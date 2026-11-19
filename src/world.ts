import * as THREE from "three";
import { COURSE, type RaceState, type Track } from "./simulation";
const Y = new THREE.Vector3(0, 1, 0);
export function center(d: number, track: Track): THREE.Vector3 {
  let x = 0;
  for (const c of track.corners) {
    const t = THREE.MathUtils.clamp((d - c.start) / (c.end - c.start), 0, 1);
    x += (c.direction * 105 * (1 - Math.cos(t * Math.PI))) / 2;
  }
  return new THREE.Vector3(x, 10 + Math.sin(d * 0.004) * 3, -d);
}
function tangent(d: number, track: Track) {
  return center(d + 1, track)
    .sub(center(d - 1, track))
    .normalize();
}
function offset(d: number, lateral: number, track: Track) {
  const p = center(d, track),
    side = new THREE.Vector3().crossVectors(tangent(d, track), Y).normalize();
  return p.addScaledVector(side, lateral);
}
function material(color: number, emissive = 0x000000, intensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    metalness: 0.5,
    roughness: 0.4,
  });
}
export class World {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.2, 1800);
  private courseGroup = new THREE.Group();
  private environment = new THREE.Group();
  private ship = new THREE.Group();
  private flames: THREE.Mesh[] = [];
  private track: Track = COURSE;
  private low = false;
  private lastDistance = -1;
  private cyan = new THREE.MeshBasicMaterial({ color: 0x64e9ff });
  private gold = new THREE.MeshBasicMaterial({ color: 0xffca64 });
  private hull = material(0xe1edf0);
  private dark = material(0x112732);
  private roadMat = new THREE.MeshStandardMaterial({
    color: 0x122c40,
    roughness: 0.95,
    metalness: 0.05,
  });
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x071523);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.scene.fog = new THREE.FogExp2(0x112b3c, 0.0015);
    this.scene.add(new THREE.HemisphereLight(0xbbeeff, 0x111c3a, 3));
    const sun = new THREE.DirectionalLight(0xffdcb5, 4);
    sun.position.set(-100, 250, -300);
    this.scene.add(sun);
    this.scene.add(this.courseGroup, this.environment, this.ship);
    this.buildShip();
    this.setTrack(COURSE);
    this.buildAtmosphere();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }
  private box(
    parent: THREE.Group,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  private buildShip() {
    this.box(this.ship, 1.35, 0.45, 3.5, 0, 0.1, 0, this.hull);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.87, 2, 4), this.hull);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0.1, -2.3);
    this.ship.add(nose);
    const canopy = this.box(
      this.ship,
      0.85,
      0.42,
      1.8,
      0,
      0.51,
      -0.25,
      material(0x123f55, 0x167b9b, 0.4),
    );
    canopy.rotation.x = -0.15;
    for (const side of [-1, 1]) {
      const wing = this.box(
        this.ship,
        1.45,
        0.16,
        2.1,
        side * 1.2,
        0,
        0.65,
        this.hull,
      );
      wing.rotation.y = side * -0.32;
      this.box(this.ship, 0.36, 0.52, 2.3, side * 1.7, 0.12, 0.65, this.dark);
      this.box(this.ship, 0.08, 0.06, 2.1, side * 1.91, 0.4, 0.6, this.cyan);
      this.box(this.ship, 0.3, 0.12, 0.65, side * 0.7, 0.4, 1.35, this.gold);
      const fire = new THREE.Mesh(
        new THREE.ConeGeometry(0.29, 2.2, 10),
        new THREE.MeshBasicMaterial({
          color: 0x91efff,
          transparent: true,
          opacity: 0.9,
        }),
      );
      fire.rotation.x = Math.PI / 2;
      fire.position.set(side * 1.7, 0.1, 2.6);
      this.ship.add(fire);
      this.flames.push(fire);
    }
    const under = new THREE.PointLight(0x4bdafa, 8, 15);
    under.position.y = -1;
    this.ship.add(under);
  }
  setTrack(track: Track) {
    this.track = track;
    this.lastDistance = -1;
    this.courseGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    this.courseGroup.clear();
    const vertices: number[] = [],
      indices: number[] = [];
    const railPoints: [THREE.Vector3[], THREE.Vector3[]] = [[], []];
    const count = Math.ceil((track.length + 200) / 4);
    for (let i = 0; i <= count; i++) {
      const d = i * 4 - 80;
      const l = offset(d, -7, track),
        r = offset(d, 7, track);
      vertices.push(l.x, l.y, l.z, r.x, r.y, r.z);
      railPoints[0].push(l.clone().add(new THREE.Vector3(0, 0.2, 0)));
      railPoints[1].push(r.clone().add(new THREE.Vector3(0, 0.2, 0)));
      if (i < count) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.courseGroup.add(new THREE.Mesh(geometry, this.roadMat));
    for (const pts of railPoints) {
      const curve = new THREE.CatmullRomCurve3(pts);
      this.courseGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, count, 0.09, 4, false),
          this.cyan,
        ),
      );
    }
    for (let d = 0; d < track.length; d += 20) {
      for (const side of [-1, 1]) {
        const p = offset(d, side * 6.4, track);
        const bar = this.box(
          this.courseGroup,
          0.15,
          0.04,
          4,
          p.x,
          p.y + 0.07,
          p.z,
          this.hull,
        );
        bar.rotation.y = Math.atan2(-tangent(d, track).x, -tangent(d, track).z);
      }
      if (d % 40 === 0) {
        const p = center(d, track);
        const dash = this.box(
          this.courseGroup,
          0.08,
          0.04,
          4,
          p.x,
          p.y + 0.04,
          p.z,
          this.dark,
        );
        dash.rotation.y = Math.atan2(
          -tangent(d, track).x,
          -tangent(d, track).z,
        );
      }
    }
    track.corners.forEach((c, i) => {
      this.gate(
        c.start - 20,
        "HOLD  /  " + String(i + 1).padStart(2, "0"),
        this.gold,
      );
      this.gate(c.end - 10, "RELEASE", this.cyan);
      const p = center((c.start + c.end) / 2, track);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(28, 0.1, 6, 70),
        this.cyan,
      );
      halo.position.set(p.x, p.y + 16, p.z);
      halo.rotation.y = 0.4;
      this.courseGroup.add(halo);
    });
    this.gate(track.length, "FINISH", this.gold);
  }
  private gate(d: number, label: string, mat: THREE.Material) {
    const group = new THREE.Group();
    const p = center(d, this.track);
    group.position.copy(p);
    group.rotation.y = Math.atan2(
      -tangent(d, this.track).x,
      -tangent(d, this.track).z,
    );
    this.box(group, 14, 0.07, 1.7, 0, 0.06, 0, mat);
    for (const s of [-1, 1]) {
      this.box(group, 0.16, 5, 0.22, s * 7, 2.5, 0, mat);
      this.box(group, 1.8, 0.2, 0.22, s * 6.2, 5, 0, mat);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = mat === this.gold ? "#f4c778" : "#9ae7ed";
    ctx.font = "700 42px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, 256, 80);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
    );
    sprite.position.set(0, 6.5, 0);
    sprite.scale.set(11, 2.75, 1);
    group.add(sprite);
    this.courseGroup.add(group);
  }
  private buildAtmosphere() {
    const random = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const cloudCanvas = document.createElement("canvas");
    cloudCanvas.width = 256;
    cloudCanvas.height = 256;
    const ctx = cloudCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(167,213,232,.45)");
    gradient.addColorStop(0.35, "rgba(126,178,203,.23)");
    gradient.addColorStop(1, "rgba(80,130,166,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      color: 0x89b6ce,
    });
    for (let i = 0; i < 220; i++) {
      const d = random(i * 3) * 3000 - 200;
      const p = center(d, COURSE);
      const cloud = new THREE.Sprite(cloudMaterial);
      cloud.position.set(
        p.x + (random(i * 3 + 1) - 0.5) * 650,
        -32 - random(i + 300) * 70,
        -d,
      );
      cloud.scale.set(
        110 + random(i + 500) * 180,
        35 + random(i + 700) * 60,
        1,
      );
      this.environment.add(cloud);
    }
    const pillarMat = material(0x142b40, 0x193852, 0.1);
    for (let i = 0; i < 45; i++) {
      const d = i * 65 - 100;
      const p = center(d, COURSE);
      const height = 30 + random(i + 25) * 120;
      const side = i % 2 === 0 ? -1 : 1;
      const tower = this.box(
        this.environment,
        14,
        height,
        14,
        p.x + side * (65 + random(i + 55) * 150),
        -80 + height / 2,
        -d,
        pillarMat,
      );
      tower.rotation.y = 0.35;
      this.box(
        this.environment,
        14.5,
        0.15,
        14.5,
        tower.position.x,
        tower.position.y + height / 2,
        -d,
        this.cyan,
      );
    }
    const starGeo = new THREE.BufferGeometry();
    const stars: number[] = [];
    for (let i = 0; i < 800; i++)
      stars.push(
        (random(i + 3000) - 0.5) * 2500,
        70 + random(i + 4000) * 450,
        -random(i + 5000) * 3400,
      );
    starGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(stars, 3),
    );
    this.environment.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xa8dbe6,
          size: 0.65,
          transparent: true,
          opacity: 0.75,
        }),
      ),
    );
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xf5c994, fog: false }),
    );
    sun.position.set(-400, 150, -1350);
    this.environment.add(sun);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(51 + i * 8, 0.15, 5, 100),
        this.gold,
      );
      ring.position.copy(sun.position);
      ring.rotation.y = 0.4;
      this.environment.add(ring);
    }
  }
  setLow(low: boolean) {
    this.low = low;
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.8));
    this.environment.visible = !low;
    this.resize();
  }
  resize() {
    const w = innerWidth,
      h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  render(s: RaceState, active: boolean, time: number) {
    const d = active ? s.distance : 30 + Math.sin(time * 0.08) * 12;
    const p = offset(d, s.lateral, this.track);
    this.ship.position
      .copy(p)
      .add(
        new THREE.Vector3(
          0,
          1.05 + (this.low ? 0 : Math.sin(time * 4) * 0.08),
          0,
        ),
      );
    const dir = tangent(d, this.track);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const c = this.track.corners.find((c) => d >= c.start && d < c.end);
    this.ship.rotation.set(
      0,
      yaw + (s.drifting ? (c?.direction ?? 1) * 0.32 : 0),
      s.drifting ? -(c?.direction ?? 1) * 0.2 : 0,
    );
    for (const flame of this.flames) {
      const boost = s.boostRemaining > 0;
      flame.scale.set(boost ? 1.6 : 1, boost ? 3 : 1, boost ? 1.6 : 1);
      flame.position.z = boost ? 4.2 : 2.6;
    }
    let cameraD = d - 23,
      side = 0,
      height = 10;
    if (!active) {
      cameraD = d - 32;
      side = -19;
      height = 13;
    }
    const cam = offset(cameraD, side, this.track).add(
      new THREE.Vector3(0, height, 0),
    );
    if (this.lastDistance < 0 || Math.abs(d - this.lastDistance) > 50)
      this.camera.position.copy(cam);
    else this.camera.position.lerp(cam, 0.15);
    this.camera.lookAt(
      center(d + (active ? 40 : 38), this.track).add(
        new THREE.Vector3(active ? 0 : 9, 0, 0),
      ),
    );
    const targetFov = s.boostRemaining > 0 && !this.low ? 69 : 60;
    this.camera.fov += (targetFov - this.camera.fov) * 0.05;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    this.lastDistance = d;
  }
}
