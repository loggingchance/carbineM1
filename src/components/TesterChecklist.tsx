import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, FileJson, RefreshCw, Terminal } from "lucide-react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { hasHostedFvsApi, hostedFvsApiUrl, type RuntimeMode } from "../config/runtime";

interface BridgeHealth {
  ok: boolean;
  fvsExe: string | null;
  variants: string[];
  error: string | null;
}

export function TesterChecklist({
  request,
  results,
  onGoToInventory,
  onGoToScenario,
  onGoToRun,
  onGoToAdvanced,
  runtimeMode
}: {
  request: CarbineRunRequest;
  results?: CarbineScenarioResults;
  onGoToInventory: () => void;
  onGoToScenario: () => void;
  onGoToRun: () => void;
  onGoToAdvanced: () => void;
  runtimeMode: RuntimeMode;
}) {
  const hasInventory = request.inventory.length > 0;
  const hasBaseline = request.scenarios.some((scenario) => scenario.type === "baseline");
  const treatmentCount = request.scenarios.filter((scenario) => scenario.type !== "baseline").length;
  const hasResults = Boolean(results);
  const isRealFvs = Boolean(results?.isRealFvs);
  const [bridgeHealth, setBridgeHealth] = useState<BridgeHealth | undefined>();
  const [bridgeChecking, setBridgeChecking] = useState(false);
  const [bridgeError, setBridgeError] = useState("");
  const requestedVariant = `FVS${request.fvs.variant}`.toLowerCase();
  const variantBuilt = bridgeHealth?.variants.some((variant) => variant.toLowerCase() === requestedVariant) ?? false;
  const runtimeHealthUrl = runtimeMode === "hosted" && hasHostedFvsApi ? `${hostedFvsApiUrl}/health` : "http://127.0.0.1:8787/health";
  const runtimeName = runtimeMode === "hosted" ? "Hosted FVS API" : "Local FVS bridge";

  useEffect(() => {
    void checkBridge();
  }, []);

  async function checkBridge() {
    setBridgeChecking(true);
    setBridgeError("");
    try {
      const response = await fetch(runtimeHealthUrl);
      const health = (await response.json()) as BridgeHealth;
      setBridgeHealth(health);
    } catch {
      setBridgeHealth(undefined);
      setBridgeError(runtimeMode === "hosted" ? "Hosted FVS API is not reachable." : "Local bridge is offline.");
    }
    setBridgeChecking(false);
  }

  return (
    <section className="panel tester-checklist">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Tester</p>
          <h2>Outside tester checklist</h2>
        </div>
        <span className={isRealFvs ? "real-badge" : "demo-badge"}>
          {hasResults ? (isRealFvs ? "Real FVS results" : "Demo results") : "No run yet"}
        </span>
      </div>

      <p className="quiet">
        Use this page as the handoff script for a tester. In a hosted deployment, testers should only need the CARBINE web address.
      </p>

      <div className="checklist-grid">
        <article className="checklist-card">
          <h3><Terminal size={18} /> Tester startup</h3>
          <p>Hosted tester build:</p>
          <pre className="command-snippet">{`Open the CARBINE web address.`}</pre>
          <p>Developer-only local fallback:</p>
          <pre className="command-snippet">{`start-carbine.bat`}</pre>
        </article>

        <article className="checklist-card">
          <h3><ClipboardList size={18} /> Current run readiness</h3>
          <ul className="status-list">
            <li className={hasInventory ? "pass" : "warn"}>
              {hasInventory ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Inventory loaded: {hasInventory ? `${request.inventory.length} tree records` : "not yet"}
            </li>
            <li className={hasBaseline ? "pass" : "warn"}>
              {hasBaseline ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Baseline scenario present: {hasBaseline ? "yes" : "missing"}
            </li>
            <li className={treatmentCount > 0 ? "pass" : "warn"}>
              {treatmentCount > 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Treatment scenarios: {treatmentCount}
            </li>
            <li className={bridgeHealth?.ok ? "pass" : "warn"}>
              {bridgeHealth?.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {runtimeName}: {bridgeHealth?.ok ? "reachable" : bridgeError || bridgeHealth?.error || "not checked yet"}
            </li>
            <li className={runtimeMode === "hosted" && hasHostedFvsApi ? "pass" : "warn"}>
              {runtimeMode === "hosted" && hasHostedFvsApi ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Hosted FVS API: {hasHostedFvsApi ? hostedFvsApiUrl : "not configured in this build"}
            </li>
            <li className={variantBuilt ? "pass" : "warn"}>
              {variantBuilt ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Requested variant {request.fvs.variant}: {variantBuilt ? "built" : "not found in bridge health"}
            </li>
            <li className={isRealFvs ? "pass" : "warn"}>
              {isRealFvs ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              Official FVS result confirmed: {isRealFvs ? "yes" : "run Official FVS source mode"}
            </li>
          </ul>
          <div className="button-row">
            <button type="button" className="secondary" onClick={checkBridge} disabled={bridgeChecking}>
              <RefreshCw size={16} /> {bridgeChecking ? "Checking" : "Check bridge"}
            </button>
            <button type="button" className="secondary" onClick={onGoToInventory}>Inventory</button>
            <button type="button" className="secondary" onClick={onGoToScenario}>Scenario</button>
            <button type="button" className="primary" onClick={onGoToRun}>Run</button>
          </div>
        </article>

        <article className="checklist-card">
          <h3><CheckCircle2 size={18} /> Test workflow</h3>
          <ol>
            <li>Load an inventory CSV and confirm the record count looks right.</li>
            <li>Keep a No treatment baseline.</li>
            <li>Add one or more treatment scenarios using the dropdown controls.</li>
            <li>On Run, choose Hosted FVS API for outside testing, or Local bridge only for developer checks.</li>
            <li>Run scenarios, review Results, then open Report.</li>
            <li>Open Advanced and export diagnostics.</li>
          </ol>
        </article>

        <article className="checklist-card">
          <h3><FileJson size={18} /> Send back this evidence</h3>
          <ul>
            <li>The exported diagnostics JSON from Advanced.</li>
            <li>The inventory CSV used for the test.</li>
            <li>Any report PDF they printed or exported.</li>
            <li>A short note describing what they expected versus what happened.</li>
          </ul>
          <button type="button" className="secondary" onClick={onGoToAdvanced}>Advanced / diagnostics</button>
        </article>
      </div>

      <div className="tester-limits">
        <strong>Known limits for this tester build:</strong>
        <span>NE is the verified path right now.</span>
        <span>Treatments use the current simple FVS thinning controls.</span>
        <span>Carbon is parsed from official FMIN/CARBREPT output.</span>
        <span>CARBINE is not an official USDA Forest Service product.</span>
      </div>
    </section>
  );
}
