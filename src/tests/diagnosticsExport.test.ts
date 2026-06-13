import { describe, expect, it } from "vitest";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { baselineScenario, lightThinScenario } from "../domain/scenarioSchema";
import { buildDiagnosticsExport } from "../reports/diagnosticsExport";

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
      units: "tons_carbon",
      points: [
        { year: 2026, selectedPoolTotalCarbonTons: 10, liveTreeCarbonTons: 8 },
        { year: 2036, selectedPoolTotalCarbonTons: 12, liveTreeCarbonTons: 9 }
      ],
      includedPools: [],
      excludedPools: [],
      fvsSourceFiles: [],
      parserWarnings: []
    },
    {
      scenarioId: "thin-2036",
      scenarioName: "Thin 20% BA in 2036 DBH >= 6 in",
      units: "tons_carbon",
      points: [
        { year: 2026, selectedPoolTotalCarbonTons: 10, liveTreeCarbonTons: 8 },
        { year: 2036, selectedPoolTotalCarbonTons: 11, liveTreeCarbonTons: 7.5, harvestedCarbonTons: 1.2 }
      ],
      includedPools: [],
      excludedPools: [],
      fvsSourceFiles: [],
      parserWarnings: []
    }
  ],
  runArtifacts: [
    {
      scenarioId: "baseline",
      scenarioName: "No treatment",
      keywordFile: "SCREEN\nPROCESS\nSTOP\n",
      inventoryFile: "tree rows\n-999\n",
      runLog: "ran fvsne.exe",
      rawOutputs: { "input.out": "STAND CARBON REPORT" }
    }
  ]
};

describe("buildDiagnosticsExport", () => {
  it("packages request, parsed results, generated preview, and raw artifacts", () => {
    const exported = JSON.parse(buildDiagnosticsExport(request, results, "friendly preview"));

    expect(exported.format).toBe("carbine-diagnostics");
    expect(exported.summary.variant).toBe("NE");
    expect(exported.summary.runArtifactCount).toBe(1);
    expect(exported.summary.treatmentEffects[0].removedCarbonByYear[0].removedCarbonTons).toBe(1.2);
    expect(exported.summary.treatmentEffects[0].finalSelectedPoolDeltaVsBaselineTons).toBe(-1);
    expect(exported.generatedPreview).toBe("friendly preview");
    expect(exported.request.inventory[0].speciesCode).toBe("SM");
    expect(exported.runArtifacts[0].keywordFile).toContain("SCREEN");
    expect(exported.runArtifacts[0].rawOutputs["input.out"]).toContain("STAND CARBON REPORT");
  });
});
