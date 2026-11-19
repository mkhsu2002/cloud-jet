import * as THREE from "three";

export function alloy(color: number, roughness = 0.47) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.36 });
}
export function lamp(color: number) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false });
}
const ceramic = alloy(0xf4e6ce, 0.33);
const midnight = alloy(0x18222d);
const ochre = alloy(0xb07637, 0.38);
const steel = alloy(0x506377);
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x153a51,
  metalness: 0.48,
  roughness: 0.14,
  clearcoat: 1,
  emissive: 0x155b79,
  emissiveIntensity: 0.6,
});
const ice = lamp(0x81eaff);
const warm = lamp(0xffb767);
const red = lamp(0xff5637);

export function mesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z);
  group.add(part);
  return part;
}
export function panel(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
) {
  return mesh(group, new THREE.BoxGeometry(w, h, d), material, x, y, z);
}
function ring(
  group: THREE.Group,
  r: number,
  t: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  return mesh(group, new THREE.TorusGeometry(r, t, 8, 24), mat, x, y, z);
}
function hullSection(
  group: THREE.Group,
  sections: number[][],
  mat: THREE.Material,
  segments = 12,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [z, width, height, y] of sections) {
    for (let i = 0; i < segments; i++) {
      const angle = ((i + 0.5) / segments) * Math.PI * 2;
      positions.push(Math.cos(angle) * width, y + Math.sin(angle) * height, z);
    }
  }
  for (let row = 0; row < sections.length - 1; row++) {
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i,
        b = row * segments + ((i + 1) % segments);
      indices.push(a, b, a + segments, b, b + segments, a + segments);
    }
  }
  for (const row of [0, sections.length - 1]) {
    const [z, , , y] = sections[row];
    const center = positions.length / 3;
    positions.push(0, y, z);
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i;
      const b = row * segments + ((i + 1) % segments);
      if (row === 0) indices.push(center, b, a);
      else indices.push(center, a, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(group, geo, mat);
}

export function courier(ship: THREE.Group) {
  const peach = alloy(0xe3917d, 0.33);
  const shell = alloy(0xc47b64, 0.43);
  const brass = alloy(0xb18750, 0.32);
  const trim = alloy(0x563a29, 0.55);
  const smoke = new THREE.MeshPhysicalMaterial({
    color: 0x46322c,
    roughness: 0.18,
    metalness: 0.28,
    clearcoat: 0.8,
  });
  const hull = [
    [-3.85, 0.05, 0.04, -0.02],
    [-3.5, 0.71, 0.33, -0.06],
    [-2.5, 1.28, 0.6, -0.05],
    [-1.4, 1.53, 0.77, 0],
    [-0.1, 1.62, 0.78, 0],
    [1.25, 1.47, 0.66, 0],
    [2.37, 1.09, 0.43, 0.06],
    [2.8, 0.1, 0.07, 0.07],
  ];
  hullSection(ship, hull, peach, 38);
  hullSection(
    ship,
    [
      [-2.8, 0.18, 0.08, -0.38],
      [-1.8, 0.9, 0.33, -0.36],
      [1, 0.98, 0.37, -0.4],
      [2.2, 0.58, 0.22, -0.33],
    ],
    brass,
    22,
  );
  mesh(
    ship,
    new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    smoke,
    0,
    0.57,
    -1.33,
  ).scale.set(1.3, 0.8, 2.03);
  const seal = ring(ship, 1, 0.041, brass, 0, 0.58, -1.33);
  seal.rotation.x = Math.PI / 2;
  seal.scale.set(1.31, 2.04, 1);
  for (const z of [-2.07, -0.91, 0.12]) {
    const canopyRib = mesh(
      ship,
      new THREE.TorusGeometry(1, 0.035, 8, 32, Math.PI),
      brass,
      0,
      0.605,
      z,
    );
    const radius = Math.sqrt(1 - ((z + 1.33) / 2.03) ** 2);
    canopyRib.scale.set(1.3 * radius, 0.79 * radius, 1);
  }
  const rivets = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.034, 7, 5),
    brass,
    4 * 22,
  );
  const pose = new THREE.Object3D();
  for (const [i, [z, width, height, y]] of hull.slice(2, 6).entries()) {
    ring(ship, 1, 0.014, trim, 0, y, z).scale.set(width, height, 0.65);
    for (let j = 0; j < 22; j++) {
      const a = (j * Math.PI) / 11;
      pose.position.set(
        (width + 0.01) * Math.cos(a),
        y + (height + 0.018) * Math.sin(a),
        z + 0.085,
      );
      pose.updateMatrix();
      rivets.setMatrixAt(i * 22 + j, pose.matrix);
    }
  }
  ship.add(rivets);
  for (const side of [-1, 1]) {
    const rear = new THREE.Group();
    rear.position.set(side * 1.48, 0.04, 0.64);
    ship.add(rear);
    hullSection(
      rear,
      [
        [-1.9, 0.08, 0.06, 0],
        [-1.25, 0.56, 0.42, 0],
        [-0.2, 0.65, 0.55, 0],
        [1.35, 0.57, 0.49, 0],
        [1.88, 0.45, 0.43, 0],
      ],
      shell,
      28,
    );
    ring(rear, 0.47, 0.086, brass, 0, 0, 1.87);
    ring(rear, 0.39, 0.047, warm, 0, 0, 1.94);
    mesh(rear, new THREE.CircleGeometry(0.39, 32), trim, 0, 0, 1.92);
    mesh(rear, new THREE.CircleGeometry(0.23, 24), warm, 0, 0, 1.95);
    for (let j = 0; j < 10; j++) {
      const a = (j * Math.PI) / 5;
      panel(
        rear,
        0.034,
        0.185,
        0.026,
        Math.cos(a) * 0.3,
        Math.sin(a) * 0.3,
        1.975,
        brass,
      ).rotation.z = a - Math.PI / 2;
    }
    for (const z of [-1.65, 0.94]) {
      mesh(
        ship,
        new THREE.SphereGeometry(0.18, 12, 8),
        warm,
        side * 0.7,
        -0.58,
        z,
      ).scale.set(1.1, 0.45, 1.45);
    }
  }
}

