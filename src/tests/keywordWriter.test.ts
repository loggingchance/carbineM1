import { describe, expect, it } from "vitest";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { baselineScenario, lightThinScenario } from "../domain/scenarioSchema";
import { writeKeywordPreview, writeOfficialKeywordFile, writeOfficialTreeFile } from "../fvs/keywordWriter";

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
      speciesCode: "RED MAPLE",
      dbhIn: 8,
      heightFt: 54,
      treesPerAcre: 2.3,
      status: "live"
    }
  ],
  scenarios: [baselineScenario(2026)]
};

describe("writeKeywordPreview", () => {
  it("keeps FVS syntax isolated in the writer", () => {
    const output = writeKeywordPreview(request, request.scenarios[0]);
    expect(output).toContain("Project: Test project");
    expect(output).toContain("Variant: NE");
    expect(output).toContain("INVYEAR 2026");
  });

  it("writes official FVS key and tree files for the native bridge", () => {
    const key = writeOfficialKeywordFile(request, request.scenarios[0]);
    const tree = writeOfficialTreeFile(request);
    expect(key).toContain("TREEDATA");
    expect(key).toContain("FMIN");
    expect(key).toContain("CARBCALC");
    expect(key).toContain("CARBREPT");
    expect(key).toContain("COMPUTE");
    expect(tree).toContain("RM");
    expect(tree).toContain("  2.3000");
    expect(tree).toContain("-999");
  });

  it("scales tree expansion from inventory TPA instead of fixed plot area defaults", () => {
    const tree = writeOfficialTreeFile({
      ...request,
      inventory: [
        ...request.inventory,
        { ...request.inventory[0], speciesCode: "SUGAR MAPLE", treesPerAcre: 4.3 }
      ]
    });
    expect(tree).toContain("  2.3000");
    expect(tree).toContain("  4.3000");
  });

  it("maps common species names to NE FVS species codes in official tree files", () => {
    const tree = writeOfficialTreeFile({
      ...request,
      inventory: [
        { ...request.inventory[0], treeId: "1002", speciesCode: "RED SPRUCE" },
        { ...request.inventory[0], treeId: "1003", speciesCode: "BLACK CHERRY" },
        { ...request.inventory[0], treeId: "1004", speciesCode: "EASTERN WHITE PINE" }
      ]
    });

    expect(tree).toContain("1RS");
    expect(tree).toContain("1BC");
    expect(tree).toContain("1WP");
    expect(tree).not.toContain("1RE");
    expect(tree).not.toContain("1BL");
    expect(tree).not.toContain("1EA");
  });

  it("uses source plot ids while preserving inventory trees-per-acre expansion", () => {
    const robustRequest = {
      ...request,
      inventory: [
        { ...request.inventory[0], plotId: "Plot_1", treeId: "1001", treesPerAcre: 1.2, crownRatio: 46 },
        { ...request.inventory[0], plotId: "Plot_1", treeId: "1002", treesPerAcre: 2.4, crownRatio: 0.42 },
        { ...request.inventory[0], plotId: "Plot_2", treeId: "1003", treesPerAcre: 3.6, crownRatio: 0.38 }
      ]
    };
    const key = writeOfficialKeywordFile(robustRequest, robustRequest.scenarios[0]);
    const tree = writeOfficialTreeFile(robustRequest);

    expect(key).toContain("DESIGN        -15.0       0.0");
    expect(tree).toContain("   1    1001  1.2000");
    expect(tree).toContain("   1    1002  2.4000");
    expect(tree).toContain("   2    1003  3.6000");
    expect(tree).toContain("  46");
    expect(tree).toContain("  42");
  });

  it("writes thinning controls as the requested removal fraction and DBH limits", () => {
    const scenario = {
      ...lightThinScenario(2026),
      treatmentYears: [2036],
      simpleControls: { percentBasalAreaRemoval: 25, minDbhIn: 6, maxDbhIn: 18 }
    };

    const key = writeOfficialKeywordFile({ ...request, scenarios: [scenario] }, scenario);

    expect(key).toContain("NUMCYCLE        7.0");
    expect(key).toContain("TIMEINT         0.0       5.0");
    expect(key).toContain("THINDBH      2036.0       6.0      18.0      0.25");
  });
});
