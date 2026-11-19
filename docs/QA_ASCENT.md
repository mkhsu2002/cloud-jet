# Cloud Jet: Ascent verification

2026-11-19, America/Vancouver.

The public mission replaces the rescue route. Each gate has a local countdown, and any missed gate stops the attempt. Successful dockings use a separate elapsed-time leaderboard. Practice, restart and next-pilot handoff remain available.

The automated simulation suite covers exact-deadline behavior, an idle failure, reset, cue-following completion at 30/60/120 fps with 150 ms input delay, offline record separation, and the existing boost and session regressions.

The local Chrome run at 1360 × 850 waited through the first gate without pressing Space. The game ended at 9.800 s, showed the pod falling into the cloud sea, and wrote no record. Space handed off to the launch screen. A fresh attempt using the visible hold and release cues docked in 42.683 s with five perfect corners, five boosts and no wall grazes. The browser requested the new score and reported no page errors. The source audio is a 60.959 s stereo Opus file with measured integrated loudness of −19.8 LUFS and true peak of −5.9 dBFS before in-game mixing. Venue playback remains untested.

### Cloud-sea art and physical track collapse

The 1360 × 850 browser flight with the modular deck completed all five gates in 42.408 s with five boosts and zero wall grazes. The new backdrop and score were requested successfully. An intentional timeout with the final side-on camera showed the deck and guardrails tilting together, the pod sliding over the exposed edge, and the fog swallowing it after it had separated from the deck. Space returned to the briefing, and the next flight's first gate clock started at 9.8 s. The regression suite passed 22 tests.
