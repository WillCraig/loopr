# loopr

**Repeat any GPX loop into a longer ride.**

Drop a `.gpx` of one lap, pick how many times to ride it (or a target distance or climbing target), and download a stitched GPX for Strava, Ride With GPS, Garmin Connect, or Wahoo. Parsing and file generation run in the browser. The GPX never leaves the device.

Live site: [willcraig.github.io/loopr](https://willcraig.github.io/loopr/).

## What it does

- Parse GPX (multi-segment, multi-track, with routes and waypoints).
- Repeat each `<trk>` N times with the seam deduped between laps.
- Turn a point-to-point track into an out-and-back, and optionally prepend a commute.
- Drop a waypoint at the start of each lap so a bike computer can show them.
- Strip `<time>` (this is a plan, not a recorded ride).
- Show distance, elevation gain/loss, and max gradient over a 100 m window.
- Emit GPX 1.1 with `creator="loopr <version>"`.

## Stack

- SvelteKit + Svelte 5 (runes), TypeScript strict
- `@sveltejs/adapter-static` → GitHub Pages at `/loopr/`
- Vitest + Playwright
- pnpm

The npm package is `private` so it is not published. The source is MIT licensed.

## Develop

```sh
corepack enable
pnpm install
pnpm dev
```

Dev and preview use the project base path: [http://localhost:5173/loopr/](http://localhost:5173/loopr/).

`BASE_PATH` defaults to `/loopr` in `svelte.config.js`. It is read from the shell, not from `.env`. For a host-root custom domain:

```sh
BASE_PATH= PUBLIC_SITE_ORIGIN=https://example.com pnpm build
```

Other public build settings live in `.env.example`. Copy that file to `.env` for local builds. Do not commit `.env`.

## Verify

```sh
pnpm check        # svelte-check + tsc
pnpm test:unit    # vitest
pnpm test:e2e     # functional, accessibility, responsive, and visual browser suite
pnpm test:e2e:functional # browser checks except screenshot comparisons
pnpm test:visual  # compare committed screenshots across desktop and mobile browsers
pnpm validate     # types, lint, unit, UI, and visual tests
pnpm build        # static output → build/
pnpm preview      # serves build/ at http://127.0.0.1:4173/loopr/
```

The UI contract runs in desktop Chromium, Firefox, and WebKit, plus Pixel/Chrome and iPhone/WebKit profiles. WebKit is the repeatable CI proxy for Safari. Before changing the UI intentionally, refresh baselines on macOS with `pnpm test:visual:update`, then commit the images under `tests/e2e/__screenshots__`. CI compares them on the macOS 26 arm64 runner.

Playwright's WebKit build is not the Safari binary shipped by macOS. For a release check, run the suite locally on macOS and do a short pass in current Safari.

## Analytics

Page-visit analytics are off until you configure a provider. No account id is committed. GoatCounter, Plausible, and Cloudflare Web Analytics are supported. Each one is a cookieless page count. The root layout renders the tag into prerendered pages, and the build copies that same tag into the GitHub Pages 404 shell.

Set **one** of these at build time (shell export or `.env`). Values containing `YOUR_` are ignored, so the example placeholders cannot turn the tracker on.

| Provider                 | Variables                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| GoatCounter              | `PUBLIC_GOATCOUNTER_ENDPOINT=https://YOUR_CODE.goatcounter.com/count`                                                                        |
| Plausible                | `PUBLIC_PLAUSIBLE_DOMAIN=YOUR_DOMAIN` and, for a self-hosted script, `PUBLIC_PLAUSIBLE_SCRIPT` (default `https://plausible.io/js/script.js`) |
| Cloudflare Web Analytics | `PUBLIC_CF_BEACON_TOKEN=YOUR_CLOUDFLARE_WEB_ANALYTICS_TOKEN`                                                                                 |

If more than one is set, also set `PUBLIC_ANALYTICS_PROVIDER` to `goatcounter`, `plausible`, or `cloudflare`. `off` forces the snippet to stay out.

For the GitHub Pages deploy, add the same names as **repository variables** (Settings → Secrets and variables → Actions → Variables), not secrets. They are embedded in public HTML. Push to `main` or re-run the deploy workflow after changing them. The footer stays "No analytics. No cookies." until a provider is actually enabled.

## Search

`pnpm build` writes `robots.txt` and `sitemap.xml` into `build/` with absolute URLs:

- [https://willcraig.github.io/loopr/robots.txt](https://willcraig.github.io/loopr/robots.txt)
- [https://willcraig.github.io/loopr/sitemap.xml](https://willcraig.github.io/loopr/sitemap.xml)

GitHub Pages serves those project paths. Compliant crawlers request robots from the host root, `https://willcraig.github.io/robots.txt`. This account has no user site, so that URL 404s and crawlers may fetch the project. The project `robots.txt` still allows the site, blocks common AI-training scrapers, and points at the sitemap. The homepage links `rel="sitemap"` and includes canonical, Open Graph, Twitter, and WebApplication JSON-LD tags. The prerendered homepage is crawlable HTML, not an empty client shell.

Submit `https://willcraig.github.io/loopr/sitemap.xml` in Google Search Console and Bing Webmaster Tools. `static/.nojekyll` is there so a branch deploy would not drop the `_app` directory.

## Automation

| Workflow                                           | When                             | What                                                                                                 |
| -------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [ci.yml](.github/workflows/ci.yml)                 | push and pull request            | typecheck, unit tests, production build, link check of the preview, Lighthouse SEO and accessibility |
| [test.yml](.github/workflows/test.yml)             | push to `main` and pull requests | cross-browser functional, accessibility, and visual tests                                            |
| [link-check.yml](.github/workflows/link-check.yml) | Mondays 06:17 UTC, plus manual   | lychee against the live site and this README                                                         |
| [deploy.yml](.github/workflows/deploy.yml)         | push to `main`                   | build and deploy GitHub Pages                                                                        |

Suggested GitHub topics: `gpx`, `cycling`, `svelte`, `sveltekit`, `typescript`, `github-pages`, `garmin`, `strava`, `triathlon`.

## License

[MIT](LICENSE) © 2026 WillC Software House.
