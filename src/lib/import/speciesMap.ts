import { normalizeImportToken } from "./fieldSynonyms";

const neSpeciesMap: Record<string, string> = {
  sugar_maple: "SUGAR MAPLE",
  sm: "SUGAR MAPLE",
  acer_saccharum: "SUGAR MAPLE",
  "318": "SUGAR MAPLE",
  red_maple: "RED MAPLE",
  rm: "RED MAPLE",
  acer_rubrum: "RED MAPLE",
  "316": "RED MAPLE",
  yellow_birch: "YELLOW BIRCH",
  yb: "YELLOW BIRCH",
  betula_alleghaniensis: "YELLOW BIRCH",
  "371": "YELLOW BIRCH",
  paper_birch: "PAPER BIRCH",
  pb: "PAPER BIRCH",
  betula_papyrifera: "PAPER BIRCH",
  "375": "PAPER BIRCH",
  american_beech: "AMERICAN BEECH",
  beech: "AMERICAN BEECH",
  ab: "AMERICAN BEECH",
  fagus_grandifolia: "AMERICAN BEECH",
  "531": "AMERICAN BEECH",
  white_ash: "WHITE ASH",
  wa: "WHITE ASH",
  fraxinus_americana: "WHITE ASH",
  "541": "WHITE ASH",
  black_cherry: "BLACK CHERRY",
  bc: "BLACK CHERRY",
  prunus_serotina: "BLACK CHERRY",
  "762": "BLACK CHERRY",
  red_spruce: "RED SPRUCE",
  rs: "RED SPRUCE",
  picea_rubens: "RED SPRUCE",
  "097": "RED SPRUCE",
  eastern_hemlock: "EASTERN HEMLOCK",
  hemlock: "EASTERN HEMLOCK",
  eh: "EASTERN HEMLOCK",
  tsuga_canadensis: "EASTERN HEMLOCK",
  "261": "EASTERN HEMLOCK",
  white_pine: "EASTERN WHITE PINE",
  eastern_white_pine: "EASTERN WHITE PINE",
  wp: "EASTERN WHITE PINE",
  pinus_strobus: "EASTERN WHITE PINE",
  "129": "EASTERN WHITE PINE",
  northern_red_oak: "NORTHERN RED OAK",
  red_oak: "NORTHERN RED OAK",
  ro: "NORTHERN RED OAK",
  quercus_rubra: "NORTHERN RED OAK",
  "833": "NORTHERN RED OAK"
};

export function mapSpecies(value: string): { species: string; warning?: string } {
  const key = normalizeImportToken(value);
  const species = neSpeciesMap[key];
  if (species) return { species };
  return { species: value.trim().toUpperCase(), warning: `Species "${value}" needs review; kept as entered.` };
}
