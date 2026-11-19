import { GATES } from "./ascent";
import { buildAscentScenery } from "./ascent-scenery";
import { boostShot } from "./boost-presentation";
import * as THREE from "three";
import { COURSE, type RaceState, type Track } from "./simulation";
import { sampleTrack, curvature } from "./track";
import { courier, dock, stormPylon, deckTexture } from "./art";

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
  private camera = new THREE.PerspectiveCamera(60, 1, 0.2, 4800);
  private courseGroup = new THREE.Group();
  private environment = new THREE.Group();
  private ship = new THREE.Group();
  private driveTrails: {
    mount: THREE.Group;
    material: THREE.ShaderMaterial;
  }[] = [];
  private pitchVelocity = 0;
  private ignitionAt = -10;
  private seenBoosts = 0;
  private classic = false;
  private roadFlow = new THREE.Group();
  setClassicBoost(classic: boolean) {
    this.classic = classic;
    this.resetBoost();
  }
  private resetBoost() {
    this.ignitionAt = -10;
    this.seenBoosts = 0;
    this.pitchVelocity = 0;
    this.lastDistance = -1;
  }
  private arrivalTime = 0;
  private track: Track = COURSE;
  private low = false;
  private lastDistance = -1;
  private previousTime = 0;
  private gateSigns: { distance: number; sprite: THREE.Sprite }[] = [];
  private orbital?: ReturnType<typeof buildAscentScenery>;
  private flux = new THREE.Group();
  private fluxMarks: THREE.Mesh[] = [];
  private lastPhase = false;
  private look = new THREE.Vector3();
  private brass = material(0x6f4932);
  private concrete = material(0x213244);
  private windows = new THREE.MeshBasicMaterial({ color: 0xffb675 });
  private skyline = new THREE.Group();
  private cyan = new THREE.MeshBasicMaterial({ color: 0x64e9ff });
  private gold = new THREE.MeshBasicMaterial({ color: 0xffca64 });
  private hull = material(0xe1edf0);
  private dark = material(0x112732);
  private roadMat = new THREE.MeshStandardMaterial({
    color: 0xc39d82,
    map: deckTexture(),
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
    this.renderer.toneMappingExposure = 1.17;
    this.scene.fog = new THREE.FogExp2(0xf2cdb9, 0.00022);
    this.scene.add(new THREE.HemisphereLight(0xffefe0, 0x74617b, 2.45));
    const sun = new THREE.DirectionalLight(0xffddae, 3.5);
    sun.position.set(-100, 250, -300);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xc0d9ff, 2.05);
    rim.position.set(180, 60, 50);
    this.scene.add(rim);
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
    courier(this.ship);
    for (const side of [-1, 1]) {
      const trailMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { drive: { value: 0 } },
        vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float drive; varying vec2 vUv;void main(){
          float spine=pow(max(0.,1.-abs(vUv.x-.5)*2.),2.2);
          float a=pow(1.-vUv.y,1.65)*spine;
          vec3 color=mix(vec3(.93,.26,.08),vec3(1.,.86,.46),pow(spine,3.));
          gl_FragColor=vec4(color,a*(.34+drive*.62));
        }`,
      });
      for (const crossed of [false, true]) {
        const plume = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          trailMaterial,
        );
        const mount = new THREE.Group();
        mount.position.set(side * 1.48, 0.04, 2.66);
        mount.rotation.x = Math.PI / 2;
        if (crossed) mount.rotateY(Math.PI / 2);
        plume.position.y = 0.5;
        mount.add(plume);
        this.ship.add(mount);
        this.driveTrails.push({ mount, material: trailMaterial });
      }
    }
    const under = new THREE.PointLight(0xffa54f, 8, 12);
    under.position.set(0, -0.6, 1.5);
    this.ship.add(under);
  }
  setTrack(track: Track) {
    if (this.courseGroup.children.length && this.track === track) return;
    this.track = track;
    this.lastDistance = -1;
    this.courseGroup.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (o.userData.disposeMaterial && o.material instanceof THREE.Material)
          o.material.dispose();
      }
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        o.material.dispose();
      }
    });
    if (this.orbital) {
      const materials = new Set<THREE.Material>();
      this.orbital.group.traverse((object) => {
        if (
          object instanceof THREE.Mesh &&
          object.material instanceof THREE.Material
        )
          materials.add(object.material);
      });
      materials.forEach((material) => material.dispose());
    }
    this.courseGroup.clear();
    this.gateSigns = [];
    this.orbital = undefined;
    this.skyline.clear();
    this.roadFlow.clear();
    this.arrivalTime = 0;
    const uv: number[] = [];
    const vertices: number[] = [],
      indices: number[] = [];
    const railPoints: [THREE.Vector3[], THREE.Vector3[]] = [[], []];
    const count = Math.ceil((track.length + 200) / 4);
    for (let i = 0; i <= count; i++) {
      const d = i * 4 - 80;
      const l = offset(d, -7, track),
        r = offset(d, 7, track);
      vertices.push(l.x, l.y, l.z, r.x, r.y, r.z);
      uv.push(0, d / 24, 1, d / 24);
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
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
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
    });
    if (track === COURSE) {
      this.orbital = buildAscentScenery(track);
      this.courseGroup.add(this.orbital.group);
      GATES.forEach((gate, index) =>
        this.gate(
          gate.distance,
          index === GATES.length - 1 ? "DOCK" : `GATE ${index + 1}`,
          this.gold,
        ),
      );
    } else {
      this.gate(track.length, "RETURN", this.gold);
    }
    this.buildRouteScenery(track);
    this.courseGroup.add(this.roadFlow);
    const light = new THREE.MeshBasicMaterial({ color: 0x8faebb });
    const marker = new THREE.BoxGeometry(0.24, 0.06, 1.7);
    const countMarkers = Math.ceil(track.length / 7);
    const roadTicks = new THREE.InstancedMesh(marker, light, countMarkers * 2);
    roadTicks.userData.disposeMaterial = true;
    const markerPose = new THREE.Object3D();
    for (let i = 0; i < countMarkers; i++) {
      const distance = i * 7;
      for (const [j, side] of [-1, 1].entries()) {
        markerPose.position.copy(offset(distance, side * 5.75, track));
        markerPose.position.y += 0.065;
        markerPose.rotation.y = -sampleTrack(track, distance).heading;
        markerPose.updateMatrix();
        roadTicks.setMatrixAt(i * 2 + j, markerPose.matrix);
      }
    }
    this.roadFlow.add(roadTicks);
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
    this.gateSigns.push({ distance: d, sprite });
    this.courseGroup.add(group);
  }
  private buildSky() {
    const material = new THREE.ShaderMaterial({
      uniforms: { altitude: { value: 0 } },
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vWorld; void main(){ vWorld=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vWorld; uniform float altitude;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){vec3 d=normalize(vWorld);float h=d.y;
      float rim=smoothstep(-.075,.23,h);
      vec3 horizon=mix(vec3(1.,.79,.63),vec3(.67,.73,.96),altitude);
      vec3 high=mix(vec3(.31,.65,.84),vec3(.09,.11,.27),altitude);
      vec3 sky=mix(horizon,high,rim);
      float sun=max(0.,dot(d,normalize(vec3(-.51,.19,-.84))));
      sky+=vec3(.37,.20,.08)*pow(sun,16.);
      sky=mix(sky,vec3(1.,.95,.76),smoothstep(.9992,.9997,sun));
      vec2 p=d.xz/(abs(h)+.11)*.85;
      float n=noise(p)+.52*noise(p*2.1)+.23*noise(p*4.4)+.11*noise(p*8.8);
      float sea=(1.-smoothstep(-.20,.035,h));
      vec3 clouds=mix(vec3(.76,.64,.69),vec3(1.,.94,.81),smoothstep(.32,1.15,n));
      sky=mix(sky,clouds,sea);
      float star=step(.998,hash(floor(d.xz*460.)));
      sky+=vec3(.5,.54,.63)*star*altitude*smoothstep(.11,.4,h)*.75;
      gl_FragColor=vec4(sky,1.);
      }`,
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(4200, 32, 20),
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
        ((((i * 13.71 - elapsed * 32 - d * 1.4) % 88) + 88) % 88) - 13;
      const x = (i % 2 === 0 ? 1 : -1) * (4.8 + ((i * 3.71) % 19));
      const p = offset(d + ahead, x, this.track);
      const mark = this.fluxMarks[i];
      mark.position.copy(p);
      mark.position.y += 0.8 + ((i * 1.79) % 12);
      mark.rotation.y = -sampleTrack(this.track, d + ahead).heading + 0.18;
      mark.scale.z =
        boost > 0 ? 1.6 + boost * 6 + speed * 0.035 : 1.2 + (i % 4) * 0.38;
    }
  }
  private buildRouteScenery(track: Track) {
    this.courseGroup.add(this.skyline);
    for (let d = 14; d < track.length; d += 11) {
      const harbor = track !== COURSE && d < 405;
      const channel = track !== COURSE && d >= 490;
      const heading = sampleTrack(track, d).heading;
      for (const side of [-1, 1]) {
        const post = offset(d, side * 7.12, track);
        const riser = this.box(
          this.skyline,
          0.32,
          1.19,
          0.56,
          post.x,
          post.y + 0.49,
          post.z,
          this.concrete,
        );
        riser.rotation.y = -heading;
        const lamp = this.box(
          this.skyline,
          0.29,
          0.12,
          0.44,
          post.x,
          post.y + 1.12,
          post.z,
          harbor ? this.windows : this.cyan,
        );
        lamp.rotation.y = -heading;
        if (d % 33 === 14 && harbor) {
          const structure = new THREE.Group();
          structure.position.copy(offset(d, side * (15.7 + (d % 4)), track));
          structure.rotation.y = -heading;
          dock(structure, side, d + side);
          this.skyline.add(structure);
        }
        if (d % 55 === 14 && channel) {
          const tower = new THREE.Group();
          tower.position.copy(offset(d, side * (10 + (d % 5)), track));
          tower.rotation.y = -heading;
          stormPylon(tower, side);
          this.skyline.add(tower);
        }
      }
    }
    if (track === COURSE) return;
    for (const d of [96, 202, 353]) {
      const arch = new THREE.Group();
      arch.position.copy(center(d, track));
      arch.rotation.y = -sampleTrack(track, d).heading;
      for (const side of [-1, 1]) {
        this.box(arch, 1.35, 11, 1.8, side * 9, 5.5, 0, this.concrete);
        const brace = this.box(
          arch,
          0.65,
          4.7,
          1.5,
          side * 8.05,
          8.3,
          0,
          this.brass,
        );
        brace.rotation.z = -side * 0.64;
      }
      this.box(arch, 19.4, 1.3, 1.8, 0, 11.3, 0, this.concrete);
      for (const x of [-6, -3, 0, 3, 6])
        this.box(arch, 1.4, 0.12, 0.48, x, 10.62, -0.08, this.windows);
      this.skyline.add(arch);
    }
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
    gradient.addColorStop(0, "rgba(255,247,229,.78)");
    gradient.addColorStop(0.35, "rgba(230,205,205,.37)");
    gradient.addColorStop(1, "rgba(183,158,184,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      color: 0xffeee1,
    });
    for (let i = 0; i < 172; i++) {
      const d = random(i * 3) * 3000 - 200;
      const p = center(d, COURSE);
      const cloud = new THREE.Sprite(cloudMaterial);
      cloud.position.set(
        p.x + (random(i * 3 + 1) - 0.5) * 650,
        p.y - 26 - random(i + 300) * 125,
        p.z,
      );
      cloud.scale.set(
        110 + random(i + 500) * 180,
        35 + random(i + 700) * 60,
        1,
      );
      this.environment.add(cloud);
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
    const delivered = s.finished && !s.failed && this.track === COURSE;
    if (s.boosts < this.seenBoosts) this.resetBoost();
    if (s.boosts > this.seenBoosts) {
      this.ignitionAt = s.time;
      this.seenBoosts = s.boosts;
    }
    const shot = boostShot(
      s.time - this.ignitionAt,
      s.thrust,
      this.low || this.classic,
    );
    this.roadFlow.visible = !this.classic;

    const terminal = delivered || s.failed;
    this.arrivalTime = terminal ? this.arrivalTime + elapsed : 0;
    const reveal = THREE.MathUtils.smoothstep(this.arrivalTime, 0, 2.35);
    const fall = s.failed ? Math.min(118, this.arrivalTime ** 2 * 30) : 0;
    if (active && !this.lastPhase) this.lastDistance = -1;
    this.lastPhase = active;
    const d = active ? s.distance : 19 + Math.sin(time * 0.08) * 8;
    this.orbital?.shutters.forEach((leaves, index) => {
      const amount =
        index < s.gatesCleared
          ? 1
          : s.failed && index === s.gatesCleared
            ? 1 - reveal
            : 1;
      leaves.forEach((leaf, side) => {
        leaf.position.x = (side ? 1 : -1) * (4 + 15 * amount);
      });
    });
    for (const { distance, sprite } of this.gateSigns) {
      sprite.material.opacity = THREE.MathUtils.smoothstep(distance - d, -2, 6);
      sprite.visible = sprite.material.opacity > 0 && !delivered;
    }
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
    this.ship.position.y -= fall;
    if (delivered)
      this.ship.position.addScaledVector(tangent(d, this.track), 43 * reveal);
    const dir = tangent(d, this.track);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const bank = curvature(this.track, d) * 12;
    this.ship.rotation.set(
      s.failed
        ? -reveal * 0.78
        : -s.thrust * Number(s.boostRemaining > 0) * 0.1,
      yaw - s.slip,
      s.failed ? reveal * 1.05 : bank - s.slip * 0.6,
    );
    const pushing = s.boostRemaining > 0 ? s.thrust : 0;
    this.pitchVelocity +=
      (pushing - this.pitchVelocity) * (1 - Math.exp(-elapsed * 10));
    for (const trail of this.driveTrails) {
      trail.mount.visible = active && !terminal;
      trail.mount.scale.set(
        0.6 + this.pitchVelocity * 0.63,
        1.55 + this.pitchVelocity * 9.5 + shot.kick * 3.2,
        1,
      );
      trail.material.uniforms.drive.value = this.pitchVelocity;
    }
    const skyMaterial = this.sky?.material as THREE.ShaderMaterial | undefined;
    if (skyMaterial)
      skyMaterial.uniforms.altitude.value =
        this.track === COURSE ? THREE.MathUtils.smoothstep(d, 820, 2310) : 0;
    const cameraD =
      d -
      (delivered
        ? 28 + reveal * 36
        : active
          ? this.classic
            ? 11.8 + this.pitchVelocity * 7.2
            : 11.8
          : 19);
    const side = delivered ? -15 - reveal * 23 : active ? s.lateral * 0.7 : -14;
    const height = delivered ? 10 + reveal * 18 : active ? 4.25 : 7;
    const cam = offset(cameraD, side, this.track).add(
      new THREE.Vector3(0, height, 0),
    );
    const target = offset(d + (active ? 24 : 20), active ? 0 : 7, this.track);
    target.y += active ? 3.3 : 9;
    if (delivered && this.orbital)
      target.lerp(
        this.orbital.dock.position.clone().add(new THREE.Vector3(0, 25, 0)),
        0.72,
      );
    if (s.failed) {
      cam.copy(offset(d - 21, -6, this.track));
      cam.y = this.ship.position.y + 7;
      target.copy(this.ship.position).addScaledVector(dir, 3);
      target.y -= 1;
    }
    if (this.lastDistance < 0 || Math.abs(d - this.lastDistance) > 50) {
      this.camera.position.copy(cam);
      this.look.copy(target);
    } else {
      this.camera.position.lerp(cam, 1 - Math.exp(-elapsed * 7));
      this.look.lerp(target, 1 - Math.exp(-elapsed * 8));
    }
    // Apply the short inertial offset after the normal chase smoothing.
    // It decays independently of sustained boost and does not flood the FOV.
    const chasePosition = this.camera.position.clone();
    if (active && !terminal && shot.lag > 0) {
      this.camera.position.addScaledVector(dir, -shot.lag);
      this.camera.position.y -= shot.kick * 0.32;
    }
    this.camera.lookAt(this.look);
    if (active && !terminal) this.camera.rotateX(shot.pitch);
    if (!this.low && active && !terminal)
      this.camera.rotateZ(bank * 0.35 - s.slip * 0.12);
    this.sky?.position.copy(this.camera.position);
    const targetFov =
      (delivered ? 59 : 57) +
      (this.low
        ? 0
        : this.classic
          ? this.pitchVelocity * 19
          : this.pitchVelocity * 2);
    this.camera.fov +=
      (targetFov - this.camera.fov) * (1 - Math.exp(-elapsed * 5));
    const chaseFov = this.camera.fov;
    if (active && !terminal && shot.lag > 0) {
      this.camera.fov = THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            (Math.tan(THREE.MathUtils.degToRad(chaseFov * 0.5)) * 11.8) /
              (11.8 + shot.lag),
          ),
      );
    }
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
    this.camera.fov = chaseFov;
    this.camera.position.copy(chasePosition);
    this.lastDistance = d;
  }
}
