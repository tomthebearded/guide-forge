# M4 · Step 01 of 8 — Install three deps + add the country GeoJSON
> Nav: — · [Overview](00_overview.md) · [Geo data →](02_geo-data.md)

This step is project prep — no app code yet. It touches two things, done together: the **dependencies**
(`three` + `three-globe` + their types) and one **data asset** (the Natural Earth country file). Both are
prerequisites for every later step in this milestone.

## Glossary for this step
> **three.js** — the WebGL 3D library that draws the globe (scene, camera, meshes, render loop). New concept — the deepest-taught topic in this guide. Docs: [threejs.org/docs](https://threejs.org/docs/).
> **three-globe** — a three.js add-on that builds a ready-made globe object (sphere, atmosphere, country polygons) from GeoJSON, so you don't hand-roll the geometry. Docs: [github.com/vasturiano/three-globe](https://github.com/vasturiano/three-globe).
> **GeoJSON** — a JSON format for geographic shapes (here, country border polygons). See [glossary](../foundation/glossary.md#geojson). This app uses Natural Earth's **110m** set — low detail, small file, fast to parse and pick against.

## Why / design
The globe's geometry is data-driven: three-globe takes an array of GeoJSON country **features** and extrudes
each border into a coloured cap on the sphere. So before any rendering code, you need (a) the libraries and (b)
the polygons. We pin exact versions because three moves fast and three-globe `2.45.2` was built against
`three@~0.184` — a mismatched `three` breaks three-globe's peer expectations
([decision-log R2](../foundation/decision-log.md#r2--pin-three-0184-with-three-globe-2452)).

## Do this
1. **Confirm the three.js dependencies are installed.** They were added during the M0 scaffold (see
   [`foundation/stack.md`](../foundation/stack.md)). Check `package.json` for `three`, `three-globe`, and
   `@types/three`. If any is missing, install them at the **pinned** versions (the versions are load-bearing;
   don't let `npm i three` pull a newer major):
   ```bash
   npm i three@~0.184 three-globe@2.45.2
   npm i -D @types/three@~0.184
   ```
   - `three` and `three-globe` are runtime deps; `@types/three` is a dev dep (TypeScript types only — three-globe ships its own types).
2. **Create the asset folder.** In the project root, make `public/geo/` if it doesn't exist. Angular serves
   everything under `public/` at the site root (see `angular.json` → `architect.build.options.assets`, the
   `{ "glob": "**/*", "input": "public" }` entry), so a file at `public/geo/countries-110m.geo.json` is
   fetched at the URL `geo/countries-110m.geo.json`.
3. **Add the Natural Earth 110m countries file** as `public/geo/countries-110m.geo.json`. Get it from the
   Natural Earth vector repo — the file `geojson/ne_110m_admin_0_countries.geojson` from
   [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/tree/master/geojson) — and
   save it under that exact name/path.
   > 📚 **The filename is load-bearing.** `geo-data.ts` (next step) fetches the literal path
   > `geo/countries-110m.geo.json`. Rename the file and the globe silently loads nothing. The folder name
   > (`geo/`) and file name must match exactly.
4. **Sanity-check the file has ISO codes.** Open it and confirm the first feature's `properties` contains an
   `ISO_A2` field (Fiji, `"ISO_A2":"FJ"`). The whole app matches artists to countries on this two-letter code
   ([ISO 3166-1 alpha-2](../foundation/glossary.md#iso-3166-1-alpha-2)); a GeoJSON export without `ISO_A2`
   won't pick.

## Done when (this step)
- [ ] `npm ls three three-globe` → prints `three@0.184.x` and `three-globe@2.45.2` (no `UNMET` / `invalid`).
- [ ] `public/geo/countries-110m.geo.json` exists and is ~800 KB; its first feature's `properties.ISO_A2` is a
      two-letter string.

## If it breaks
- **`npm ls` shows `invalid: three@0.185…`** → something pulled a newer three. Reinstall the pinned pair:
  `npm i three@~0.184 three-globe@2.45.2`, then re-check — three-globe's peer range wants `~0.184`.
- **The globe later loads blank / 404 on `geo/countries-110m.geo.json`** → the file isn't under `public/geo/`
  or is misnamed. The path is case-sensitive and must match `COUNTRIES_URL` in the next step exactly.
- **Picking never resolves a country** → your GeoJSON lacks `ISO_A2`. Use the Natural Earth **admin_0
  countries** export (not a simplified topojson) — it carries `ISO_A2`/`ISO_A2_EH`.
