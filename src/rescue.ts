export interface RescueWindow {
  from: number;
  to: number;
  ships: 1 | 2;
  charge: number;
}
export const RELAYS: readonly (readonly RescueWindow[])[] = [
  [{ from: 304, to: 347, ships: 1, charge: 0.65 }],
  [
    { from: 728, to: 758, ships: 1, charge: 0.62 },
    { from: 781, to: 803, ships: 2, charge: 0.9 },
  ],
];

export type RescueOutcome = 0 | 1 | 2 | null;

export function resolveRelay(
  relay: number,
  distance: number,
  charge: number,
): Exclude<RescueOutcome, null> {
  const match = RELAYS[relay]?.find(
    (window) =>
      distance >= window.from &&
      distance <= window.to &&
      charge >= window.charge,
  );
  return match?.ships ?? 0;
}

export function rescueCue(relay: number, distance: number, charge: number) {
  const windows = RELAYS[relay];
  if (!windows) return "FLY IT HOME";
  const next = windows.find((window) => distance <= window.to);
  if (!next) return "WINDOW CLOSED";
  if (distance < next.from)
    return next.ships === 2 ? "HOLD FOR TWO SHIPS" : "CHARGE THE RELAY";
  if (charge < next.charge) return "KEEP CHARGING";
  if (next === windows[0] && windows.length === 2)
    return "RELEASE FOR ONE · OR HOLD FOR TWO";
  return next.ships === 2 ? "RELEASE FOR TWO NOW ↑" : "RELEASE FOR ONE NOW ↑";
}
