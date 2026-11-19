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
