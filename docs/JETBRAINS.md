# JetBrains engineering evidence

Updated: 2026-11-19.

## Actual use

WebStorm 2026.3, build WS-263.7307.202, ran its offline project inspection through the bundled `inspect.sh` tool with the Default profile. The scan processed the TypeScript source, tests, HTML, CSS, package configuration and local server script, and exited successfully. It was an actual inspection, not merely an installation screenshot.

The first inspection identified an ambiguous DOM-helper name that triggered jQuery heuristics, an unresolved Node process reference, and a server-listen signature warning. The helper was renamed, process imported explicitly, and the server configured through the listen options object. These changes were reviewed and verified with TypeScript/build/tests. Additional unused-symbol warnings on structural storage test doubles and prose style suggestions are not evidence of game failures.

## Interactive rescue debugging and tests

On November 19, after license activation, WebStorm launched Vitest 5.1.1 using a local Node.js configuration called **Convoy Rescue** and Node 24.22.3. Its Run console showed four tests passed and exit code 0. Its JavaScript debugger stopped at `src/rescue.ts:22` and `tests/rescue.test.ts:50`. The debugger confirmed one ship, two ships, no matching window, and an empty rescue state after reset. See the [development log](DEVELOPMENT_LOG.md) for source revision, parameters and exact observed values.

To reproduce in WebStorm, use a Node.js run configuration with the project as the working directory, `node_modules/vitest/vitest.mjs` as the entry point and `run tests/rescue.test.ts --pool=threads --maxWorkers=1` as the application arguments. Use Run for the test result and Debug for source breakpoints. Keep local interpreter paths and license data out of Git.

## References

- https://www.jetbrains.com/help/webstorm/command-line-code-inspector.html
- https://www.jetbrains.com/help/webstorm/configuring-javascript-debugger.html
- https://www.jetbrains.com/help/webstorm/unit-testing-javascript.html
- https://cloud9.devpost.com/rules
