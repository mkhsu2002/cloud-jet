import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Original 32-bar score. Four harmonic phrases share a returning courier theme.
const rate = 32000;
const beat = 60 / 136;
const frames = Math.round(128 * beat * rate);
const left = new Float32Array(frames);
const right = new Float32Array(frames);
const tau = 2 * Math.PI;
const notes = [
  [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 64],
  [48, 55, 60, 64, 67],
  [43, 50, 55, 59, 62],
];
let seed = 93;
function noise() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
}
function add(at, length, pan, voice) {
  const offset = Math.round(at * beat * rate);
  for (let i = 0; i < length * rate; i++) {
    const index = (offset + i) % frames;
    const v = voice(i / rate, i);
    left[index] += v * Math.sqrt(1 - pan);
    right[index] += v * Math.sqrt(pan);
  }
}
function tone(at, duration, midi, gain, pan, timbre) {
  const hz = 440 * 2 ** ((midi - 69) / 12);
  const pad = timbre === "pad";
  add(at, duration, pan, (t) => {
    const p = tau * hz * t;
    const envelope = Math.min(
      1,
      t / (pad ? 0.3 : 0.013),
      (duration - t) / (pad ? 0.48 : 0.12),
    );
    const wave = pad
      ? 0.6 * Math.sin(p) +
        0.25 * Math.sin(p * 1.003 + 0.8) +
        0.15 * Math.sin(2 * p)
      : Math.sin(p + 0.6 * Math.exp(-8 * t) * Math.sin(2 * p)) +
        0.22 * Math.sin(p * 2);
    return gain * Math.max(0, envelope) * wave * (pad ? 1 : Math.exp(-2.5 * t));
  });
}
const motif = [
  [0, 0],
  [0.75, 2],
  [1.5, 4],
  [2.5, 3],
  [3.25, 2],
];
for (let bar = 0; bar < 32; bar++) {
  const b = bar * 4,
    chord = notes[bar % 4];
  const drive = bar >= 4 && bar < 28;
  chord
    .slice(1)
    .forEach((n, i) =>
      tone(b, beat * 4.65, n, 0.034, i % 2 ? 0.73 : 0.25, "pad"),
    );
  for (let k = 0; k < 8; k++) {
    tone(
      b + k / 2,
      0.22,
      chord[0] - 12 + (k === 6 ? 12 : 0),
      drive ? 0.1 : 0.045,
      0.5,
      "bass",
    );
    tone(
      b + k / 2 + 0.04,
      0.34,
      chord[1 + (k % 4)] + 12,
      0.022,
      k % 2 ? 0.32 : 0.69,
      "pluck",
    );
    if (drive)
      add(
        b + k / 2,
        0.065,
        k % 2 ? 0.65 : 0.36,
        (t, i) => 0.038 * Math.exp(-62 * t) * (noise() - (i % 2 ? 0.2 : 0)),
      );
  }
  if (drive)
    for (let k = 0; k < 4; k++) {
      add(
        b + k,
        0.23,
        0.5,
        (t) =>
          0.24 *
          Math.exp(-19 * t) *
          Math.sin(tau * (49 * t + 2.6 * (1 - Math.exp(-35 * t)))),
      );
      if (k % 2)
        add(
          b + k,
          0.18,
          0.51,
          (t) =>
            0.079 *
            Math.exp(-24 * t) *
            (noise() + 0.35 * Math.sin(tau * 164 * t)),
        );
    }
  if (bar % 4 !== 3 || bar >= 24)
    for (const [offset, n] of motif) {
      tone(
        b + offset,
        0.58,
        chord[n] + (n === 0 ? 24 : 12),
        bar >= 16 ? 0.085 : 0.059,
        0.49,
        "lead",
      );
      tone(
        b + offset + 0.75,
        0.51,
        chord[n] + (n === 0 ? 24 : 12),
        0.021,
        0.78,
        "lead",
      );
    }
}
const wav = Buffer.alloc(44 + 4 * frames);
wav.write("RIFF");
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) {
  wav.writeInt16LE(Math.round(Math.tanh(left[i] * 1.35) * 32760), 44 + i * 4);
  wav.writeInt16LE(Math.round(Math.tanh(right[i] * 1.35) * 32760), 46 + i * 4);
}
const encoded = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "wav",
    "-i",
    "pipe:0",
    "-c:a",
    "libopus",
    "-b:a",
    "96k",
    "-f",
    "ogg",
    "pipe:1",
  ],
  { input: wav, maxBuffer: 4e6 },
);
if (encoded.status !== 0)
  throw Error(encoded.stderr?.toString() || "ffmpeg is required.");
writeFileSync("public/audio/last-light.ogg", encoded.stdout);
