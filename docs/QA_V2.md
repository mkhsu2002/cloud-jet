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
