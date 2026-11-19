import { expect, it } from "vitest";
import { PRACTICE, RESCUE, Simulation, STEP } from "../src/simulation";
import { resolveRelay } from "../src/rescue";

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
