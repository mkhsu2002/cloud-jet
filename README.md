# Cloud Jet: Last Light

**One button. Two golden moments. Every millisecond matters.**

FlyPig’s browser arcade game about a courier carrying a beacon ignition core through a storm. Hold to drift through a bend, release to accelerate and restore the navigation light that guides the fleet home.

The v2 mission replaces the original time-trial prototype. See the [v2 redesign](docs/UPGRADE_V2.md) and [verification record](docs/QA_V2.md).

## Play

**[Play Cloud Jet](https://cloud-jet.pages.dev)** in a modern browser with WebGL 2 and hardware acceleration. No login is required. See [release status](docs/QA_V2.md) for verified checks and limitations.

- **Last Light**: a 2,450 m mission with five corners, three route beats and a beacon arrival scene.
- **Harbor Shakedown**: a 920 m single-corner practice course.
- **Compare harbor flights**: two playable views of the same harbor turn with the speed display and boost text hidden. Comparison flights have their own replay flow and do not write the local leaderboard.
- Press **Space** at the gold entry line, hold through the bend, release at the cyan exit line. The on-screen button supports the same mouse/touch hold-and-release action.
- Entry timing changes the racing line and energy buildup; release timing changes exit acceleration. Poor lines can graze the wall and slow you down.
- Rankings are saved on this browser/device, separately for each course version. They are informal local records, not a trusted global leaderboard.
- The first flight enables sound after an interaction. Use Sound to toggle it. Low effects reduces scenery and camera effects; reduced-motion preference enables it automatically.
- Leaving the window or suspending the tab interrupts the attempt. Start a fresh flight to set a time.

## Run locally

Use **Node 24.22.3** (also in `.nvmrc`). With nvm, run `nvm use` after installing that version.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To verify and run the production build:

```sh
npm test
npm run format:check
npm run build
npm run serve:offline
```

Visit http://127.0.0.1:4173. All browser assets are bundled. The offline server needs only Node built-ins and `dist/`; see [booth operation](docs/BOOTH.md) for moving it to another computer. The hosted page is not an installable offline PWA.

## Architecture

TypeScript + Vite + Three.js, plain HTML/CSS overlays, synthesized Web Audio and localStorage. No backend, accounts, telemetry or runtime third-party API is used.

- `src/simulation.ts`: deterministic 120 Hz race simulation, timestamped input, drift/boost energy, speed, wall contact and finish time.
- `src/session.ts`: countdown, racing, finish and interruption lifecycle.
- `src/track.ts`: shared sampled track geometry and curvature.
- `src/art.ts`: original courier, loading docks, storm pylons, lighthouse and convoy models, plus the deck texture.
- `src/world.ts`: scene construction, navigation signs, chase camera, boost plumes and arrival animation.
- `src/main.ts`: keyboard/pointer interaction, accessible UI, results and display settings.
- `src/records.ts`: validated local records and graceful storage failure.
- `src/audio.ts`: bundled original score and layered vehicle and cue synthesis.
- `tests/`: timing, recovery, frame-rate replay, reset, lifecycle and storage tests.

Rendering does not decide timing quality. Input replays are tested across 30/60/120 fps render schedules; device latency still depends on the actual hardware. CI runs only for game/build/test-related changes, with concurrency cancellation. Documentation-only changes do not trigger a full build or deployment. Public deployment is a deliberate direct-upload release, not triggered by every Git push.

## Competition and tool evidence

Prepared for **Category 3: Event Mini Game** of the [Cloud9 × JetBrains Sky's the Limit Hackathon](https://cloud9.devpost.com/rules). This is an independent project, not an official Cloud9 or JetBrains product or endorsement. Eligibility, current category specifics and final submission remain separate checks.

Codex assists implementation; WebStorm 2026.3 has performed an actual offline project inspection. The inspected findings, completed checks and remaining limitations are recorded in the [development log](docs/DEVELOPMENT_LOG.md), [JetBrains workflow](docs/JETBRAINS.md) and [QA status](docs/QA.md). Interactive IDE debugging and IDE test execution must not be claimed until performed.

The [competition plan](docs/COMPETITION_PLAN.md) records the two-day scope. The earlier multi-week delivery proposal was superseded on November 19, 2026. This repository now contains a runnable game; older setup-only entries in the development log are historical checkpoints.

## License

Project code, procedural assets and documentation: [MIT](LICENSE). See [asset provenance](docs/ASSETS.md) and the bundled [Three.js license](public/third-party/three-LICENSE.txt). Third-party names and trademarks retain their own rights.
