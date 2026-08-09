import { CheckCircle2, Download, ExternalLink, Play, RefreshCw } from "lucide-react";
import { localFvsConnectorUrl } from "../config/runtime";

const windowsFvsDownloadUrl = "https://www.fs.usda.gov/fvs/software/complete.php";
const windowsConnectorDownloadUrl = "https://github.com/loggingchance/carbineM1/releases/latest/download/carbine-fvs-connector-windows-x64.zip";
const macFvsSourceUrl = "https://github.com/USDAForestService/ForestVegetationSimulator";

export function FvsSetupGuide({ onGoToRun }: { onGoToRun: () => void }) {
  return (
    <section className="panel setup-guide">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Setup FVS</p>
          <h2>Use FVS on your own computer</h2>
        </div>
        <button type="button" className="primary" onClick={onGoToRun}>
          <Play size={16} /> Go to Run
        </button>
      </div>

      <p className="quiet setup-intro">
        CARBINE runs FVS locally through a small connector. Install USDA FVS first, install the CARBINE connector second, then return to CARBINE and test the connection.
      </p>

      <div className="setup-actions">
        <a className="secondary link-button" href={windowsFvsDownloadUrl} target="_blank" rel="noreferrer">
          <Download size={16} /> USDA FVS download
        </a>
        <a className="secondary link-button" href={windowsConnectorDownloadUrl} target="_blank" rel="noreferrer">
          <Download size={16} /> CARBINE connector
        </a>
      </div>

      <div className="setup-grid">
        <article className="setup-card">
          <h3>Windows setup</h3>
          <ol className="setup-steps">
            <li>Open the USDA FVS download page.</li>
            <li>In the Download table, choose the current FVS Software Complete Package installer.</li>
            <li>Save the installer somewhere you can find it, such as Downloads.</li>
            <li>Open the installer, click Next, and let it finish. The normal install location is usually under <code>C:\FVS</code>.</li>
            <li>Download the CARBINE FVS Connector ZIP.</li>
            <li>Open the ZIP file and run <code>INSTALL-CARBINE-FVS-CONNECTOR.cmd</code>.</li>
            <li>Open the Windows Start Menu and choose <strong>Open CARBINE with Local FVS</strong>.</li>
            <li>Leave the connector window open while you use CARBINE.</li>
            <li>In CARBINE, go to Run, choose Local FVS, and click Test connection.</li>
            <li>When CARBINE says Local FVS detected, load or import inventory and click Run scenarios.</li>
          </ol>
        </article>

        <article className="setup-card">
          <h3>macOS status</h3>
          <p>
            USDA does not provide the same simple Complete Package installer for macOS. CARBINE does not yet offer a packaged Mac connector.
          </p>
          <p>
            Mac users who are comfortable building software can review the official FVS source code. For most users, Windows is currently the straightforward local-FVS path.
          </p>
          <a className="secondary link-button" href={macFvsSourceUrl} target="_blank" rel="noreferrer">
            FVS source code <ExternalLink size={14} />
          </a>
        </article>
      </div>

      <div className="setup-card setup-check">
        <h3>Connection check</h3>
        <ul className="setup-checklist">
          <li><CheckCircle2 size={18} /> Connector address should be <code>{localFvsConnectorUrl}</code>.</li>
          <li><CheckCircle2 size={18} /> The connector window must stay open during the FVS run.</li>
          <li><CheckCircle2 size={18} /> If CARBINE does not detect FVS, restart the connector after installing FVS.</li>
          <li><CheckCircle2 size={18} /> If FVS is installed in an unusual folder, drag the FVS executable folder onto <code>START-CARBINE-FVS-CONNECTOR.cmd</code>.</li>
        </ul>
        <button type="button" className="secondary" onClick={onGoToRun}>
          <RefreshCw size={16} /> Test in Run
        </button>
      </div>
    </section>
  );
}
