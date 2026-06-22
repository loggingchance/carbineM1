import type { StandProject } from "../domain/inventorySchema";
import { isVerifiedVariant, suggestVariantForState, variantCatalog } from "../fvs/variantCatalog";

export function VariantPicker({
  project,
  onProjectChange
}: {
  project: StandProject;
  onProjectChange: (project: StandProject) => void;
}) {
  const suggestion = suggestVariantForState(project.state);

  return (
    <section className="panel compact">
      <div>
        <p className="eyebrow">Variant</p>
        <h2>Choose the FVS variant</h2>
      </div>
      <div className="variant-row">
        <select value={project.fvsVariant} onChange={(event) => onProjectChange({ ...project, fvsVariant: event.target.value })}>
          {variantCatalog.map((variant) => (
            <option key={variant.code} value={variant.code} disabled={!isVerifiedVariant(variant.code)}>
              {variant.code} - {variant.name}{isVerifiedVariant(variant.code) ? "" : " (not yet verified)"}
            </option>
          ))}
        </select>
        {suggestion && isVerifiedVariant(suggestion.code) && suggestion.code !== project.fvsVariant && (
          <button type="button" className="secondary" onClick={() => onProjectChange({ ...project, fvsVariant: suggestion.code })}>
            Use suggested {suggestion.code}
          </button>
        )}
      </div>
      <p className="quiet">Only NE is enabled in this testing build. Other official executables may be installed on the server, but CARBINE's tree-file defaults and species handling have not yet been verified for those variants.</p>
    </section>
  );
}
