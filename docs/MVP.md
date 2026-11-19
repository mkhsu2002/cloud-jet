# MVP delivery status

Updated: 2026-11-19. This replaces the pre-implementation MVP plan; use QA.md for actual check results.

## Experience status

V1 functionality is implemented, but MK rejected the experience on 2026-11-19. Treat the list below as prototype capabilities, not quality approval. On 2026-11-19 Last Light replaced the prototype as the active experience. See UPGRADE_V2.md for the design and QA_V2.md for evidence. The v1 inventory below is historical.

## Implemented

- Deterministic fixed-step simulation, ordered timestamped input, drift entry/hold/release, speed, wall contact and forgiving completion.
- Single-corner First Flight practice and full five-corner Skyline Circuit.
- Countdown, finish timer, clean restart, local per-course leaderboard and storage-failure handling.
- Keyboard and on-screen pointer controls; key-repeat suppression; lost-focus/tab-suspension interruption.
- Original 3D vehicle/track/scenery, drift line and boost feedback, opt-in synthesized audio, low-effects mode and reduced-motion default.
- Responsive interface and locally served offline build with bundled assets.
- Automated timing/replay/reset/recovery/lifecycle/storage tests; path-filtered CI.

## Validation and competition work

See QA.md for observed automated and browser results. A developer-machine test is not proof of every booth device, true physical touch hardware, unattended multi-hour reliability or independent playtest success.

Interactive WebStorm debugging/tests, external playtests, final demo video, submission-field recheck, registration/eligibility confirmation and binding final submission are separate unfinished competition tasks. No finished-game feature list should be read as a completed competition submission.
