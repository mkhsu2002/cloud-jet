export class AudioEngine {
  private ctx?: AudioContext;
  private motor?: OscillatorNode;
  private filter?: BiquadFilterNode;
  private motorLevel?: GainNode;
  private windLevel?: GainNode;
  private effects?: GainNode;
  private musicGain?: GainNode;
  private music = new Audio("/audio/ascent.ogg");
  enabled = false;
  private cueUntil = 0;

  constructor() {
    this.music.loop = true;
    this.music.preload = "none";
  }

  async enable(on: boolean) {
    this.enabled = on;
    if (!on) {
      this.music.pause();
      if (this.effects && this.ctx)
        this.effects.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      return;
    }
    this.ctx ??= new AudioContext();
    const ctx = this.ctx;
    if (!this.motor) {
      this.effects = ctx.createGain();
      this.effects.gain.value = 0.62;
      const limiter = ctx.createDynamicsCompressor();
      this.effects.connect(limiter).connect(ctx.destination);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.59;
      ctx
        .createMediaElementSource(this.music)
        .connect(this.musicGain)
        .connect(limiter);

      this.motor = ctx.createOscillator();
      this.motor.type = "triangle";
      this.filter = ctx.createBiquadFilter();
      this.filter.frequency.value = 185;
      this.motorLevel = ctx.createGain();
      this.motorLevel.gain.value = 0;
      this.motor
        .connect(this.filter)
        .connect(this.motorLevel)
        .connect(this.effects);
      this.motor.start();

      const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.random() * 2 - 1;
      const air = ctx.createBufferSource();
      air.buffer = noise;
      air.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 650;
      windFilter.Q.value = 0.45;
      this.windLevel = ctx.createGain();
      this.windLevel.gain.value = 0;
      air.connect(windFilter).connect(this.windLevel).connect(this.effects);
      air.start();
    }
    await ctx.resume();
    this.effects!.gain.setTargetAtTime(0.62, ctx.currentTime, 0.03);
    await this.music.play().catch(() => {});
  }

  update(speed: number, drift: boolean, boost: boolean, active: boolean) {
    if (!this.ctx || !this.motor || !this.enabled) return;
    const t = this.ctx.currentTime;
    this.motor.frequency.setTargetAtTime(39 + speed * 0.82, t, 0.08);
    this.filter!.frequency.setTargetAtTime(
      boost ? 390 : drift ? 250 : 156,
      t,
      0.1,
    );
    this.motorLevel!.gain.setTargetAtTime(active ? 0.04 : 0, t, 0.12);
    this.windLevel!.gain.setTargetAtTime(
      active ? (boost ? 0.22 : drift ? 0.14 : 0.067) : 0,
      t,
      0.1,
    );
    this.musicGain!.gain.setTargetAtTime(
      t < this.cueUntil ? 0.27 : active ? 0.58 : 0.43,
      t,
      0.23,
    );
  }

  ignition(strength: number) {
    if (!this.ctx || !this.effects || !this.enabled) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const voice = ctx.createOscillator();
    const level = ctx.createGain();
    const power = Math.max(0.12, Math.min(1, strength));
    voice.type = "triangle";
    voice.frequency.setValueAtTime(82, now);
    voice.frequency.exponentialRampToValueAtTime(116, now + 0.1);
    voice.frequency.exponentialRampToValueAtTime(56, now + 0.34);
    level.gain.setValueAtTime(0, now);
    level.gain.linearRampToValueAtTime(0.28 * power, now + 0.035);
    level.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    voice.connect(level).connect(this.effects);
    voice.start(now);
    voice.stop(now + 0.45);

    const turbine = ctx.createOscillator();
    const turbineLevel = ctx.createGain();
    turbine.type = "sawtooth";
    turbine.frequency.setValueAtTime(270, now);
    turbine.frequency.exponentialRampToValueAtTime(480, now + 0.16);
    turbine.frequency.exponentialRampToValueAtTime(185, now + 0.61);
    turbineLevel.gain.setValueAtTime(0.001, now);
    turbineLevel.gain.exponentialRampToValueAtTime(0.042 * power, now + 0.1);
    turbineLevel.gain.exponentialRampToValueAtTime(0.001, now + 0.64);
    turbine.connect(turbineLevel).connect(this.effects);
    turbine.start(now);
    turbine.stop(now + 0.67);
  }

  chime(kind: "boost" | "contact" | "arrival" | "gate" | "warning" | "fall") {
    if (!this.ctx || !this.effects || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const events = {
      arrival: [130.81, 196, 261.63, 329.63, 523.25, 659.25],
      gate: [392, 587.33, 783.99],
      warning: [340, 340, 452],
      fall: [164.81, 82.41, 55],
      boost: [154, 308],
      contact: [94],
    };
    const steps = events[kind];
    const duration = kind === "arrival" ? 1.26 : kind === "fall" ? 0.88 : 0.27;
    const interval =
      kind === "warning" ? 0.25 : kind === "arrival" ? 0.12 : 0.075;
    if (kind === "fall" || kind === "arrival") this.cueUntil = t + 2.5;
    steps.forEach((hz, i) => {
      const start = t + i * interval;
      const voice = ctx.createOscillator();
      const gain = ctx.createGain();
      voice.type = kind === "contact" || kind === "fall" ? "triangle" : "sine";
      voice.frequency.setValueAtTime(hz, start);
      if (kind === "fall" || kind === "contact")
        voice.frequency.exponentialRampToValueAtTime(
          hz * 0.43,
          start + duration,
        );
      if (kind === "boost")
        voice.frequency.exponentialRampToValueAtTime(
          hz * 2.2,
          start + duration,
        );
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(
        kind === "arrival" ? 0.1 : 0.18,
        start + 0.023,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      voice.connect(gain).connect(this.effects!);
      voice.start(start);
      voice.stop(start + duration + 0.02);
    });
  }
}
