# JetBrains engineering evidence

Updated: 2026-11-19.

## Actual use

WebStorm 2026.3, build WS-263.7307.202, ran its offline project inspection through the bundled `inspect.sh` tool with the Default profile. The scan processed the TypeScript source, tests, HTML, CSS, package configuration and local server script, and exited successfully. It was an actual inspection, not merely an installation screenshot.

The first inspection identified an ambiguous DOM-helper name that triggered jQuery heuristics, an unresolved Node process reference, and a server-listen signature warning. The helper was renamed, process imported explicitly, and the server configured through the listen options object. These changes were reviewed and verified with TypeScript/build/tests. Additional unused-symbol warnings on structural storage test doubles and prose style suggestions are not evidence of game failures.

## Remaining interactive work

Do not claim interactive breakpoint debugging or test execution inside the IDE yet. To collect those distinct forms of evidence:

1. Open the repository in WebStorm. MK completes any required first-launch, account or license interaction.
2. Set the project's Node runtime to 24.22.3 and install pinned packages with `npm ci`.
3. Run `dev` from package.json and debug `Simulation.apply`/`step` with a real press/release interaction; compare event timestamps with simulation time.
4. Run `tests/simulation.test.ts` from the IDE and inspect timing/replay results.
5. Add the actual action, version, result and commit to DEVELOPMENT_LOG.md; review screenshots for private information.

No Unity, Rider or Toolbox is needed for this stack. Junie and Air have not been used. A paid subscription is not required by this project's technical plan, and none has been purchased by this task.

## References

- https://www.jetbrains.com/help/webstorm/command-line-code-inspector.html
- https://www.jetbrains.com/help/webstorm/configuring-javascript-debugger.html
- https://www.jetbrains.com/help/webstorm/unit-testing-javascript.html
- https://cloud9.devpost.com/rules
