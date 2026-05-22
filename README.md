# loopr

**Repeat any GPX loop into a longer ride.**

Drop a `.gpx` of one lap, pick how many times to ride it (or a target distance), download a stitched GPX you can import into Strava, Ride With GPS, Garmin Connect, or Wahoo. Everything happens in the browser — your file never leaves your device.

Live at [loopr.willcsoftware.com](https://loopr.willcsoftware.com).

## What it does

- Parse GPX (multi-segment, multi-track, with routes and waypoints).
- Repeat each `<trk>` N times with the seam deduped between laps.
- Optionally drop a waypoint at the start of each lap so your bike computer can show them.
- Strip `<time>` (this isn't a ride — it's a plan).
- Compute distance, elevation gain/loss, and max gradient over a 100m moving window for a live summary.
- Emit valid GPX 1.1 with `creator="loopr <version>"`.

## Stack

- SvelteKit + Svelte 5 (runes), TypeScript strict
- `@sveltejs/adapter-static` → GitHub Pages
- Vitest + Playwright
- pnpm

No backend. No analytics. No state-management library. No map preview.

## Develop

```sh
corepack enable
pnpm install
pnpm dev
```

## Verify

```sh
pnpm check        # svelte-check + tsc
pnpm test:unit    # vitest, GPX library
pnpm test:e2e     # playwright, full UI
pnpm build        # static output → build/
pnpm preview      # serves build/ at :4173
```

## Project layout

```
src/lib/gpx/         # framework-agnostic GPX library (pure TypeScript)
src/lib/components/  # Svelte 5 components ported from the design bundle
src/routes/+page.svelte   # wires the components to the gpx library
tests/fixtures/      # hand-authored GPX inputs
tests/unit/          # vitest specs for the gpx library
tests/e2e/           # playwright end-to-end against the built site
.github/workflows/   # test.yml runs on push; deploy.yml ships build/ to Pages
static/CNAME         # custom domain
```

`src/lib/gpx/` never imports from Svelte — components consume it.

## Deploy

`deploy.yml` runs on pushes to `main`, builds the static site, and uploads it to GitHub Pages. In repo settings, set Pages source to "GitHub Actions" once; the workflow handles the rest.

DNS: a `CNAME` for `loopr` pointing at `willcraig.github.io`. GitHub provisions HTTPS automatically once it resolves.

## License

MIT, © 2026 WillC Software House.
