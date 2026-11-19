export class AudioEngine {
  private ctx?: AudioContext;
  private motor?: OscillatorNode;
  private filter?: BiquadFilterNode;
  private motorLevel?: GainNode;
  private windLevel?: GainNode;
  private effects?: GainNode;
  private musicGain?: GainNode;
  private music = new Audio("/audio/last-light.ogg");
  enabled = false;

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
    this.musicGain!.gain.setTargetAtTime(active ? 0.58 : 0.43, t, 0.23);
  }

  chime(kind: "boost" | "contact" | "arrival") {
    if (!this.ctx || !this.effects || !this.enabled) return;
    const ctx = this.ctx,
      t = ctx.currentTime;
    const notes =
      kind === "arrival"
        ? [261.63, 329.63, 392, 523.25]
        : kind === "boost"
          ? [154, 308]
          : [94];
    notes.forEach((hz, i) => {
      const start = t + (kind === "arrival" ? i * 0.13 : 0);
      const voice = ctx.createOscillator(),
        gain = ctx.createGain();
      voice.type = kind === "contact" ? "triangle" : "sine";
      voice.frequency.setValueAtTime(hz, start);
      const duration = kind === "arrival" ? 0.88 : 0.31;
      if (kind !== "arrival")
        voice.frequency.exponentialRampToValueAtTime(
          hz * (kind === "boost" ? 2.2 : 0.44),
          start + duration,
        );
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.13, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      voice.connect(gain).connect(this.effects!);
      voice.start(start);
      voice.stop(start + duration + 0.02);
    });
  }
}
