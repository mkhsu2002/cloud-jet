import { expect, it } from "vitest";
import { boostShot } from "../src/boost-presentation";
import { PRACTICE, Simulation, STEP } from "../src/simulation";

it("triggers a brief chase lag only after a successful simulated release", () => {
  const sim = new Simulation(PRACTICE);
  for (let t = STEP; sim.state.distance < 160; t += STEP) sim.advanceTo(t);
  sim.input(sim.state.time, true);
  sim.advanceTo(sim.state.time + STEP);
  expect(sim.state.boosts).toBe(0);
  while (sim.state.distance < 330) sim.advanceTo(sim.state.time + STEP * 2);
  sim.input(sim.state.time, false);
  sim.advanceTo(sim.state.time + STEP * 2);
  expect(sim.state.boosts).toBe(1);
  const power = sim.state.thrust;
  expect(boostShot(-0.01, power, false).lag).toBe(0);
  expect(boostShot(0.12, power, false).lag).toBeGreaterThan(1.5);
  expect(boostShot(0.55, power, false).lag).toBeLessThan(0.5);
  expect(boostShot(1, power, false).lag).toBe(0);
  expect(boostShot(0.12, power, true).lag).toBe(0);
});
