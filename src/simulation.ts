import { curvature } from "./track";
export const STEP = 1 / 120;
export interface Corner {
  start: number;
  end: number;
  direction: number;
  name: string;
}
export interface Track {
  id: string;
  name: string;
  length: number;
  corners: Corner[];
}
export const PRACTICE: Track = {
  id: "harbor-v2",
  name: "Harbor Shakedown",
  length: 920,
  corners: [{ start: 180, end: 340, direction: 1, name: "HARBOR TURN" }],
};
export const COURSE: Track = {
  id: "last-light-v2",
  name: "Last Light",
  length: 2450,
  corners: [
    { start: 180, end: 340, direction: 1, name: "SILENT HARBOR" },
    { start: 620, end: 800, direction: -1, name: "STORM CHANNEL" },
    { start: 1060, end: 1240, direction: 1, name: "CLOUD BREAK" },
    { start: 1500, end: 1680, direction: -1, name: "BEACON APPROACH" },
    { start: 1940, end: 2140, direction: 1, name: "LAST LIGHT" },
  ],
};
export interface RaceState {
  time: number;
  distance: number;
  speed: number;
  lateral: number;
  lateralVelocity: number;
  slip: number;
  yawRate: number;
  thrust: number;
  finished: boolean;
  drifting: boolean;
  energy: number;
  boostRemaining: number;
  boosts: number;
  perfects: number;
  contacts: number;
  entryQuality: number;
  feedback: string;
  feedbackAt: number;
}
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
function initial(): RaceState {
  return {
    time: 0,
    distance: 0,
    speed: 32,
    lateral: 0,
    lateralVelocity: 0,
    slip: 0,
    yawRate: 0,
    thrust: 0,
    finished: false,
    drifting: false,
    energy: 0,
    boostRemaining: 0,
    boosts: 0,
    perfects: 0,
    contacts: 0,
    entryQuality: 0,
    feedback: "",
    feedbackAt: -10,
  };
}
export class Simulation {
  state = initial();
  private ticks = 0;
  private queue: { time: number; down: boolean; order: number }[] = [];
  private sequence = 0;
  private driftCorner: Corner | undefined;
  private used = new Set<Corner>();
  private touchingWall = false;
  constructor(public track: Track) {}
  reset() {
    this.state = initial();
    this.ticks = 0;
    this.queue = [];
    this.sequence = 0;
    this.driftCorner = undefined;
    this.used.clear();
    this.touchingWall = false;
  }
  input(time: number, down: boolean) {
    if (!Number.isFinite(time) || this.state.finished) return;
    this.queue.push({
      time: Math.max(time, this.state.time),
      down,
      order: this.sequence++,
    });
    this.queue.sort((a, b) => a.time - b.time || a.order - b.order);
  }
  private message(text: string) {
    this.state.feedback = text;
    this.state.feedbackAt = this.state.time;
  }
  private apply(down: boolean) {
    const s = this.state;
    if (down === s.drifting) return;
    s.drifting = down;
    if (down) {
      this.driftCorner = this.track.corners.find(
        (c) => s.distance < c.end + 35 && s.distance >= c.start - 110,
      );
      s.entryQuality = this.driftCorner
        ? clamp(
            1 -
              Math.abs(s.distance - (this.driftCorner.start - 20)) /
                Math.max(18, s.speed * 1.05),
            0,
            1,
          )
        : 0;
      s.energy = 0;
      this.message(
        s.entryQuality > 0.82
          ? "PERFECT ENTRY"
          : this.driftCorner
            ? s.distance < this.driftCorner.start - 20
              ? "EARLY ENTRY"
              : "LATE ENTRY"
            : "WAIT FOR THE CORNER",
      );
    } else {
      const c = this.driftCorner;
      if (c && !this.used.has(c) && s.energy > 0.06) {
        const release = clamp(
          1 - Math.abs(s.distance - (c.end - 10)) / Math.max(20, s.speed * 1.0),
          0,
          1,
        );
        const power =
          s.energy * (0.25 + 0.75 * release) * (0.45 + 0.55 * s.entryQuality);
        s.boostRemaining = power * 3.1;
        s.thrust = power;
        s.speed += 14 * power;
        s.boosts++;
        this.used.add(c);
        if (release > 0.82 && s.entryQuality > 0.82) s.perfects++;
        this.message(
          release > 0.82
            ? "PERFECT BOOST"
            : s.distance < c.end - 10
              ? "EARLY BOOST"
              : "LATE BOOST",
        );
      } else this.message("KEEP YOUR MOMENTUM");
      s.energy = 0;
      this.driftCorner = undefined;
    }
  }
  advanceTo(time: number) {
    if (!Number.isFinite(time)) return;
    const target = Math.floor((time + 1e-9) / STEP);
    while (this.ticks < target && !this.state.finished) {
      const next = (this.ticks + 1) * STEP;
      while (this.queue.length && this.queue[0].time <= next + 1e-9)
        this.apply(this.queue.shift()!.down);
      this.step();
      this.ticks++;
      this.state.time = this.ticks * STEP;
    }
  }
  private step() {
    const s = this.state;
    const corner = this.track.corners.find(
      (c) => s.distance >= c.start && s.distance < c.end,
    );
    const active =
      s.drifting &&
      this.driftCorner !== undefined &&
      s.distance < this.driftCorner.end + 17;
    const quality = s.entryQuality;
    const driftDirection = active ? this.driftCorner!.direction : 0;
    const bend = curvature(this.track, s.distance);
    const desiredSlip = driftDirection * (0.32 + 0.19 * quality);
    s.yawRate += ((desiredSlip - s.slip) * 22 - s.yawRate * 8) * STEP;
    s.slip += s.yawRate * STEP;
    if (active && corner === this.driftCorner) {
      s.energy = clamp(s.energy + STEP * (0.26 + 0.13 * quality), 0, 1);
    }
    const centrifugal = -bend * s.speed * s.speed;
    const driftForce = Math.sin(s.slip) * (17 + 26 * quality);
    const guidance = (active ? 3.8 : 5.3) * s.lateral;
    const damping = active ? 2.9 : 5;
    s.lateralVelocity +=
      (centrifugal + driftForce - guidance - damping * s.lateralVelocity) *
      STEP;
    s.lateral += s.lateralVelocity * STEP;
    if (Math.abs(s.lateral) >= 5.6) {
      s.lateral = Math.sign(s.lateral) * 5.6;
      s.lateralVelocity =
        Math.sign(s.lateralVelocity) === Math.sign(s.lateral)
          ? 0
          : s.lateralVelocity;
      if (!this.touchingWall) {
        s.contacts++;
        s.speed *= 0.83;
        this.message("RAIL CONTACT");
      }
      this.touchingWall = true;
      s.speed -= 6 * STEP;
    } else if (Math.abs(s.lateral) < 5.4) {
      this.touchingWall = false;
    }
    s.boostRemaining = Math.max(0, s.boostRemaining - STEP);
    const curved = corner !== undefined;
    const target =
      s.boostRemaining > 0
        ? 52 + s.thrust * 25
        : curved
          ? active
            ? 35 + 9 * quality
            : 33
          : 47;
    s.speed = Math.max(
      20,
      s.speed + clamp((target - s.speed) * 2.1, -22, 34) * STEP,
    );
    s.distance = Math.min(this.track.length, s.distance + s.speed * STEP);
    if (s.distance >= this.track.length) {
      s.finished = true;
      s.drifting = false;
      s.energy = 0;
    }
  }
}
