import * as THREE from "three";
import { GATES } from "./ascent";
import { alloy, lamp, mesh, mothership, panel } from "./art";
import { sampleTrack } from "./track";
import type { Track } from "./simulation";

export function buildAscentScenery(track: Track) {
  const group = new THREE.Group();
  const ceramic = alloy(0xeed2ae);
  const midnight = alloy(0x785d52);
  const accent = GATES.map(({ color }) => lamp(color));
  const shutters: THREE.Group[][] = [];
  const put = (distance: number, side: number, lift: number) => {
    const point = sampleTrack(track, distance);
    const section = new THREE.Group();
    section.position.set(
      point.x + Math.cos(point.heading) * side,
      point.y + lift,
      point.z + Math.sin(point.heading) * side,
    );
    section.rotation.y = -point.heading;
    group.add(section);
    return section;
  };

  GATES.forEach((gate, index) => {
    const portal = put(gate.distance, 0, 0);
    const ring = mesh(
      portal,
      new THREE.TorusGeometry(13.3, 0.85, 8, 36),
      ceramic,
      0,
      8,
      0,
    );
    ring.scale.set(1.1, 0.79, 1);
    mesh(
      portal,
      new THREE.TorusGeometry(13.3, 0.28, 6, 36),
      accent[index],
      0,
      8,
      0.82,
    ).scale.copy(ring.scale);
    const leaves = [-1, 1].map((side) => {
      const plate = new THREE.Group();
      plate.position.x = side * 19;
      portal.add(plate);
      panel(plate, 8, 12, 0.9, 0, 6, 0, midnight);
      panel(plate, 0.4, 10, 0.2, -side * 3.25, 6, 0.6, accent[index]);
      return plate;
    });
    shutters.push(leaves);
    for (const side of [-1, 1]) {
      panel(portal, 1.8, 16, 2.3, side * 14, 6.4, 0, midnight);
      panel(portal, 0.38, 13, 0.18, side * 13.9, 6.8, 1.18, accent[index]);
    }
  });

  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const mirror = put(72 + i * 77, side * (29 + i * 9), -8);
      const wing = panel(mirror, 26, 1.2, 15, 0, 3, 0, ceramic);
      wing.rotation.z = side * 0.28;
      panel(mirror, 1.1, 18, 1.1, 0, -7, 0, midnight);
      panel(mirror, 14, 0.2, 0.5, 0, 4, 6.7, accent[0]);

      const spire = put(510 + i * 87, side * (31 + i * 7), -22);
      const cloudRock = mesh(
        spire,
        new THREE.DodecahedronGeometry(12, 0),
        alloy(0xd5b1a2),
        0,
        -5,
        0,
      );
      cloudRock.scale.set(0.85, 2.5 + i * 0.23, 1.1);
      mesh(
        spire,
        new THREE.TorusGeometry(12, 0.45, 8, 24),
        accent[1],
        0,
        8,
        0,
      ).rotation.x = Math.PI / 2;

      const prism = put(942 + i * 92, side * (25 + i * 6), 1);
      const crystal = mesh(
        prism,
        new THREE.OctahedronGeometry(9.3),
        i % 2 ? accent[2] : ceramic,
        0,
        4,
        0,
      );
      crystal.scale.y = 1.9 + i * 0.23;
      crystal.rotation.z = side * 0.26;
      mesh(
        prism,
        new THREE.OctahedronGeometry(4),
        accent[2],
        side * 13,
        -10,
        6,
      );

      const array = put(1385 + 98 * i, side * (36 + i * 8), 7);
      const ring = mesh(
        array,
        new THREE.TorusGeometry(16 + i * 3, 0.55, 8, 32),
        accent[3],
      );
      ring.rotation.set(0.25 * i, side * 0.47, 0);
      panel(array, 1.2, 29, 1.2, 0, 0, 0, ceramic);

      const gantry = put(1920 + 98 * i, side * (15 + i * 2), -4);
      panel(gantry, 1.8, 20 + i * 3, 1.8, 0, 10, 0, ceramic);
      const rail = panel(
        gantry,
        24,
        0.85,
        3,
        -side * 10,
        18 + i * 2,
        0,
        midnight,
      );
      rail.rotation.z = side * 0.11;
      panel(gantry, 1.4, 6, 1.1, 0, 15, 1, accent[4]);
    }
  }
  const dock = put(track.length + 28, 0, 0);
  mothership(dock);

  const moon = put(1890, -240, 224);
  mesh(moon, new THREE.SphereGeometry(73, 28, 16), alloy(0xd4cbf1));
  return { dock, shutters, group };
}
