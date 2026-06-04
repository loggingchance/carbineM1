export const standardInventoryFields = [
  "stand_id",
  "plot_id",
  "tree_id",
  "species",
  "dbh_in",
  "trees_per_acre",
  "height_ft",
  "crown_ratio",
  "status",
  "notes"
] as const;

export type StandardInventoryField = (typeof standardInventoryFields)[number];

export const requiredImportFields: StandardInventoryField[] = ["species", "dbh_in", "trees_per_acre", "status"];

export const fieldSynonyms: Record<StandardInventoryField, string[]> = {
  stand_id: ["stand", "standid", "stand_id", "compartment", "unit", "tract", "property", "standname", "stand_name"],
  plot_id: ["plot", "plotid", "plot_id", "point", "point_id", "prism", "cruise_plot", "sample_point", "subplot"],
  tree_id: ["tree", "treeid", "tree_id", "tag", "tag_no", "stem", "stem_id", "record", "row", "tree_no"],
  species: ["species", "sp", "spp", "spec", "species_code", "species_name", "common_name", "tree_species", "fia_spcd", "fvs_sp"],
  dbh_in: ["dbh", "dia", "diameter", "diameter_in", "dbh_in", "dbh_inches", "d_b_h", "breast_height_diameter"],
  trees_per_acre: ["tpa", "trees_ac", "trees_per_acre", "expansion", "expansion_factor", "expf", "tree_factor", "factor"],
  height_ft: ["height", "ht", "total_ht", "total_height", "tree_height", "height_ft", "ht_ft"],
  crown_ratio: ["cr", "crown", "crown_ratio", "live_crown_ratio", "lcr", "cr_pct", "crown_percent"],
  status: ["status", "live_dead", "condition", "tree_status", "class", "mortality", "alive", "dead", "treeclcd"],
  notes: ["notes", "comments", "remarks", "defect", "product", "vigor", "quality", "grade"]
};

export function normalizeImportToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
