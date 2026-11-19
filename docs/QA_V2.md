# Last Light verification

Checked 2026-11-19 (America/Vancouver).

- Ran the harbor practice in the authorized Chrome lane using Space at the entry and exit markers. Observed slip through the turn, exit acceleration, one perfect corner, one boost and zero rail contacts in 17.783 seconds. Captured the in-race view at the apex.
- The score is a 56.477-second stereo file, with measured integrated loudness of −21.3 LUFS and true peak of −7.5 dBFS before in-game mixing. The browser loaded the bundled file. Loudness analysis and verified media playback do not constitute a listening-panel or booth-speaker review.
- The physics share the curved route with rendering. Local rankings use the versioned Last Light and Harbor Shakedown identifiers.
- The source and build are static. The v1 public deployment remains separately identifiable in QA.md for rollback.

The full mission was played in Chrome with the keyboard. It finished in 42.492 seconds with five boosts, five perfect corners and zero rail contacts. Each release raised indicated speed from 158 to 225–226 km/h within the browser sample about 165 ms later. Observed the storm segment, lighthouse reveal, convoy and results in sequence. The score advanced to 49 seconds during the mission and arrival sequence. A person evaluating mix quality or handling preference remains distinct from these observed behaviors.

## Release

- Public URL https://cloud-jet.pages.dev/
- Cloudflare deployment https://79874b77.cloud-jet.pages.dev/
- Source `fa097610a3aee9158e218ce1a23ca92c3c459db4` on `main` and successful [GitHub quality run](https://github.com/mkhsu2002/cloud-jet/actions/runs/44605618446).
- Cloudflare API confirmed the production commit and successful deployment. Public and local booth HTTP responses matched the build byte for byte for HTML, JavaScript, CSS and the score. The local server returns `audio/ogg`. The v1 deployment is still recorded in QA.md.
- Repeated the full five-corner keyboard run on production. The built-in score loaded, the arrival scene showed the lighthouse and convoy together, and results recorded 42.708 seconds, five perfect corners, five boosts and zero rail contacts. Selecting replay immediately restarted the countdown. Browser console reported zero errors and warnings.
- External playtesting, a listening review on the event sound system and a prolonged booth soak remain open.

## Flight art pass, 2026-11-19

Captured the previous production version and the new local production build at 1360 × 850. The pairings use the same course and keyboard inputs, with screenshots triggered near 145 m for harbor entry, 808 m after the storm boost, and 1.15 seconds after arrival. Both builds completed the mission with five boosts and no rail contacts. The prior run took 42.567 s, and the new local run took 42.425 s. The capture times are individual runs, not a handling or speed comparison. Course geometry, race simulation, ranking IDs and score remain compatible.

The art pass adds a modeled courier with lit nacelles and an ignition capsule, dock façades and loading gantries, a textured deck, near-course storm pylons, speed-scaled plumes and a closer chase camera. Passed timing signs fade out. The new beacon glass, hulls, optical beam and staged runway lights support the arrival sequence. Space advances from the arrival scene to results. The desktop comparison visibly confirmed entry markings, a clear route at boost and the beacon and fleet in the same arrival shot. The final local production run produced no browser console errors or warnings.

Published from `3958a69043532667ecd254fe0d2e9a9455a79c13` to Cloudflare Pages deployment `d7567c1c-3d3e-43f9-a15c-fc4c32e50a80` after [GitHub quality run](https://github.com/mkhsu2002/cloud-jet/actions/runs/44607311877) passed. The Cloudflare production readback matched the commit, and the page, bundles and score matched their local build bytes. In the final public run, the mission took 42.617 s with five boosts and no rail contacts. The core-delivery and beacon messages appeared in sequence, and Space advanced immediately to results. A reduced-motion local run at 844 × 390 selected low effects, rendered WebGL and entered the practice course without horizontal overflow.

## Boost comparison and event rules, 2026-11-19

The matched playable comparison uses the existing Harbor Shakedown track and the same simulation in both flights. A uses the previous camera and cue, and B uses a short release-triggered camera lag with framing compensation, stronger plumes, near-field route markers and a low ignition sound. Both comparison links hide speed/boost text and keep attempts out of local rankings. The mission and standard practice use the new presentation through the same simulated boost event. The simulation, cutoffs and ranking IDs are unchanged.

Played A and B locally in Chrome at 1360 × 850. Matched inputs around 159 m and 329 m yielded one boost in each, one completed result in each and working links to the other flight. Both hides were checked in flight. Times of 17.692 and 17.717 seconds reflect live input dispatch variation. The comparison evaluates presentation, so the times are not evidence that either version is faster. Browser interaction and captured frames establish visible behavior. Perceived force and audio quality on event hardware still require human evaluation.

The 2026 Category 3 Submission Specifics page was read successfully. It describes short, easy booth sessions and a complete start-to-score loop with sustained responsiveness and clean resets. WebStorm qualifies alongside Codex. The public and local builds remain free to play. English submission materials, actual booth rehearsal, and sustained use checks are separate from these development runs. See COMPETITION_PLAN.md.

After the one-corner checks, the full local production route completed in 42.700 seconds with five boosts and zero rail contacts, followed by the beacon ending and results. WebStorm ran the Default source inspection across the new timing code. The regression suite ran separately in the terminal.

Published from `d31391f2c5b5b20639dc11918525f82088f5a079` as Cloudflare Pages deployment `8b764e41-c736-42e5-8ba3-e1262f89a439` after [GitHub quality run](https://github.com/mkhsu2002/cloud-jet/actions/runs/44610294822) passed. The page, script, stylesheet and score matched the verified build. On the public URL, both A and B completed one boost and reached results with the speed block and boost text hidden and an enabled link to the other flight. Public A took 17.675 seconds and B took 17.692 seconds.

## Two-turn Convoy Rescue

The browser entry is `/?mission=rescue`. Chrome keyboard runs used harbor release near 329 m for both attempts and storm releases near 740 m or 790 m. The earlier run finished with Harbor 1 and Storm Channel 1. The later run finished with Harbor 1 and Storm Channel 2. The beacon sequence showed the corresponding two and three ships returning. Verified replay and Space to advance to results. The terminal suite passed 19 tests, covering missed windows and one-time scoring as well as existing game behavior. After activation, the four rescue regressions ran inside WebStorm. Its debugger verified both successful windows, a missed release between them and the reset state. See DEVELOPMENT_LOG.md for observed values.

Published the prototype from `8181ee5a40a5329c6ea9303e70c82a88b645c0b7` to Cloudflare Pages deployment `75242e8e-4db4-4826-81eb-eff16047bf9b` after [quality run 44613613984](https://github.com/mkhsu2002/cloud-jet/actions/runs/44613613984) passed. The public HTML, bundles and score matched the local production build byte for byte. The public keyboard run chose the later storm window, returned all three ships, displayed Harbor 1 and Storm Channel 2, and advanced from the beacon scene to results with Space.

## Ranked five-turn convoy mission, 2026-11-19

This supersedes the time-only Last Light leaderboard. The public home path launches the five-turn mission with a fresh record category. The two-turn tutorial and harbor comparison remain available. The main mission scores up to nine ships and sorts local records by ships rescued, then elapsed time. Harbor practice remains time-ranked.

The final local production build was played in Chrome at 1360 × 850 with Space. The full rescue finished in 44.750 s with sector counts of 1, 2, 2, 2, and 2. The first returning formation crossed in front of the lighthouse and visually hid several ships. After moving the formation clear of the tower, the final capture showed all nine moving ships beside the lit beacon. Space advanced to results and the faster of two nine-ship flights appeared first. See DEVELOPMENT_LOG.md for the separate WebStorm debugger and regression evidence.

A separate flight used the same first four rescue outcomes and released at the opening of the final relay. It returned eight ships in 43.192 s. The board kept the nine-ship flights at 44.750 s and 44.858 s above the faster eight-ship flight. Replay entered the countdown with zero of nine ships.

Published source `a6c05a5a3ae798e557c07a3bf1c28de62277689f` from `main` after [GitHub Game quality passed](https://github.com/mkhsu2002/cloud-jet/actions/runs/44620054215). Cloudflare Pages confirmed production deployment `b71b1d71-8373-440f-b481-023a1abe4deb` at [the deployment URL](https://b71b1d71.cloud-jet.pages.dev). Public HTML, JavaScript, CSS and the score matched the local build byte for byte.

Replayed all five turns via Space on the [public game](https://cloud-jet.pages.dev/). All nine ships returned in 45.025 s, with the expected sector counts and nine distinct models visible beside the lighthouse. Space advanced to results, the score appeared on the device leaderboard, and the browser console reported no errors. These were browser-driven keyboard flights. The event hardware and visitor sessions have yet to be evaluated.
