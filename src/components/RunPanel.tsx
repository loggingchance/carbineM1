import { Cloud, Download, Laptop, Play, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import type { FvsAdapter, FvsRuntimeInfo } from "../fvs/FvsAdapter";
import { writeInventoryPreview, writeKeywordPreview } from "../fvs/keywordWriter";
import { inventoryColumnHelp, summarizeInventory } from "../domain/inventorySchema";
import type { ValidationMessage } from "../domain/validation";
import { hasHostedFvsApi, localFvsConnectorUrl, type RuntimeMode } from "../config/runtime";

const windowsFvsDownloadUrl = "https://www.fs.usda.gov/fvs/software/complete.php";
const windowsConnectorDownloadUrl = "https://github.com/loggingchance/carbineM1/releases/latest/download/carbine-fvs-connector-windows-x64.zip";
const macFvsSourceUrl = "https://github.com/USDAForestService/ForestVegetationSimulator";

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

  async function refreshRuntime() {
    setRuntimeInfo(undefined);
    setRuntimeInfo(await adapter.getRuntimeInfo());
  }

  return (
    <section className="panel run-panel">
      <p className="eyebrow">Run</p>
      <h2>Run the scenario set</h2>
      <p className="quiet">Use FVS on this computer when available. Carbine Cloud FVS remains available as a convenience fallback.</p>
      <div className="segmented" aria-label="Runtime mode">
        <button type="button" className={runtimeMode === "official" ? "active" : ""} onClick={() => onRuntimeModeChange("official")}>
          <Laptop size={16} /> Local FVS
        </button>
        <button
          type="button"
          className={runtimeMode === "hosted" ? "active" : ""}
          onClick={() => onRuntimeModeChange("hosted")}
          disabled={!hasHostedFvsApi}
          title={hasHostedFvsApi ? "Use the hosted Carbine FVS API" : "Carbine Cloud FVS is not configured for this build"}
        >
          <Cloud size={16} /> Carbine Cloud
        </button>
        <button type="button" className={runtimeMode === "demo" ? "active" : ""} onClick={() => onRuntimeModeChange("demo")}>
          Demo
        </button>
      </div>
      {runtimeMode === "hosted" && !hasHostedFvsApi && (
        <p className="note">
          Carbine Cloud FVS is not configured for this build.
        </p>
      )}
      {runtimeMode === "official" && (
        <div className="local-fvs-help">
          <div>
            <h3>Use your own FVS installation</h3>
            <p>Install USDA Forest Service FVS, start the Carbine FVS Connector, then Carbine will run FVS through this browser.</p>
          </div>
          <div className="button-row">
            <a className="secondary link-button" href={windowsFvsDownloadUrl} target="_blank" rel="noreferrer">
              <Download size={16} /> Install FVS for Windows
            </a>
            <a className="secondary link-button" href={windowsConnectorDownloadUrl} target="_blank" rel="noreferrer">
              <Download size={16} /> Download Carbine connector
            </a>
            <a className="secondary link-button" href={macFvsSourceUrl} target="_blank" rel="noreferrer">
              macOS source build
            </a>
          </div>
          <p className="connector-url">Connector address: <code>{localFvsConnectorUrl}</code></p>
        </div>
      )}
      <div className="runtime-check" aria-live="polite">
        <strong className={runtimeInfo?.isRealFvs ? "real-badge" : "demo-badge"}>
          {runtimeInfo ? runtimeInfo.label : "Checking runtime"}
        </strong>
        <span>{runtimeInfo?.notes.join(" ") ?? "Checking adapter status before running."}</span>
        <button type="button" className="secondary compact-button" onClick={refreshRuntime}>
          <RefreshCw size={16} /> Test connection
        </button>
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
