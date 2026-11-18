# Cloud Jet: Drift & Boost

**One button. Two golden moments. Every millisecond matters.**

Cloud Jet is a planned futuristic hover-racing time trial for the [Cloud9 × JetBrains Sky's the Limit Hackathon](https://cloud9.devpost.com/rules). Built by FlyPig. This repository starts with a design and development plan, not a finished game.

## Why this game?

We want to build something people can immediately pick up at an event booth and want to play again, rather than a demonstration that needs a lengthy tutorial. Cloud9 has previously brought hackathon projects to live events ([official case study](https://cloud9.gg/case-study/jetbrains-hackathon/)). We therefore started with the precision of a single button press and turned a reaction test into hover racing with visible feedback through speed, racing lines and risk.

The name Cloud Jet combines a track in the clouds with jet-powered acceleration; Drift & Boost describes the gameplay directly. This is an independent competition concept, not an official Cloud9 or JetBrains product or endorsement.

## The two golden moments

- The vehicle moves forward automatically. Players control one button: Space first, with touch input planned later.
- **Press at the golden moment** to enter a drift. Keep holding to sustain the drift and build energy.
- **Release at the golden moment** to end the drift and boost down the exit straight.
- Pressing too early or too late affects the racing line and energy buildup. Releasing too early produces a weaker boost. Releasing too late delays forward acceleration and may cause wall contact that costs time.
- **Mistakes do not prevent finishing; they only cost time.** No elimination or forced-restart penalty. The game needs safe guidance and recovery from getting stuck.
- Race against the clock on a fixed course, comparing actual finish times. Feedback must appear in the vehicle's line, speed and propulsion, not just a Perfect label.

## Visual direction and booth goals

A polished futuristic look: floating tracks above a sea of clouds, beautiful jet trails and easy-to-read corners. Explore blue and white alongside colorful geometry as subtle visual references to Cloud9 and JetBrains. Use official trademarks or assets only after confirming permission. Prioritize clear input feedback and smooth rendering before adding effects.

Design targets: approximately 45–75 seconds per run, one-button replay, clear rankings and no login. These are our design targets, not organizer requirements. The booth version should work offline and reset quickly; a second-screen leaderboard is a later extension.

## Development: Codex leads, JetBrains provides verifiable engineering work

The planned browser stack is TypeScript + Vite + Three.js, avoiding a large game engine at the outset. These project dependencies have not yet been installed, and the game has not been implemented.

- **Codex**: primary implementation, scene and UI iteration, documentation and automated tests.
- **JetBrains WebStorm**: TypeScript inspections, breakpoint debugging, test execution and refactoring review for the drift state machine and input timing. In particular, verify that press / hold / release behavior is independent of rendering frame rate.
- **Optional Junie / Air**: help propose boundary tests and review changes only after availability and authorization are confirmed. This is not a record of completed usage, and these tools are not required installations.

WebStorm is not chosen merely to meet the competition's tooling requirement. Fairness in this game depends on timing and state details, which need a workflow that traces events, reproduces bugs and runs tests. Record the tools, versions, actions and evidence actually used in the [development log](docs/DEVELOPMENT_LOG.md), without presenting plans as completed work.

## MVP and development handoff

See the [MVP plan](docs/MVP.md), [JetBrains workflow](docs/JETBRAINS.md) and [Codex guidelines](AGENTS.md).

The first stage is just a straight, one corner and an exit straight, to establish whether holding to drift and releasing to boost feels good. Then expand to a complete timed course, visual polish and booth reliability. This stage covers project setup and planning; there is no runnable game or passed game test suite yet.

## Development history

- **2026-11-18**: established the booth-oriented direction, single-button dual-timing mechanic and forgiving completion principle.
- **2026-11-18**: selected **Cloud Jet: Drift & Boost** as the name and created an independent public repository, design documentation and a Codex / JetBrains division of work.
- Future implementation, test results, tool usage and design revisions will be added to the development log.

## License

Project-authored code and documentation: [MIT](LICENSE). Third-party names, trademarks, and future third-party assets are not licensed by this project; keep their rights and attribution separate.
