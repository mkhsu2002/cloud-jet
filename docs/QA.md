# Verification and release status

Checked: 2026-11-19 (America/Vancouver). These results describe this sprint, not independent event validation.

## Build and automated behavior

- Node 24.22.3, Vite 8.3.8, Three.js 0.187.0, TypeScript 5.9.3 and Vitest 5.1.1 are pinned.
- A clean `npm ci` completed; the installation audit reported zero vulnerabilities at that check.
- `npm test`: 14 passing tests across two files, including 100 deterministic stress replays of the full course.
- Tests cover faster ideal entry/release, actual finish despite no input or permanent hold, identical timestamp replay outcomes at 30/60/120 render fps, repeat suppression, energy consumption, clean reset/queued input, countdown/double-start, interrupted attempts, completion, sorted per-course records and corrupt/blocked storage.
- `npm run build`: TypeScript check and production build passed. Vite emits a size advisory for the approximately 579 kB JavaScript bundle (approximately 145 kB gzip), which includes Three.js. This is an advisory, not a failed check.
- Formatting is enforced with `npm run format:check`. The path-filtered GitHub quality workflow checks install, formatting, tests and build; it has no schedule or deployment step.

## Actual browser checks

Used the authorized `codex-flypig-ai` browser lane. Focus emulation was used for the stable production-build run because background/occluded automation tabs suspend animation. Explicit interruption behavior was tested separately. These are real browser interactions, not simulated finish screens.

| Check | Observed result |
| --- | --- |
| Keyboard First Flight | Perfect entry/release, 11.983 s, one boost, zero wall grazes |
| Full Skyline Circuit | Start/countdown, all five corners, results and saved ranking; 46.217 s, four perfect corners/four boosts, six wall grazes; mistakes did not prevent finishing |
| On-screen pointer button, network disabled after loading | First Flight finished in 11.883 s, one perfect corner/boost, zero wall grazes; records saved |
| Explicit blur during a race | Attempt interrupted; restart begins at 00:00.000 |
| Sound and low-effects buttons | Sound enabled/disabled; low-effects state and scenery changed successfully |
| Responsive layout | No horizontal overflow at 1440 × 900 or 390 × 844; screenshots visually reviewed |
| Frame scheduling sample | 120 animation frames on the development machine at 1440 × 900: mean 16.63 ms, maximum 19.40 ms; a short sample, not a hardware guarantee |

Screenshots: [home](evidence/home.png), [complete circuit](evidence/full-circuit-result.png). The browser console had no JavaScript errors at the initial inspected checkpoint; final hosted verification is recorded below after publication.

## JetBrains evidence

WebStorm 2026.3 performed two actual command-line inspections with the Default profile. The first prompted a DOM-helper rename and explicit Node process/listen configuration. The final scan exited successfully. The sanitized [inspection report](evidence/webstorm-inspection.json) preserves the actual remaining findings; do not read successful inspection execution as a claim that every warning disappeared. Interactive IDE debugging and running tests inside the IDE have not been performed.

## Release

Cloudflare Pages project `cloud-jet` was created through the official API with production branch `main`, using an existing Keychain credential. An expired Wrangler OAuth session was not used. No provider secret was written to the repository or browser application.

Deployment is pending at this checkpoint. The intended production address is https://cloud-jet.pages.dev. Source commit, deployment identity, asset correspondence and live behavior must be recorded after actual deployment before this is marked released. This is a static application: there are no migrations, functions, runtime secrets, bindings or backend API contracts to synchronize.

## Remaining competition / event validation

- Interactive IDE debugging/tests, independent first-time-player trials and a multi-hour booth soak are not completed. The automated stress replays are not a substitute for real-time soak testing.
- Physical touch hardware, other GPUs/browsers and the final event display need rehearsal; pointer and narrow-layout checks are not a universal-device guarantee.
- Registration/eligibility confirmation, the current Submission Specifics page (previously 403), final English video/methodology package and binding submission remain unfinished.
- The game is not submitted to Devpost by publishing a website. MK performs binding final submission. Retain the submitted release through the official judging period when applicable.
