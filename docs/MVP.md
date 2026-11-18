# MVP delivery plan

## 1. Prove the handling

Implement a deterministic simulation separated from Three.js rendering: input timestamps, vehicle state, track progress, drift energy, wall contact and boost. Fixed simulation steps should give comparable results across render rates. Use a monotonic clock and avoid artificial score-only penalties.

Prototype one straight, one bend, one exit straight. Map Space down to drift entry, held to continuous drift, up to boost exit. Key-repeat must not restart a drift. Establish ideal entry and exit windows in configuration, then tune by playtesting, not assumed constants.

Acceptance: well-timed inputs visibly beat early/late inputs; late release visibly delays acceleration; mistakes still finish. Missing input must not trap the vehicle.

## 2. Complete a time trial

One fixed track, countdown, finish timer, immediate replay, local leaderboard. Target 45–75 seconds. Prevent double-starts and reset all state on replay. Pause or safely cancel on focus loss so a lost key-up cannot stick drift. No network dependency during a race.

## 3. Polish for a booth

Hovercraft, clouds, track readability, clear boost feedback, scalable graphics quality, sound mute, reduced visual effects option and large readable results. Use original placeholder assets until provenance is documented. Provide a short attract loop and one-screen instruction.

## Test matrix

- Ideal / early / late entry and release; release outside a bend; never press; never release.
- Held key auto-repeat, repeated restart, window blur, tab suspension, resize.
- Compare 30 / 60 / 120 fps render schedules against identical timestamped input replays.
- Wall contacts must cost time but never cause a soft lock.
- Repeated races reset timers, energy, input, rank and vehicle state.
- Offline test and prolonged booth soak test.

## Submission gate (verify current official rules before submitting)

Public source and open-source license; accessible demo; concise public video; truthful JetBrains usage evidence; asset provenance; installation/play instructions. No submission or deployment is performed by repository setup.
