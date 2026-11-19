export class AudioEngine {
  private ctx: AudioContext | undefined;
  private engine: OscillatorNode | undefined;
  private gain: GainNode | undefined;
  enabled = false;
  async enable(on: boolean) {
    this.enabled = on;
    if (on) {
      this.ctx ??= new AudioContext();
      await this.ctx.resume();
      if (!this.engine) {
        this.engine = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.engine.type = "sawtooth";
        this.engine.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0;
        this.engine.start();
      }
    } else if (this.gain && this.ctx)
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
  }
  update(speed: number, drifting: boolean, boosting: boolean, active: boolean) {
    if (!this.enabled || !this.ctx || !this.engine || !this.gain) return;
    const t = this.ctx.currentTime;
    this.engine.frequency.setTargetAtTime(
      38 + speed * (boosting ? 2.6 : 1.8),
      t,
      0.15,
    );
    this.gain.gain.setTargetAtTime(
      active ? (drifting ? 0.018 : boosting ? 0.028 : 0.012) : 0,
      t,
      0.1,
    );
  }
  chime(boost: boolean) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator(),
      g = this.ctx.createGain(),
      t = this.ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(boost ? 420 : 660, t);
    osc.frequency.exponentialRampToValueAtTime(boost ? 1100 : 440, t + 0.3);
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}
