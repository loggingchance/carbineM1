export interface CarbonResultPoint {
  year: number;
  age?: number;
  liveTreeCarbonTons?: number;
  standingDeadCarbonTons?: number;
  downDeadWoodCarbonTons?: number;
  biomassCarbonTons?: number;
  harvestedCarbonTons?: number;
  selectedPoolTotalCarbonTons?: number;
  totalVolumeCuFt?: number;
  merchantableVolumeCuFt?: number;
  basalAreaFt2PerAcre?: number;
  treesPerAcre?: number;
  notes?: string[];
}

export interface CarbonResultSeries {
  scenarioId: string;
  scenarioName: string;
  units: "tons_carbon" | "metric_tons_carbon" | "tons_co2e" | "metric_tons_co2e";
  points: CarbonResultPoint[];
  includedPools: string[];
  excludedPools: string[];
  fvsSourceFiles: string[];
  parserWarnings: string[];
}

export interface CarbineScenarioResults {
  adapterName: string;
  isRealFvs: boolean;
  generatedAt: string;
  series: CarbonResultSeries[];
  runArtifacts?: Array<{
    scenarioId: string;
    scenarioName: string;
    keywordFile?: string;
    inventoryFile?: string;
    runLog?: string;
    rawOutputs?: Record<string, string>;
  }>;
}
