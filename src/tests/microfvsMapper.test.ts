import { describe, expect, it } from "vitest";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { baselineScenario, lightThinScenario } from "../domain/scenarioSchema";
import { buildMicroFvsRunPayload } from "../fvs/microfvsMapper";

const request: CarbineRunRequest = {
  project: {
    projectName: "Test project",
    standName: "Stand A",
    areaAcres: 10,
    inventoryYear: 2026,
    projectionYears: 30,
    cycleLengthYears: 5,
    forestLocationCode: 922,
    siteSpeciesCode: 13,
    siteIndex: 56,
    inventoryDesign: "expanded_tpa",
    location: { state: "VT", latitude: 44.1, longitude: -72.4 }
  },
  fvs: { variant: "NE", extensions: { carbon: true } },
  inventory: [
    {
      standId: "Stand A",
      plotId: "1",
      treeId: "1001",
      speciesCode: "RED MAPLE",
      dbhIn: 8,
      heightFt: 54,
      treesPerAcre: 2.3,
      status: "live",
      crownRatio: 0.42
    }
  ],
  scenarios: [baselineScenario(2026)]
};

describe("buildMicroFvsRunPayload", () => {
  it("maps CARBINE stand and tree data to MicroFVS input records", () => {
    const payload = buildMicroFvsRunPayload(request, request.scenarios[0]);

    expect(payload.stand_init).toMatchObject({
      stand_id: "Stand A",
      variant: "NE",
      inv_year: 2026,
      basal_area_factor: -15,
      inv_plot_size: 0,
      brk_dbh: 0,
      location: 922,
      site_species: 13,
      site_index: 56,
      latitude: 44.1,
      longitude: -72.4
    });
    expect(payload.template_params).toEqual({ num_cycles: 7, cycle_length: 5 });
    expect(payload.tree_init.trees?.[0]).toMatchObject({
      stand_id: "Stand A",
      plot_id: 1,
      tree_id: "1001",
      tree_count: 2.3,
      species: "RM",
      diameter: 8,
      history: 1,
      ht: 54,
      crratio: 42
    });
  });

  it("fails closed for treatment scenarios until MicroFVS treatment mapping is explicit", () => {
    expect(() => buildMicroFvsRunPayload(request, lightThinScenario(2026))).toThrow(/baseline runs only/);
  });
});
