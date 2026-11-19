# Competition strategy and execution plan

Prepared: 2026-11-19 (America/Vancouver).
Status: proposed plan for review; no game implementation, playtest, deployment or submission has been completed by this planning task.

## Recommendation

Enter Category 3, Event Mini Game, with Cloud Jet: Drift & Boost. Build a complete, original, one-button time trial that a booth visitor can understand quickly, finish despite mistakes, and immediately want to replay. The differentiator is two consequential timing decisions per corner: press to establish a drift, then release to convert stored energy into exit speed. Make those decisions visible through trajectory, propulsion and finish time.

Pursue the optional AI-Powered Workflow Story only using evidence collected during necessary engineering work. Keep Codex as primary implementation assistance and WebStorm as the genuine debugging, inspection and test workbench. Junie or Air is optional; do not add tools solely for appearance.

Planning assumption: MK plus Codex, a desktop-browser-first game, and no backend for the MVP. Dates below are proposed milestones, not a claim about available staffing or guaranteed delivery. Re-estimate after the single-corner prototype.

## Verified competition facts and remaining checks

Sources checked directly on 2026-11-19:

- [Current official rules](https://cloud9.devpost.com/rules)
- [Current overview](https://cloud9.devpost.com/)

The current registration/submission window runs from November 17, 2026 at 11:00 Pacific to January 12, 2027 at 11:00 Pacific. The judging period ends February 3, 2027 at 15:00 Pacific. Plan to keep the submitted build freely accessible and unchanged through that end date.

Category 3 covers event mini games. At least one JetBrains tool must actually be used; Rider is recommended, not mandatory. GRID data is optional. The project must function consistently and match its presentation. Public source, an open-source license, a working website demo, an English description and methodology, and a public YouTube demonstration under three minutes form the submission package. The optional workflow prize needs a direct link to its case study or video.

The five equally weighted judging criteria are technological implementation, design, potential impact, quality of the idea, and presentation. Technology is the first tie-break criterion. Category 3 advertises a USD 6,000 first prize and USD 2,000 runner-up; the workflow bonus advertises USD 1,000. Prize outcomes and booth adoption are not guaranteed.

Open verification items:

- The current [Submission Specifics page](https://cloud9.devpost.com/details/submission-specifics) returned HTTP 403 during this check. Recheck it before scope freeze and submission; do not treat this document as a complete substitute.
- Search results contain previous-edition pages with Category 4 and old dates. Use the current live rules, not cached prior-edition requirements.
- MK must confirm individual/team eligibility, representative details and registration status. Neither residence nor eligibility is inferred from machine timezone. Any binding submission/terms acceptance requires MK's final action.
- Recheck rules and submission fields before submitting; record material changes rather than silently changing the verification date.

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

Use the README's proposed TypeScript + Vite + Three.js stack, with a supported Node LTS selected when scaffolding and exact dependencies pinned in a lockfile. No packages have yet been selected or installed.

- Simulation owns race time, progress, speed, lateral position, drift energy, boost and collision/recovery. A fixed update step consumes ordered input timestamps; rendering never decides timing quality.
- Track data owns a fixed course, corner geometry and entry/exit windows. Start with one bend; expand to a small sequence of distinct bends only after that slice is enjoyable.
- Input normalizes Space down/up, suppresses repeat, and clears state on restart. Blur or suspension pauses safely and invalidates that competitive result; resuming must never create a faster ranked time.
- Rendering displays the vehicle, track, drift line, propulsion and readable cues. Use both shape/position and color so gold alone is not the only timing signal.
- UI owns the race lifecycle, mute/effects settings and local results. Timing uses simulation time from a monotonic clock; display rounding must not change leaderboard ordering.
- Local persistence stores versioned records. Storage denial or corruption must not block play. Changed track/timing rules start a separate ranking version.
- A static hosted demo and a locally served offline package share one versioned build. The offline package must include its assets and documented startup steps; do not assume opening an HTML file directly works.

Late input, missed input and wall contact reduce physical progress or speed; do not substitute arbitrary score penalties for time loss. Safe guidance must preserve the ability to finish. Recovery should not become a shortcut that beats a clean run.

Public game copy explains controls and results only. Keep evidence, implementation details, test thresholds, tool choices and production instructions out of gameplay screens. A dedicated competition methodology/workflow document may disclose the tool work explicitly required for judging, after removing secrets and private information.

## Delivery milestones

All dates use America/Vancouver. Core work targets December 20 to leave holiday and submission buffer.

| Window | Deliverable | Exit condition |
| --- | --- | --- |
| Nov 19–22 | Confirm scope and logistics; select runtime; establish scaffold, simulation boundary and test runner | Clean install/build from a fresh checkout; MK completes any necessary IDE activation; registration and current specifics tracked accurately |
| Nov 23–29 | One straight, one bend, one exit; placeholder vehicle; real press/hold/release behavior | Ideal input reliably beats controlled early/late replays; missed/held input still finishes; a first-time player can explain the two moments |
| Nov 30–Dec 6 | Full course and race lifecycle; local leaderboard; pause/restart recovery | Complete playable loop; target clean runs around 45–75 seconds; consecutive races reset all state; interrupted runs cannot rank |
| Dec 7–13 | Visual and sound polish, clearer cues, low-effects option, local offline package | Readable turns on the target display; documented target device and measured performance; no external asset dependency during play |
| Dec 14–20 | Small playtest round and booth hardening | Record at least five new players' completion, understanding, retries and observations; run automated replays and a two-hour manual/automated soak; prioritize observed issues |
| Dec 21–Jan 3 | Fix findings, prepare hosted candidate, README/runbook, provenance and workflow case study | Fresh-checkout reproduction; hosted/offline candidate checks; source/build correspondence; all public copy reviewed; no unsupported claims |
| Jan 4–8 | Record final English demo and prepare submission package | Video under three minutes; all links accessible without login; final game matches video; MK reviews submission and performs binding final submit |
| Jan 9–12 | Submission contingency buffer | Resolve upload/access problems; confirm platform receipt before Jan 12, 11:00 Pacific; do not leave first submission to deadline day |
| Through Feb 3, 15:00 Pacific | Preserve judge access | Keep submitted build reachable and retain release source/assets; do not overwrite it with later development |

Implementation order inside the first slice:

1. Pin runtime/dependencies and create simulation, input and rendering modules.
2. Implement timestamped input, fixed-step update and race lifecycle without visual polish.
3. Add entry timing, hold energy, release timing and wall/recovery response.
4. Add minimal track/vehicle feedback to judge feel.
5. Run deterministic input comparisons and real WebStorm breakpoint/test work.
6. Observe a new player's first attempts, tune and decide whether to expand.

## Internal acceptance and stop rules

- Given the same timestamped input, different render schedules must produce the same simulation outcome within a documented tolerance no larger than one simulation step. Ranked ordering must remain stable. Measure input latency separately; deterministic replay does not prove equal device latency.
- Test early/ideal/late press and release, no press, no release, release outside corners, key-repeat, double-start, restart, resize, blur and tab suspension. Every normal error path must finish without a soft lock.
- Compare automated completion times to the track's clean-run reference to catch recovery exploits. Preserve ranking integrity across pauses and ruleset changes.
- Record first-time-player completion rate, time to understand controls and voluntary retries. The first sample is formative, not statistical proof of impact. If fewer than four of five players understand the mechanic without coaching, simplify cues before expanding content.
- Measure frame times on the declared target device. Aim for smooth 60 fps there; reduce effects before sacrificing input/simulation correctness. Browser automation, when needed, must follow the authorized browser-lane rules.
- Verify the offline package with networking disabled after local setup. During the soak, check repeated resets, resource growth, stuck input, audio behavior and leaderboard storage failure.
- If the Nov 29 slice is not fun or legible, spend the next milestone fixing it and cut decorative scope. If Dec 20 reliability gates fail, remove optional features and repair; do not hide failures or present planned tests as passed.
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

MK owns creative review, external playtest recruitment, account/license/security interactions, and binding final submission. Codex can prepare implementation, tests, documentation and release artifacts after scope approval. No registration, deployment, external publishing or submission was performed during this planning task.
