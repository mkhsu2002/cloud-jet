import { expect, it } from "vitest";
import { COURSE, PRACTICE, RESCUE, Simulation, STEP } from "../src/simulation";
import {
  approachCue,
  relayChecks,
  rescueCue,
  resolveRelay,
} from "../src/rescue";

function reach(sim: Simulation, distance: number) {
  for (let step = 0; sim.state.distance < distance && step < 12000; step++) {
    sim.advanceTo(sim.state.time + STEP * 2);
  }
  expect(sim.state.distance).toBeGreaterThanOrEqual(distance);
}

function fly(sim: Simulation, entry: number, release: number) {
  reach(sim, entry);
  sim.input(sim.state.time, true);
  reach(sim, release);
  sim.input(sim.state.time, false);
  sim.advanceTo(sim.state.time + STEP * 2);
}

it("scores either one ship or two ships on the same second turn", () => {
  const early = new Simulation(RESCUE);
  const late = new Simulation(RESCUE);
  fly(early, 160, 330);
  fly(late, 160, 330);
  fly(early, 600, 741);
  fly(late, 600, 790);
  expect(early.state.rescues).toEqual([1, 1]);
  expect(late.state.rescues).toEqual([1, 2]);
});

it("closes missed windows and still finishes the mission", () => {
  const sim = new Simulation(RESCUE);
  fly(sim, 160, 330);
  fly(sim, 600, 767);
  reach(sim, RESCUE.length);
  expect(sim.state.finished).toBe(true);
  expect(sim.state.rescues).toEqual([1, 0]);

  sim.reset();
  reach(sim, RESCUE.length);
  expect(sim.state.rescues).toEqual([0, 0]);
});

it("never counts the same relay twice and clears the score on replay", () => {
  const sim = new Simulation(RESCUE);
  fly(sim, 600, 741);
  fly(sim, 755, 790);
  expect(sim.state.rescues).toEqual([0, 1]);
  sim.reset();
  expect(sim.state.rescues).toEqual([null, null]);
  fly(sim, 600, 790);
  expect(sim.state.rescues).toEqual([0, 2]);
});

it("uses inclusive window boundaries and requires enough energy", () => {
  expect(resolveRelay(1, 728, 0.62)).toBe(1);
  expect(resolveRelay(1, 781, 0.9)).toBe(2);
  expect(resolveRelay(1, 803, 0.9)).toBe(2);
  expect(resolveRelay(1, 790, 0.89)).toBe(0);
  expect(resolveRelay(1, 803.01, 1)).toBe(0);
  expect(new Simulation(PRACTICE).state.rescues).toEqual([]);
});

it("uses distinct checks for cargo charge, escort and approach alignment", () => {
  const clean = { escorted: 3, entryQuality: 0.9, slip: 0.1, lateral: 1 };
  expect(resolveRelay(2, 1220, 0.85, clean)).toBe(1);
  expect(resolveRelay(2, 1220, 1, clean)).toBe(2);
  expect(resolveRelay(3, 1670, 1, { ...clean, escorted: 2 })).toBe(1);
  expect(resolveRelay(3, 1670, 1, { ...clean, entryQuality: 0.6 })).toBe(1);
  expect(resolveRelay(3, 1670, 1, clean)).toBe(2);
  expect(resolveRelay(4, 2175, 1, { ...clean, slip: 0.32 })).toBe(1);
  expect(resolveRelay(4, 2175, 1, { ...clean, lateral: 2 })).toBe(1);
  expect(resolveRelay(4, 2175, 0.7, clean)).toBe(2);
});

it("guides all nine ships on a five-turn mission and clears every outcome on replay", () => {
  const sim = new Simulation(COURSE);
  for (const [entry, release] of [
    [160, 330],
    [600, 790],
    [1040, 1220],
    [1480, 1670],
    [1920, 2235],
  ])
    fly(sim, entry, release);
  reach(sim, COURSE.length);
  expect(sim.state.finished).toBe(true);
  expect(sim.state.rescues).toEqual([1, 2, 2, 2, 2]);
  sim.reset();
  expect(sim.state.rescues).toEqual([null, null, null, null, null]);
});

it("can release for one before the aircraft recenters at the lighthouse", () => {
  const sim = new Simulation(COURSE);
  fly(sim, 1920, 2191);
  reach(sim, COURSE.length);
  expect(sim.state.rescues).toEqual([0, 0, 0, 0, 1]);
});

it.each([30, 60, 120])(
  "guides a cue-following first rescue at %i fps",
  (fps) => {
    const sim = new Simulation(COURSE);
    const entry = COURSE.corners[0].start - 20;
    let actionTime = 0;
    let pressed = false;
    let released = false;
    let prepared = false;

    for (let frame = 0; frame < 12 * fps && !released; frame++) {
      const now = frame / fps;
      sim.advanceTo(now);
      const { distance, speed, energy } = sim.state;

      if (!pressed) {
        const cue = approachCue(distance, entry, speed);
        if (cue === "GET READY") prepared = true;
        if (cue.startsWith("HOLD NOW")) {
          sim.input(now + 0.15, true);
          actionTime = now + 0.15;
          pressed = true;
        }
      } else if (
        now >= actionTime &&
        rescueCue(0, distance, energy).startsWith("RELEASE")
      ) {
        sim.input(now + 0.15, false);
        sim.advanceTo(now + 0.2);
        released = true;
      }
    }
    expect(prepared).toBe(true);
    expect(sim.state.rescues[0]).toBe(1);
  },
);

it("keeps visible bonus checks synchronized with the rescue decisions", () => {
  const centered = { escorted: 3, entryQuality: 0.9, slip: 0.04, lateral: 1 };
  expect(relayChecks(2, 0.93, centered).map(({ met }) => met)).toEqual([false]);
  expect(relayChecks(2, 0.94, centered).map(({ met }) => met)).toEqual([true]);
  expect(
    relayChecks(3, 1, { ...centered, entryQuality: 0.6 }).map(({ met }) => met),
  ).toEqual([true, false]);
  const offset = { ...centered, lateral: 2 };
  expect(relayChecks(4, 1, offset).map(({ met }) => met)).toEqual([
    true,
    false,
  ]);
  expect(rescueCue(4, 2230, 1, offset)).toContain("HOLD TO CENTER");
  expect(rescueCue(4, 2230, 1, centered)).toContain("RELEASE FOR TWO NOW");
});
