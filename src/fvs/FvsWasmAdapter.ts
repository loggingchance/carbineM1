import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import type { ValidationResult } from "../domain/validation";
import type { FvsAdapter, FvsRunResult, FvsRuntimeInfo } from "./FvsAdapter";

export class FvsWasmAdapter implements FvsAdapter {
  name = "FVS browser runtime";
  isRealFvs = true;

  async getRuntimeInfo(): Promise<FvsRuntimeInfo> {
    return {
      adapterName: this.name,
      isRealFvs: true,
      label: "Real FVS runtime unavailable",
      notes: ["FVS WASM/WASI runtime has not been bundled yet."]
    };
  }

  async validateRequest(): Promise<ValidationResult> {
    return {
      ok: false,
      messages: [{ severity: "error", message: "Real browser FVS runtime is not connected yet." }]
    };
  }

  async runScenario(_request: CarbineRunRequest, _scenarioId: string): Promise<FvsRunResult> {
    throw new Error("Real browser FVS runtime is not connected yet.");
  }

  async runScenarioSet(_request: CarbineRunRequest): Promise<CarbineScenarioResults> {
    throw new Error("Real browser FVS runtime is not connected yet.");
  }
}
