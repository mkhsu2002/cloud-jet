import { describe, it, expect } from "vitest";
import { Simulation, COURSE, PRACTICE, STEP } from "../src/simulation";

function drive(
  mode: "ideal" | "early" | "late" | "none" | "held",
  course = COURSE,
  fps = 60,
) {
  const sim = new Simulation(course);
  let pressed = false;
  for (let frame = 1; frame < fps * 180 && !sim.state.finished; frame++) {
    const s = sim.state;
    const corner = course.corners.find((c) => s.distance < c.end + 5);
    let down = false;
    if (mode === "held") down = true;
    if (corner && mode !== "none" && mode !== "held") {
      const shift = mode === "early" ? -65 : mode === "late" ? 65 : 0;
      down =
        s.distance >= corner.start - 20 + shift &&
        s.distance < corner.end - 10 + shift;
    }
    if (down !== pressed) sim.input(s.time, down);
    pressed = down;
    sim.advanceTo(frame / fps);
  }
  return sim.state;
}

describe("racing behavior", () => {
  it("completes the single-corner slice with no input", () => {
    const s = drive("none", PRACTICE);
    expect(s.finished).toBe(true);
    expect(s.distance).toBe(PRACTICE.length);
  });
  it("rewards entry and release timing with a faster actual finish", () => {
    const ideal = drive("ideal", PRACTICE);
    expect(ideal.time).toBeLessThan(drive("early", PRACTICE).time);
    expect(ideal.time).toBeLessThan(drive("late", PRACTICE).time);
    expect(ideal.time).toBeLessThan(drive("none", PRACTICE).time);
    expect(ideal.boosts).toBe(1);
  });
  it("closes the first gate when the drift key is never released", () => {
    const s = drive("held");
    expect(s.finished).toBe(true);
    expect(s.failed).toBe(true);
    expect(s.gatesCleared).toBe(0);
  });
  it("finishes the full course in the intended short-session range", () => {
    const s = drive("ideal");
    expect(s.finished).toBe(true);
    expect(s.failed).toBe(false);
    expect(s.gatesCleared).toBe(5);
    expect(s.time).toBeGreaterThan(40);
    expect(s.time).toBeLessThan(75);
  });
  it("reproduces identical outcomes at 30, 60 and 120 render fps", () => {
    const replay = (fps: number) => {
      const sim = new Simulation(COURSE);
      for (const [t, down] of [
        [3.8, true],
        [7.4, false],
        [14, true],
        [18.2, false],
        [27, true],
        [31, false],
      ] as const)
        sim.input(t, down);
      for (let frame = 1; frame <= fps * 100 && !sim.state.finished; frame++)
        sim.advanceTo(frame / fps);
      return sim.state;
    };
    expect(replay(30)).toEqual(replay(60));
    expect(replay(60)).toEqual(replay(120));
  });
  it("ignores repeated down events without replacing drift entry quality", () => {
    const a = new Simulation(PRACTICE),
      b = new Simulation(PRACTICE);
    a.input(3, true);
    b.input(3, true);
    b.input(3.1, true);
    b.input(3.2, true);
    a.input(7, false);
    b.input(7, false);
    a.advanceTo(8);
    b.advanceTo(8);
    expect(a.state).toEqual(b.state);
  });
  it("boosts immediately on release and consumes stored energy", () => {
    const sim = new Simulation(PRACTICE);
    while (sim.state.distance < PRACTICE.corners[0].start - 20)
      sim.advanceTo(sim.state.time + STEP * 2);
    sim.input(sim.state.time, true);
    while (sim.state.distance < PRACTICE.corners[0].end - 10)
      sim.advanceTo(sim.state.time + STEP * 2);
    sim.input(sim.state.time, false);
    sim.advanceTo(sim.state.time + STEP * 2);
    expect(sim.state.boostRemaining).toBeGreaterThan(0);
    expect(sim.state.energy).toBe(0);
    expect(sim.state.drifting).toBe(false);
  });
  it("resets every race property and queued input", () => {
    const sim = new Simulation(PRACTICE);
    sim.input(0, true);
    sim.input(20, false);
    sim.advanceTo(6);
    sim.reset();
    expect(sim.state).toEqual(new Simulation(PRACTICE).state);
    sim.advanceTo(25);
    const clean = new Simulation(PRACTICE);
    clean.advanceTo(25);
    expect(sim.state).toEqual(clean.state);
  });
});

it("finishes 100 deterministic stress replays without stuck or non-finite state", () => {
  let seed = 519;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let run = 0; run < 100; run++) {
    const sim = new Simulation(COURSE);
    let t = 0;
    for (let event = 0; event < 80; event++) {
      t += random() * 2;
      sim.input(t, event % 2 === 0);
    }
    sim.advanceTo(120);
    expect(sim.state.finished).toBe(true);
    expect(sim.state.failed || sim.state.distance === COURSE.length).toBe(true);
    expect(sim.state.time).toBeGreaterThan(8);
    expect(Number.isFinite(sim.state.speed)).toBe(true);
  }
});
