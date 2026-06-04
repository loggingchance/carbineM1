# CARBINE Outside Tester Checklist

This checklist is for hosted official-FVS testing of CARBINE.

## Start CARBINE

Open the CARBINE web address supplied by the project owner.

Outside testers should not need to install FVS, open a command prompt, or start a local bridge. If CARBINE asks for a local bridge, that build is not the hosted tester build.

## Developer-only local check

Use this only when verifying the development workstation, not when handing CARBINE to outside testers.

From the CARBINE project folder:

```bat
npm.cmd run doctor
```

If it reports a failure, follow the `Next:` line before continuing.

```bat
start-carbine.bat
```

This opens the bridge terminal, the UI terminal, and the browser. Leave the two terminal windows running while testing.

To prove the official-FVS path before using your own inventory, run this in a third terminal from the project folder:

```bat
npm.cmd run smoke:official
```

It should report one passing smoke test. If it fails, send the full terminal output with the diagnostics JSON.

If the launcher does not work, use two terminals manually and leave both running.

Bridge terminal:

```bat
cd "C:\path\to\files-mentioned-by-the-user-carbine"
npm.cmd run fvs:bridge
```

UI terminal:

```bat
cd "C:\path\to\files-mentioned-by-the-user-carbine"
npm.cmd run dev:live -- --host 127.0.0.1 --port 5174 --force
```

Open:

```text
http://127.0.0.1:5174/
```

## Test workflow

1. Load an inventory CSV.
2. Confirm the inventory summary has plausible tree count, TPA, basal area, and species count.
3. Keep the FVS variant on `NE` for the current outside-test pass.
4. Confirm one `No treatment` baseline is present.
5. Add one or more treatment scenarios.
6. Use the treatment-year dropdown. Do not type off-cycle years.
7. Review the actual FVS control preview under each scenario.
8. Go to Tester and confirm the Hosted FVS API is reachable.
9. Confirm the requested variant is available.
10. Go to Run.
11. Confirm the runtime is `Hosted FVS API`.
12. Run scenarios.
13. Confirm Results says `Real FVS runtime`.
14. Review Scenario Summary and Treatment effects vs no treatment.
15. Review Report and export HTML or PDF if desired.
16. Click `Diagnostics` and `Summary` from Report, or go to Advanced and click `Export diagnostics`.

## Send back

Send these files or notes after each test:

- The `carbine-diagnostics*.json` file from Report or Advanced.
- The `carbine-tester-summary.txt` file from Report.
- The inventory CSV used for the run.
- The exported report, if the report is part of the feedback.
- A short note describing anything confusing, surprising, or incorrect.

## Current known limits

- The verified outside-test path is the NE variant.
- Carbon is parsed from official FVS `FMIN` / `CARBREPT` stand carbon output.
- Soil carbon is excluded.
- Treatments currently use simple `THINDBH` controls: treatment year, DBH min/max, and percent basal area removal.
- CARBINE is not an official USDA Forest Service product. Inputs, assumptions, variant choice, and interpretations still require professional review.
