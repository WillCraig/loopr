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

MIT, © 2026 WillC Software House.
