# Cloud Jet v2 — experience redesign proposal

**Archived 2026-11-19.** This records the earlier Cloud Jet build. The current game is Ascent. See [current verification](QA_ASCENT.md).
Date: 2026-11-19. Status on 2026-11-19: approved and implemented for the playable v2. This document preserves the design proposal. See QA_V2.md for measured behavior and remaining experience checks. MK rejected the v1 handling, visuals, sound and lack of narrative motivation. This proposal replaces the v1 experience direction. Existing automated passes remain functional evidence only, not evidence of entertainment value or artistic quality.

## Product direction

Recommended working subtitle: **Cloud Jet: Last Light**. Preserve the Cloud Jet name and the approachable single-button entry/hold/release loop. Build an authored arcade experience with a reason to race, expressive handling, distinctive environments and a composed musical identity.

| Direction | Strength | Tradeoff |
| --- | --- | --- |
| Storm courier restoring a sky city's navigation beacon | Gives drifting/boosting a clear urgent mission and an emotionally visible finish | Requires deliberate environmental and audio storytelling; recommended |
| Underground sky-racing championship | Immediate competitive motivation, rivals and spectacle | Rival AI, racing traffic and competition presentation add significant scope |
| Pilot qualification trial | Very easy to explain and produce | Weaker stakes; risks reproducing v1's detached time-trial experience |

MK approved the courier direction on 2026-11-19.

## Story that plays

A storm has severed the navigation network of a floating city. Ships are waiting outside the cloud wall for a safe route home. The player is a courier carrying a beacon ignition core across the abandoned skyway to the city's lighthouse.

Present the premise in a short launch scene: dark harbor, a distant waiting convoy, the core locking into the craft and a brief radio call. Allow immediate skip and skip it by default on replay. No account, lore encyclopedia, long cutscene or branching dialogue is required.

Three route beats:

1. **The Silent Harbor** — close buildings, dark windows, readable first bend; a relay lights as the player passes.
2. **The Storm Channel** — stronger silhouette contrast, cloud movement and a banked exposed turn; wind becomes visible through particles and banners, not random control penalties.
3. **The Beacon Run** — the skyline opens into warm light; a long exit boost leads to the lighthouse. Deliver the core, sweep a beam across the clouds, and reveal ships following it home.

Every normal run can deliver the core, even after mistakes. Fast, clean flying earns flight medals and better records; it does not decide whether civilians survive. A relay's activation is route progress, not a new arbitrary scoring tax. Show the payoff before the results panel. Replay enters the flight promptly and retains separate first-run/replay pacing.

## Verified causes in v1

- `simulation.ts` converges toward preset lateral targets and target speeds. It does not model yaw rate, slip angle or lateral velocity. Holding/releasing therefore has limited continuous expression.
- `world.ts` renders a fixed drift rotation and uses per-render-frame camera lerp factors. Visual response can differ with render rate even though the underlying simulation passes replay tests.
- Track geometry is primarily a monotonic negative-Z route with cosine lateral shifts. Repeated bends lack a convincing heading change or authored rhythm.
- Primitive craft/scenery, uniform lighting, sparse landmarks and weak near-field detail fail to establish scale, depth or a strong world identity.
- `audio.ts` is a sawtooth oscillator plus short sine sweeps. It contains no composed background music, layered vehicle sound, environment soundscape or mix system.
- Completion, timing and storage tests establish working behavior. They cannot establish fun, visual quality, musical quality or player motivation.

## Handling redesign

Retain one button for booth accessibility. Rebuild the underlying motion instead of adding decorative effects to the same interpolation.

