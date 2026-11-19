# Cloud Jet: Ascent

A one-button browser flight through five timed gates to an alien mothership above the atmosphere.

## Play

[Launch Cloud Jet](https://cloud-jet.pages.dev/) in a modern browser with WebGL 2 and hardware acceleration. No sign-in is required.

- Wait for **HOLD NOW**, hold Space to drift, and let go on **RELEASE NOW** for boost. The on-screen button accepts the same hold-and-release input.
- Each gate has its own countdown. Cross it before zero to start the next sector. A missed gate ends the flight in the cloud sea. The fifth gate leads to the mothership dock.
- The device leaderboard records completed flights by time. At results, **Next pilot · flight briefing** hands off to the next player and **Fly again** starts a fresh attempt.
- Harbor Shakedown is an untimed one-turn practice flight. The optional harbor A/B comparison masks its speed and boost labels and skips leaderboard writes.
- Sound starts after a gesture. Low effects reduces scene density and camera movement. Leaving the active window interrupts the flight.

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

TypeScript, Vite and Three.js with Web Audio and device-local records. The game runs statically with no accounts, backend or telemetry.

- `src/ascent.ts` defines the five gate budgets and cue timing. `src/simulation.ts` resolves movement and deadlines at 120 Hz.
- `src/track.ts` samples banked bends and elevation. `src/ascent-scenery.ts` builds the five stage environments, gates and dock.
- `src/art.ts` contains the player pod, mothership and materials. `src/world.ts` handles rendering, chase camera, boost, descent and docking.
- `src/session.ts`, `src/main.ts` and `src/records.ts` handle input, game flow and local timing records.
- `src/audio.ts` mixes the bundled score, engine and gameplay cues. `scripts/compose.mjs` synthesizes the stereo score.

GitHub Actions runs the build and tests on changes to game, test and build files. Production is deployed directly after verification.

## Competition and tool evidence

Prepared for Category 3, Event Mini Game, of the [Cloud9 × JetBrains Sky's the Limit Hackathon](https://cloud9.devpost.com/rules). See the [development log](docs/DEVELOPMENT_LOG.md), [Ascent verification](docs/QA_ASCENT.md) and [booth operation notes](docs/BOOTH.md).

## License

Project code, procedural assets and documentation: [MIT](LICENSE). See [asset provenance](docs/ASSETS.md) and the bundled [Three.js license](public/third-party/three-LICENSE.txt). Third-party names and trademarks retain their own rights.
