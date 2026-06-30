import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import type { FvsAdapter, FvsRuntimeInfo } from "../fvs/FvsAdapter";
import { writeInventoryPreview, writeKeywordPreview } from "../fvs/keywordWriter";
import { inventoryColumnHelp, summarizeInventory } from "../domain/inventorySchema";
import type { ValidationMessage } from "../domain/validation";
import { hasHostedFvsApi, type RuntimeMode } from "../config/runtime";

export function RunPanel({
  adapter,
  request,
  runtimeMode,
  onRuntimeModeChange,
  onNeedInventory,
  onLoadSampleInventory,
  onResults
}: {
  adapter: FvsAdapter;
  request: CarbineRunRequest;
  runtimeMode: RuntimeMode;
  onRuntimeModeChange: (mode: RuntimeMode) => void;
  onNeedInventory: () => void;
  onLoadSampleInventory: () => Promise<void>;
  onResults: (results: CarbineScenarioResults, generatedPreview: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [runtimeInfo, setRuntimeInfo] = useState<FvsRuntimeInfo>();
  const summary = summarizeInventory(request.inventory);

  useEffect(() => {
    let cancelled = false;
    setRuntimeInfo(undefined);
    adapter.getRuntimeInfo().then((info) => {
      if (!cancelled) setRuntimeInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, [adapter, runtimeMode]);

  async function run() {
    setBusy(true);
    const validation = await adapter.validateRequest(request);
    setMessages(validation.messages);
    if (!validation.ok) {
      setBusy(false);
      return;
    }

    try {
      const results = await adapter.runScenarioSet(request);
      const runDetails = results.series
        .map(
          (series) =>
            [
              `===== Scenario: ${series.scenarioName} =====`,
              `Source files: ${series.fvsSourceFiles.join(", ") || "none reported"}`,
              `Parser warnings: ${series.parserWarnings.join(" | ") || "none"}`
            ].join("\n")
        )
        .join("\n\n");
      const artifacts = results.runArtifacts
        ?.map((artifact) =>
          [
            `===== Generated official files: ${artifact.scenarioName} =====`,
            artifact.keywordFile ? `--- input.key ---\n${artifact.keywordFile}` : "",
            artifact.inventoryFile ? `--- input.tre / inventory ---\n${artifact.inventoryFile}` : "",
            artifact.runLog ? `--- run log ---\n${artifact.runLog}` : ""
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n\n");
      const preview = [
        writeInventoryPreview(request),
        ...request.scenarios.map((scenario) => writeKeywordPreview(request, scenario)),
        runDetails,
        artifacts ?? ""
      ].join("\n---\n");
      onResults(results, preview);
    } catch (error) {
      setMessages([{ severity: "error", message: error instanceof Error ? error.message : String(error) }]);
    }
    setBusy(false);
  }

  return (
    <section className="panel run-panel">
      <p className="eyebrow">Run</p>
      <h2>Run the scenario set</h2>
      <p className="quiet">Run the loaded inventory and scenario set through the configured FVS runtime.</p>
      {!hasHostedFvsApi && (
        <div className="segmented" aria-label="Runtime mode">
          <button type="button" className={runtimeMode === "official" ? "active" : ""} onClick={() => onRuntimeModeChange("official")}>
            Local bridge
          </button>
          <button type="button" className={runtimeMode === "demo" ? "active" : ""} onClick={() => onRuntimeModeChange("demo")}>
            Demo
          </button>
        </div>
      )}
      {runtimeMode === "hosted" && !hasHostedFvsApi && (
        <p className="note">
          Hosted FVS API is not configured for this build.
        </p>
      )}
      {runtimeMode === "official" && (
        <p className="note">
          Developer mode only. It requires the official USDA source build and a local bridge running on this computer.
        </p>
      )}
      <div className="runtime-check" aria-live="polite">
        <strong className={runtimeInfo?.isRealFvs ? "real-badge" : "demo-badge"}>
          {runtimeInfo ? runtimeInfo.label : "Checking runtime"}
        </strong>
        <span>{runtimeInfo?.notes.join(" ") ?? "Checking adapter status before running."}</span>
      </div>
      <p className={request.inventory.length > 0 ? "ready-note" : "note"}>
        {request.inventory.length > 0
          ? `Inventory ready: ${summary.recordCount} records, ${summary.speciesCount} species, ${summary.totalTreesPerAcre.toFixed(1)} TPA.`
          : `No parsed inventory is loaded. Uploading a file is not enough; CARBINE has to parse usable tree rows from it. ${inventoryColumnHelp}`}
      </p>
      <button type="button" className="primary" onClick={run} disabled={busy}>
        <Play size={18} /> {busy ? "Running" : "Run scenarios"}
      </button>
      {messages.length > 0 && (
        <>
          <ul className="messages">
            {messages.map((message) => (
              <li className={message.severity} key={message.message}>{message.message}</li>
            ))}
          </ul>
          {request.inventory.length === 0 && (
            <div className="button-row">
              <button type="button" className="secondary" onClick={onNeedInventory}>
                Go to Inventory
              </button>
              <button
                type="button"
                className="secondary"
                onClick={async () => {
                  await onLoadSampleInventory();
                  setMessages([{ severity: "info", message: "Sample inventory loaded. Click Run scenarios again to create results." }]);
                }}
              >
                Load sample inventory
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
