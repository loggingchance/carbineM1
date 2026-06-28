import type { CarbineRunRequest } from "./fvsRunRequest";
import type { ScenarioDefinition } from "./scenarioSchema";
import type { ValidationMessage, ValidationResult } from "./validation";
import { isVerifiedVariant } from "../fvs/variantCatalog";

export function validateRunRequest(request: CarbineRunRequest): ValidationResult {
  const messages: ValidationMessage[] = [];

  if (request.inventory.length === 0) {
    messages.push({ severity: "error", message: "Load and validate an inventory before running a scenario." });
  }

  if (request.scenarios.length === 0) {
    messages.push({ severity: "error", message: "Add at least one scenario before running." });
  }

  if (!isVerifiedVariant(request.fvs.variant)) {
    messages.push({ severity: "error", message: `FVS variant ${request.fvs.variant} is not in the CARBINE variant catalog.` });
  }

  if (!Number.isFinite(request.project.forestLocationCode) || request.project.forestLocationCode <= 0) {
    messages.push({ severity: "error", message: "Enter a valid FVS forest/location code for the selected variant." });
  }

  if (!request.scenarios.some((scenario) => scenario.type === "baseline")) {
    messages.push({ severity: "warning", message: "Add a no-treatment baseline so treatment effects can be compared clearly." });
  }

  const seenIds = new Set<string>();
  for (const scenario of request.scenarios) {
    if (seenIds.has(scenario.id)) {
      messages.push({ severity: "error", message: `Scenario id "${scenario.id}" is duplicated.` });
    }
    seenIds.add(scenario.id);

    messages.push(...validateScenario(scenario));
  }

  return { ok: !messages.some((message) => message.severity === "error"), messages };
}

function validateScenario(scenario: ScenarioDefinition): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  if (scenario.type === "baseline") return messages;

  if (scenario.treatmentYears.length === 0) {
    messages.push({ severity: "error", message: `${scenario.name} needs a treatment year.` });
  }

  const percent = scenario.simpleControls?.percentBasalAreaRemoval;
  if (scenario.type === "thin" || scenario.type === "harvest") {
    if (percent === undefined || percent <= 0) {
      messages.push({ severity: "error", message: `${scenario.name} needs a BA removal percent greater than 0.` });
    } else if (percent > 80) {
      messages.push({ severity: "warning", message: `${scenario.name} removes ${percent}% BA. Review this before outside testing.` });
    }
  }

  const minDbh = scenario.simpleControls?.minDbhIn;
  const maxDbh = scenario.simpleControls?.maxDbhIn;
  if (minDbh !== undefined && maxDbh !== undefined && minDbh > maxDbh) {
    messages.push({ severity: "error", message: `${scenario.name} has Min DBH greater than Max DBH.` });
  }

  if ((scenario.type === "thin" || scenario.type === "harvest") && percent === 0) {
    messages.push({ severity: "warning", message: `${scenario.name} is effectively identical to the baseline.` });
  }

  return messages;
}
