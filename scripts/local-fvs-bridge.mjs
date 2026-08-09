import { createServer } from "node:http";
import { access, constants, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { homedir, platform, tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const port = Number(process.env.CARBINE_FVS_PORT ?? 8787);
const host = process.env.CARBINE_FVS_HOST ?? "127.0.0.1";
const fvsExe = process.env.FVS_EXE;
const configuredBinDir = process.env.FVS_BIN_DIR;
const binDir = resolve(configuredBinDir ?? join("fvs-src", "ForestVegetationSimulator-main", "bin"));
const allowedOrigins = (process.env.CARBINE_ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", resolveCorsOrigin(request.headers.origin));
  response.setHeader("Access-Control-Allow-Headers", request.headers["access-control-request-headers"] ?? "content-type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Private-Network", "true");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Vary", "Origin");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.url === "/" || request.url === "/status") {
      const health = await getHealthStatus();
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(renderStatusPage(health));
      return;
    }

    if (request.url === "/health") {
      response.end(JSON.stringify(await getHealthStatus()));
      return;
    }

    if (request.url === "/run" && request.method === "POST") {
      const body = await readJson(request);
      const exePath = fvsExe ?? await resolveVariantExe(body.variant);
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

async function getHealthStatus() {
  const detected = await detectFvsInstallations();
  const variants = detected.flatMap((candidate) => candidate.variants.map((variant) => variant.name));
  const check = fvsExe ? await validateFvsExe(fvsExe) : { ok: variants.length > 0 };
  return {
    ok: check.ok,
    platform: platform(),
    fvsExe: fvsExe ?? null,
    variants: [...new Set(variants)].sort(),
    detected,
    error: check.error ?? null
  };
}

function renderStatusPage(health) {
  const variants = health.variants.length > 0 ? health.variants.join(", ") : "No FVS variants detected yet.";
  const detected = health.detected.length > 0
    ? health.detected.map((candidate) => `<li><code>${escapeHtml(candidate.path)}</code></li>`).join("")
    : "<li>No FVS folders detected. Install FVS or restart this connector with an FVS folder path.</li>";
  const statusClass = health.ok ? "ok" : "warn";
  const statusText = health.ok ? "Local FVS is ready" : "Local FVS needs attention";
  const error = health.error ? `<p class=\"error\">${escapeHtml(health.error)}</p>` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Carbine FVS Connector</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f4f2ea; color: #17231d; }
    main { max-width: 820px; margin: 8vh auto; padding: 24px; background: #fff; border: 1px solid #d7ded8; border-radius: 8px; box-shadow: 0 10px 24px rgba(26, 44, 34, 0.1); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .badge { display: inline-block; margin: 12px 0; padding: 8px 10px; border-radius: 999px; font-weight: 700; }
    .ok { background: #d7f0dc; color: #143d2d; }
    .warn { background: #fff3cf; color: #6f4c00; }
    .error { padding: 10px; background: #f6e9e6; border-radius: 6px; }
    code { overflow-wrap: anywhere; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <main>
    <h1>Carbine FVS Connector</h1>
    <p class="badge ${statusClass}">${statusText}</p>
    ${error}
    <p>Connector address: <code>http://${escapeHtml(host)}:${port}</code></p>
    <h2>Detected Variants</h2>
    <p>${escapeHtml(variants)}</p>
    <h2>Detected FVS Folders</h2>
    <ul>${detected}</ul>
    <p>Leave this connector running while using Local FVS in CARBINE.</p>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

async function listVariantsInDir(directory) {
  if (!directory || !existsSync(directory)) return [];
  const files = await readdir(directory);
  return files
    .filter((name) => /^FVS[a-z0-9]{2}(\.exe)?$/i.test(name))
    .map((name) => ({ name: name.replace(/\.exe$/i, ""), path: join(directory, name) }))
    .sort();
}

async function resolveVariantExe(variant) {
  const normalized = String(variant ?? "NE").trim().toLowerCase();
  const exeName = normalized.startsWith("fvs") ? normalized : `fvs${normalized}`;
  const detected = await detectFvsInstallations();
  for (const candidate of detected) {
    const match = candidate.variants.find((available) => available.name.toLowerCase() === exeName);
    if (match) return match.path;
  }
  return join(binDir, platform() === "win32" ? `${exeName}.exe` : exeName);
}

async function detectFvsInstallations() {
  const hintDirectories = platform() === "win32" ? await detectWindowsFvsHints() : [];
  const directories = uniquePaths(expandCandidateDirectories([
    configuredBinDir,
    process.env.CARBINE_FVS_DIR,
    binDir,
    join(process.cwd(), "fvs-src", "ForestVegetationSimulator-main", "bin"),
    platform() === "win32" ? "C:\\FVS" : undefined,
    platform() === "win32" ? "C:\\Program Files\\FVS" : undefined,
    platform() === "win32" ? "C:\\Program Files (x86)\\FVS" : undefined,
    platform() === "win32" ? join(process.env.ProgramFiles ?? "C:\\Program Files", "FVS") : undefined,
    platform() === "darwin" ? "/Applications/FVS" : undefined,
    platform() === "darwin" ? "/usr/local/bin" : undefined,
    platform() === "darwin" ? "/opt/homebrew/bin" : undefined,
    join(homedir(), "FVS"),
    ...hintDirectories
  ]));
  const candidates = [];
  for (const directory of directories) {
    const variants = await listVariantsInDir(directory);
    if (variants.length > 0) {
      candidates.push({ path: directory, label: basename(directory) || directory, variants });
    }
  }
  return candidates;
}

function expandCandidateDirectories(paths) {
  const expanded = [];
  for (const candidate of paths.filter(Boolean)) {
    expanded.push(candidate);
    expanded.push(join(candidate, "bin"));
    expanded.push(join(candidate, "Bin"));
    expanded.push(join(candidate, "FVSbin"));
    expanded.push(join(candidate, "FVS"));
  }
  return expanded;
}

async function detectWindowsFvsHints() {
  const hints = [
    ...(await detectWindowsRegistryFvsDirs()),
    ...(await detectWindowsShortcutFvsDirs())
  ];
  return hints;
}

async function detectWindowsRegistryFvsDirs() {
  const roots = [
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
  ];
  const dirs = [];
  for (const root of roots) {
    const result = await runCommand("reg.exe", ["query", root, "/s"]);
    if (result.code !== 0) continue;
    const blocks = result.stdout.split(/\r?\n\r?\n/);
    for (const block of blocks) {
      if (!/\b(FVS|Forest Vegetation Simulator|Suppose)\b/i.test(block)) continue;
      for (const key of ["InstallLocation", "DisplayIcon", "UninstallString"]) {
        const match = block.match(new RegExp(`\\s${key}\\s+REG_\\w+\\s+(.+)`, "i"));
        if (!match) continue;
        const dir = normalizeWindowsInstallHint(match[1]);
        if (dir) dirs.push(dir);
      }
    }
  }
  return dirs;
}

async function detectWindowsShortcutFvsDirs() {
  const command = [
    "$paths=@($env:ProgramData + '\\Microsoft\\Windows\\Start Menu\\Programs',$env:APPDATA + '\\Microsoft\\Windows\\Start Menu\\Programs');",
    "$shell=New-Object -ComObject WScript.Shell;",
    "foreach($root in $paths){",
    "if(Test-Path $root){",
    "Get-ChildItem -Path $root -Recurse -Filter *.lnk -ErrorAction SilentlyContinue | ForEach-Object {",
    "try { $s=$shell.CreateShortcut($_.FullName); if(($s.TargetPath -match 'FVS|Suppose|Forest') -or ($_.FullName -match 'FVS|Suppose|Forest')) { $s.TargetPath } } catch {}",
    "}",
    "}",
    "}"
  ].join(" ");
  const result = await runCommand("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command]);
  if (result.code !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .map(normalizeWindowsInstallHint)
    .filter(Boolean);
}

function normalizeWindowsInstallHint(value) {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/^"([^"]+)".*$/, "$1")
    .replace(/^'([^']+)'.*$/, "$1");
  if (!cleaned || /^msiexec/i.test(cleaned)) return "";
  const withoutArgs = cleaned.match(/^[A-Za-z]:\\.*?\.(?:exe|cmd|bat)/i)?.[0] ?? cleaned;
  return /\.(exe|cmd|bat)$/i.test(withoutArgs) ? dirname(withoutArgs) : withoutArgs;
}

function runCommand(command, args) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { windowsHide: true });
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

function uniquePaths(paths) {
  const seen = new Set();
  return paths
    .filter(Boolean)
    .map((candidate) => resolve(candidate))
    .filter((candidate) => {
      const key = candidate.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
