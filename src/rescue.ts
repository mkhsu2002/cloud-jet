export interface RescueWindow {
  from: number;
  to: number;
  ships: 1 | 2;
  charge: number;
  bonus?: "heavy" | "escort" | "alignment";
}
export const RELAYS: readonly (readonly RescueWindow[])[] = [
  [{ from: 304, to: 347, ships: 1, charge: 0.65 }],
  [
    { from: 728, to: 758, ships: 1, charge: 0.62 },
    { from: 781, to: 803, ships: 2, charge: 0.9 },
  ],
  [{ from: 1205, to: 1248, ships: 2, charge: 0.63, bonus: "heavy" }],
  [{ from: 1646, to: 1692, ships: 2, charge: 0.66, bonus: "escort" }],
  [{ from: 2122, to: 2252, ships: 2, charge: 0.64, bonus: "alignment" }],
];

export type RescueOutcome = 0 | 1 | 2 | null;
export interface Approach {
  escorted: number;
  entryQuality: number;
  slip: number;
  lateral: number;
}
const solo: Approach = {
  escorted: 0,
  entryQuality: 0,
  slip: 1,
  lateral: Infinity,
};

export function rescuedTotal(relays: readonly RescueOutcome[]) {
  return relays.reduce<number>((count, outcome) => count + (outcome ?? 0), 0);
}

function eligibleBonus(
  window: RescueWindow,
  charge: number,
  approach: Approach,
) {
  switch (window.bonus) {
    case "heavy":
      return charge >= 0.94;
    case "escort":
      return approach.escorted >= 3 && approach.entryQuality >= 0.78;
    case "alignment":
      return (
        Math.abs(approach.slip) <= 0.24 && Math.abs(approach.lateral) <= 1.55
      );
    default:
      return true;
  }
}

export function resolveRelay(
  relay: number,
  distance: number,
  charge: number,
  approach = solo,
): Exclude<RescueOutcome, null> {
  const match = RELAYS[relay]?.find(
    (window) =>
      distance >= window.from &&
      distance <= window.to &&
      charge >= window.charge,
  );
  if (!match) return 0;
  return eligibleBonus(match, charge, approach) ? match.ships : 1;
}

export function rescueCue(
  relay: number,
  distance: number,
  charge: number,
  approach = solo,
) {
  const windows = RELAYS[relay];
  if (!windows) return "FLY IT HOME";
  const next = windows.find((window) => distance <= window.to);
  if (!next) return "WINDOW CLOSED";
  if (distance < next.from) {
    if (next.bonus === "heavy" && charge < 0.94)
      return "BUILD FULL CHARGE FOR THE HAULER";
    return next === windows[1] ? "HOLD FOR TWO SHIPS" : "CHARGE THE RELAY";
  }
  if (charge < next.charge) return "KEEP CHARGING";
  if (next === windows[0] && windows.length === 2)
    return "RELEASE FOR ONE · OR HOLD FOR TWO";
  if (next.bonus && !eligibleBonus(next, charge, approach)) {
    if (next.bonus === "heavy") return "RELEASE FOR ONE · CHARGE MORE FOR TWO";
    if (next.bonus === "alignment") return "RELEASE FOR ONE · HOLD UNTIL LEVEL";
    return "RELEASE FOR ONE · ESCORT UNAVAILABLE";
  }
  return next.ships === 2 ? "RELEASE FOR TWO NOW ↑" : "RELEASE FOR ONE NOW ↑";
}
