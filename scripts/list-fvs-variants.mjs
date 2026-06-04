import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const binDir = resolve("fvs-src", "ForestVegetationSimulator-main", "bin");

if (!existsSync(binDir)) {
  console.error("Official FVS bin directory not found. Put USDA ForestVegetationSimulator source under fvs-src first.");
  process.exit(1);
}

const variants = readdirSync(binDir)
  .filter((name) => /^FVS.*_sourceList\.txt$/i.test(name))
  .map((name) => name.replace("_sourceList.txt", ""))
  .sort();

console.log(`Official FVS variants found: ${variants.length}`);
for (const variant of variants) {
  console.log(variant);
}
