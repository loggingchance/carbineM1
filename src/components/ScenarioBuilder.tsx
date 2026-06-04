import { Plus, Trash2 } from "lucide-react";
import type { StandProject } from "../domain/inventorySchema";
import {
  generatedScenarioName,
  scenarioDisplayName,
  snapTreatmentYear,
  treatmentYearOptions,
  type ScenarioDefinition
} from "../domain/scenarioSchema";

type ScenarioPreset = "baseline" | "thin-15" | "thin-25" | "thin-35" | "harvest-25" | "custom-thin";

export function ScenarioBuilder({
  project,
  scenarios,
  onScenariosChange
}: {
  project: StandProject;
  scenarios: ScenarioDefinition[];
  onScenariosChange: (scenarios: ScenarioDefinition[]) => void;
}) {
  const cycleYears = treatmentYearOptions(project.inventoryYear, project.projectionYears);

  function applyScenarioPreset(scenario: ScenarioDefinition, preset: ScenarioPreset): ScenarioDefinition {
    if (preset === "baseline") {
      return {
        ...scenario,
        type: "baseline",
        name: "No treatment",
        treatmentYears: [],
        simpleControls: undefined,
        customFvsKeywordText: undefined
      };
    }

    const type = preset === "harvest-25" ? "harvest" : "thin";
    const percent = preset === "thin-15" ? 15 : preset === "thin-35" ? 35 : 25;
    const treatmentYear = snapTreatmentYear(
      project.inventoryYear,
      project.projectionYears,
      scenario.treatmentYears[0] ?? project.inventoryYear + 10
    );
    const updated: ScenarioDefinition = {
      ...scenario,
      type,
      treatmentYears: [treatmentYear],
      simpleControls: {
        minDbhIn: 6,
        ...scenario.simpleControls,
        percentBasalAreaRemoval: preset === "custom-thin" ? scenario.simpleControls?.percentBasalAreaRemoval ?? 25 : percent
      }
    };
    return withGeneratedName(updated);
  }

  function updateSimpleControl(
    scenario: ScenarioDefinition,
    key: keyof NonNullable<ScenarioDefinition["simpleControls"]>,
    value: number | undefined
  ): ScenarioDefinition {
    return withGeneratedName({
      ...scenario,
      simpleControls: {
        ...scenario.simpleControls,
        [key]: value
      }
    });
  }

  function addThinScenario() {
    const scenario: ScenarioDefinition = {
      id: `thin-${Date.now()}`,
      name: "Treatment scenario",
      type: "thin",
      startYear: project.inventoryYear,
      treatmentYears: [project.inventoryYear + 10],
      simpleControls: { percentBasalAreaRemoval: 25, minDbhIn: 6 }
    };
    onScenariosChange([
      ...scenarios,
      withGeneratedName(scenario)
    ]);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Scenario</p>
          <h2>Build a plain-language treatment timeline</h2>
        </div>
        <button type="button" className="secondary" onClick={addThinScenario}>
          <Plus size={18} /> Add scenario
        </button>
      </div>

      <div className="scenario-list">
        {scenarios.map((scenario) => (
          <article className="scenario-card" key={scenario.id}>
            <label>
              Scenario
              <select
                value={scenarioPreset(scenario)}
                disabled={scenario.id === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id ? applyScenarioPreset(item, event.target.value as ScenarioPreset) : item
                    )
                  )
                }
              >
                <option value="baseline">No treatment</option>
                <option value="thin-15">Thin 15% BA</option>
                <option value="thin-25">Thin 25% BA</option>
                <option value="thin-35">Thin 35% BA</option>
                <option value="harvest-25">Harvest/remove 25% BA</option>
                <option value="custom-thin">Custom controls</option>
              </select>
            </label>
            <label>
              Treatment year
              <select
                value={snapTreatmentYear(
                  project.inventoryYear,
                  project.projectionYears,
                  scenario.treatmentYears[0] ?? project.inventoryYear + 10
                )}
                disabled={scenario.type === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id ? withGeneratedName({ ...item, treatmentYears: [Number(event.target.value)] }) : item
                    )
                  )
                }
              >
                {cycleYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              BA removal %
              <input
                type="number"
                value={scenario.simpleControls?.percentBasalAreaRemoval ?? 0}
                disabled={scenario.type === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id
                        ? updateSimpleControl(item, "percentBasalAreaRemoval", Number(event.target.value))
                        : item
                    )
                  )
                }
              />
            </label>
            <label>
              Min DBH
              <input
                type="number"
                value={scenario.simpleControls?.minDbhIn ?? ""}
                disabled={scenario.type === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id
                        ? updateSimpleControl(item, "minDbhIn", event.target.value === "" ? undefined : Number(event.target.value))
                        : item
                    )
                  )
                }
              />
            </label>
            <label>
              Max DBH
              <input
                type="number"
                value={scenario.simpleControls?.maxDbhIn ?? ""}
                disabled={scenario.type === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id
                        ? updateSimpleControl(item, "maxDbhIn", event.target.value === "" ? undefined : Number(event.target.value))
                        : item
                    )
                  )
                }
              />
            </label>
            {scenario.id !== "baseline" && (
              <button type="button" className="icon-button" aria-label={`Remove ${scenario.name}`} onClick={() => onScenariosChange(scenarios.filter((item) => item.id !== scenario.id))}>
                <Trash2 size={17} />
              </button>
            )}
            <p className="scenario-control-preview">
              {scenarioDisplayName(withGeneratedName(scenario))}. {describeActualControls(project, scenario)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function withGeneratedName(scenario: ScenarioDefinition): ScenarioDefinition {
  return { ...scenario, name: generatedScenarioName(scenario) };
}

function scenarioPreset(scenario: ScenarioDefinition): ScenarioPreset {
  if (scenario.type === "baseline") return "baseline";
  if (scenario.type === "harvest") return "harvest-25";

  const percent = scenario.simpleControls?.percentBasalAreaRemoval;
  if (scenario.type === "thin" && percent === 15) return "thin-15";
  if (scenario.type === "thin" && percent === 25) return "thin-25";
  if (scenario.type === "thin" && percent === 35) return "thin-35";
  return "custom-thin";
}

function describeActualControls(project: StandProject, scenario: ScenarioDefinition): string {
  if (scenario.type === "baseline") return "Actual FVS controls: no treatment keyword";

  const year = snapTreatmentYear(project.inventoryYear, project.projectionYears, scenario.treatmentYears[0] ?? project.inventoryYear + 10);
  const percent = scenario.simpleControls?.percentBasalAreaRemoval ?? 0;
  const minDbh = scenario.simpleControls?.minDbhIn;
  const maxDbh = scenario.simpleControls?.maxDbhIn;
  const minText = minDbh === undefined ? "0" : String(minDbh);
  const maxText = maxDbh === undefined ? "999" : String(maxDbh);
  return `Actual FVS controls: THINDBH ${year}, DBH ${minText}-${maxText} in, remove ${percent}%`;
}
