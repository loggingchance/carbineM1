export type TreeStatus = "live" | "dead" | "cut" | "leave";

export interface TreeRecord {
  standId: string;
  plotId?: string;
  treeId?: string;
  speciesCode: string;
  dbhIn: number;
  heightFt?: number;
  treesPerAcre: number;
  status: TreeStatus;
  crownRatio?: number;
  treeClass?: string;
  notes?: string;
}

export interface StandProject {
  projectName: string;
  standName: string;
  state: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  areaAcres: number;
  inventoryYear: number;
  projectionYears: number;
  cycleLengthYears: number;
  forestLocationCode: number;
  siteSpeciesCode: number;
  siteIndex: number;
  inventoryDesign: "expanded_tpa";
  fvsVariant: string;
  units: "english";
}

export interface InventorySummary {
  recordCount: number;
  speciesCount: number;
  dbhRange: [number, number] | null;
  totalTreesPerAcre: number;
  basalAreaFt2PerAcre: number;
}

export const requiredInventoryColumns = [
  "stand_id",
  "species_code",
  "dbh_in",
  "trees_per_acre"
] as const;

export const inventoryColumnHelp =
  "Needed columns: stand_id, species_code, dbh_in, and trees_per_acre. CARBINE currently expects each tree row to include expanded trees per acre; common headings like Stand, Species, DBH, and TPA are accepted.";

export function summarizeInventory(records: TreeRecord[]): InventorySummary {
  if (records.length === 0) {
    return {
      recordCount: 0,
      speciesCount: 0,
      dbhRange: null,
      totalTreesPerAcre: 0,
      basalAreaFt2PerAcre: 0
    };
  }

  const dbhValues = records.map((record) => record.dbhIn);
  const basalAreaFt2PerAcre = records.reduce((sum, record) => {
    const treeBasalArea = 0.005454 * record.dbhIn * record.dbhIn;
    return sum + treeBasalArea * record.treesPerAcre;
  }, 0);

  return {
    recordCount: records.length,
    speciesCount: new Set(records.map((record) => record.speciesCode)).size,
    dbhRange: [Math.min(...dbhValues), Math.max(...dbhValues)],
    totalTreesPerAcre: records.reduce((sum, record) => sum + record.treesPerAcre, 0),
    basalAreaFt2PerAcre
  };
}
