import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { scenarioDisplayName } from "../domain/scenarioSchema";
import type { ValidationResult } from "../domain/validation";
import type { FvsAdapter, FvsRunResult, FvsRuntimeInfo } from "./FvsAdapter";
import { writeInventoryPreview, writeKeywordPreview } from "./keywordWriter";

interface BridgeRunResponse {
  ok: boolean;
  code?: number;
  error?: string;
  stdout?: string;
  stderr?: string;
  files?: Record<string, string>;
}

export class FvsLocalBridgeAdapter implements FvsAdapter {
  name = "Local FVS bridge";
  isRealFvs = true;
  private bridgeUrl = "http://127.0.0.1:8787";

  async getRuntimeInfo(): Promise<FvsRuntimeInfo> {
    try {
      const response = await fetch(`${this.bridgeUrl}/health`);
      const health = (await response.json()) as { ok: boolean; fvsExe?: string | null; error?: string | null };
      return {
        adapterName: this.name,
        isRealFvs: health.ok,
        label: health.ok ? "Local FVS executable" : "Local bridge missing FVS_EXE",
        notes: [health.error ?? (health.fvsExe ? `Using ${health.fvsExe}` : "Start the bridge with FVS_EXE set to a variant executable.")]
      };
    } catch {
      return {
        adapterName: this.name,
        isRealFvs: false,
        label: "Local FVS bridge offline",
        notes: ["Run npm.cmd run fvs:bridge after installing FVS and setting FVS_EXE."]
      };
    }
  }

  async validateRequest(request: CarbineRunRequest): Promise<ValidationResult> {
    const messages = [];
    if (request.inventory.length === 0) {
      messages.push({ severity: "error" as const, message: "Load and validate an inventory before running a scenario." });
    }
    const info = await this.getRuntimeInfo();
    if (!info.isRealFvs) {
      messages.push({ severity: "error" as const, message: info.notes.join(" ") });
    }
    return { ok: !messages.some((message) => message.severity === "error"), messages };
  }

  async runScenario(request: CarbineRunRequest, scenarioId: string): Promise<FvsRunResult> {
    const scenario = request.scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} was not found.`);
    }

    const keywordFile = writeKeywordPreview(request, scenario);
    const inventoryFile = writeInventoryPreview(request);
    const response = await fetch(`${this.bridgeUrl}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenarioId, keywordFile, inventoryFile })
    });
    const bridge = (await response.json()) as BridgeRunResponse;

    const rawOutputText = Object.entries(bridge.files ?? {})
      .map(([name, contents]) => `===== ${name} =====\n${contents}`)
      .join("\n\n");

    return {
      scenarioId,
      success: bridge.ok,
      warnings: [
        "Local FVS bridge ran the executable, but CARBINE keyword generation still needs official FVS fixture validation before parsed carbon values are trusted."
      ],
      errors: bridge.ok ? [] : [bridge.error ?? bridge.stderr ?? "FVS run failed."],
      generatedFiles: {
        keywordFile,
        inventoryFile,
        runLog: [bridge.stdout, bridge.stderr, rawOutputText].filter(Boolean).join("\n\n"),
        rawOutputs: bridge.files
      },
      parsedCarbon: {
        scenarioId,
        scenarioName: scenarioDisplayName(scenario),
        units: "short_tons_carbon_per_acre",
        points: [],
        includedPools: [],
        excludedPools: ["soil_carbon"],
        fvsSourceFiles: Object.keys(bridge.files ?? {}),
        parserWarnings: ["Raw FVS execution is connected; carbon output parser is not connected to official FVS carbon tables yet."]
      }
    };
  }

  async runScenarioSet(request: CarbineRunRequest): Promise<CarbineScenarioResults> {
    const runs = await Promise.all(request.scenarios.map((scenario) => this.runScenario(request, scenario.id)));
    return {
      adapterName: this.name,
      isRealFvs: runs.every((run) => run.success),
      generatedAt: new Date().toISOString(),
      series: runs.map((run) => run.parsedCarbon),
      runArtifacts: runs.map((run) => ({
        scenarioId: run.scenarioId,
        scenarioName: run.parsedCarbon.scenarioName,
        ...run.generatedFiles
      }))
    };
  }
}
