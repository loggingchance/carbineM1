import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const sourceRoot = resolve("fvs-src", "ForestVegetationSimulator-main");
const binDir = join(sourceRoot, "bin");
const bashExe = "C:\\msys64\\usr\\bin\\bash.exe";
const makefileSource = join(binDir, "makefile_Xbuild");
const makefileCopy = join(binDir, "makefile.carbine");
const tmpDir = resolve(".fvs-tmp");
const variantSourceListAdditions = {
  FVSbc: [
    "../volume/NVEL/wdbkwtdata.inc",
    "../dbsqlite/dbs_fiavbc_atrtls.f",
    "../dbsqlite/dbs_fiavbc_cutlst.f",
    "../dbsqlite/dbs_fiavbc_trls.f",
    "../vdbsqlite/dbsreference.f"
  ],
  FVSon: [
    "../dbsqlite/dbs_fiavbc_atrtls.f",
    "../dbsqlite/dbs_fiavbc_cutlst.f",
    "../dbsqlite/dbs_fiavbc_trls.f",
    "../vdbsqlite/dbsreference.f"
  ]
};

function toMsysPath(path) {
  const normalized = path.replaceAll("\\", "/");
  return normalized.replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
}

function quoteForBash(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

if (!existsSync(binDir)) {
  console.error("Official FVS bin directory not found. Put USDA ForestVegetationSimulator source under fvs-src first.");
  process.exit(1);
}

if (!existsSync(makefileSource)) {
  console.error(`Official FVS makefile template not found: ${makefileSource}`);
  process.exit(1);
}

if (!existsSync(bashExe)) {
  console.error(`MSYS2 bash not found: ${bashExe}`);
  console.error("Install MSYS2, then install the UCRT64 gcc, gcc-fortran, make, and cmake packages.");
  process.exit(1);
}

const required = ["gcc", "gfortran", "mingw32-make"];
const missing = required.filter((tool) => {
  const result = spawnSync("where.exe", [tool], { encoding: "utf8" });
  return result.status !== 0;
});

if (missing.length > 0) {
  console.error(`Missing build tools on PATH: ${missing.join(", ")}`);
  console.error("In this Command Prompt, run:");
  console.error("set PATH=C:\\msys64\\ucrt64\\bin;%PATH%");
  console.error("Then rerun: npm.cmd run fvs:build:all");
  process.exit(1);
}

const sourceLists = (await readdir(binDir))
  .filter((name) => /^FVS.*_sourceList\.txt$/i.test(name))
  .sort();

const requested = process.env.FVS_VARIANTS
  ? new Set(process.env.FVS_VARIANTS.split(",").map((name) => name.trim()).filter(Boolean))
  : null;

const variants = sourceLists
  .map((name) => name.replace("_sourceList.txt", ""))
  .filter((variant) => !requested || requested.has(variant));

if (variants.length === 0) {
  console.error("No official FVS variants matched the requested build.");
  process.exit(1);
}

const originalMakefile = await readFile(makefileSource, "utf8");
const patchedMakefile = originalMakefile
  .replaceAll("$(basename $@)_sourceList.txt", "$(basename $@)_sourceList.carbine.txt")
  .replaceAll("--file=../makefile", "--file=../makefile.carbine")
  .replaceAll("--file=makefile", "--file=makefile.carbine")
  .replaceAll("-Wl, --export-all-symbols", "-Wl,--export-all-symbols")
  .replaceAll("$(filter %.c %.f, $(sourceList))", "$(filter %.c %.cpp %.f %.for, $(sourceList))")
  .replaceAll("$(filter-out  main.o,$(object))", "$(filter-out  main.o,$(object)) -lstdc++")
  .replaceAll("$(filter-out fvsSQL.o main.o,$(object))", "$(filter-out fvsSQL.o main.o,$(object)) -lstdc++")
  .replaceAll("$(filter-out fvsSQL.o       ,$(object))", "$(filter-out fvsSQL.o       ,$(object)) -lstdc++")
  .replaceAll("$(object) $(DBLINK)", "$(object) $(DBLINK) -lstdc++")
  .replaceAll("-o $(basename ../$@)$(PRGSUFX) $(object)", "-o $(basename ../$@)$(PRGSUFX) $(object) -lstdc++")
  .replace(
    "%.o : %.c $(includes) \n\t$(CCprf)$(CC) $(CFLAGS) -c -o $@ $<",
    "%.o : %.for $(includes) $(mods_mods)\n\t$(FCprf)$(FC) $(FFLAGS) -c -o $@ $<\n\n%.o : %.cpp $(includes) \n\tg++ $(CFLAGS) -c -o $@ $<\n\n%.o : %.c $(includes) \n\t$(CCprf)$(CC) $(CFLAGS) -c -o $@ $<"
  );
await writeFile(makefileCopy, patchedMakefile, "utf8");
await mkdir(tmpDir, { recursive: true });

for (const sourceList of sourceLists) {
  const variant = sourceList.replace("_sourceList.txt", "");
  const sourceListPath = join(binDir, sourceList);
  const generatedSourceListPath = join(binDir, `${variant}_sourceList.carbine.txt`);
  const original = await readFile(sourceListPath, "utf8");
  const lines = original.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const seen = new Set(lines.map((line) => line.trim().toLowerCase()));
  for (const addition of variantSourceListAdditions[variant] ?? []) {
    if (!seen.has(addition.toLowerCase())) lines.push(addition);
  }
  await writeFile(generatedSourceListPath, `${lines.join("\n")}\n`, "utf8");
}

console.log(`Preparing official FVS makefile build for ${variants.length} variants.`);
console.log(variants.join(", "));
console.log(`Using patched makefile copy: ${makefileCopy}`);

const msysBinDir = toMsysPath(binDir);
const msysTmpDir = toMsysPath(tmpDir);
const outcomes = [];

for (const variant of variants) {
  console.log(`\n=== Building ${variant} ===`);
  const command = [
    "set -e",
    "export PATH=/ucrt64/bin:/usr/bin:$PATH",
    `export TMPDIR=${quoteForBash(msysTmpDir)}`,
    `export TMP=${quoteForBash(msysTmpDir)}`,
    `export TEMP=${quoteForBash(msysTmpDir)}`,
    `export HOME=${quoteForBash(msysTmpDir)}`,
    `cd ${quoteForBash(msysBinDir)}`,
    `mingw32-make --file=makefile.carbine ${variant}.setup OS=Windows_NT OSARCH=w64`
  ].join(" && ");

  const result = spawnSync(bashExe, ["--noprofile", "--norc", "-c", command], {
    cwd: binDir,
    encoding: "utf8",
    stdio: "inherit"
  });

  const exe = join(binDir, `${variant}.exe`);
  outcomes.push({
    variant,
    ok: result.status === 0 && existsSync(exe),
    note: result.status === 0 ? "Build command finished." : "Build failed."
  });
}

console.log("\nOfficial FVS variant build summary:");
for (const outcome of outcomes) {
  console.log(`${outcome.ok ? "OK" : "FAIL"} ${outcome.variant}: ${outcome.note}`);
}

if (outcomes.some((outcome) => !outcome.ok)) {
  process.exit(1);
}
