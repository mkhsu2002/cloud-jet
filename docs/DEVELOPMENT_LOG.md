# Development log

## 2026-11-18 · Project definition

- Selected the name Cloud Jet: Drift & Boost.
- Defined one-button hover racing: timed drift entry, sustained hold, timed release/boost. Mistakes lose time without blocking completion.
- Planned booth-oriented fixed-course time trial and original futuristic visual direction.
- Created project documentation and a browser-first MVP plan. No game implementation or game tests exist yet.
- Chose Codex for primary development and WebStorm for genuine timing-state debugging, inspections and test execution.
- Verified an Apple Silicon development machine with Git, GitHub CLI, Node 23.9.0, npm 10.9.2 and Codex CLI 0.164.0 available.
- JetBrains workflow is planned; no claim of completed IDE debugging or tests is made.

## 2026-11-18 · Tooling preparation

- Published this new repository publicly on GitHub with a fresh main branch and MIT license; verified it is not a fork.
- Installed **WebStorm 2026.3 for Apple Silicon** from JetBrains' official download service. The downloaded DMG matched the official SHA-256; app signature verification and macOS execution assessment succeeded.
- Kept the installation to WebStorm only, without Unity, Rider or Toolbox.
- First launch, license selection / account sign-in, IDE configuration and actual debugging remain **not performed**. No paid subscription was started.
- The repository is documentation-only at this checkpoint. Git whitespace checks passed; there are no game tests or build results to claim.

## 2026-11-18 · English project language

- Translated the README into English while preserving the existing facts, design choices, links and implementation-status caveats.
- Checked all tracked project files for remaining Chinese text; none remained.
- Recorded English as the project-wide language for documentation, code comments, UI copy, tests and development logs.

## 2026-11-19 · Competition planning

- Cloned the public repository into the local project workspace and verified main matched origin at `3bd2d77` before planning edits.
- Read the README, MVP, JetBrains workflow and project guardrails. The repository remains documentation-only.
- Reviewed the current official Devpost overview and rules: Category 3, actual JetBrains tool use, five equally weighted criteria, and January 12, 2027 at 11:00 Pacific submission deadline.
- The current Submission Specifics page returned HTTP 403. Search results also contained previous-edition material; those older requirements were not adopted.
- Added a proposed competition strategy, milestone schedule, acceptance checks, evidence plan and submission handoff in COMPETITION_PLAN.md. No game tests, IDE activation, deployment, registration or submission occurred in this task.

## 2026-11-19 · Two-day sprint correction

- MK replaced the multi-week delivery proposal with a focused November 19–20 sprint. The previous implementation schedule is superseded.
- Rechecked current official rules and Vite/Three.js documentation for the browser-first recommendation. WebStorm qualifies as the required JetBrains tool when genuinely used; a web demo is explicitly supported by the rules.
- Recommended TypeScript + Vite + Three.js, separate deterministic simulation, plain HTML/CSS UI, Web Audio, localStorage and Vitest. No runtime dependencies have been installed or game behavior tested yet.

## 2026-11-19 · Playable game implementation

- Implemented the approved browser stack on Node 24.22.3: deterministic 120 Hz simulation, original procedural Three.js scene, keyboard/pointer input, synthesized audio and responsive HTML/CSS UI.
- Completed First Flight (one bend) before testing the full five-corner Skyline Circuit. Added countdown, results, instant replay, local versioned rankings, low-effects mode and interruption handling.
- Observed failing behavior tests before implementing the simulation/session/storage behavior; the final suite has 14 passing tests, including 100 full-course stress replays. Clean install, TypeScript/build and format checks are part of validation.
- Ran WebStorm 2026.3's actual offline project inspection twice. Reviewed findings and renamed the DOM helper, imported process explicitly and changed server-listen options. Saved a sanitized final diagnostic report. No interactive IDE breakpoint debugging or IDE test execution is claimed.
- Browser checks observed a keyboard practice finish at 11.983 s, a complete circuit at 46.217 s despite wall grazes, and an on-screen-button practice finish at 11.883 s with networking disabled after loading. Verified interrupted-attempt restart and inspected desktop/mobile layouts. Details and limits are in QA.md.
- Added local offline operation, asset/license provenance, a Three.js notice, actual source/run instructions and path-filtered quality CI. Historical setup-only documents now point to current game/QA status.
- Created the Cloudflare Pages project using an existing Keychain credential after discovering expired Wrangler OAuth. Deployment and live readback are a separate release checkpoint below.

