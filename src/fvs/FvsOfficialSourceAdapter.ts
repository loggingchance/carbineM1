import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { validateRunRequest } from "../domain/runValidation";
import { scenarioDisplayName } from "../domain/scenarioSchema";
import type { ValidationResult } from "../domain/validation";
import type { FvsAdapter, FvsRunResult, FvsRuntimeInfo } from "./FvsAdapter";
import { writeInventoryPreview, writeKeywordPreview, writeOfficialKeywordFile, writeOfficialTreeFile } from "./keywordWriter";
import { parseFvsSummaryOutput } from "./outputParser";

interface BridgeRunResponse {
  ok: boolean;
  code?: number;
  exePath?: string;
  error?: string;
  stdout?: string;
  stderr?: string;
  files?: Record<string, string>;
}

export class FvsOfficialSourceAdapter implements FvsAdapter {
  name: string;
  isRealFvs = true;

  constructor(
    private bridgeUrl = "http://127.0.0.1:8787",
    name = "Official FVS source",
    private runtimeLabel = "Official FVS native bridge",
    private offlineLabel = "Official FVS bridge offline",
    private offlineHint = "Start the bridge with npm.cmd run fvs:bridge from this workspace."
  ) {
    this.name = name;
  }

  async getRuntimeInfo(): Promise<FvsRuntimeInfo> {
    if (!this.bridgeUrl) {
      return {
        adapterName: this.name,
        isRealFvs: false,
        label: this.offlineLabel,
        notes: [this.offlineHint]
      };
    }

    try {
      const response = await fetch(`${this.bridgeUrl}/health`);
      const health = (await response.json()) as { ok: boolean; variants?: string[]; error?: string };
      return {
        adapterName: this.name,
        isRealFvs: health.ok,
        label: health.ok ? this.runtimeLabel : this.offlineLabel,
        notes: health.ok
          ? [`Built official variants available: ${(health.variants ?? []).join(", ")}`]
          : [health.error ?? this.offlineHint]
      };
    } catch {
      return {
        adapterName: this.name,
        isRealFvs: false,
        label: this.offlineLabel,
        notes: [this.offlineHint]
      };
    }
  }

  async validateRequest(request: CarbineRunRequest): Promise<ValidationResult> {
    const messages: ValidationResult["messages"] = [...validateRunRequest(request).messages];
    const info = await this.getRuntimeInfo();
    if (!info.isRealFvs) {
      messages.push({ severity: "error", message: `${info.label}: ${info.notes.join(" ")}` });
    }
    return { ok: messages.every((message) => message.severity !== "error"), messages };
  }

  async runScenario(request: CarbineRunRequest, scenarioId: string): Promise<FvsRunResult> {
    if (!this.bridgeUrl) {
      throw new Error(this.offlineHint);
    }

    const scenario = request.scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} was not found.`);

    const keywordFile = writeOfficialKeywordFile(request, scenario);
    const treeFile = writeOfficialTreeFile(request);
    const response = await fetch(`${this.bridgeUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant: request.fvs.variant, scenarioId, keywordFile, treeFile })
    });
    const bridge = (await response.json()) as BridgeRunResponse;
    const files = bridge.files ?? {};
    const rawOutputText = files["input.out"] ?? Object.entries(files).map(([name, content]) => `===== ${name} =====\n${content}`).join("\n\n");
    const parseText = [rawOutputText, files["input.sum"]].filter(Boolean).join("\n");

    return {
      scenarioId,
      success: bridge.ok,
      warnings: bridge.ok ? [] : [`FVS exited with code ${bridge.code ?? "unknown"}. Raw output is available in Advanced.`],
      errors: bridge.ok ? [] : [bridge.error ?? bridge.stderr ?? "FVS run failed."],
      generatedFiles: {
        keywordFile,
        inventoryFile: [writeInventoryPreview(request), "--- official FVS tree file ---", treeFile].join("\n"),
        runLog: [`Executable: ${bridge.exePath ?? "not reported"}`, bridge.stdout, bridge.stderr, rawOutputText].filter(Boolean).join("\n\n"),
        rawOutputs: files
      },
      parsedCarbon: trimSeriesToProjectionEnd(
        parseFvsSummaryOutput(parseText, scenarioId, scenarioDisplayName(scenario), Object.keys(files)),
        request
      )
    };
  }

  async runScenarioSet(request: CarbineRunRequest): Promise<CarbineScenarioResults> {
    const runs = [];
    for (const scenario of request.scenarios) {
      runs.push(await this.runScenario(request, scenario.id));
    }
    const series = runs.map((run) => run.parsedCarbon);
    addInitialYearConsistencyWarnings(request, series);
    return {
      adapterName: this.name,
      isRealFvs: runs.every((run) => run.success),
      generatedAt: new Date().toISOString(),
      series,
      runArtifacts: runs.map((run) => ({
        scenarioId: run.scenarioId,
        scenarioName: run.parsedCarbon.scenarioName,
        ...run.generatedFiles
      }))
    };
  }
}

function trimSeriesToProjectionEnd(series: ReturnType<typeof parseFvsSummaryOutput>, request: CarbineRunRequest): ReturnType<typeof parseFvsSummaryOutput> {
  const projectionEndYear = request.project.inventoryYear + request.project.projectionYears;
  return {
    ...series,
    points: series.points.filter((point) => point.year <= projectionEndYear)
  };
}

export function addInitialYearConsistencyWarnings(request: CarbineRunRequest, series: CarbineScenarioResults["series"]): void {
  const baseline = series.find((candidate) => candidate.scenarioId === "baseline") ?? series[0];
  const baselinePoint = baseline?.points.find((point) => point.year === request.project.inventoryYear);
  if (!baselinePoint) return;

  const baselineCarbon = baselinePoint.selectedPoolTotalCarbonTons;
  const baselineLive = baselinePoint.liveTreeCarbonTons;
  if (baselineCarbon === undefined && baselineLive === undefined) return;

  for (const resultSeries of series) {
    if (resultSeries.scenarioId === baseline.scenarioId) continue;
    const scenario = request.scenarios.find((candidate) => candidate.id === resultSeries.scenarioId);
    const hasInventoryYearTreatment = scenario?.treatmentYears.some((year) => year <= request.project.inventoryYear) ?? false;
    if (hasInventoryYearTreatment) continue;

    const point = resultSeries.points.find((candidate) => candidate.year === request.project.inventoryYear);
    if (!point) continue;
    const carbonDelta = Math.abs((point.selectedPoolTotalCarbonTons ?? baselineCarbon ?? 0) - (baselineCarbon ?? point.selectedPoolTotalCarbonTons ?? 0));
    const liveDelta = Math.abs((point.liveTreeCarbonTons ?? baselineLive ?? 0) - (baselineLive ?? point.liveTreeCarbonTons ?? 0));
    if (carbonDelta > 0.05 || liveDelta > 0.05) {
      resultSeries.parserWarnings.push(
        `Inventory-year carbon differs from the baseline before any treatment year. Restart the UI/bridge and rerun, then inspect raw FVS output if this warning remains.`
      );
    }
  }
}
