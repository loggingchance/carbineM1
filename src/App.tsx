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
import { hasHostedFvsApi, hostedFvsApiUrl, runtimeModeFromStored, type RuntimeMode } from "./config/runtime";

const steps: WorkflowStep[] = ["Inventory", "Scenario", "Run", "Results", "Report", "Advanced", "About"];

const initialProject: StandProject = {
  projectName: "CARBINE sample project",
  standName: "NE simple stand",
  state: "VT",
  county: "Windsor",
  areaAcres: 42,
  inventoryYear: 2026,
  projectionYears: 50,
  fvsVariant: "NE",
  units: "english"
};

const storageKey = "carbine-project-draft";

interface StoredDraft {
  project: StandProject;
  inventory: TreeRecord[];
  scenarios: ScenarioDefinition[];
  results?: CarbineScenarioResults;
  generatedPreview?: string;
  runtimeMode?: RuntimeMode;
}

export function App() {
  const storedDraft = loadStoredDraft();
  const draftProject = storedDraft?.project ?? initialProject;
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
  const [generatedPreview, setGeneratedPreview] = useState(storedDraft?.generatedPreview ?? "");
  const [runtimeMode, setRuntimeMode] = useState<RuntimeMode>(
    hasHostedFvsApi ? "hosted" : runtimeModeFromStored(storedDraft?.runtimeMode) ?? "official"
  );

  const demoAdapter = useMemo(() => new FvsMockAdapter(), []);
  const officialAdapter = useMemo(() => new FvsOfficialSourceAdapter(), []);
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
        generatedPreview,
        runtimeMode
      })
    );
  }, [project, inventory, scenarios, results, generatedPreview, runtimeMode]);

  async function loadSampleInventory() {
    const csv = await fetch("./sample-data/ne-simple-stand.csv").then((response) => response.text());
    const metadata = await fetch("./sample-data/ne-simple-stand.json").then((response) => response.json());
    const parsed = parseInventoryCsv(csv);
    setInventory(parsed.records);
    setProject((current) => ({ ...current, ...metadata }));
  }

  return (
    <div className="app">
      <Banner runtimeLabel={results?.isRealFvs ? "Real FVS runtime" : hasHostedFvsApi ? "Hosted FVS API" : "Demo data"} />
      <WorkflowShell steps={steps} activeStep={activeStep} onChange={setActiveStep} />
      <main className="workspace">
        {activeStep === "Inventory" && (
          <InventoryUpload project={project} inventory={inventory} onProjectChange={setProject} onInventoryChange={setInventory} />
        )}
        {activeStep === "Scenario" && (
          <>
            <VariantPicker project={project} onProjectChange={setProject} />
            <ScenarioBuilder project={project} scenarios={scenarios} onScenariosChange={setScenarios} />
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
        {activeStep === "Report" && <ReportPreview request={request} results={results} generatedPreview={generatedPreview} />}
        {activeStep === "Advanced" && <AdvancedFvsPanel request={request} results={results} generatedPreview={generatedPreview} />}
        {activeStep === "About" && <AboutCarbine />}
      </main>
      <Disclaimer />
    </div>
  );
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
    const years = scenario.treatmentYears.length > 0 ? scenario.treatmentYears : [project.inventoryYear + 10];
    const sanitized = {
      ...scenario,
      treatmentYears: years.map((year) => snapTreatmentYear(project.inventoryYear, project.projectionYears, year))
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
