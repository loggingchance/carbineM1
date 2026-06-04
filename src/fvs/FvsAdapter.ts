import type { CarbineScenarioResults, CarbonResultSeries } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import type { ValidationResult } from "../domain/validation";

export interface FvsRuntimeInfo {
  adapterName: string;
  isRealFvs: boolean;
  label: string;
  version?: string;
  notes: string[];
}

export interface FvsRunResult {
  scenarioId: string;
  success: boolean;
  warnings: string[];
  errors: string[];
  generatedFiles: {
    keywordFile?: string;
    inventoryFile?: string;
    runLog?: string;
    rawOutputs?: Record<string, string>;
  };
  parsedCarbon: CarbonResultSeries;
}

export interface FvsAdapter {
  name: string;
  isRealFvs: boolean;
  getRuntimeInfo(): Promise<FvsRuntimeInfo>;
  validateRequest(request: CarbineRunRequest): Promise<ValidationResult>;
  runScenario(request: CarbineRunRequest, scenarioId: string): Promise<FvsRunResult>;
  runScenarioSet(request: CarbineRunRequest): Promise<CarbineScenarioResults>;
}
