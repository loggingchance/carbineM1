# CARBINE User Guide

## Start CARBINE

For outside testers, open the CARBINE web address. The preferred runtime is `Local FVS`, which uses the user's own USDA Forest Service FVS installation through the Carbine FVS Connector. `Carbine Cloud FVS` remains available as the fallback when local FVS is not installed or the connector is not running.

## Local official-FVS testing

From the CARBINE project folder, check the local setup:

```bat
npm.cmd run doctor
```

From the CARBINE project folder, run:

```bat
start-carbine.bat
```

This opens the bridge terminal, the UI terminal, and the browser. Leave the two terminal windows running while testing.

Optional official-FVS smoke check:

```bat
npm.cmd run smoke:official
```

Run that from a third terminal after the bridge is running. It verifies the known sample inventory can run through the official bridge and produce parsed carbon rows.

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

Open `http://127.0.0.1:5174/`.

## Basic workflow

1. Load the sample inventory or upload a CSV with `stand_id`, `species_code`, `dbh_in`, and `trees_per_acre`.
2. Review the inventory summary and project details.
3. Choose the FVS variant. Current outside-testing work is verified on the NE path.
4. Add a no-treatment baseline and treatment scenarios.
5. Use FVS cycle years from the treatment-year dropdown.
6. Run the scenario set with `Local FVS` selected when the connector is available. Use `Carbine Cloud FVS` as the fallback.
7. Review Results:
   - Scenario summary cards show final carbon and removed carbon.
   - Treatment effects compare each scenario against no treatment by year.
   - Detailed rows show selected pool total, live tree carbon, removed carbon, volume, basal area, and trees/ac.
8. Review Report and export HTML/PDF/CSV as needed.
9. Use Advanced > Export diagnostics when sharing a bug report or model question.

## Outside tester expectations

- Results should show `Real FVS runtime`.
- Scenario names should match the generated `THINDBH` keyword lines in Advanced.
- Carbon rows are parsed from official FVS `FMIN` / `CARBREPT` output.
- Soil carbon is not included.
- CARBINE is not an official USDA Forest Service product; testers must review assumptions, variant choice, input data, and FVS settings.

See `docs/outside-tester-checklist.md` for the tester handoff checklist.
