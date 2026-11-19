const releaseAt = 1.03;
const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

export function collapsePose(seconds: number, startLateral: number) {
  const direction = startLateral < -0.25 ? -1 : 1;
  const slide = smooth((seconds - 0.32) / (releaseAt - 0.32));
  const fallTime = Math.max(0, seconds - releaseAt);
  const angle = (t: number) =>
    direction *
    (1.02 * smooth((t - 0.14) / 0.93) + 0.74 * smooth((t - releaseAt) / 0.7));
  return {
    deckRoll: angle(seconds),
    podRoll: angle(Math.min(releaseAt, seconds)),
    lateral: startLateral + (direction * 8.1 - startLateral) * slide,
    driftOut: direction * 9 * fallTime,
    drop: fallTime * 7 + fallTime * fallTime * 26,
  };
}
