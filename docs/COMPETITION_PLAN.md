# Competition strategy and execution plan

Prepared: 2026-11-19 (America/Vancouver).
Status updated 2026-11-19: MK approved the stack and authorized continuous implementation. The browser game is implemented; see QA.md for actual verification/release status. Competition submission remains unfinished. Historical planning targets below are not completion claims.

## Experience direction superseded

On 2026-11-19, MK rejected the v1 handling, visuals, sound and missing motivation. The delivery/engineering records below remain historical context; use UPGRADE_V2.md for the approved Last Light direction and QA_V2.md for current verification.

## Recommendation

Enter Category 3, Event Mini Game, with Cloud Jet: Last Light. Build a complete, original, one-button time trial that a booth visitor can understand quickly, finish despite mistakes, and immediately want to replay. The differentiator is two consequential timing decisions per corner: press to establish a drift, then release to convert stored energy into exit speed. Make those decisions visible through trajectory, propulsion and finish time.

Pursue the optional AI-Powered Workflow Story only using evidence collected during necessary engineering work. Keep Codex as primary implementation assistance and WebStorm as the genuine debugging, inspection and test workbench. Junie or Air is optional; do not add tools solely for appearance.

Planning basis: MK plus Codex, a desktop-browser-first game, and no backend for the MVP. Updated on 2026-11-19 at MK’s direction: replace the previous multi-week delivery proposal with a two-day focused sprint. The earlier November-to-January implementation schedule is superseded. Completion remains subject to actual validation.

## November 19 design review

MK rejected the existing time trial as too conventional. The deployed build and harbor comparison remain development evidence. The next design proposal makes saving the convoy a player-controlled outcome.

Prototype two consecutive rescue encounters in the browser. Hold through the wind curve to charge a relay. Release when a waiting ship crosses the relay window to give it a safe corridor. The first encounter teaches the timing with a visible ship and a forgiving window. The second offers a choice between an early release for one ship or holding for a later, more demanding pair. The lighthouse still comes online on every completed run. Rank by ships guided home, then delivery time. The intent is to give spectators a visible outcome and players a reason to immediately try a different release. The two-bend prototype implements both choices, counts the convoy in the beacon ending and shows both sector results. See QA_V2.md for validation. The five-bend time trial is still a separate mode.

Use the WebStorm debugger and Vitest run configuration to verify one release event, one relay resolution and exactly one award per ship, including a missed window and an immediate replay. The native app currently stops at its first-launch User Agreement and requires MK to complete that action. A command-line inspection previously ran, and the terminal test suite is separately documented. The organizer makes the eligibility decision.

## Verified competition facts and remaining checks

Sources checked directly on 2026-11-19:

