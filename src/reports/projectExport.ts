import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";

export function buildProjectExport(request: CarbineRunRequest, results?: CarbineScenarioResults): string {
  return JSON.stringify(
    {
      format: "carbine-project",
      version: 1,
      exportedAt: new Date().toISOString(),
      request,
      results
    },
    null,
    2
  );
}
