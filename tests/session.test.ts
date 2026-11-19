import { it, expect } from "vitest";
import { Session } from "../src/session";
import { PRACTICE } from "../src/simulation";
import { readRecords, saveRecord } from "../src/records";
it("counts down before moving and ignores double starts", () => {
  const s = new Session();
  s.start(PRACTICE, 1000);
  s.start(PRACTICE, 2000);
  s.update(3999);
  expect(s.phase).toBe("countdown");
  expect(s.sim.state.distance).toBe(0);
  s.update(5000);
  expect(s.phase).toBe("racing");
  expect(s.sim.state.time).toBeCloseTo(1);
});
it("focus loss cancels competitive play and replay starts clean", () => {
  const s = new Session();
  s.start(PRACTICE, 0);
  s.update(5000);
  s.input(5000, true);
  s.interrupt();
  s.update(90000);
  expect(s.phase).toBe("paused");
  expect(s.sim.state.finished).toBe(false);
  s.start(PRACTICE, 90000);
  expect(s.phase).toBe("countdown");
  expect(s.sim.state.distance).toBe(0);
});
it("only becomes finished after completing the course", () => {
  const s = new Session();
  s.start(PRACTICE, 0);
  s.update(3000);
  for (let t = 3100; t < 60000 && s.phase !== "finished"; t += 100) s.update(t);
  expect(s.phase).toBe("finished");
  expect(s.sim.state.finished).toBe(true);
});
it("sorts local records, isolates courses and tolerates corrupt/blocked storage", () => {
  const m = new Map<string, string>();
  const store = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  };
  saveRecord(store, "a", { time: 55, perfects: 1, date: "2026-11-19" });
  saveRecord(store, "a", { time: 45, perfects: 3, date: "2026-11-19" });
  expect(readRecords(store, "a").map((r) => r.time)).toEqual([45, 55]);
  expect(readRecords(store, "b")).toEqual([]);
  m.set("cloud-jet:a", '[null,{"time":-1}]');
  expect(readRecords(store, "a")).toEqual([]);
  const bad = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  expect(readRecords(bad, "a")).toEqual([]);
  expect(saveRecord(bad, "a", { time: 50, perfects: 0, date: "today" })).toBe(
    false,
  );
});

it("returning to the hangar clears the previous flight before the attract scene", () => {
  const s = new Session();
  s.start(PRACTICE, 0);
  s.update(6000);
  s.input(6000, true);
  s.goHome();
  expect(s.phase).toBe("ready");
  expect(s.sim.state.time).toBe(0);
  expect(s.sim.state.drifting).toBe(false);
  expect(s.sim.state.boostRemaining).toBe(0);
});
