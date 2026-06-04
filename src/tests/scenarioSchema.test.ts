import { describe, expect, it } from "vitest";
import {
  generatedScenarioName,
  scenarioDisplayName,
  snapTreatmentYear,
  treatmentYearOptions,
  type ScenarioDefinition
} from "../domain/scenarioSchema";

describe("scenarioDisplayName", () => {
  it("describes generic treatment scenarios from their prescription", () => {
    const scenario: ScenarioDefinition = {
      id: "thin-1",
      name: "Treatment scenario",
      type: "thin",
      startYear: 2026,
      treatmentYears: [2036],
      simpleControls: { percentBasalAreaRemoval: 25, minDbhIn: 6 }
    };

    expect(scenarioDisplayName(scenario)).toBe("Thin 25% BA in 2036 DBH >= 6 in");
  });

  it("preserves explicit user scenario names", () => {
    const scenario: ScenarioDefinition = {
      id: "thin-2",
      name: "Shelterwood entry",
      type: "thin",
      startYear: 2026,
      treatmentYears: [2036],
      simpleControls: { percentBasalAreaRemoval: 30 }
    };

    expect(scenarioDisplayName(scenario)).toBe("Shelterwood entry");
  });

  it("regenerates scenario names from actual treatment controls", () => {
    const scenario: ScenarioDefinition = {
      id: "thin-3",
      name: "Thin 35% BA in 2061 DBH 12-24 in",
      type: "thin",
      startYear: 2026,
      treatmentYears: [2056],
      simpleControls: { percentBasalAreaRemoval: 35, minDbhIn: 12, maxDbhIn: 24 }
    };

    expect(generatedScenarioName(scenario)).toBe("Thin 35% BA in 2056 DBH 12-24 in");
  });
});

describe("FVS treatment cycle years", () => {
  it("offers post-inventory 10-year FVS cycle years through the projection", () => {
    expect(treatmentYearOptions(2026, 50)).toEqual([2036, 2046, 2056, 2066, 2076]);
  });

  it("snaps off-cycle treatment years to the next FVS cycle year", () => {
    expect(snapTreatmentYear(2026, 50, 2061)).toBe(2066);
    expect(snapTreatmentYear(2026, 50, 2063)).toBe(2066);
  });
});
