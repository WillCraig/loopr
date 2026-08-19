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
pnpm test:e2e     # functional, accessibility, responsive, and visual browser suite
pnpm test:e2e:functional # all browser checks except screenshot comparisons
pnpm test:visual  # compare committed screenshots across desktop and mobile browsers
pnpm validate     # complete pre-push check: types, lint, unit, UI, and visual tests
pnpm build        # static output → build/
pnpm preview      # serves build/ at :4173
```

The UI contract runs in desktop Chromium, Firefox, and WebKit, plus Pixel/Chrome and
iPhone/WebKit profiles. WebKit is the repeatable CI proxy for Safari. Before changing the UI
intentionally, refresh and inspect baselines on macOS with `pnpm test:visual:update`, then commit
the images under `tests/e2e/__screenshots__`. CI compares them on the macOS 26 arm64 runner to
minimize platform-specific rendering differences from local Apple Silicon Macs.

Playwright's WebKit build is not the exact Safari binary shipped by macOS. For a release-level
Safari check, run the suite locally on macOS and do a short manual pass in the current Safari;
CI still catches the large majority of WebKit-specific layout and behavior regressions on every PR.

MIT, © 2026 WillC Software House.