- Use one shared, arc-length-sampled track definition for simulation, collision, gates, racing line and renderer. Support true heading changes, curvature, banking and vertical profile. Avoid separate approximate render and simulation paths.
- At a fixed simulation step, evolve forward speed, lateral velocity, yaw rate, slip angle and grip. Use a bounded arcade vehicle model with stability assistance; a heavyweight general-purpose physics engine is not assumed necessary.
- Press initiates weight transfer and grip reduction. Hold lets slip and energy build; the craft should visibly rotate relative to its travel direction. Curvature determines the assisted turn direction.
- Release restores grip progressively and converts stored energy into a boost impulse. Yaw unwinds and lateral motion settles smoothly. Boost must be legible in vehicle acceleration, nearby scenery motion, sound and camera distance.
- Broaden ordinary success windows and reserve narrow windows for mastery. Derive timing windows in seconds from the local speed/track context instead of using only fixed distances. Provide recoverable late entry and a clear late-release consequence.
- Wall contact is a discrete impact with visual/audio response and a speed impulse; continued scraping uses a controlled friction response. Do not repeatedly trigger impact punishment while one contact is maintained. Safe recovery preserves forward progress and cannot become a faster shortcut.
- Use elapsed-time-based camera damping, lookahead into the bend, restrained banking and a continuous boost response. Camera shake is brief and bounded; reduced-motion mode retains clear speed/energy cues without shake or aggressive FOV changes.
- Introduce no random wind force or hidden input delay. Preserve repeat suppression, deterministic replays, interruption handling and clean resets.

First tuning pass: create three internally switchable handling presets (stable / balanced / expressive) on the same representative corner. Compare them in actual play and select one default before expanding. Target immediate input onset within one simulation step and visible response on the next available rendered frame; measure real input-to-visible latency on the target machine rather than promising an unmeasured millisecond figure.

## Art direction and speed

Visual identity: pearl-white courier craft, dark blue storm architecture, turquoise navigation light and a warm amber beacon. Distinguish functional cues from scenery through shape, movement and value as well as color.

Replace the box assembly with a deliberately designed vehicle silhouette: a readable cockpit/core housing, swept wings, articulated stabilizers and two identifiable thrusters. Show three useful angles in an art review before committing asset production. Prefer a small number of purposeful, optimized assets; document rights and provenance for authored, licensed or generated material.

Author a track with meaningful silhouettes and changes in space: compressed harbor canyon, exposed banked storm bend, open beacon approach. Add near-field markers/rail joints and deliberate scale references. Build lighting, sky, cloud layers and fog together. Do not fill empty space with unrelated towers or obscure the next turn with bloom, cloud opacity or particles.

Use a selective post-processing pass only after the base composition is strong: restrained bloom on navigation/thrusters, atmospheric depth and consistent tone/color. Avoid full-screen motion blur that hides timing cues. Compose start, corner apex and exit screenshots at actual gameplay camera positions, not only a flattering menu shot.

The HUD should support the craft and route. Reduce continuous instruction text, place entry/apex/exit cues in the world, show a readable route preview and concise timing feedback. Reserve strong visual/audio emphasis for meaningful input outcomes. Review portrait, landscape and event-display legibility.

## Music and sound

Produce a real original musical cue with a memorable motif, an energetic rhythmic bed and a coherent beginning/build/payoff. A proposed starting palette is cinematic electronic music around 132–140 BPM, with atmospheric opening, bass/percussion drive through the storm, and a brighter harmonic resolution at the beacon. This is an audition direction, not a settled composition.

- Audition three short musical treatments against the same flight video before producing the final cue. Choose based on drive, emotional identity, repeated-play fatigue and fit with vehicle sounds.
- Deliver loop-safe stems (ambience / rhythm / bass / melodic lift) that can crossfade at musical boundaries. Race events should not abruptly restart a song or change tempo with every boost.
- Layer engine body, speed-dependent air/wind, drift energy, thruster ignition, discrete impact and environment. The raw continuous sawtooth from v1 is a placeholder to replace.
- Duck music slightly for the most important launch/mission cue and impact feedback. Prevent clipping and avoid masking the release cue. Provide separate music/SFX levels plus master mute.
- The browser begins audio only after a user gesture. Verify loading, loop seams, pause/restart, repeated runs, mute and missing/failed audio. Music failure must never block a race.
- Keep all shipped audio local and provide a mix that works on modest booth speakers as well as headphones. Listen to the final asset and in-game mix; technical generation success is not artistic acceptance.
- Confirm music/asset rights and any generation/export terms before using a provider or library. No paid service, voice clone or external asset procurement is assumed by this proposal.

