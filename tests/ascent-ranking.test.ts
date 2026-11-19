import { expect, it } from "vitest";
import { readRecords, saveRecord } from "../src/records";

it("keeps ascent times separate from earlier convoy records", () => {
  const map = new Map<string, string>();
  const store = {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
  const base = { date: "2026-11-19", perfects: 0 };
  saveRecord(store, "last-light-v2", { ...base, time: 30 });
  saveRecord(store, "last-light-rescue-v1", { ...base, time: 37, ships: 8 });
  saveRecord(store, "last-light-rescue-v1", { ...base, time: 52, ships: 9 });
  saveRecord(store, "last-light-rescue-v1", { ...base, time: 50, ships: 9 });
  expect(
    readRecords(store, "last-light-rescue-v1").map((r) => [r.ships, r.time]),
  ).toEqual([
    [9, 50],
    [9, 52],
    [8, 37],
  ]);
  saveRecord(store, "cloud-jet-ascent-v1", { ...base, time: 44 });
  saveRecord(store, "cloud-jet-ascent-v1", { ...base, time: 42 });
  expect(readRecords(store, "cloud-jet-ascent-v1").map((r) => r.time)).toEqual([
    42, 44,
  ]);
  expect(readRecords(store, "last-light-v2").map((r) => r.time)).toEqual([30]);
});
