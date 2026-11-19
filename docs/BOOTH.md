# Booth operation

Updated: 2026-11-19. Applies to the browser implementation introduced in this sprint.

## Start

Use a modern desktop browser with WebGL 2 and hardware acceleration. Open the hosted game or run the bundled build locally. Start with a keyboard and a 1080p display; use the full-screen button after opening the page. Harbor Shakedown is a single-corner practice run. Last Light has five corners and ends with a short sequence showing the core delivery, beacon ignition and convoy departure. Press Space during the arrival scene to go straight to results.

Launch the mission from the normal home address for ranked booth play. The optional harbor comparison runs the same practice track with both speed displays hidden and excludes those attempts from rankings.

Controls: press and hold Space at the gold entry line, keep holding through the corner, release at the cyan exit line. The circular on-screen button offers the same hold/release interaction for a mouse or touch input. Mistakes slow the flight and never eliminate the player. Restart is available at any time. Focus loss or a suspended tab ends that attempt; choose a fresh flight to rank.

Audio is enabled on the first flight after a user gesture. Use Sound to mute it. The score is included in the local build. Low effects removes scenery, lowers resolution and removes boost camera widening; reduced-motion preference enables it by default. Reduced effects does not change race simulation.

## Offline package

On a development machine with the pinned Node version:

```sh
npm ci
npm run build
npm run serve:offline
```

Visit http://127.0.0.1:4173. `dist/` contains all browser assets; `scripts/serve.mjs` uses only Node built-ins. To prepare another booth computer, copy `dist/` and `scripts/serve.mjs`, install Node 24, and run `node scripts/serve.mjs` from their parent folder. The runtime server needs neither npm packages nor an internet connection. Do not double-click index.html; module loading needs HTTP. The public website is not a service-worker-installed offline app.

## Records and troubleshooting

Rankings are local to the browser, origin and course version. They are suitable for informal same-device challenges, not a trusted online competition. Development, offline and public origins have separate records. Switching browsers/private sessions or clearing browser storage changes the visible rankings. If storage is blocked, the game still finishes and explains that saving failed.

Keep the tab active. If graphics fail, enable hardware acceleration or try another current browser, then reload. If the device struggles, enable Low effects first. Sound failure must not stop the game. A page reload clears the current run, while saved local records remain.

Before an event, rehearse on the actual display, browser, keyboard and network/offline setup. A developer-machine check is not proof that all booth hardware is supported. Run a prolonged rehearsal before relying on it for unattended operation.
