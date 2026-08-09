import { useEffect, useMemo, useState } from "react";
import { Banner } from "./components/Banner";
import { WorkflowShell, type WorkflowStep } from "./components/WorkflowShell";
import { InventoryUpload } from "./components/InventoryUpload";
import { VariantPicker } from "./components/VariantPicker";
import { ScenarioBuilder } from "./components/ScenarioBuilder";
import { RunPanel } from "./components/RunPanel";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { ReportPreview } from "./components/ReportPreview";
import { AdvancedFvsPanel } from "./components/AdvancedFvsPanel";
import { AboutCarbine } from "./components/AboutCarbine";
import { Disclaimer } from "./components/Disclaimer";
import type { TreeRecord } from "./domain/inventorySchema";
import type { StandProject } from "./domain/inventorySchema";
import {
  baselineScenario,
  generatedScenarioName,
  lightThinScenario,
  snapTreatmentYear,
  type ScenarioDefinition
} from "./domain/scenarioSchema";
import type { CarbineRunRequest } from "./domain/fvsRunRequest";
import type { CarbineScenarioResults } from "./domain/carbonResults";
import { FvsMockAdapter } from "./fvs/FvsMockAdapter";
import { parseInventoryCsv } from "./domain/validation";
import { FvsOfficialSourceAdapter } from "./fvs/FvsOfficialSourceAdapter";
import { hostedFvsApiUrl, localFvsConnectorUrl, runtimeModeFromStored, type RuntimeMode } from "./config/runtime";
import { getVariantByCode } from "./fvs/variantCatalog";

const steps: WorkflowStep[] = ["Inventory", "Scenario", "Run", "Results", "Report", "Advanced", "About"];
const windowsConnectorDownloadUrl = "https://github.com/loggingchance/carbineM1/releases/latest/download/carbine-fvs-connector-windows-x64.zip";

const initialProject: StandProject = {
  projectName: "CARBINE sample project",
  standName: "NE simple stand",
  state: "VT",
  county: "Windsor",
  areaAcres: 42,
  inventoryYear: 2026,
  projectionYears: 30,
  cycleLengthYears: 5,
  forestLocationCode: 922,
  siteSpeciesCode: 13,
  siteIndex: 56,
  inventoryDesign: "expanded_tpa",
  fvsVariant: "NE",
  units: "english"
};

const storageKey = "carbine-project-draft";

interface StoredDraft {
  project: StandProject;
  inventory: TreeRecord[];
  scenarios: ScenarioDefinition[];
  results?: CarbineScenarioResults;
  lastRunRequest?: CarbineRunRequest;
  generatedPreview?: string;
  runtimeMode?: RuntimeMode;
}

