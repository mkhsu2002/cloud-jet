# Booth operation

Updated: 2026-11-19. Applies to the browser implementation introduced in this sprint.

## Start

Open the hosted game or the local build on a modern browser with WebGL 2 and hardware acceleration. The main mission has five timed gates. Wait for **HOLD NOW**, hold through the bend, then release on **RELEASE NOW**. Use Space or the circular on-screen button. A crossed gate starts the next clock. A closed gate ends the flight. The harbor practice run is untimed.

At results, **Next pilot · flight briefing** (or Space) returns to the ready screen and focuses **Launch mission**. The previous record stays on the device. **Fly again** restarts immediately for the same pilot. Only successful dockings enter the Ascent board, sorted by elapsed time.

Use Sound to mute music and cues. Low effects reduces scenery and camera effects. Focus loss interrupts the run. A brief descent or docking sequence leads to results automatically and can also be advanced.

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
