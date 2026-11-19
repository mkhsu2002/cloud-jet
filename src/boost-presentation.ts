/** Camera response to a simulation-confirmed release, measured in race seconds. */
export function boostShot(
  age: number,
  strength: number,
  reducedMotion: boolean,
) {
  const power = Math.max(0, Math.min(1, strength));
  if (age < 0 || age >= 1 || reducedMotion || power === 0)
    return { lag: 0, pitch: 0, kick: 0 };

  // The craft gets a head start. The camera then closes the gap as thrust settles.
  const impulse = (1 - Math.exp(-age / 0.045)) * Math.exp(-age / 0.22);
  return {
    lag: 4.8 * impulse * power,
    pitch: 0.06 * impulse * power,
    kick: impulse * power,
  };
}