export function App() {
  const storedDraft = loadStoredDraft();
  const draftProject = normalizeProject(storedDraft?.project ?? initialProject);
  const [activeStep, setActiveStep] = useState<WorkflowStep>("Inventory");
  const [project, setProject] = useState<StandProject>(draftProject);
  const [inventory, setInventory] = useState<TreeRecord[]>(storedDraft?.inventory ?? []);
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>(
    storedDraft?.scenarios.map((scenario) => sanitizeScenario(draftProject, scenario)) ?? [
      baselineScenario(initialProject.inventoryYear),
      lightThinScenario(initialProject.inventoryYear)
    ]
  );
  const [results, setResults] = useState<CarbineScenarioResults | undefined>(storedDraft?.results);
  const [lastRunRequest, setLastRunRequest] = useState<CarbineRunRequest | undefined>(storedDraft?.lastRunRequest);
  const [generatedPreview, setGeneratedPreview] = useState(storedDraft?.generatedPreview ?? "");
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(
    runtimeModeFromStored(storedDraft?.runtimeMode) ?? "official"
  );

  const demoAdapter = useMemo(() => new FvsMockAdapter(), []);
  const officialAdapter = useMemo(
    () =>
      new FvsOfficialSourceAdapter(
        localFvsConnectorUrl,
        "Local FVS connector",
        "Local FVS detected",
        "Local FVS connector offline",
        `Install FVS, start the Carbine FVS Connector, then leave it running at ${localFvsConnectorUrl}.`
      ),
    []
  );
  const hostedAdapter = useMemo(
    () =>
      new FvsOfficialSourceAdapter(
        hostedFvsApiUrl,
        "Hosted official FVS API",
        "Hosted official FVS API",
        "Hosted FVS API not configured",
        "This deployment needs VITE_CARBINE_FVS_API_URL set to the hosted CARBINE FVS API."
      ),
    []
  );
  const adapter = runtimeMode === "hosted" ? hostedAdapter : runtimeMode === "official" ? officialAdapter : demoAdapter;
  const request = useMemo<CarbineRunRequest>(
    () => ({
      project: {
        projectName: project.projectName,
        standName: project.standName,
        areaAcres: project.areaAcres,
        inventoryYear: project.inventoryYear,
        projectionYears: project.projectionYears,
        cycleLengthYears: project.cycleLengthYears ?? 5,
        forestLocationCode: project.forestLocationCode ?? 922,
        siteSpeciesCode: project.siteSpeciesCode ?? 13,
        siteIndex: project.siteIndex ?? 56,
        inventoryDesign: project.inventoryDesign ?? "expanded_tpa",
        location: {
          state: project.state,
          county: project.county,
          latitude: project.latitude,
          longitude: project.longitude
        }
      },
      fvs: {
        variant: project.fvsVariant,
        extensions: {
          carbon: true,
          fireAndFuels: true
        }
      },
      inventory,
      scenarios: scenarios.map((scenario) => sanitizeScenario(project, scenario))
    }),
    [project, inventory, scenarios]
  );

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        project,
        inventory,
        scenarios: scenarios.map((scenario) => sanitizeScenario(project, scenario)),
        results,
        lastRunRequest,
        generatedPreview,
        runtimeMode
      })
    );
  }, [project, inventory, scenarios, results, lastRunRequest, generatedPreview, runtimeMode]);

  async function loadSampleInventory() {
    const csv = await fetch("./sample-data/ne-simple-stand.csv").then((response) => response.text());
    const metadata = await fetch("./sample-data/ne-simple-stand.json").then((response) => response.json());
    const parsed = parseInventoryCsv(csv);
    setInventory(parsed.records);
    setProject((current) => normalizeProject({ ...current, ...metadata }));
    clearRunOutputs();
  }

  function clearRunOutputs() {
    setResults(undefined);
    setLastRunRequest(undefined);
    setGeneratedPreview("");
  }

  function updateProject(nextProject: StandProject) {
    setProject(nextProject);
    clearRunOutputs();
  }

  function updateInventory(nextInventory: TreeRecord[]) {
    setInventory(nextInventory);
    clearRunOutputs();
  }

  function updateScenarios(nextScenarios: ScenarioDefinition[]) {
    setScenarios(nextScenarios);
    clearRunOutputs();
  }

  return (
    <div className="app">
      <Banner runtimeLabel={results?.isRealFvs ? "Real FVS runtime" : runtimeMode === "hosted" ? "Carbine Cloud FVS" : "Local FVS"} />
      <WorkflowShell steps={steps} activeStep={activeStep} onChange={setActiveStep} />
      <section className="connector-announcement" aria-label="Local FVS connector">
        <div>
          <strong>New: run FVS on your own computer</strong>
          <span>Install USDA FVS, download the Carbine connector, then choose Local FVS.</span>
        </div>
        <div className="button-row">
          <a className="secondary link-button" href={windowsConnectorDownloadUrl} target="_blank" rel="noreferrer">
            Download connector
          </a>
          <button type="button" className="primary" onClick={() => setActiveStep("Run")}>
            Set up Local FVS
          </button>
        </div>
      </section>
      <main className="workspace">
        {activeStep === "Inventory" && (
          <InventoryUpload project={project} inventory={inventory} onProjectChange={updateProject} onInventoryChange={updateInventory} />
        )}
        {activeStep === "Scenario" && (
          <>
            <VariantPicker project={project} onProjectChange={updateProject} />
            <ScenarioBuilder project={project} scenarios={scenarios} onScenariosChange={updateScenarios} />
          </>
        )}
        {activeStep === "Run" && (
          <RunPanel
            adapter={adapter}
            request={request}
            runtimeMode={runtimeMode}
            onRuntimeModeChange={setRuntimeMode}
            onNeedInventory={() => setActiveStep("Inventory")}
            onLoadSampleInventory={loadSampleInventory}
            onResults={(nextResults, preview) => {
              setResults(nextResults);
              setLastRunRequest(request);
              setGeneratedPreview(preview);
              setActiveStep("Results");
            }}
          />
        )}
        {activeStep === "Results" && (
          <ResultsDashboard
            results={results}
            onGoToRun={() => setActiveStep("Run")}
            onGoToAdvanced={() => setActiveStep("Advanced")}
          />
        )}
        {activeStep === "Report" && (
          <ReportPreview
            request={results && lastRunRequest ? lastRunRequest : request}
            currentRequest={request}
            results={results}
            generatedPreview={generatedPreview}
          />
        )}
        {activeStep === "Advanced" && (
          <AdvancedFvsPanel
            request={results && lastRunRequest ? lastRunRequest : request}
            currentRequest={request}
            results={results}
            generatedPreview={generatedPreview}
          />
        )}
        {activeStep === "About" && <AboutCarbine />}
      </main>
      <Disclaimer />
    </div>
  );
}

