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
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return mesh(group, geo, mat);
}

export function courier(ship: THREE.Group) {
  hullSection(
    ship,
    [
      [-4.1, 0, 0.04, 0.1],
      [-2.9, 0.63, 0.34, 0.14],
      [-1.4, 1.11, 0.57, 0.14],
      [0.8, 1.18, 0.62, 0.02],
      [2.4, 0.76, 0.39, -0.05],
      [2.7, 0, 0.02, -0.05],
    ],
    ceramic,
  );
  hullSection(
    ship,
    [
      [-2.3, 0, 0.01, 0.38],
      [-1.65, 0.49, 0.39, 0.48],
      [-0.28, 0.72, 0.49, 0.5],
      [0.72, 0.5, 0.33, 0.57],
      [1.08, 0, 0.02, 0.55],
    ],
    glass,
  );
  const capsule = mesh(
    ship,
    new THREE.CapsuleGeometry(0.26, 0.72, 5, 12),
    ochre,
    0,
    0.68,
    1.17,
  );
  capsule.rotation.x = Math.PI / 2;
  panel(ship, 0.25, 0.045, 1.05, 0, 0.94, 1.17, warm);
  for (const side of [-1, 1]) {
    const outline = new THREE.Shape();
    outline.moveTo(0.65, -2.15);
    outline.lineTo(2.59, -0.2);
    outline.lineTo(3.03, 1.52);
    outline.lineTo(2.7, 2.47);
    outline.lineTo(1.62, 1.78);
    outline.lineTo(0.62, 0.92);
    outline.closePath();
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: 0.13,
      bevelSegments: 2,
      bevelThickness: 0.067,
      bevelSize: 0.08,
      steps: 1,
    });
    const wing = mesh(ship, geometry, ceramic, 0, 0.08, 0);
    wing.rotation.x = Math.PI / 2;
    wing.scale.x = side;
    const pylon = panel(
      ship,
      0.26,
      0.32,
      1.9,
      side * 1.59,
      -0.08,
      0.64,
      midnight,
    );
    pylon.rotation.y = side * 0.34;
    const pod = new THREE.Group();
    pod.position.set(side * 1.91, -0.14, 0.62);
    ship.add(pod);
    hullSection(
      pod,
      [
        [-1.85, 0, 0.01, 0],
        [-1.43, 0.4, 0.34, 0],
        [-0.71, 0.54, 0.54, 0],
        [0.81, 0.57, 0.56, 0],
        [1.73, 0.46, 0.45, 0],
      ],
      ochre,
    );
    ring(pod, 0.44, 0.095, midnight, 0, 0, 1.72);
    ring(pod, 0.32, 0.049, ice, 0, 0, 1.82);
    mesh(pod, new THREE.CircleGeometry(0.31, 20), ice, 0, 0, 1.78);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      const vane = panel(
        pod,
        0.1,
        0.25,
        0.24,
        Math.sin(a) * 0.54,
        Math.cos(a) * 0.54,
        1.51,
        steel,
      );
      vane.rotation.z = -a;
    }
    const tip = panel(
      ship,
      0.055,
      0.055,
      1.13,
      side * 2.79,
      0.1,
      1.44,
      side === -1 ? red : ice,
    );
    tip.rotation.y = -side * 0.23;
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

export function lighthouse(group: THREE.Group) {
  mesh(group, new THREE.CylinderGeometry(13, 16, 3.3, 12), midnight, 0, -2, 0);
  mesh(group, new THREE.CylinderGeometry(11.8, 13, 1.3, 12), steel, 0, 0.35, 0);
  mesh(group, new THREE.CylinderGeometry(3.7, 6.9, 27, 10), ceramic, 0, 13, 0);
  for (const y of [1.2, 5, 24, 27])
    mesh(group, new THREE.CylinderGeometry(5.6, 5.6, 0.71, 12), ochre, 0, y, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rib = panel(
      group,
      1.2,
      27.5,
      0.45,
      Math.cos(a) * 5.6,
      13,
      Math.sin(a) * 5.6,
      steel,
    );
    rib.rotation.set(0, -a, -0.13);
    const light = panel(
      group,
      0.6,
      0.28,
      1.5,
      Math.cos(a) * 10.8,
      1.12,
      Math.sin(a) * 10.8,
      warm,
    );
    light.rotation.y = -a;
  }
  mesh(
    group,
    new THREE.CylinderGeometry(6.3, 5.1, 1.6, 12),
    midnight,
    0,
    28,
    0,
  );
  mesh(
    group,
    new THREE.CylinderGeometry(5.06, 5.06, 4.4, 12, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0x5790a1,
      transparent: true,
      opacity: 0.29,
      roughness: 0.21,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    0,
    30.8,
    0,
  ).userData.disposeMaterial = true;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    panel(
      group,
      0.24,
      4.7,
      0.24,
      Math.cos(a) * 5.08,
      30.9,
      Math.sin(a) * 5.08,
      steel,
    );
  }
  mesh(
    group,
    new THREE.CylinderGeometry(1.4, 5.75, 2.7, 12),
    midnight,
    0,
    34.5,
    0,
  );
  panel(group, 0.18, 4, 0.18, 0, 37, 0, steel);
  panel(group, 0.42, 0.42, 0.42, 0, 39, 0, red);
}

export function fleetShip(group: THREE.Group, heavy = false) {
  hullSection(
    group,
    [
      [-6.4, 0, 0.04, 0],
      [-4.5, 1.6, 0.73, 0],
      [-1.1, 2.55, 1.35, 0],
      [4.4, 2.31, 0.93, 0],
      [5.4, 1.7, 0.68, 0],
    ],
    steel,
  );
  const tower = panel(group, 2.85, 1.44, 3.05, 0, 1.47, -1.02, ceramic);
  tower.rotation.x = 0.12;
  panel(group, 2.17, 0.54, 0.38, 0, 1.84, -2.58, glass);
  if (heavy) {
    for (const side of [-1, 1]) {
      panel(group, 1.45, 1.6, 4.7, side * 1.6, 1.58, 1.5, warm);
      panel(group, 1.5, 0.19, 0.42, side * 1.6, 2.47, 2.2, ceramic);
    }
  }
  for (const side of [-1, 1]) {
    const pod = new THREE.Group();
    pod.position.set(side * 2.9, 0, 1);
    group.add(pod);
    hullSection(
      pod,
      [
        [-1.8, 0, 0.02, 0],
        [-1, 0.65, 0.57, 0],
        [2.75, 0.56, 0.54, 0],
      ],
      midnight,
    );
    ring(pod, 0.44, 0.095, ice, 0, 0, 2.79);
    panel(
      group,
      0.17,
      0.15,
      2.3,
      side * 2.52,
      0.42,
      0,
      side === 1 ? warm : ice,
    );
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
