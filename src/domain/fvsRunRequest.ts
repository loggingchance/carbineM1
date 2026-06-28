import type { TreeRecord } from "./inventorySchema";
import type { ScenarioDefinition } from "./scenarioSchema";

export interface CarbineRunRequest {
  project: {
    projectName: string;
    standName: string;
    areaAcres: number;
    inventoryYear: number;
    projectionYears: number;
    cycleLengthYears: number;
    forestLocationCode: number;
    siteSpeciesCode: number;
    siteIndex: number;
    inventoryDesign: "expanded_tpa";
    location: {
      state: string;
      county?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  fvs: {
    variant: string;
    version?: string;
    extensions: {
      carbon: boolean;
      fireAndFuels?: boolean;
    };
    advancedKeywordSnippets?: string[];
  };
  inventory: TreeRecord[];
  scenarios: ScenarioDefinition[];
}
