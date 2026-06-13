import { normalizeImportToken } from "./fieldSynonyms";

const neSpeciesMap: Record<string, string> = {
  sugar_maple: "SM",
  sm: "SM",
  acer_saccharum: "SM",
  "318": "SM",
  red_maple: "RM",
  rm: "RM",
  acer_rubrum: "RM",
  "316": "RM",
  yellow_birch: "YB",
  yb: "YB",
  betula_alleghaniensis: "YB",
  "371": "YB",
  paper_birch: "PB",
  pb: "PB",
  betula_papyrifera: "PB",
  "375": "PB",
  american_beech: "AB",
  beech: "AB",
  ab: "AB",
  fagus_grandifolia: "AB",
  "531": "AB",
  white_ash: "WA",
  wa: "WA",
  fraxinus_americana: "WA",
  "541": "WA",
  black_cherry: "BC",
  bc: "BC",
  prunus_serotina: "BC",
  "762": "BC",
  red_spruce: "RS",
  rs: "RS",
  picea_rubens: "RS",
  "097": "RS",
  eastern_hemlock: "EH",
  hemlock: "EH",
  eh: "EH",
  tsuga_canadensis: "EH",
  "261": "EH",
  white_pine: "WP",
  eastern_white_pine: "WP",
  wp: "WP",
  pinus_strobus: "WP",
  "129": "WP",
  northern_red_oak: "RO",
  red_oak: "RO",
  ro: "RO",
  quercus_rubra: "RO",
  "833": "RO"
};

export function mapSpecies(value: string): { species: string; warning?: string } {
  const key = normalizeImportToken(value);
  const species = neSpeciesMap[key];
  if (species) return { species };
  return { species: value.trim().toUpperCase(), warning: `Species "${value}" needs review; kept as entered.` };
}