function normalizeProject(project: StandProject): StandProject {
  const variant = getVariantByCode(project.fvsVariant);
  return {
    ...project,
    fvsVariant: variant?.code ?? project.fvsVariant ?? "NE",
    state: project.state || variant?.defaultState || "VT",
    projectionYears: [10, 20, 30].includes(project.projectionYears) ? project.projectionYears : 30,
    cycleLengthYears: project.cycleLengthYears ?? 5,
    forestLocationCode: project.forestLocationCode ?? variant?.defaultForestLocationCode ?? 922,
    siteSpeciesCode: project.siteSpeciesCode ?? variant?.defaultSiteSpeciesCode ?? 13,
    siteIndex: project.siteIndex ?? variant?.defaultSiteIndex ?? 56,
    inventoryDesign: project.inventoryDesign ?? "expanded_tpa"
  };
}

function loadStoredDraft(): StoredDraft | undefined {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredDraft) : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeScenario(project: StandProject, scenario: ScenarioDefinition): ScenarioDefinition {
  if (scenario.type !== "baseline") {
    const years = scenario.treatmentYears.length > 0 ? scenario.treatmentYears : [project.inventoryYear + (project.cycleLengthYears ?? 5)];
    const treatmentYears = years.map((year) =>
      snapTreatmentYear(project.inventoryYear, project.projectionYears, year, project.cycleLengthYears ?? 5)
    );
    const treatmentYear = Math.max(0, treatmentYears[0] - project.inventoryYear);
    const sanitized = {
      ...scenario,
      treatmentYears,
      treatmentYear,
      treatmentType: scenario.type,
      treatmentIntensity: scenario.simpleControls?.percentBasalAreaRemoval ?? scenario.treatmentIntensity,
      treatmentBasis: scenario.treatmentBasis ?? "percent_basal_area_removed",
      cycleLengthYears: project.cycleLengthYears ?? 5
    };
    return {
      ...sanitized,
      name: generatedScenarioName(sanitized)
    };
  }
  return {
    ...scenario,
    name: scenario.id === "baseline" ? "No treatment" : scenario.name,
    treatmentYears: [],
    simpleControls: undefined,
    customFvsKeywordText: undefined
  };
}
