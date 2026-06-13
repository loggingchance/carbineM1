import { describe, expect, it } from "vitest";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { baselineScenario, lightThinScenario } from "../domain/scenarioSchema";
import { validateRunRequest } from "../domain/runValidation";

const request: CarbineRunRequest = {
  project: {
    projectName: "Test project",
    standName: "Stand A",
    areaAcres: 10,
    inventoryYear: 2026,
    projectionYears: 30,
    cycleLengthYears: 5,
    location: { state: "VT" }
  },
  fvs: { variant: "NE", extensions: { carbon: true } },
  inventory: [
    {
      standId: "Stand A",
      speciesCode: "SM",
      dbhIn: 12,
      heightFt: 60,
      treesPerAcre: 10,
      status: "live"
    }
  ],
  scenarios: [baselineScenario(2026), lightThinScenario(2026)]
};

describe("validateRunRequest", () => {
  it("blocks scenarios with inverted DBH limits", () => {
    const scenario = {
      ...lightThinScenario(2026),
      simpleControls: { percentBasalAreaRemoval: 25, minDbhIn: 20, maxDbhIn: 10 }
    };

    const validation = validateRunRequest({ ...request, scenarios: [baselineScenario(2026), scenario] });

    expect(validation.ok).toBe(false);
    expect(validation.messages.some((message) => message.message.includes("Min DBH greater than Max DBH"))).toBe(true);
  });

  it("blocks thinning scenarios with no removal percent", () => {
    const scenario = {
      ...lightThinScenario(2026),
      simpleControls: { percentBasalAreaRemoval: 0, minDbhIn: 6 }
    };

    const validation = validateRunRequest({ ...request, scenarios: [baselineScenario(2026), scenario] });

    expect(validation.ok).toBe(false);
    expect(validation.messages.some((message) => message.message.includes("BA removal percent greater than 0"))).toBe(true);
  });

  it("warns about very heavy removals and missing baselines", () => {
    const scenario = {
      ...lightThinScenario(2026),
      simpleControls: { percentBasalAreaRemoval: 85, minDbhIn: 6 }
    };

    const validation = validateRunRequest({ ...request, scenarios: [scenario] });

    expect(validation.ok).toBe(true);
    expect(validation.messages.some((message) => message.message.includes("no-treatment baseline"))).toBe(true);
    expect(validation.messages.some((message) => message.message.includes("removes 85% BA"))).toBe(true);
  });
});
