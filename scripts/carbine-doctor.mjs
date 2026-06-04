import { existsSync, readdirSync } from "node:fs";
import { access, constants, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(".");
const binDir = resolve("fvs-src", "ForestVegetationSimulator-main", "bin");
const bridgeUrl = process.env.CARBINE_FVS_BRIDGE_URL ?? "http://127.0.0.1:8787/health";
const uiUrl = process.env.CARBINE_UI_URL ?? "http://127.0.0.1:5174/";
const expectedVariants = [
  "FVSak", "FVSbc", "FVSbm", "FVSca", "FVSci", "FVScr", "FVScs", "FVSec", "FVSem", "FVSie", "FVSkt", "FVSls",
  "FVSnc", "FVSne", "FVSoc", "FVSon", "FVSop", "FVSpn", "FVSsn", "FVSso", "FVStt", "FVSut", "FVSwc", "FVSws"
];

const checks = [];

await checkProjectRoot();
await checkNodeAndNpm();
await checkInstalledDependencies();
await checkOfficialSource();
await checkBuiltVariants();
await checkHttp("Official FVS bridge", bridgeUrl, parseBridgeHealth);
await checkHttp("CARBINE UI", uiUrl);

const failed = checks.filter((check) => check.status === "FAIL");
const warned = checks.filter((check) => check.status === "WARN");

console.log("");
console.log("CARBINE doctor summary");
console.log("======================");
for (const check of checks) {
  console.log(`${check.status.padEnd(4)} ${check.name}: ${check.message}`);
  if (check.next) console.log(`     Next: ${check.next}`);
}
console.log("");
console.log(`Result: ${failed.length} fail, ${warned.length} warning, ${checks.length - failed.length - warned.length} pass.`);

if (failed.length > 0) {
  process.exit(1);
}

function add(status, name, message, next = "") {
  checks.push({ status, name, message, next });
}

async function checkProjectRoot() {
  if (!existsSync(join(root, "package.json"))) {
    add("FAIL", "Project folder", "package.json was not found.", "Run this from the CARBINE project folder.");
    return;
  }

  try {
    const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    add(packageJson.name === "carbine" ? "PASS" : "WARN", "Project folder", `package.json name is ${packageJson.name ?? "missing"}.`);
  } catch (error) {
    add("FAIL", "Project folder", `Could not read package.json: ${message(error)}`);
  }
}

async function checkNodeAndNpm() {
  add("PASS", "Node.js", process.version);

  const npmVersion = process.env.npm_config_user_agent?.match(/npm\/([^\s]+)/)?.[1];
  if (npmVersion) {
    add("PASS", "npm", npmVersion);
    return;
  }

  try {
    const { stdout } = await execFileAsync("cmd.exe", ["/d", "/s", "/c", "npm.cmd --version"], { timeout: 5000 });
    add("PASS", "npm", stdout.trim());
  } catch {
    add("WARN", "npm", "Could not confirm npm from this script.", "Run npm.cmd --version in this terminal.");
  }
}

async function checkInstalledDependencies() {
  const vitePath = join(root, "node_modules", "vite");
  const reactPath = join(root, "node_modules", "react");
  if (existsSync(vitePath) && existsSync(reactPath)) {
    add("PASS", "Node dependencies", "node_modules contains Vite and React.");
  } else {
    add("FAIL", "Node dependencies", "node_modules is missing required packages.", "Run npm.cmd install.");
  }
}

async function checkOfficialSource() {
  const sourceRoot = resolve("fvs-src", "ForestVegetationSimulator-main");
  if (!existsSync(sourceRoot)) {
    add("FAIL", "Official FVS source", "ForestVegetationSimulator-main was not found.", "Download/extract the official USDA FVS source under fvs-src.");
    return;
  }

  const required = ["base", "ne", "fire", "volume"];
  const missing = required.filter((name) => !existsSync(join(sourceRoot, name)));
  const nvelReady = existsSync(join(sourceRoot, "volume", "NVEL", "beqinfo.inc"));

  if (missing.length > 0) {
    add("FAIL", "Official FVS source", `Missing: ${missing.join(", ")}.`, "Re-extract the official FVS source.");
    return;
  }

  add(
    nvelReady ? "PASS" : "WARN",
    "Official FVS source",
    nvelReady ? "Source tree and NVEL files are present." : "Source tree exists, but NVEL files are missing.",
    nvelReady ? "" : "Extract VolumeLibrary into volume\\NVEL."
  );
}

async function checkBuiltVariants() {
  if (!existsSync(binDir)) {
    add("FAIL", "Built FVS variants", "The FVS bin directory was not found.", "Build official variants or copy built executables into fvs-src\\ForestVegetationSimulator-main\\bin.");
    return;
  }

  const built = readdirSync(binDir)
    .filter((name) => /^FVS.+\.exe$/i.test(name))
    .map((name) => name.replace(/\.exe$/i, ""))
    .sort();
  const missing = expectedVariants.filter((variant) => !built.some((candidate) => candidate.toLowerCase() === variant.toLowerCase()));

  if (built.length === 0) {
    add("FAIL", "Built FVS variants", "No variant executables were found.", "Run npm.cmd run fvs:build:all after installing the build toolchain.");
    return;
  }

  add(missing.length === 0 ? "PASS" : "WARN", "Built FVS variants", `${built.length} executable(s) found${missing.length ? `; missing ${missing.join(", ")}` : "."}`);
}

async function checkHttp(name, url, parser) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const text = await response.text();
    if (!response.ok) {
      add("FAIL", name, `HTTP ${response.status} from ${url}.`);
      return;
    }
    parser ? parser(text) : add("PASS", name, `${url} responded.`);
  } catch (error) {
    add("WARN", name, `${url} is not responding.`, name.includes("bridge") ? "Run start-carbine.bat or npm.cmd run fvs:bridge." : "Run start-carbine.bat or the UI command.");
  }
}

function parseBridgeHealth(text) {
  try {
    const health = JSON.parse(text);
    const variants = Array.isArray(health.variants) ? health.variants : [];
    add(health.ok ? "PASS" : "FAIL", "Official FVS bridge", health.ok ? `${variants.length} built variant(s) reported by bridge.` : (health.error ?? "Bridge reported not ready."));
  } catch {
    add("FAIL", "Official FVS bridge", "Bridge health response was not valid JSON.");
  }
}

function message(error) {
  return error instanceof Error ? error.message : String(error);
}
