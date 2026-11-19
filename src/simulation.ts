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
  id: "practice-v1",
  name: "First Flight",
  length: 650,
  corners: [{ start: 180, end: 340, direction: 1, name: "THE ARC" }],
};
export const COURSE: Track = {
  id: "skyline-v1",
  name: "Skyline Circuit",
  length: 2450,
  corners: [
    { start: 180, end: 340, direction: 1, name: "FIRST LIGHT" },
    { start: 620, end: 800, direction: -1, name: "CLOUD BREAK" },
    { start: 1060, end: 1240, direction: 1, name: "THE HALO" },
    { start: 1500, end: 1680, direction: -1, name: "BLUE HOUR" },
    { start: 1940, end: 2140, direction: 1, name: "HOME STRETCH" },
  ],
};
export interface RaceState {
  time: number;
  distance: number;
  speed: number;
  lateral: number;
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
  private contactCooldown = 0;
  constructor(public track: Track) {}
  reset() {
    this.state = initial();
    this.ticks = 0;
    this.queue = [];
    this.sequence = 0;
    this.driftCorner = undefined;
    this.used.clear();
    this.contactCooldown = 0;
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
            1 - Math.abs(s.distance - (this.driftCorner.start - 20)) / 75,
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
          1 - Math.abs(s.distance - (c.end - 10)) / 95,
          0,
          1,
        );
        const power =
          s.energy * (0.25 + 0.75 * release) * (0.45 + 0.55 * s.entryQuality);
        s.boostRemaining = power * 4.5;
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
    const correct = s.drifting && corner === this.driftCorner;
    const quality = correct ? s.entryQuality : 0;
    const boosted = s.boostRemaining > 0;
    let targetSpeed = boosted ? 79 : 46;
    if (s.drifting) targetSpeed = corner ? 35 + quality * 10 : 30;
    else if (corner && !boosted) targetSpeed = 34;
    if (correct)
      s.energy = clamp(s.energy + STEP * (0.24 + 0.12 * quality), 0, 1);
    s.boostRemaining = Math.max(0, s.boostRemaining - STEP);
    const targetOffset = corner
      ? corner.direction * (correct ? -1.4 + (1 - quality) * 6.5 : 6.2)
      : 0;
    s.lateral += (targetOffset - s.lateral) * STEP * 2;
    this.contactCooldown = Math.max(0, this.contactCooldown - STEP);
    if (Math.abs(s.lateral) > 5 && this.contactCooldown === 0) {
      s.speed = Math.max(22, s.speed * 0.75);
      s.contacts++;
      this.contactCooldown = 0.85;
      this.message("WALL GRAZE");
    }
    s.speed += (targetSpeed - s.speed) * STEP * 1.8;
    s.distance = Math.min(this.track.length, s.distance + s.speed * STEP);
    if (s.distance >= this.track.length) {
      s.finished = true;
      s.drifting = false;
      s.energy = 0;
    }
  }
}
