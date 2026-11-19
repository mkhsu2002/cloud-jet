import * as THREE from "three";
import { COURSE, type RaceState, type Track } from "./simulation";
import { sampleTrack, curvature } from "./track";
export function center(d: number, track: Track) {
  const { x, y, z } = sampleTrack(track, d);
  return new THREE.Vector3(x, y, z);
}
function tangent(d: number, track: Track) {
  const { heading } = sampleTrack(track, d);
  return new THREE.Vector3(Math.sin(heading), 0, -Math.cos(heading));
}
function offset(d: number, lateral: number, track: Track) {
  const { heading } = sampleTrack(track, d);
  return center(d, track).add(
    new THREE.Vector3(
      Math.cos(heading) * lateral,
      -curvature(track, d) * 16 * lateral,
      Math.sin(heading) * lateral,
    ),
  );
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
  private previousTime = 0;
  private beacon = new THREE.Group();
  private convoy = new THREE.Group();
  private intensity = 0;
  private flux = new THREE.Group();
  private fluxMarks: THREE.Mesh[] = [];
  private lastPhase = false;
  private beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffcc83,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  private look = new THREE.Vector3();
  private beaconCore = new THREE.MeshBasicMaterial({ color: 0xffcf82 });
  private brass = material(0x6f4932);
  private concrete = material(0x213244);
  private windows = new THREE.MeshBasicMaterial({ color: 0xffb675 });
  private skyline = new THREE.Group();
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
    this.buildSky();
    this.buildFlux();
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
    const outline = new THREE.Shape();
    outline.moveTo(0, -3.9);
    outline.lineTo(1.04, -1.1);
    outline.lineTo(2.7, 0.5);
    outline.lineTo(2.6, 1.9);
    outline.lineTo(1.5, 1.2);
    outline.lineTo(0.85, 2.25);
    outline.lineTo(-0.85, 2.25);
    outline.lineTo(-1.5, 1.2);
    outline.lineTo(-2.6, 1.9);
    outline.lineTo(-2.7, 0.5);
    outline.lineTo(-1.04, -1.1);
    outline.closePath();
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(outline, {
        depth: 0.38,
        bevelEnabled: true,
        bevelSize: 0.13,
        bevelThickness: 0.11,
        bevelSegments: 2,
      }),
      this.hull,
    );
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.36;
    this.ship.add(body);
    this.box(this.ship, 0.31, 0.2, 2.8, 0, 0.54, -0.62, this.brass);
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
    if (this.courseGroup.children.length && this.track === track) return;
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
    this.beacon.clear();
    this.convoy.clear();
    this.skyline.clear();
    this.intensity = 0;
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
    this.gate(
      track.length,
      track === COURSE ? "LIGHTHOUSE" : "RETURN",
      this.gold,
    );
    this.buildRouteScenery(track);
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
  private buildSky() {
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vWorld; void main(){ vWorld=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vWorld;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec3 d=normalize(vWorld);float h=d.y;
      vec3 sky=mix(vec3(.32,.36,.49),vec3(.025,.066,.15),smoothstep(-.04,.78,h));
      float light=pow(max(0.,dot(d,normalize(vec3(.6,.035,-.8)))),9.);
      sky+=vec3(.54,.26,.115)*light*(1.-smoothstep(.02,.32,h));
      vec2 p=vec2(atan(d.x,-d.z)*3.8,h*19.);
      float n=noise(p)+.52*noise(p*2.1)+.23*noise(p*4.4)+.11*noise(p*8.8);
      float clouds=smoothstep(.6,1.24,n)*smoothstep(-.31,-.02,h);
      sky=mix(sky,vec3(.11,.17,.27)+vec3(.32,.21,.15)*light,clouds*.72);
      gl_FragColor=vec4(sky,1.);
      }`,
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1400, 28, 16),
      material,
    );
    sky.frustumCulled = false;
    sky.renderOrder = -10;
    this.scene.add(sky);
    this.sky = sky;
  }
  private sky?: THREE.Mesh;
  private buildFlux() {
    const line = new THREE.BoxGeometry(0.045, 0.045, 1);
    const glow = new THREE.MeshBasicMaterial({
      color: 0xc0e7ff,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });
    for (let i = 0; i < 72; i++) {
      const particle = new THREE.Mesh(line, glow);
      this.flux.add(particle);
      this.fluxMarks.push(particle);
    }
    this.scene.add(this.flux);
  }
  private renderFlux(
    d: number,
    speed: number,
    elapsed: number,
    boost: number,
    storm: boolean,
  ) {
    this.flux.visible = !this.low && (storm || boost > 0.15);
    if (!this.flux.visible) return;
    for (let i = 0; i < this.fluxMarks.length; i++) {
      const ahead =
        ((((i * 13.71 - elapsed * (55 + speed * 0.64)) % 88) + 88) % 88) - 13;
      const x = (i % 2 === 0 ? 1 : -1) * (6 + ((i * 3.71) % 18));
      const p = offset(d + ahead, x, this.track);
      const mark = this.fluxMarks[i];
      mark.position.copy(p);
      mark.position.y += 0.8 + ((i * 1.79) % 12);
      mark.rotation.y = -sampleTrack(this.track, d + ahead).heading + 0.18;
      mark.scale.z = boost > 0 ? 2.3 + boost * 4 : 1.2 + (i % 4) * 0.38;
    }
  }
  private buildRouteScenery(track: Track) {
    this.courseGroup.add(this.skyline, this.beacon, this.convoy);
    for (let d = 15; d < track.length; d += 18) {
      const harbor = d < 420;
      const tower = d % 4 === 1;
      for (const side of [-1, 1]) {
        const { heading } = sampleTrack(track, d);
        const p = offset(d, side * (harbor ? 22 + (d % 9) : 27), track);
        const h = 12 + ((d * 7) % 31);
        if (harbor && tower) {
          const building = new THREE.Group();
          building.position.copy(p);
          building.rotation.y = -heading;
          this.box(building, 15, h, 19, 0, h / 2 - 11, 0, this.concrete);
          this.box(building, 13, 2, 16, 0, h - 10, 0, this.dark);
          for (let row = 0; row < 4; row++)
            this.box(
              building,
              0.16,
              0.23,
              11,
              -side * 7.52,
              h - 13 - row * 2.7,
              0,
              this.windows,
            );
          this.skyline.add(building);
        }
        const rail = offset(d, side * 7.1, track);
        const riser = this.box(
          this.skyline,
          0.38,
          1.3,
          0.7,
          rail.x,
          rail.y + 0.51,
          rail.z,
          this.concrete,
        );
        riser.rotation.y = -heading;
        this.box(
          this.skyline,
          0.35,
          0.16,
          0.55,
          rail.x,
          rail.y + 1.13,
          rail.z,
          harbor ? this.windows : this.cyan,
        );
      }
      const mark = center(d, track);
      const tie = this.box(
        this.skyline,
        13,
        0.09,
        0.26,
        mark.x,
        mark.y + 0.025,
        mark.z,
        this.dark,
      );
      tie.rotation.y = -sampleTrack(track, d).heading;
    }
    const end = offset(track.length + 18, 14, track);
    this.beacon.position.copy(end);
    for (let i = 0; i < 6; i++) {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8 - i * 0.43, 4.4 - i * 0.45, 6, 8),
        i % 2 ? this.brass : this.concrete,
      );
      column.position.y = i * 5.6 - 1;
      this.beacon.add(column);
    }
    const crown = new THREE.Mesh(
      new THREE.OctahedronGeometry(3.3),
      this.beaconCore,
    );
    crown.position.y = 32;
    this.beacon.add(crown);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(14, 230, 20, 1, true),
      this.beamMaterial,
    );
    beam.position.set(0, 32, -115);
    beam.rotation.x = Math.PI / 2;
    const arm = new THREE.Group();
    arm.add(beam);
    this.beacon.add(arm);
    this.beam = arm;
    this.convoy.position.copy(offset(track.length - 5, 31, track));
    for (let i = 0; i < 5; i++) {
      const ship = new THREE.Group();
      ship.position.set(i * 8 - 12, 8 + (i % 2) * 5, -i * 12);
      ship.rotation.y = 0.55;
      const fuselage = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 2.2, 9, 6),
        this.hull,
      );
      fuselage.rotation.x = Math.PI / 2;
      ship.add(fuselage);
      this.box(ship, 2.5, 0.85, 2.7, 0, 1, -0.6, this.concrete);
      this.box(ship, 1.8, 0.24, 0.8, 0, 1.45, -0.5, this.gold);
      for (const side of [-1, 1]) {
        this.box(ship, 1.15, 0.48, 4, side * 2.1, 0, 1, this.dark);
        this.box(ship, 0.8, 0.22, 0.8, side * 2.1, 0, 3, this.cyan);
      }
      this.convoy.add(ship);
    }
  }
  private beam?: THREE.Group;

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
    const elapsed = Math.min(0.08, Math.max(0, time - this.previousTime));
    this.previousTime = time;
    const delivered = s.finished && this.track === COURSE;
    this.intensity +=
      (Number(delivered) - this.intensity) * (1 - Math.exp(-elapsed * 2.8));
    this.beaconCore.color.set(delivered ? 0xffdb8e : 0x4c5964);
    if (this.beam) {
      this.beam.visible = delivered;
      this.beam.rotation.y = this.low ? 0.8 : time * 0.36;
    }
    this.convoy.visible = delivered;
    if (delivered) {
      this.convoy.position.copy(
        offset(this.track.length + this.intensity * 38, 31, this.track),
      );
      this.convoy.position.y += this.intensity * 6;
    }
    if (active && !this.lastPhase) this.lastDistance = -1;
    this.lastPhase = active;
    const d = active ? s.distance : 30 + Math.sin(time * 0.08) * 12;
    this.renderFlux(
      d,
      s.speed,
      time,
      s.boostRemaining > 0 ? s.thrust : 0,
      active && !delivered && this.track === COURSE && d >= 530 && d < 1620,
    );
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
    const bank = curvature(this.track, d) * 12;
    this.ship.rotation.set(
      -s.thrust * Number(s.boostRemaining > 0) * 0.1,
      yaw - s.slip,
      bank - s.slip * 0.6,
    );
    for (const flame of this.flames) {
      const boost = s.boostRemaining > 0;
      flame.scale.set(boost ? 1.6 : 1, boost ? 3 : 1, boost ? 1.6 : 1);
      flame.position.z = boost ? 4.2 : 2.6;
    }
    const pushing = s.boostRemaining > 0 ? s.thrust : 0;
    const cameraD = d - (delivered ? 49 : active ? 14 + pushing * 5 : 19);
    const side = delivered ? -28 : active ? s.lateral * 0.58 : -14;
    const height = delivered ? 24 : active ? 5.9 : 7;
    const cam = offset(cameraD, side, this.track).add(
      new THREE.Vector3(0, height, 0),
    );
    const target = offset(d + (active ? 24 : 20), active ? 0 : 7, this.track);
    target.y += active ? 1.4 : 3;
    if (delivered)
      target.lerp(
        this.beacon.position.clone().add(new THREE.Vector3(0, 18, 0)),
        0.58,
      );
    if (this.lastDistance < 0 || Math.abs(d - this.lastDistance) > 50) {
      this.camera.position.copy(cam);
      this.look.copy(target);
    } else {
      this.camera.position.lerp(cam, 1 - Math.exp(-elapsed * 7));
      this.look.lerp(target, 1 - Math.exp(-elapsed * 8));
    }
    this.camera.lookAt(this.look);
    if (!this.low && active && !delivered)
      this.camera.rotateZ(bank * 0.35 - s.slip * 0.12);
    this.sky?.position.copy(this.camera.position);
    const targetFov = (delivered ? 64 : 60) + (this.low ? 0 : pushing * 12);
    this.camera.fov +=
      (targetFov - this.camera.fov) * (1 - Math.exp(-elapsed * 5));
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    this.lastDistance = d;
  }
}
