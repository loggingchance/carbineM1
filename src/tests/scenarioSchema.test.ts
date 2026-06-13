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
  it("offers 5-year treatment options and excludes the final projection year", () => {
    expect(treatmentYearOptions(2026, 30)).toEqual([2026, 2031, 2036, 2041, 2046, 2051]);
  });

  it("snaps off-cycle treatment years to the next 5-year cycle year", () => {
    expect(snapTreatmentYear(2026, 30, 2032)).toBe(2036);
    expect(snapTreatmentYear(2026, 30, 2056)).toBe(2051);
  });
});
