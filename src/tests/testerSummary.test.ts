import { describe, expect, it } from "vitest";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { baselineScenario, lightThinScenario } from "../domain/scenarioSchema";
import { buildTesterSummary } from "../reports/testerSummary";

const request: CarbineRunRequest = {
  project: {
    projectName: "Test project",
    standName: "Stand A",
    areaAcres: 10,
    inventoryYear: 2026,
    projectionYears: 30,
    cycleLengthYears: 5,
    siteSpeciesCode: 13,
    siteIndex: 56,
    inventoryDesign: "expanded_tpa",
    location: { state: "VT" }
  },
  fvs: { variant: "NE", extensions: { carbon: true } },
  inventory: [
    {
      standId: "Stand A",
      speciesCode: "SM",
      dbhIn: 12,
      heightFt: 55,
      treesPerAcre: 1.2,
      status: "live"
    }
  ],
  scenarios: [baselineScenario(2026), lightThinScenario(2026)]
};

const results: CarbineScenarioResults = {
  adapterName: "Official FVS source",
  isRealFvs: true,
  generatedAt: "2026-06-01T00:00:00.000Z",
  series: [
    {
      scenarioId: "baseline",
      scenarioName: "No treatment",
      units: "short_tons_carbon_per_acre",
      points: [
        { year: 2026, selectedPoolTotalCarbonTons: 10, liveTreeCarbonTons: 8, totalVolumeCuFt: 100 },
        { year: 2036, selectedPoolTotalCarbonTons: 12, liveTreeCarbonTons: 9, totalVolumeCuFt: 120 }
      ],
      includedPools: [],
      excludedPools: [],
      fvsSourceFiles: [],
      parserWarnings: ["baseline warning"]
    },
    {
      scenarioId: "thin-2036",
      scenarioName: "Thin 20% BA in 2036 DBH >= 6 in",
      units: "short_tons_carbon_per_acre",
      points: [
        { year: 2026, selectedPoolTotalCarbonTons: 10, liveTreeCarbonTons: 8, totalVolumeCuFt: 100 },
        { year: 2036, selectedPoolTotalCarbonTons: 11, liveTreeCarbonTons: 7.5, harvestedCarbonTons: 1.2, totalVolumeCuFt: 90 }
      ],
      includedPools: [],
      excludedPools: [],
      fvsSourceFiles: [],
      parserWarnings: []
    }
  ]
};

describe("buildTesterSummary", () => {
  it("creates a plain text tester handoff summary", () => {
    const summary = buildTesterSummary(request, results);

    expect(summary).toContain("Runtime: Real official FVS output");
    expect(summary).toContain("Final carbon pool shown: 11.0 short tons C/acre");
    expect(summary).toContain("Treatment Effects vs Baseline");
    expect(summary).toContain("carbon pool shown -1.0");
    expect(summary).toContain("No treatment: baseline warning");
    expect(summary).toContain("carbine-diagnostics*.json");
    expect(summary).toContain("CARBINE is not an official USDA Forest Service product.");
  });
});
