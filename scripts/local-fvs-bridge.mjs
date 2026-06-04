import { createServer } from "node:http";
import { access, constants, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const port = Number(process.env.CARBINE_FVS_PORT ?? 8787);
const host = process.env.CARBINE_FVS_HOST ?? "127.0.0.1";
const fvsExe = process.env.FVS_EXE;
const binDir = resolve(process.env.FVS_BIN_DIR ?? join("fvs-src", "ForestVegetationSimulator-main", "bin"));
const allowedOrigins = (process.env.CARBINE_ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", resolveCorsOrigin(request.headers.origin));
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Vary", "Origin");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.url === "/health") {
      const variants = await listBuiltVariants();
      const check = fvsExe ? await validateFvsExe(fvsExe) : { ok: variants.length > 0 };
      response.end(JSON.stringify({ ok: check.ok, fvsExe: fvsExe ?? null, variants, error: check.error ?? null }));
      return;
    }

    if (request.url === "/run" && request.method === "POST") {
      const body = await readJson(request);
      const exePath = fvsExe ?? resolveVariantExe(body.variant);
      const check = await validateFvsExe(exePath);
      if (!check.ok) {
        response.writeHead(400);
        response.end(JSON.stringify({ ok: false, error: check.error }));
        return;
      }

      const safeScenarioId = String(body.scenarioId ?? "scenario").replace(/[^a-z0-9_-]/gi, "_").slice(0, 48);
      const runDir = resolve(tmpdir(), `carbine-fvs-${safeScenarioId}-${Date.now()}-${randomUUID()}`);
      await mkdir(runDir, { recursive: true });

      const keywordPath = join(runDir, "input.key");
      const treePath = join(runDir, "input.tre");
      await writeFile(keywordPath, body.keywordFile ?? "", "utf8");
      await writeFile(treePath, body.treeFile ?? body.inventoryFile ?? "", "utf8");

      const run = await runFvs(exePath, keywordPath, runDir);
      const files = await collectTextFiles(runDir);
      const producedSummary = Object.keys(files).some((name) => /\.sum$/i.test(name));
      await rm(runDir, { recursive: true, force: true });

      response.end(JSON.stringify({ ok: run.code === 0 || producedSummary, code: run.code, exePath, stdout: run.stdout, stderr: run.stderr, files }));
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ ok: false, error: "Not found" }));
  } catch (error) {
    response.writeHead(500);
    response.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  }
});

server.listen(port, host, () => {
  console.log(`CARBINE FVS API listening at http://${host}:${port}`);
  console.log(fvsExe ? `Using FVS_EXE=${fvsExe}` : `Using built variants under ${binDir}`);
});

async function validateFvsExe(exePath) {
  if (!exePath) {
    return { ok: false, error: "Set FVS_EXE to the FVS variant executable path before starting the bridge." };
  }
  if (/C:\\Path\\To\\/i.test(exePath) || /Path\\To/i.test(exePath)) {
    return { ok: false, error: `FVS_EXE is still the placeholder path: ${exePath}` };
  }
  try {
    await access(exePath, constants.X_OK);
    return { ok: true };
  } catch {
    return { ok: false, error: `FVS_EXE does not point to a readable executable: ${exePath}` };
  }
}

function resolveCorsOrigin(origin) {
  if (allowedOrigins.includes("*")) return "*";
  if (origin && allowedOrigins.includes(origin)) return origin;
  return allowedOrigins[0] ?? "*";
}

async function listBuiltVariants() {
  if (!existsSync(binDir)) return [];
  const files = await readdir(binDir);
  return files
    .filter((name) => /^FVS.+\.exe$/i.test(name))
    .map((name) => name.replace(/\.exe$/i, ""))
    .sort();
}

function resolveVariantExe(variant) {
  const normalized = String(variant ?? "NE").trim().toLowerCase();
  const exeName = normalized.startsWith("fvs") ? normalized : `fvs${normalized}`;
  return join(binDir, `${exeName}.exe`);
}

function readJson(request) {
  return new Promise((resolveRequest, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10_000_000) {
        request.destroy();
        reject(new Error("Request body too large."));
      }
    });
    request.on("end", () => resolveRequest(JSON.parse(data || "{}")));
    request.on("error", reject);
  });
}

function runFvs(exePath, keywordPath, cwd) {
  return new Promise((resolveRun) => {
    const child = spawn(exePath, [`--keywordfile=${keywordPath}`], { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolveRun({ code: -1, stdout, stderr: `${stderr}\n${error.message}` });
    });
    child.on("close", (code) => {
      resolveRun({ code, stdout, stderr });
    });
  });
}

async function collectTextFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = {};
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!/\.(out|txt|key|csv|err|log|sum)$/i.test(name)) continue;
    files[name] = await readFile(join(folder, name), "utf8");
  }
  return files;
}
