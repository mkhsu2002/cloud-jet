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

const haulerCharge = 0.94;
const escortCount = 3;
const cleanEntry = 0.78;
const maxSlip = 0.24;
const maxOffset = 1.55;

export function relayChecks(relay: number, charge: number, approach: Approach) {
  switch (RELAYS[relay]?.[0].bonus) {
    case "heavy":
      return [{ label: "Hauler charge", met: charge >= haulerCharge }];
    case "escort":
      return [
        {
          label: `Escort ${Math.min(approach.escorted, escortCount)}/${escortCount}`,
          met: approach.escorted >= escortCount,
        },
        { label: "Clean entry", met: approach.entryQuality >= cleanEntry },
      ];
    case "alignment":
      return [
        { label: "Nose straight", met: Math.abs(approach.slip) <= maxSlip },
        {
          label: "On centerline",
          met: Math.abs(approach.lateral) <= maxOffset,
        },
      ];
    default:
      return [];
  }
}

export const relayBriefs = [
  "Hold through the bend. Let go when RELEASE lights up.",
  "Take one ship now, or hold for the pair.",
  "Fill the charge bar to bring the heavy hauler.",
  "Bring three ships and press on cue to escort the pair.",
  "Hold for the pair until the nose is straight and the ship is centered.",
];

export function approachCue(distance: number, entry: number, speed: number) {
  if (distance < entry - 45) return "FIND THE GOLD LINE";
  if (distance < entry - speed * 0.17) return "GET READY";
  if (distance <= entry + speed * 0.2) return "HOLD NOW ↓";
  return "HOLD TO SALVAGE THIS TURN ↓";
}

const pairFeedback = [
  "2 SHIPS RESCUED",
  "2 SHIPS RESCUED",
  "2 RESCUED · HAULER CHARGED",
  "2 RESCUED · ESCORT AND CLEAN ENTRY",
  "2 RESCUED · STRAIGHT AND CENTERED",
];
export function rescueFeedback(relay: number, outcome: RescueOutcome) {
  if (outcome === 2) return pairFeedback[relay];
  return outcome === 1 ? "1 SHIP RESCUED" : "RELAY MISSED";
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
  return relayChecks(relay, charge, approach).every(({ met }) => met)
    ? match.ships
    : 1;
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
    if (next.bonus === "heavy" && charge < haulerCharge)
      return "BUILD FULL CHARGE FOR THE HAULER";
    return next === windows[1] ? "HOLD FOR TWO SHIPS" : "CHARGE THE RELAY";
  }
  if (charge < next.charge) return "KEEP CHARGING";
  if (next === windows[0] && windows.length === 2)
    return "RELEASE FOR ONE · OR HOLD FOR TWO";
  if (
    next.bonus &&
    !relayChecks(relay, charge, approach).every(({ met }) => met)
  ) {
    if (next.bonus === "heavy") return "RELEASE FOR ONE · HOLD TO CHARGE";
    if (next.bonus === "alignment") return "RELEASE FOR ONE · HOLD TO CENTER";
    return "RELEASE FOR ONE NOW ↑";
  }
  return next.ships === 2 ? "RELEASE FOR TWO NOW ↑" : "RELEASE FOR ONE NOW ↑";
}
