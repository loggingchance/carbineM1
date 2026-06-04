import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve("fvs-src");
const candidateRoots = [
  join(root, "ForestVegetationSimulator"),
  join(root, "ForestVegetationSimulator-main"),
  root
];

const expected = ["README.md", "license.txt", "base", "ne", "fire", "bin"];
const officialRoot = candidateRoots.find((candidate) => existsSync(join(candidate, "ne")) && existsSync(join(candidate, "base")));

if (!officialRoot) {
  console.log("Official FVS source not found.");
  console.log("");
  console.log("Download the official USDA source ZIP:");
  console.log("https://github.com/USDAForestService/ForestVegetationSimulator/archive/refs/heads/main.zip");
  console.log("");
  console.log("Save it as:");
  console.log(join(root, "official-fvs-main.zip"));
  console.log("");
  console.log("Then run:");
  console.log("powershell -NoProfile -Command \"Expand-Archive -LiteralPath fvs-src\\official-fvs-main.zip -DestinationPath fvs-src -Force\"");
  process.exit(1);
}

const present = expected.filter((name) => existsSync(join(officialRoot, name)));
const nvelRoot = join(officialRoot, "volume", "NVEL");
const nvelReady = existsSync(join(nvelRoot, "beqinfo.inc")) && existsSync(join(nvelRoot, "bioeqcoef.inc"));
const directories = readdirSync(officialRoot)
  .filter((name) => statSync(join(officialRoot, name)).isDirectory())
  .slice(0, 80);

console.log(`Official FVS source candidate: ${officialRoot}`);
console.log(`Expected entries present: ${present.join(", ") || "none"}`);
console.log(`NVEL VolumeLibrary submodule: ${nvelReady ? "present" : "missing"}`);
console.log(`Top-level directories: ${directories.join(", ")}`);

if (!present.includes("ne")) {
  console.log("NE variant folder was not found. CARBINE cannot begin the Northeast build spike yet.");
  process.exit(1);
}

if (!nvelReady) {
  console.log("");
  console.log("The official FVS source ZIP does not include the volume/NVEL submodule files.");
  console.log("Download the official VolumeLibrary ZIP from:");
  console.log("https://github.com/FMSC-Measurements/VolumeLibrary");
  console.log("");
  console.log("Use GitHub's Code > Download ZIP button, then extract its contents into:");
  console.log(nvelRoot);
  console.log("");
  console.log("After extraction, this file should exist:");
  console.log(join(nvelRoot, "beqinfo.inc"));
  process.exit(1);
}

console.log("Ready for the official FVS source build spike.");