export function dock(group: THREE.Group, side: number, variant: number) {
  const h = 15 + (variant % 16),
    width = 12 + (variant % 6);
  panel(group, width, h, 22, 0, h * 0.5 - 8, 0, midnight);
  panel(group, width + 1, 1.1, 23, 0, -4.4, 0, steel);
  panel(group, width - 1, 1.6, 21, 0, h - 7.7, 0, steel);
  panel(group, width * 0.58, 4, 9, side * 0.6, h - 5, 3, midnight);
  const face = -side * (width / 2 + 0.05);
  for (let row = 0; row < 4; row++) {
    for (let bay = 0; bay < 6; bay++) {
      const z = (bay - 2.5) * 3.2;
      panel(
        group,
        0.1,
        0.53,
        2.06,
        face,
        h - 11 - row * 2.62,
        z,
        (row + bay + variant) % 6 === 0 ? warm : glass,
      );
    }
  }
  for (let bay = 0; bay < 4; bay++) {
    panel(
      group,
      0.52,
      h + 0.2,
      0.41,
      face,
      h * 0.5 - 8,
      (bay - 1.5) * 6.25,
      steel,
    );
  }
  panel(group, 2.8, 0.36, 8, face - side * 1.18, -1, 2, steel);
  for (let i = 0; i < 5; i++)
    panel(
      group,
      0.16,
      0.13,
      0.62,
      face - side * 2.53,
      -0.73,
      i * 1.56 - 1.4,
      warm,
    );
  panel(group, 0.24, 5, 0.24, side * 1.8, h - 2, 3, steel);
  panel(group, 0.3, 0.3, 0.3, side * 1.8, h + 0.55, 3, red);
}

export function stormPylon(group: THREE.Group, side: number) {
  const foot = panel(group, 2.7, 25, 3, 0, -10, 0, midnight);
  foot.rotation.z = side * 0.13;
  const arm = panel(group, 1.05, 12, 1.2, -side * 1.5, 3, 1.3, steel);
  arm.rotation.z = -side * 0.32;
  const signal = panel(group, 0.2, 5, 0.38, -side * 3.2, 7, 1.3, ice);
  signal.rotation.z = -side * 0.32;
  panel(group, 1.3, 0.4, 2.7, 0, 2, 0, ochre);
}

