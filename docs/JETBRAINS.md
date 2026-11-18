# JetBrains engineering workflow

## Planned role

Codex remains the main development assistant. WebStorm is the inspection, debugging and test workbench for the timing-critical TypeScript simulation. There is no need to install Unity, Rider or Toolbox for this browser-first plan.

After the game scaffold exists:
1. Open this repository in WebStorm and select the project's supported Node runtime.
2. Install pinned project dependencies using the lockfile. Run the dev server from the package.json gutter.
3. Debug input events and drift/boost state transitions, checking event timestamps against simulation time.
4. Run the timing/replay test suite from the IDE. Inspect failures and review refactors with TypeScript inspections.
5. Record the real version, task, test results, relevant commit and optional screenshot in DEVELOPMENT_LOG.md.

Suggested regression cases: early/late release, lost focus while holding, key-repeat, frame-rate variation and clean restart. Do not replace evidence of actual IDE work with an installation screenshot.

Junie / Air is optional, not yet configured or used. Do not sign up for a paid plan or claim AI-generated test coverage without actually reviewing and running it.

## Runtime caveat

The setup machine initially has Node 23.9.0. Before creating the Vite/Three.js scaffold, select a supported LTS runtime compatible with the versions chosen. Do not assume an installed Node version is suitable just because it runs.

## Official references

- https://www.jetbrains.com/webstorm/
- https://www.jetbrains.com/help/webstorm/configuring-javascript-debugger.html
- https://www.jetbrains.com/help/webstorm/unit-testing-javascript.html
- https://cloud9.devpost.com/rules

## Status

See DEVELOPMENT_LOG.md for observed setup results. Installation, first launch / license activation, actual debugging, and actual test execution are separate milestones.
