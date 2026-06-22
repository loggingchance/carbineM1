import { Download, Send } from "lucide-react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { buildDiagnosticsExport } from "../reports/diagnosticsExport";
import { carbineBuildId } from "../config/buildInfo";

export function AdvancedFvsPanel({
  request,
  currentRequest,
  results,
  generatedPreview
}: {
  request: CarbineRunRequest;
  currentRequest?: CarbineRunRequest;
  results?: CarbineScenarioResults;
  generatedPreview: string;
}) {
  const rawPreview = generatedPreview || "Run scenarios to preview generated inventory, keyword files, and raw local FVS output.";
  const canExport = Boolean(results || generatedPreview);
  const currentScenarioCount = currentRequest?.scenarios.length ?? request.scenarios.length;
  const showsRunSnapshot = Boolean(results && currentRequest && currentScenarioCount !== request.scenarios.length);

  function createDiagnosticsFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const body = buildDiagnosticsExport(request, results, rawPreview, currentRequest);
    return new File([body], `carbine-diagnostics-${timestamp}.json`, { type: "application/json" });
  }

  function downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadDiagnostics() {
    downloadFile(createDiagnosticsFile());
  }

  async function shareDiagnostics() {
    const file = createDiagnosticsFile();
    const shareData = {
      title: `CARBINE diagnostics - build ${carbineBuildId}`,
      text: "CARBINE diagnostics for review by the CARBINE team.",
      files: [file]
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    openDiagnosticsEmailFallback(file);
  }

  function openDiagnosticsEmailFallback(file: File) {
    downloadFile(file);
    const subject = encodeURIComponent(`CARBINE diagnostics - build ${carbineBuildId}`);
    const body = encodeURIComponent(`Please find my CARBINE diagnostics attached.\n\nDownloaded file: ${file.name}\nCARBINE build: ${carbineBuildId}`);
    window.location.href = `mailto:steve@northeastforests.com?subject=${subject}&body=${body}`;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Advanced FVS</p>
          <h2>Generated files and adapter notes</h2>
        </div>
        <button type="button" className="secondary" disabled={!canExport} onClick={downloadDiagnostics}>
          <Download size={18} /> Export diagnostics
        </button>
      </div>
      <p className="quiet">
        Export diagnostics includes the request, parsed results, generated FVS keyword files, tree file, run log, and raw FVS outputs.
      </p>
      <div className="diagnostics-share-note">
        <div>
          <strong>Want to help improve CARBINE?</strong>
          <span> Share your diagnostics with the CARBINE team at steve@northeastforests.com.</span>
        </div>
        <button type="button" className="secondary" disabled={!canExport} onClick={() => void shareDiagnostics()}>
          <Send size={18} /> Share diagnostics with CARBINE team
        </button>
        <small>On supported devices, the diagnostics file is attached to your share menu. Otherwise, CARBINE downloads it and opens a pre-addressed email draft.</small>
      </div>
      {showsRunSnapshot && (
        <p className="note">
          Showing the last completed run. Current scenario setup has {currentScenarioCount} scenarios; run again before exporting a new test package.
        </p>
      )}
      <dl className="details">
        <div><dt>CARBINE build</dt><dd>{carbineBuildId}</dd></div>
        <div><dt>Variant</dt><dd>{request.fvs.variant}</dd></div>
        <div><dt>Carbon extension</dt><dd>{request.fvs.extensions.carbon ? "Requested" : "Off"}</dd></div>
        <div><dt>Scenarios in this run</dt><dd>{request.scenarios.length}</dd></div>
      </dl>
      {results?.runArtifacts?.map((artifact) => (
        <details className="artifact-details" key={artifact.scenarioId} open>
          <summary>{artifact.scenarioName} generated files</summary>
          {artifact.keywordFile && (
            <>
              <h3>input.key</h3>
              <pre>{artifact.keywordFile}</pre>
            </>
          )}
          {artifact.inventoryFile && (
            <>
              <h3>Inventory/tree file</h3>
              <pre>{artifact.inventoryFile}</pre>
            </>
          )}
          {artifact.runLog && (
            <>
              <h3>Run log and output</h3>
              <pre>{artifact.runLog}</pre>
            </>
          )}
          {artifact.rawOutputs &&
            Object.entries(artifact.rawOutputs).map(([name, contents]) => (
              <details className="artifact-details nested" key={name}>
                <summary>{name}</summary>
                <pre>{contents}</pre>
              </details>
            ))}
        </details>
      ))}
      <h3>Friendly preview</h3>
      <pre>{rawPreview}</pre>
    </section>
  );
}
