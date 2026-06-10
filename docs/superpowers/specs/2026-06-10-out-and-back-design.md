# Out-and-back (A-B → A-B-A) feature for loopr

## Context

loopr currently assumes every dropped GPX is a closed loop. Dropping a point-to-point (A-B) route today silently produces a broken output: each repeat seam teleports from B back to A. The user wants loopr to detect A-B routes and offer to convert them to out-and-back (A-B-A) rides — retracing the outbound leg in reverse so the ride ends where it began — with polished UI around the interaction.

Decisions made with the user:

- **Detection: auto-detect + suggest.** When the start→end gap marks a route as point-to-point, show a callout with a user-controlled toggle. Loop routes never see it.
- **Full composition.** The A-B-A becomes the lap. Lap count / distance mode repeat it as ping-pong (A-B-A-B-A…); lap markers and the commute feature work unchanged.
- Text-only design; user trusts implementation choices for the visual details.

## Architecture

One pure transform in the GPX library, applied in the page _before_ all existing derivations. Everything downstream (`computeSummary`, lap distance, `repeat`, download) consumes the transformed GPX and needs no awareness of the feature.

```
parsed (Gpx) ──isPointToPoint?──> OutAndBackCallout (toggle, default ON)
parsed ──[toggle on]──> outAndBack(parsed) = effectiveGpx ──> summary / LapConfig / repeat / download
```

`summary.ts`'s `detectLaps()` already handles A-B-A correctly (start point recurs once per lap), so per-lap stats and ping-pong lap counts work without changes.

## Changes

### 1. `src/lib/gpx/geo.ts` (new) — targeted dedup

`haversine()` is currently copy-pasted in `repeat.ts` and `summary.ts`, and `samePoint()`/`SEAM_DEDUPE_EPSILON` live in `repeat.ts`. Extract both into `geo.ts` and import from the three consumers (pure refactor; existing tests must stay green).

### 2. `src/lib/gpx/outandback.ts` (new)

- `startEndGapMeters(track: Track): number` — haversine between first and last point.
- `isPointToPoint(track: Track): boolean` — gap > max(100 m, 2 % of track length). Constants exported for tests. Lollipop routes and GPS-noise loop ends stay classified as loops.
- `gpxIsPointToPoint(gpx: Gpx): boolean` — true if any track qualifies.
- `outAndBack(gpx: Gpx, opts?: { turnaround?: boolean }): Gpx` — pure. For each point-to-point track: `points = pts.concat(reverse(pts).slice(1))` (seam at B deduped via `samePoint`; m points → 2m−1). Loop tracks pass through untouched. With `turnaround: true`, append one waypoint at B per transformed track: `{ name: 'Turnaround', type: 'Turnaround', ele }`. Waypoints/routes/metadata otherwise carried over unchanged.
- Re-export from `src/lib/gpx/index.ts`.

### 3. `src/routes/+page.svelte` — wiring

- New state `outAndBackOn = $state(false)`. Derived `isP2P = parsed ? gpxIsPointToPoint(parsed) : false`.
- On load of a P2P route (`handleFile`/`handleSample` success path): set `outAndBackOn = true` (default ON — zero-click correct result) and set `laps = 1` (the natural out-and-back ride; the default of 2 would surprise). Reset `outAndBackOn` on clear/replace.
- `effectiveGpx = $derived(parsed && isP2P && outAndBackOn ? outAndBack(parsed, { turnaround: addMarkers }) : parsed)`.
- Point `trackSummary`, `lapDistanceMeters`, `summaryView`, and `handleDownload`'s `repeat()` call at `effectiveGpx`. The DropZone's `loadedSummary` keeps showing the _original_ file's one-way stats (the callout communicates the conversion; the Review section shows the result).
- Naming: when out-and-back is active, `defaultRidename` becomes `` `${sourceTrackName} out & back` `` (laps = 1) or `` `${sourceTrackName} out & back x${n}` `` (laps > 1). Pass `nameOverride: ridename` to `repeat()` unconditionally so the file's track name always matches what the UI shows.
- Download filename suffix: `-out-and-back` (1 lap) / `-out-and-back-x${n}` (n > 1); commute suffix unchanged.

### 4. `src/lib/components/OutAndBackCallout.svelte` (new) — the "nice UI"

Rendered in Section 01 directly under the loaded DropZone when `isP2P`. Editorial style matching the design system (`app.css` tokens, Geist Mono eyebrows, accent rust):

- Accent-soft panel with a 3 px accent left rule (the `.err` pattern, but accent not danger).
- Eyebrow: `POINT-TO-POINT DETECTED`. Title: "This route ends {fmtDistance(gap)} {unit} from where it starts."
- Inline SVG schematic: A •──────▸ • B on top, a dashed accent return arc beneath B back to A, mono `A`/`B` labels. Pure CSS/SVG, no assets.
- Segmented pill toggle (reuse `.lap-mode--seg` styles): **Out & back** | **One way**, bound to `outAndBackOn`, `data-testid="oab-toggle"`.
- When ON, a `.live-compute` line: `→ {2×one-way distance} {unit} round trip · finishes at the start`.
- When OFF, a quiet warning line: "Repeating a one-way route creates a jump from the end back to the start."
- Props: `gapMeters`, `oneWayMeters`, `units`, `on: boolean`, `onToggle`. Styles go in `app.css` under a new `/* ── Out-and-back callout ── */` section.

### 5. `src/lib/components/SummaryBanner.svelte` + `LapConfig.svelte` — small touches

- SummaryBanner: optional `outAndBack` flag on `SummaryView`; when set, render a mono accent `OUT & BACK` chip beside the route name.
- LapConfig: when out-and-back (new optional prop), marker checkbox help text becomes "…plus a marker at the turnaround." and the laps suffix reads "out & backs" instead of "laps" (read the component before final wording; keep diff minimal).

### 6. Tests

- `tests/unit/outandback.test.ts` (new): gap math; detection thresholds (closed loop, A-B, lollipop, sub-100 m noise); point count 2m−1 with seam dedupe; elevation mirrored on return leg; turnaround waypoint on/off; loop tracks untouched in multi-track files; input GPX not mutated.
- Existing `repeat.test.ts` / `summary.test.ts`: should pass unchanged after the `geo.ts` refactor; add one `summary` case asserting an A-B-A×N track reports N laps.
- `tests/e2e/upload-and-download.spec.ts` + new fixture `tests/fixtures/point-to-point.gpx`: drop A-B file → callout visible, toggle defaults to Out & back, laps shows 1, summary shows doubled distance; download → parse the blob, assert 2m−1 points and track name ends in "out & back". Drop the existing loop sample → callout absent.

### 7. Design doc

Per the brainstorming workflow, save this design as `docs/superpowers/specs/2026-06-10-out-and-back-design.md` and commit it before implementation starts.

## Out of scope (YAGNI)

- No map/elevation preview (separate feature, was a candidate but superseded by this request).
- No per-track out-and-back toggles for multi-track files (all-or-nothing via per-track auto-detection).
- No changes to parser, serializer, or the commute feature.

## Verification

- `pnpm check` — svelte-check + tsc strict.
- `pnpm test:unit` — new outandback tests + existing suites green.
- `pnpm test:e2e` — Playwright flow above (build + preview handled by config).
- Manual: `pnpm dev`, drop an A-B GPX → callout with diagram appears, toggle ON, summary doubles, download imports cleanly; drop the sample loop → no callout, behavior identical to today.
