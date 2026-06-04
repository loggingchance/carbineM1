# FVS Runtime Feasibility Spike

Status: native official-source build path is working for all 24 official variants in this workspace.

The CARBINE app currently includes:

- `src/fvs/FvsAdapter.ts`, the execution boundary every runtime must satisfy.
- `src/fvs/FvsMockAdapter.ts`, a demo-only adapter for interface development.
- `src/fvs/FvsOfficialSourceAdapter.ts`, the selected real-FVS path for USDA source integration.
- `src/fvs/FvsLocalBridgeAdapter.ts`, a deprecated development adapter that can call a local executable but is not the product path.
- `src/fvs/FvsWasmAdapter.ts`, a placeholder for the future browser FVS runtime.
- `scripts/local-fvs-bridge.mjs`, a local-only Node bridge that can run a native FVS executable when `FVS_EXE` is set.
- `scripts/fvs-source-status.mjs`, a source-drop checker for the official USDA repository.
- `public/fvs/wasm`, reserved for bundled browser runtime artifacts.
- `fvs-src`, reserved for the official FVS source as a submodule or documented source placement.

## Spike Questions

1. Can the selected FVS variant build natively from the current official source?
2. Which Northeast-relevant variant should be the first public MVP target?
3. What file inputs and outputs are required for a minimal carbon-focused run?
4. Can the Fortran code and runtime file behavior be compiled to WebAssembly/WASI?
5. If direct WASM is blocked, what is the next fully bundled browser route?

## Required Source Review

Before finalizing keyword syntax, parser fields, carbon pool labels, or notices, inspect:

- USDA Forest Service FVS source repository.
- FVS software and complete package pages.
- Variant installer/package contents.
- FVS documents and carbon references.
- License, notice, and attribution files included with FVS.

## Current State

This workspace now contains the official FVS source under `fvs-src/ForestVegetationSimulator-main`, including the required `volume/NVEL` VolumeLibrary contents.

The original CMake/MinGW route failed with current MSYS2 CMake/compiler behavior. CARBINE now uses FVS's shipped `bin/makefile_Xbuild` as the native build path, copied at build time to `bin/makefile.carbine` with compatibility patches:

- recursive make calls use `makefile.carbine` so earlier CMake-generated `Makefile` files cannot hijack the build.
- Windows linker flag spacing is normalized from `-Wl, --export-all-symbols` to `-Wl,--export-all-symbols`.
- `.for` files from VolumeLibrary are included in the object list and compiled.
- compiler temp files are written under `.fvs-tmp` in the workspace instead of `C:\msys64\tmp`.

`npm.cmd run fvs:build:all` successfully produced all 24 official variant executables:

```cmd
FVSak.exe, FVSbc.exe, FVSbm.exe, FVSca.exe, FVSci.exe, FVScr.exe,
FVScs.exe, FVSec.exe, FVSem.exe, FVSie.exe, FVSkt.exe, FVSls.exe,
FVSnc.exe, FVSne.exe, FVSoc.exe, FVSon.exe, FVSop.exe, FVSpn.exe,
FVSsn.exe, FVSso.exe, FVStt.exe, FVSut.exe, FVSwc.exe, FVSws.exe
```

The generated keyword text is still a preview and must be validated against official FVS sample fixtures before CARBINE should parse or report carbon tables as trusted output.

## Next Technical Route

1. Run an official or manually reviewed sample case through a built variant.
2. Save raw outputs as golden fixtures under `src/tests/fixtures`.
3. Attempt a WASI build with a Fortran-capable toolchain and document all commands and errors here.
4. Replace `FvsWasmAdapter` internals only after a browser test can run the same sample case and return raw text output.

## Official Source Drop

```cmd
fvs-src\ForestVegetationSimulator
```

or:

```cmd
powershell -NoProfile -Command "Expand-Archive -LiteralPath fvs-src\official-fvs-main.zip -DestinationPath fvs-src -Force"
npm.cmd run fvs:source:status
```

Then inspect the official build files and begin the native/WASM build spike.

## Native Full-Variant Build Spike

The official source includes 24 variant source lists under `bin`:

```cmd
npm.cmd run fvs:variants
```

The CARBINE product target is the official FVS variant set, not a Northeast-only build. `FVSne` is useful only as a narrow troubleshooting target because the sample stand is Northeast-style.

The official source includes `bin/FVS*_sourceList.txt` and `bin/makefile_Xbuild`. CARBINE wraps the native official-source makefile build as:

```cmd
set PATH=C:\msys64\ucrt64\bin;%PATH%
npm.cmd run fvs:build:all
```

Verified result in this workspace: 24 expected variants, 24 built executables, no missing variants.

For a short smoke test:

```cmd
set PATH=C:\msys64\ucrt64\bin;%PATH%
npm.cmd run fvs:build:ne
```

The GitHub source ZIP leaves the official `volume/NVEL` Git submodule empty. That submodule points to `https://github.com/FMSC-Measurements/VolumeLibrary`. Download that repository through GitHub's `Code > Download ZIP` flow and extract its contents into `fvs-src/ForestVegetationSimulator-main/volume/NVEL` before running any full variant or WASM build.

The web-app path remains:

1. Complete the official source tree, including `volume/NVEL`.
2. Build all variants natively as a parity baseline.
3. Use the native bridge as the dev parity runner while the browser runtime is built:

```cmd
npm.cmd run fvs:bridge
npm.cmd run dev:live -- --port 5174
```

The current bridge auto-selects the built official executable for the requested variant. For example, variant `NE` resolves to `fvs-src\ForestVegetationSimulator-main\bin\FVSne.exe`; no `FVS_EXE` variable is required when the all-variant build exists.

4. Attempt a browser runtime from the same official source. Because FVS is Fortran/C and GitHub Pages cannot run native executables, this requires a WASM/WASI-capable Fortran route or a source-to-C/WASM route. Do not replace FVS calculations with CARBINE math.

The current app-side official run path writes a real `.key` and `.tre`, calls the official executable through the bridge, parses official `.sum` rows as FVS summary volume/growth output, and parses official `FMIN` / `CARBREPT` stand carbon rows when that report is present. Carbon values should still be reviewed against FVS assumptions, units, selected pools, and scenario keywords before operational use.
