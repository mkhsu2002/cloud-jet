import { expect, it } from "vitest";
import { approachCue, GATES, gateOutcome, releaseCue } from "../src/ascent";
import { COURSE, Simulation } from "../src/simulation";

it("allows a gate at its exact deadline and closes it after", () => {
  expect(gateOutcome(10, 10, 420, 420)).toBe("cleared");
  expect(gateOutcome(10.001, 10, 420, 420)).toBe("missed");
  expect(gateOutcome(10, 10, 419, 420)).toBe("missed");
});

it("stops unassisted flight at the first closed gate and resets the clock on retry", () => {
  const sim = new Simulation(COURSE);
  sim.advanceTo(20);
  expect(sim.state).toMatchObject({
    failed: true,
    finished: true,
    gatesCleared: 0,
  });
  expect(sim.state.distance).toBeLessThan(GATES[0].distance);
  sim.reset();
  expect(sim.state).toMatchObject({
    failed: false,
    finished: false,
    gatesCleared: 0,
    deadline: GATES[0].seconds,
    time: 0,
  });
});

it.each([30, 60, 120])(
  "clears the ascent using the cues and 150 ms input delay at %i fps",
  (fps) => {
    const sim = new Simulation(COURSE);
    let flying = false;
    let queued = -1;
    const splits: number[] = [];
    for (let frame = 0; frame < 90 * fps && !sim.state.finished; frame++) {
      const time = frame / fps;
      sim.advanceTo(time);
      const { distance, speed, gatesCleared } = sim.state;
      if (gatesCleared > splits.length) {
        splits.push(sim.state.time);
        if (!sim.state.finished)
          expect(sim.state.deadline - sim.state.time).toBeCloseTo(
            GATES[gatesCleared].seconds,
            1,
          );
      }
      const corner = COURSE.corners[gatesCleared];
      if (!corner || time < queued) continue;
      if (
        !flying &&
        approachCue(distance, corner.start - 20, speed).startsWith("HOLD NOW")
      ) {
        queued = time + 0.15;
        flying = true;
        sim.input(queued, true);
      } else if (
        flying &&
        releaseCue(distance, corner.end - 10, speed).startsWith("RELEASE NOW")
      ) {
        queued = time + 0.15;
        flying = false;
        sim.input(queued, false);
      }
    }
    expect(sim.state, JSON.stringify(splits)).toMatchObject({
      failed: false,
      finished: true,
      gatesCleared: 5,
      boosts: 5,
    });
  },
);
