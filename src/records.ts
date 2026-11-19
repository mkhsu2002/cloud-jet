export interface RecordEntry {
  time: number;
  perfects: number;
  date: string;
}
export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
function valid(v: unknown): v is RecordEntry {
  if (!v || typeof v !== "object") return false;
  const r = v as RecordEntry;
  return (
    Number.isFinite(r.time) &&
    r.time > 0 &&
    Number.isInteger(r.perfects) &&
    r.perfects >= 0 &&
    typeof r.date === "string"
  );
}
export function readRecords(store: Store, track: string): RecordEntry[] {
  try {
    const v: unknown = JSON.parse(store.getItem("cloud-jet:" + track) ?? "[]");
    return Array.isArray(v)
      ? v
          .filter(valid)
          .sort((a, b) => a.time - b.time)
          .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
export function saveRecord(store: Store, track: string, entry: RecordEntry) {
  if (!valid(entry)) return false;
  try {
    const records = [...readRecords(store, track), entry]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);
    store.setItem("cloud-jet:" + track, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}
