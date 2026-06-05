import { Download, FileJson, Printer, ScrollText } from "lucide-react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { resultsToCsv } from "../reports/csvExport";
import { buildDiagnosticsExport } from "../reports/diagnosticsExport";
import { buildHtmlReport } from "../reports/htmlReport";
import { buildProjectExport } from "../reports/projectExport";
import { buildTesterSummary } from "../reports/testerSummary";

export function ReportPreview({
  request,
  results,
  generatedPreview
}: {
  request: CarbineRunRequest;
  results?: CarbineScenarioResults;
  generatedPreview: string;
}) {
  const html = results ? buildHtmlReport(request, results) : "";
  const hasCarbonRows = results?.series.some((series) => series.points.some((point) => point.selectedPoolTotalCarbonTons !== undefined)) ?? false;
  const runtimeLabel = results ? (results.isRealFvs ? "Real FVS output" : "Demo output") : "No run yet";
  const diagnosticsPreview = generatedPreview || "Run scenarios to preview generated inventory, keyword files, and raw FVS output.";

  function download(name: string, body: string, type: string) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printReport(body: string) {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.srcdoc = body;
    document.body.appendChild(frame);

    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1000);
    };
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Report</p>
          <h2>Preview and export</h2>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="primary"
            disabled={!results}
            onClick={() => download("carbine-diagnostics.json", buildDiagnosticsExport(request, results, diagnosticsPreview), "application/json")}
          >
            <FileJson size={18} /> Diagnostics
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => download("carbine-run-summary.txt", buildTesterSummary(request, results), "text/plain")}>
            <ScrollText size={18} /> Summary
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => results && download("carbine-results.csv", resultsToCsv(results), "text/csv")}>
            <Download size={18} /> CSV
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => results && download("carbine-report.html", html, "text/html")}>
            <Download size={18} /> HTML
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => printReport(html)}>
            <Download size={18} /> PDF
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => download("carbine-project.json", buildProjectExport(request, results), "application/json")}>
            <Download size={18} /> Project
          </button>
          <button type="button" className="secondary" disabled={!results} onClick={() => printReport(html)}>
            <Printer size={18} /> Print
          </button>
        </div>
      </div>
      <div className="report-status">
        <strong className={results?.isRealFvs ? "real-badge" : "demo-badge"}>{runtimeLabel}</strong>
        <span>
          {results
            ? hasCarbonRows
              ? "Carbon rows are included. Export Diagnostics or Summary when you need to preserve the run details."
              : "No parsed carbon rows were found. Export Diagnostics so raw FVS output can be reviewed."
            : "Run scenarios before exporting results."}
        </span>
      </div>
      {results ? (
        <iframe className="report-frame" title="CARBINE report preview" srcDoc={html} />
      ) : (
        <p className="quiet">Run scenarios before generating a report.</p>
      )}
    </section>
  );
}
