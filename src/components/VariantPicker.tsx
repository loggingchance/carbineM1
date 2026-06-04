import type { StandProject } from "../domain/inventorySchema";
import { suggestVariantForState, variantCatalog } from "../fvs/variantCatalog";

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
            <option key={variant.code} value={variant.code}>
              {variant.code} - {variant.name}
            </option>
          ))}
        </select>
        {suggestion && suggestion.code !== project.fvsVariant && (
          <button type="button" className="secondary" onClick={() => onProjectChange({ ...project, fvsVariant: suggestion.code })}>
            Use suggested {suggestion.code}
          </button>
        )}
      </div>
      <p className="quiet">Variant catalog entries are placeholders until official FVS documentation is reviewed for the selected runtime.</p>
    </section>
  );
}