## Progression and motivation

Use one complete mission with three environmental beats, not an expanded campaign. Finish rewards should connect the player to the world: harbor restored, ships returning, courier flight medal and a clear next time to chase. A personal-best ghost is an optional extension only after core feel is accepted; it must be a real recorded run with matching rules, not fabricated competition.

Keep the leaderboard local and honestly labeled. Do not add accounts, a cloud service, vehicle upgrades, grinding, a daily-task system or multiplayer to compensate for weak core play.

## Execution order — concentrated work, observable checkpoints

The target remains focused work over roughly two days, re-estimated after the slice. This is an effort target rather than a promise that untested art/audio will meet quality standards within a fixed number of hours.

| Order | Work | Reviewable outcome |
| --- | --- | --- |
| 1 | Shared curved track + arcade handling + elapsed-time camera | A representative bend that feels substantially better using simple readable assets; stable/balanced/expressive comparisons |
| 2 | Same bend with the finished visual direction and audio audition | A 20–30 second playable harbor-to-storm slice, three gameplay-camera stills and musical treatments paired with flight footage |
| 3 | Consolidate the selected feel/art/sound into the complete mission | Start → harbor → storm → beacon payoff → results → instant replay |
| 4 | Real player review, repairs and release verification | Input/race tests, actual listening/visual review, booth performance, offline behavior and source/deployment readback |

Do not build the entire new route and only then discover the handling still fails. If the representative slice is not convincing, revisit its motion, composition and mix before producing more environments. This is a quality gate, not a request for approval at every routine implementation step. No v2 implementation or production replacement is performed in this planning task.

## Acceptance: technical checks plus experience judgment

**Handling:** A player can explain and feel the difference between clean entry, sustained drift, clean release and a recoverable mistake without relying on Perfect text. Holding should feel controlled and release should feel rewarding. Review the three handling presets side by side. Preserve deterministic outcomes across render schedules and test wall contact onset, scrape, separation, recontact and recovery.

**Visuals:** The gameplay camera clearly communicates the next turn, vehicle slip and exit acceleration. Harbor, storm and beacon are distinguishable by silhouette, lighting and space. Inspect the least flattering in-race frames, reduced effects and lower-resolution views. Target smooth 60 fps on the declared event machine and measure representative race frame-time distribution; a two-second homepage sample is insufficient.

**Sound:** Listen to the whole mission plus three immediate replays on headphones and speakers. Check that music has an identity, looping is seamless, the engine is not fatiguing, boost is satisfying and important cues remain audible. Test silence/failure/mute separately. Asset delivery or an oscilloscope does not count as a listening pass.

**Story:** After one run, a new player can say what they were carrying, where they were going and what changed when they arrived. The introduction remains skippable and replay does not interrupt momentum.

**Play motivation:** MK's v1 rejection is the current baseline. The decisive comparison is actual v1/v2 play with feedback on control, speed, world and music, not another perfect automated lap. If available, observe at least five first-time players and record understanding, completion and unprompted retries; do not fabricate recruitment or claim statistical validation from a small sample.

**Release:** Re-run install/tests/build, review all English public copy and asset rights, verify offline bundled assets, check the deployed source/assets/live loop, and preserve a rollback to v1. Change local ranking/course IDs when physics or route changes so v1 and v2 times cannot mix. V2 progress should never be reported as complete solely because CI passes.

## Technical disposition

Keep TypeScript, Vite, Three.js and Vitest. Preserve useful input, lifecycle, storage and deployment safeguards. Replace the current handling, track construction, camera behavior, vehicle/scenery presentation and audio implementation as needed. Separate modules by responsibility: shared track sampling; vehicle simulation; presentation camera; scene/assets; audio loading/mix; mission events; UI/results. Mission events must not become a second clock that changes competitive simulation outcomes.

Avoid new backend contracts, runtime API calls and heavy engine migration for this upgrade. Introduce art/audio assets through bounded batches, verifying actual files, optimization, rights and in-game integration before producing more. Maintain readable source, exact dependency locks, reviewed JetBrains evidence and path-filtered CI.
