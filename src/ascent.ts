// Each sector starts a fresh clock when the previous gate is crossed.
export const GATES = [
  {
    name: "SUNLIFT",
    distance: 420,
    seconds: 9.8,
    altitude: 40,
    color: 0xffd477,
  },
  {
    name: "CLOUD SPIRES",
    distance: 880,
    seconds: 9.9,
    altitude: 91,
    color: 0x77f1f4,
  },
  {
    name: "PRISM RIM",
    distance: 1340,
    seconds: 9.8,
    altitude: 156,
    color: 0xf5a8ff,
  },
  {
    name: "THIN BLUE",
    distance: 1800,
    seconds: 9.65,
    altitude: 223,
    color: 0x97b9ff,
  },
  {
    name: "MOTHERSHIP DOCK",
    distance: 2450,
    seconds: 13.45,
    altitude: 325,
    color: 0xfecc8a,
  },
] as const;

export function approachCue(distance: number, entry: number, speed: number) {
  if (distance < entry - 45) return "FIND THE GOLD LINE";
  if (distance < entry - speed * 0.17) return "GET READY";
  if (distance <= entry + speed * 0.2) return "HOLD NOW ↓";
  return "HOLD TO DRIFT ↓";
}

export function releaseCue(distance: number, exit: number, speed: number) {
  if (distance < exit - 44) return "HOLD TO CHARGE";
  if (distance < exit - speed * 0.16) return "GET READY TO RELEASE";
  return "RELEASE NOW ↑";
}

export function gateOutcome(
  time: number,
  deadline: number,
  distance: number,
  gate: number,
) {
  if (distance >= gate && time <= deadline + 1e-8) return "cleared";
  return time >= deadline - 1e-8 ? "missed" : "open";
}