## 2026-11-19 · Public release

- Pushed implementation commit `87f2e09a39dd0dcf6932dc12292b74483698bb6c` to main. GitHub quality run 44600042327 passed clean install, formatting, 14 tests and production build.
- Published the static build to Cloudflare Pages: https://cloud-jet.pages.dev (deployment 868c621f-c5a4-4287-82aa-842559779af3). Official API readback confirms main, the implementation commit and successful deployment. Five public files match the local build byte-for-byte.
- Verified the actual public game end-to-end: 41.850 s, five perfect corners, five boosts, zero wall grazes, visible saved local ranking. The perfect run is slightly below the original approximate session target; imperfect runs take longer.
- Verified full-screen switching, landscape layout, interrupted-attempt restart and returning to a clean hangar. No competition submission or account terms acceptance occurred.
- Updated the quality workflow to official checkout v7.0.1 and setup-node v7.1.0 (both Node 24 actions) after the first run reported deprecated Node 20 action runtimes. This changes CI tooling only; the served game build remains the verified implementation commit.
- Confirmed the updated Node 24 action workflow passed GitHub run 44600648959; final public console had zero errors/warnings, rankings persisted and replay/home worked. This audit update is documentation-only and does not redeploy the game.

## 2026-11-19 · Experience rejection and v2 proposal

- MK rejected v1 handling, visuals, music/sound and lack of narrative motivation, and requested a comprehensive upgrade plan. Earlier functional verification is not an experience acceptance.
- Reviewed the owning simulation, renderer/camera and audio source. Identified preset lateral/speed convergence, fixed drift presentation, per-frame camera damping, repeated lateral-shift bends and the absence of actual composed music.
- Proposed Cloud Jet: Last Light: a storm courier delivering a beacon ignition core to guide waiting ships home, with a playable representative slice before expanding the route. Defined handling, shared geometry, art, music/mix, story payoff and experience acceptance work.
- Updated README/MVP/competition/QA status to distinguish the live v1 prototype from the unimplemented v2 proposal. This task changes documentation only; no game code, assets, deployment or competition submission changed.

## 2026-11-19 · Last Light implementation

MK approved the storm courier redesign. Rebuilt the flight around shared route geometry, continuous yaw and lateral motion, rail contact, immediate boost and a frame-time camera. Proved the harbor turn in Chrome before running the full mission. Authored procedural harbor and storm navigation scenery, a beacon delivery and convoy return, and a loopable original score with separate vehicle and cue layers. Current run and release evidence is in QA_V2.md.

Published Last Light from implementation commit `fa09761` to Cloudflare Pages deployment `79874b77-6714-41c7-baec-ea36baddba83`. Read back the deployed commit and compared live and local build bytes for the page, bundles and original score. Finished the public mission in 42.708 seconds and verified the beacon/convoy ending, results and restart. The game's first public submission remains a separate action.

## 2026-11-19 · Flight art and arrival pass

Rebuilt the courier, harbor, storm channel and lighthouse art for the active flight camera. Added textured decking, closer scenery, longer boost plumes, a nearer chase camera and a gradual arrival reveal with an illuminated lens, sequential runway lights and moving convoy. Captured matched in-game before/after frames for entry, exit and arrival. The art pass preserves course geometry, balancing and ranking IDs. Details are in QA_V2.md.

## 2026-11-19 · Boost timing and booth comparison

Codex remained the primary implementation tool. WebStorm 2026.3 (WS-263.7307.202) ran its Default inspection over the final project, including `src/boost-presentation.ts`, `src/simulation.ts`, `src/world.ts` and `tests/boost-presentation.test.ts`. Inspected the source paths that determine drift release, boost confirmation and camera recovery. The inspection exited successfully. The 15-test Vitest suite ran separately in the shell, including the release-to-camera regression. This is real IDE inspection use and separate terminal testing.

Verified the current Devpost Category 3 rules and Submission Specifics. Added paired harbor flights with a shared simulation, hidden velocity and boost text, and no leaderboard writes. Played both before applying the revised presentation to the full mission verification. The local production mission completed in 42.700 seconds, with five boosts, zero rail contacts and the beacon ending. See QA_V2.md for release and booth checks.
