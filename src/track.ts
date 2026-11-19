import { GATES } from "./ascent";
import type { Track } from "./simulation";

export function curvature(track: Track, distance: number) {
  const bend = track.corners.find(
    ({ start, end }) => distance > start && distance < end,
  );
  if (!bend) return 0;
  const length = bend.end - bend.start;
  return (
    (bend.direction *
      1.28 *
      (1 - Math.cos((2 * Math.PI * (distance - bend.start)) / length))) /
    length
  );
}

interface Pose {
  x: number;
  y: number;
  z: number;
  heading: number;
}
const routes = new WeakMap<Track, Pose[]>();
const origin = -90;
function altitude(distance: number) {
  const gate = GATES.findIndex(({ distance: end }) => distance <= end);
  if (gate < 0) return GATES[GATES.length - 1].altitude;
  const before = GATES[gate - 1];
  const after = GATES[gate];
  const t = Math.max(
    0,
    (distance - (before?.distance ?? 0)) /
      (after.distance - (before?.distance ?? 0)),
  );
  return (
    (before?.altitude ?? 0) +
    (after.altitude - (before?.altitude ?? 0)) * t * t * (3 - 2 * t)
  );
}

export function sampleTrack(track: Track, distance: number): Pose {
  let route = routes.get(track);
  if (!route) {
    route = [{ x: 0, y: 10, z: -origin, heading: 0 }];
    for (let d = origin; d < track.length + 180; d++) {
      const previous = route[route.length - 1];
      const turn = curvature(track, d + 0.5);
      const heading = previous.heading + turn * 0.5;
      route.push({
        x: previous.x + Math.sin(heading),
        z: previous.z - Math.cos(heading),
        y: track.ascent
          ? 10 + altitude(d + 1)
          : 10 + 5 * Math.sin((d + 1) * 0.009) + 0.006 * Math.max(0, d),
        heading: previous.heading + turn,
      });
    }
    routes.set(track, route);
  }
  const index = Math.max(0, Math.min(route.length - 2, distance - origin));
  const a = route[Math.floor(index)],
    b = route[Math.floor(index) + 1],
    f = index % 1;
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: a.z + (b.z - a.z) * f,
    heading: a.heading + (b.heading - a.heading) * f,
  };
}