- [Current official rules](https://cloud9.devpost.com/rules)
- [Current overview](https://cloud9.devpost.com/)

The current registration/submission window runs from November 17, 2026 at 11:00 Pacific to January 12, 2027 at 11:00 Pacific. The judging period ends February 3, 2027 at 15:00 Pacific. Plan to keep the submitted build freely accessible and unchanged through that end date.

Category 3 covers event mini games. At least one JetBrains tool must actually be used; Rider is recommended, not mandatory. GRID data is optional. The project must function consistently and match its presentation. Public source, an open-source license, a working website demo, an English description and methodology, and a public YouTube demonstration under three minutes form the submission package. The optional workflow prize needs a direct link to its case study or video.

The five equally weighted judging criteria are technological implementation, design, potential impact, quality of the idea, and presentation. Technology is the first tie-break criterion. Category 3 advertises a USD 6,000 first prize and USD 2,000 runner-up; the workflow bonus advertises USD 1,000. Prize outcomes and booth adoption are not guaranteed.

Open verification items:

- The [current Submission Specifics](https://cloud9.devpost.com/details/submission-specifics) were read successfully on 2026-11-19 after the earlier HTTP 403. Category 3 calls for a complete start-to-score loop, short sessions ideally under three minutes, simple controls, clean resets, and sustained responsiveness. Rider is recommended. WebStorm with other tools is allowed. A separate-monitor local leaderboard is an optional enhancement. The current pages specify no fixed engine, rendering style or asset-size limit.
- Search results contain previous-edition pages with Category 4 and old dates. Use the current live rules, not cached prior-edition requirements.
- MK must confirm individual/team eligibility, representative details and registration status. Neither residence nor eligibility is inferred from machine timezone. Any binding submission/terms acceptance requires MK's final action.
- Recheck rules and submission fields before submitting; record material changes rather than silently changing the verification date.

The event build is intended to be a free public walkthrough experience with no install or sign-in, plus the same assets served locally for a booth. Treat award and adoption as separate organizer decisions. Before entry, rehearse on the intended booth machine with new players, multiple consecutive runs, reset, sound and the local server with internet disconnected. Prepare public open-source code and run instructions, a free working demo through February 3, 2027 at 15:00 Pacific, a public YouTube gameplay video under three minutes and the English methodology and tooling explanation. Deadline is January 12, 2027 at 11:00 Pacific.

## Alternatives and scope decision

| Approach | Benefit | Cost / risk | Decision |
| --- | --- | --- | --- |
| Single-button racing with one polished course | Strong skill expression, easy booth handoff, visible replay improvement | Timing feel and corner readability must be excellent | Recommended |
| Reaction gates with a racing visual theme | Faster prototype and lower simulation risk | May feel like a reaction test with decorative scenery | Simplify simulation this way only if vehicle response remains meaningful; retain press/hold/release |
| Multiple tracks, online competition and extensive vehicle upgrades | Broader feature set | Backend, balancing and asset work dilute the core experience | Defer until after submission |

Do not expand into esports analytics, require GRID, add a runtime AI service, or introduce account creation. A local event leaderboard is sufficient initially. Clearly label its local scope; never imply global ranking or cheat resistance.

## How to earn each score

| Criterion | Product decision | Evidence to collect |
| --- | --- | --- |
| Technological implementation | Separate deterministic simulation from rendering; timestamp input; support reliable recovery | Replay tests at 30/60/120 fps render schedules; a real WebStorm debugging session; reviewed fixes and commit references |
| Design | Coherent attract/start/countdown/race/results/replay loop, readable bends and immediate feedback | Recorded complete runs, first-time-player observations, accessibility and reset checks |
| Potential impact | Serve short event visits and quick player turnover without login or a race-time connection | Measured session/reset times, offline rehearsal, staff setup instructions and soak results |
| Quality of the idea | Make both drift entry and release matter; permit recovery and mastery | Same-corner early/ideal/late comparisons showing trajectory, speed and elapsed-time differences |
| Presentation | Demonstrate the actual loop and explain the visitor/staff benefit | English video under three minutes, reproducible demo URL, concise submission and methodology |

These are internal product goals and evidence plans, not official numeric scoring thresholds. Do not claim novelty as a verified world-first or claim event validation before testing.

## MVP architecture and behavior

Implemented stack: TypeScript + Vite + Three.js on Node 24.22.3, with exact package versions and a lockfile. See README.md for the source layout and actual run commands.

- Simulation owns race time, progress, speed, lateral position, drift energy, boost and collision/recovery. A fixed update step consumes ordered input timestamps; rendering never decides timing quality.
- Track data owns a fixed course, corner geometry and entry/exit windows. Start with one bend; expand to a small sequence of distinct bends only after that slice is enjoyable.
- Input normalizes Space down/up, suppresses repeat, and clears state on restart. Blur or suspension pauses safely and invalidates that competitive result; resuming must never create a faster ranked time.
- Rendering displays the vehicle, track, drift line, propulsion and readable cues. Use both shape/position and color so gold alone is not the only timing signal.
- UI owns the race lifecycle, mute/effects settings and local results. Timing uses simulation time from a monotonic clock; display rounding must not change leaderboard ordering.
- Local persistence stores versioned records. Storage denial or corruption must not block play. Changed track/timing rules start a separate ranking version.
- A static hosted demo and a locally served offline package share one versioned build. The offline package must include its assets and documented startup steps; do not assume opening an HTML file directly works.

Late input, missed input and wall contact reduce physical progress or speed; do not substitute arbitrary score penalties for time loss. Safe guidance must preserve the ability to finish. Recovery should not become a shortcut that beats a clean run.

Public game copy explains controls and results only. Keep evidence, implementation details, test thresholds, tool choices and production instructions out of gameplay screens. A dedicated competition methodology/workflow document may disclose the tool work explicitly required for judging, after removing secrets and private information.

## Two-day execution

Target: November 19–20, 2026 (America/Vancouver). Work continuously through implementation and validation; this is a focused delivery target, not a claim of completed work.

| Stage | Deliverable | Gate |
| --- | --- | --- |
| Day 1, first block | Supported Node LTS, TypeScript/Vite scaffold, simulation and one rendered bend | Press/hold/release visibly changes racing line, speed and time; bad input still finishes |
| Day 1, second block | Complete course, countdown, results, instant replay, local leaderboard | Full playable loop; resets and focus loss handled; deterministic timing comparisons pass |
| Day 2, first block | Original 3D presentation, audio, clear cues, low-effects option, local offline package | Smooth play on the target machine; all assets bundled; real WebStorm debugging/test evidence recorded |
| Day 2, second block | Playtest/fixes, soak test, hosted candidate, run instructions and submission materials | Build/test checks, public-copy review, source/build correspondence and actual online/offline play verified |

Use TypeScript + Vite + Three.js with WebGL rendering, plain HTML/CSS overlays, Web Audio and versioned localStorage records. Keep simulation separate from rendering. Vitest is the proposed simulation-test runner. Runtime and dependencies are now pinned in .nvmrc, package.json and package-lock.json. Avoid a backend, full physics engine, multiplayer and elaborate asset pipelines in this sprint.

Deployment and submission materials are part of the target. External publication follows the applicable release checks; MK performs any binding final competition submission. Preserve judge access through February 3, 2027 at 15:00 Pacific once submitted.

## Internal acceptance and stop rules

- Given the same timestamped input, different render schedules must produce the same simulation outcome within a documented tolerance no larger than one simulation step. Ranked ordering must remain stable. Measure input latency separately; deterministic replay does not prove equal device latency.
- Test early/ideal/late press and release, no press, no release, release outside corners, key-repeat, double-start, restart, resize, blur and tab suspension. Every normal error path must finish without a soft lock.
- Compare automated completion times to the track's clean-run reference to catch recovery exploits. Preserve ranking integrity across pauses and ruleset changes.
- Record first-time-player completion rate, time to understand controls and voluntary retries. The first sample is formative, not statistical proof of impact. If fewer than four of five players understand the mechanic without coaching, simplify cues before expanding content.
- Measure frame times on the declared target device. Aim for smooth 60 fps there; reduce effects before sacrificing input/simulation correctness. Browser automation, when needed, must follow the authorized browser-lane rules.
- Verify the offline package with networking disabled after local setup. During the soak, check repeated resets, resource growth, stuck input, audio behavior and leaderboard storage failure.
- If the first playable slice is not fun or legible, fix its controls and cues immediately and cut decorative scope. If reliability gates fail, repair before release; do not hide failures or present planned tests as passed.
- If the schedule slips, cut touch support, ghost replay, extra track sections and decorative effects first. Preserve the complete loop, forgiving finish, timing correctness, local ranking and submission evidence.

## Evidence and submission package

Maintain actual work in DEVELOPMENT_LOG.md as it happens: tool version, task, reproduced issue, fix, test result and commit. A useful workflow story is one real timing bug traced in WebStorm, corrected with Codex assistance, and protected by a regression test. Quantify speedups only if measured. Installation screenshots alone do not demonstrate engineering work.

Do not publish IDE workspace/profile files wholesale. If shared IDE configuration is useful, review it for personal paths and secrets; official encouragement to include tool folders does not require exposing local state.

Prepare these deliverables against one tagged release:

- Public repository with MIT license, complete source/assets, clean install/run/build instructions and supported environment.
- Stable website demo plus locally served offline instructions; record release commit and deployment/build identity.
- English feature description and methodology tied to the five criteria; explain the booth audience and measured findings.
- Public YouTube video, targeting approximately 2:40–2:50: short premise/control introduction, a complete actual run, results/replay, then concise booth and verified engineering evidence. Adapt editing to the measured race length; do not fabricate a full run or put production instructions in the game UI.
- Optional dedicated workflow case study URL based on verified JetBrains use, with reviewed screenshots and no private information.
- Asset/license inventory covering models, textures, fonts, audio and dependencies. Use original presentation and no unauthorized third-party logos or music.
- Final checklist: current specifics/rules, eligibility/registration confirmation, public links in a signed-out readback, actual game/video consistency, source/build correspondence, English public copy review, recorded platform receipt after MK's final submission.

MK owns creative review, external playtest recruitment, account/license/security interactions, and binding final submission. MK authorized implementation after reviewing the stack. Codex is completing the implementation, tests, documentation and release artifacts in the current sprint. Use QA.md for observed release status. No competition registration or binding submission has been performed by this task.
