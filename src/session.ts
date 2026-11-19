import { Simulation, COURSE, type Track } from "./simulation";
export type Phase = "ready" | "countdown" | "racing" | "paused" | "finished";
export class Session {
  phase: Phase = "ready";
  sim = new Simulation(COURSE);
  startAt = 0;
  start(track: Track, now: number) {
    if (this.phase === "countdown" || this.phase === "racing") return;
    this.sim = new Simulation(track);
    this.startAt = now + 3000;
    this.phase = "countdown";
  }
  update(now: number) {
    if (this.phase === "countdown" && now >= this.startAt)
      this.phase = "racing";
    if (this.phase === "racing") {
      this.sim.advanceTo((now - this.startAt) / 1000);
      if (this.sim.state.finished) this.phase = "finished";
    }
  }
  input(now: number, down: boolean) {
    if (this.phase === "racing")
      this.sim.input((now - this.startAt) / 1000, down);
  }
  goHome() {
    this.phase = "ready";
    this.sim = new Simulation(COURSE);
    this.startAt = 0;
  }
  interrupt() {
    if (this.phase === "racing" || this.phase === "countdown")
      this.phase = "paused";
  }
}
