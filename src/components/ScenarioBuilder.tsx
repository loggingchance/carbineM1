import { Plus, Trash2 } from "lucide-react";
import type { StandProject } from "../domain/inventorySchema";
import {
  generatedScenarioName,
  scenarioDisplayName,
  snapTreatmentYear,
  type ScenarioDefinition
} from "../domain/scenarioSchema";
import { generateTreatmentYearOptions } from "../utils/cycleYears";

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
  const treatmentOptions = generateTreatmentYearOptions(project.inventoryYear, project.projectionYears, project.cycleLengthYears ?? 5);

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
      scenario.treatmentYears[0] ?? project.inventoryYear + (project.cycleLengthYears ?? 5),
      project.cycleLengthYears ?? 5
    );
    const updated: ScenarioDefinition = {
      ...scenario,
      type,
      treatmentYears: [treatmentYear],
      treatmentYear: treatmentYear - project.inventoryYear,
      treatmentType: type,
      treatmentIntensity: preset === "custom-thin" ? scenario.simpleControls?.percentBasalAreaRemoval ?? 25 : percent,
      treatmentBasis: "percent_basal_area_removed",
      cycleLengthYears: project.cycleLengthYears ?? 5,
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
      treatmentIntensity: key === "percentBasalAreaRemoval" ? value : scenario.treatmentIntensity,
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
      treatmentYears: [project.inventoryYear + (project.cycleLengthYears ?? 5)],
      treatmentYear: project.cycleLengthYears ?? 5,
      treatmentType: "thin",
      treatmentIntensity: 25,
      treatmentBasis: "percent_basal_area_removed",
      cycleLengthYears: project.cycleLengthYears ?? 5,
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
          <p className="quiet">
            These simplified treatment settings are intended for scenario exploration, not as a full silvicultural prescription.
          </p>
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
                <option value="thin-15">Thin / partial removal - 15% BA</option>
                <option value="thin-25">Thin / partial removal - 25% BA</option>
                <option value="thin-35">Thin / partial removal - 35% BA</option>
                <option value="harvest-25">Harvest / regeneration removal - 25% BA</option>
                <option value="custom-thin">Custom removal percentage</option>
              </select>
            </label>
            <label>
              Treatment timing
              <select
                value={snapTreatmentYear(
                  project.inventoryYear,
                  project.projectionYears,
                  scenario.treatmentYears[0] ?? project.inventoryYear + (project.cycleLengthYears ?? 5),
                  project.cycleLengthYears ?? 5
                )}
                disabled={scenario.type === "baseline"}
                onChange={(event) =>
                  onScenariosChange(
                    scenarios.map((item) =>
                      item.id === scenario.id
                        ? withGeneratedName({
                            ...item,
                            treatmentYears: [Number(event.target.value)],
                            treatmentYear: Number(event.target.value) - project.inventoryYear
                          })
                        : item
                    )
                  )
                }
              >
                {treatmentOptions.map((option) => (
                  <option key={option.year} value={option.year}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Removal intensity
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
              Removal basis
              <select value="percent_basal_area_removed" disabled={scenario.type === "baseline"}>
                <option value="percent_basal_area_removed">Percent of basal area removed</option>
              </select>
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
              {scenarioDisplayName(withGeneratedName(scenario))}. {describePlainControls(project, scenario)}
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

function describePlainControls(project: StandProject, scenario: ScenarioDefinition): string {
  if (scenario.type === "baseline") return "No treatment is applied.";

  const year = snapTreatmentYear(
    project.inventoryYear,
    project.projectionYears,
    scenario.treatmentYears[0] ?? project.inventoryYear + (project.cycleLengthYears ?? 5),
    project.cycleLengthYears ?? 5
  );
  const percent = scenario.simpleControls?.percentBasalAreaRemoval ?? 0;
  const minDbh = scenario.simpleControls?.minDbhIn;
  const maxDbh = scenario.simpleControls?.maxDbhIn;
  const minText = minDbh === undefined ? "0" : String(minDbh);
  const maxText = maxDbh === undefined ? "999" : String(maxDbh);
  const timing = year === project.inventoryYear ? "immediately" : `in ${year}`;
  return `Treatment scheduled ${timing}; remove ${percent}% of basal area from trees ${minText}-${maxText} in DBH.`;
}
