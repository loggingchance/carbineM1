import type { StandProject } from "../domain/inventorySchema";
import { applyVariantDefaults, getVariantByCode, suggestVariantForState, variantCatalog } from "../fvs/variantCatalog";

export function VariantPicker({
  project,
  onProjectChange
}: {
  project: StandProject;
  onProjectChange: (project: StandProject) => void;
}) {
  const suggestion = suggestVariantForState(project.state);
  const selectedVariant = getVariantByCode(project.fvsVariant);

  function changeVariant(code: string) {
    onProjectChange(applyVariantDefaults(project, code));
  }

  return (
    <section className="panel compact">
      <div>
        <p className="eyebrow">Variant</p>
        <h2>Choose the FVS variant</h2>
      </div>
      <div className="variant-row">
        <select value={project.fvsVariant} onChange={(event) => changeVariant(event.target.value)}>
          {variantCatalog.map((variant) => (
            <option key={variant.code} value={variant.code}>
              {variant.code} - {variant.name}
            </option>
          ))}
        </select>
        {suggestion && suggestion.code !== project.fvsVariant && (
          <button type="button" className="secondary" onClick={() => changeVariant(suggestion.code)}>
            Use suggested {suggestion.code}
          </button>
        )}
      </div>
      {selectedVariant && (
        <p className="quiet">
          CARBINE will call the official {`FVS${selectedVariant.code.toLowerCase()}.exe`} executable when it is available on the hosted API. Review species codes, FVS forest/location code, and site index for the selected variant before relying on results.
        </p>
      )}
    </section>
  );
}