export function mothership(group: THREE.Group) {
  const pearl = alloy(0xe4b096, 0.31);
  const dusk = alloy(0x503c38);
  const gold = alloy(0xa9824d);
  const blue = lamp(0xffdeb1);
  const amber = lamp(0xffd08b);
  hullSection(
    group,
    [
      [-650, 23, 20, 104],
      [-510, 151, 50, 120],
      [-420, 240, 56, 109],
      [-305, 202, 66, 104],
      [-180, 151, 62, 92],
      [-60, 89, 40, 62],
      [8, 46, 19, 40],
      [35, 12, 7, 35],
    ],
    pearl,
    12,
  );
  hullSection(
    group,
    [
      [-580, 29, 14, 63],
      [-365, 167, 30, 71],
      [-260, 149, 39, 63],
      [-97, 74, 35, 48],
      [-17, 31, 14, 26],
      [7, 18, 6, 25],
    ],
    dusk,
    10,
  );
  for (const sign of [-1, 1]) {
    const pod = new THREE.Group();
    pod.position.set(sign * 165, 95, -330);
    pod.rotation.y = sign * 0.19;
    hullSection(
      pod,
      [
        [-260, 8, 9, 0],
        [-168, 34, 22, 0],
        [-92, 44, 25, 0],
        [65, 26, 16, 0],
        [111, 11, 10, 0],
      ],
      dusk,
    );
    for (const z of [-143, -105, -65, -26, 13]) {
      const band = ring(pod, 25, 1.1, blue, 0, 0, z);
      band.scale.set(1.26, 0.72, 1);
    }
    group.add(pod);
    for (let i = 0; i < 13; i++) {
      const spread = 47 + i * 9;
      panel(group, 7, 0.7, 3, sign * spread, 32 + i * 2.8, -53 - i * 17, blue);
      const blade = panel(
        group,
        49 - i * 1.3,
        1.6,
        8,
        sign * (54 + i * 8),
        51 + i * 2.8,
        -66 - i * 18,
        gold,
      );
      blade.rotation.y = sign * 0.33;
    }
  }
  const bridge = new THREE.Group();
  bridge.position.set(0, 148, -288);
  hullSection(
    bridge,
    [
      [-126, 16, 6, 26],
      [-72, 58, 21, 22],
      [22, 52, 20, 12],
      [83, 20, 8, -1],
    ],
    dusk,
  );
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      panel(
        bridge,
        4,
        0.9,
        2,
        side * (17 + (i % 3) * 7),
        24,
        55 - i * 11,
        amber,
      );
      const hullRib = panel(
        group,
        24,
        16,
        145 - i * 5,
        side * (177 - i * 10),
        111 - i * 4,
        -401 + i * 23,
        i % 2 ? pearl : gold,
      );
      hullRib.rotation.y = side * (0.25 + i * 0.021);
    }
    for (let i = 0; i < 4; i++) {
      panel(
        group,
        7,
        2.2,
        70,
        side * (36 + i * 10),
        49 + i * 7,
        -100 - i * 25,
        blue,
      );
    }
  }
  group.add(bridge);
  const throat = panel(group, 38, 1.2, 62, 0, 0, -24, dusk);
  throat.position.y = -0.7;
  for (let i = 0; i < 6; i++) {
    const z = -9 * i;
    ring(group, 13 + i * 1.4, 0.7, i % 2 ? blue : amber, 0, 10, z).scale.set(
      1.28,
      0.72,
      1,
    );
    for (const side of [-1, 1])
      panel(group, 0.35, 0.12, 6, side * 7.1, 0.1, z, amber);
  }
}

export function deckTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#55616a";
  ctx.fillRect(0, 0, 512, 512);
  let seed = 173;
  for (let i = 0; i < 31000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = seed % 512,
      y = (seed >>> 10) % 512;
    ctx.fillStyle = i % 2 ? "#9bbcc018" : "#0a14252a";
    ctx.fillRect(x, y, 1 + (i % 4), 1 + (i % 5));
  }
  for (const x of [0, 512]) {
    ctx.fillStyle = "#1b2732";
    ctx.fillRect(x - 40, 0, 80, 512);
    ctx.fillStyle = "#c38757";
    ctx.fillRect(x + (x ? -37 : 28), 0, 9, 512);
  }
  for (const y of [0, 256, 511]) {
    ctx.fillStyle = "#26323b";
    ctx.fillRect(0, y, 512, 4);
    ctx.fillStyle = "#9aa8aa40";
    ctx.fillRect(0, y + 4, 512, 1);
  }
  for (const x of [14, 42, 470, 498]) {
    for (const y of [17, 241, 273, 495]) {
      ctx.fillStyle = "#202a31";
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#c0c6c483";
  for (const x of [52, 455]) ctx.fillRect(x, 26, 4, 69);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
