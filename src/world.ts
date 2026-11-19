import { GATES } from "./ascent";
import { collapsePose } from "./deck-collapse";
import { buildAscentScenery } from "./ascent-scenery";
import { boostShot } from "./boost-presentation";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
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
  private deckPanels: { from: number; to: number; group: THREE.Group }[] = [];
  private fallingPanels?: {
    pivot: THREE.Vector3;
    panels: { group: THREE.Group; rest: THREE.Vector3 }[];
  };
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
    const environment = new RoomEnvironment();
    const reflectionGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = reflectionGenerator.fromScene(
      environment,
      0.08,
    ).texture;
    this.scene.environmentIntensity = 0.55;
    environment.dispose();
    reflectionGenerator.dispose();
    this.scene.fog = new THREE.FogExp2(0xf2cdb9, 0.00022);
    this.scene.add(new THREE.HemisphereLight(0xffefe0, 0x74617b, 1.65));
    const sun = new THREE.DirectionalLight(0xffddae, 3.1);
    sun.position.set(-220, 170, -135);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xc0d9ff, 1.6);
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
    this.deckPanels = [];
    this.fallingPanels = undefined;
    this.buildDeck(track);
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
        this.attachToDeck(bar, d);
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
        this.attachToDeck(dash, d);
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
  private buildDeck(track: Track) {
    const end = Math.ceil((track.length + 120) / 4) * 4;
    for (let from = -80; from < end; from += 28) {
      const to = Math.min(end, from + 28);
      const group = new THREE.Group();
      group.position.copy(center((from + to) / 2, track));
      const vertices: number[] = [];
      const uv: number[] = [];
      const top: number[] = [];
      const shell: number[] = [];
      const rails: [THREE.Vector3[], THREE.Vector3[]] = [[], []];
      for (let d = from; d <= to; d += 4) {
        const left = offset(d, -7, track).sub(group.position);
        const right = offset(d, 7, track).sub(group.position);
        vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
        vertices.push(
          left.x,
          left.y - 0.75,
          left.z,
          right.x,
          right.y - 0.75,
          right.z,
        );
        uv.push(0, d / 24, 1, d / 24, 0, d / 24, 1, d / 24);
        rails[0].push(left.clone().add(new THREE.Vector3(0, 0.2, 0)));
        rails[1].push(right.clone().add(new THREE.Vector3(0, 0.2, 0)));
        const i = d - from;
        if (d < to) {
          top.push(i, i + 1, i + 4, i + 1, i + 5, i + 4);
          shell.push(i, i + 4, i + 2, i + 2, i + 4, i + 6);
          shell.push(i + 1, i + 3, i + 5, i + 3, i + 7, i + 5);
          shell.push(i + 2, i + 6, i + 3, i + 3, i + 6, i + 7);
        }
      }
      const last = to - from;
      shell.push(
        0,
        2,
        1,
        1,
        2,
        3,
        last,
        last + 1,
        last + 2,
        last + 1,
        last + 3,
        last + 2,
      );
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geometry.setIndex([...top, ...shell]);
      geometry.addGroup(0, top.length, 0);
      geometry.addGroup(top.length, shell.length, 1);
      geometry.computeVertexNormals();
      group.add(new THREE.Mesh(geometry, [this.roadMat, this.concrete]));
      for (const route of rails)
        group.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(route),
              (to - from) / 2,
              0.09,
              4,
              false,
            ),
            this.cyan,
          ),
        );
      this.deckPanels.push({ from, to, group });
      this.courseGroup.add(group);
    }
  }
  private attachToDeck(object: THREE.Object3D, distance: number) {
    const panel = this.deckPanels.find(
      ({ from, to }) => distance >= from && distance < to,
    );
    if (panel) panel.group.attach(object);
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
    const uniforms = {
      altitude: { value: 0 },
      panorama: { value: new THREE.Texture() },
      panoramaReady: { value: 0 },
    };
    new THREE.TextureLoader().load("/scenery/cloud-sea.webp", (texture) => {
      texture.wrapS = THREE.MirroredRepeatWrapping;
      uniforms.panorama.value = texture;
      uniforms.panoramaReady.value = 1;
    });
    const material = new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vWorld; void main(){ vWorld=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vWorld; uniform float altitude; uniform sampler2D panorama; uniform float panoramaReady;
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
      if (panoramaReady > 0.5) {
        float yaw=atan(d.x,-d.z);
        float u=.34+yaw*.39;
        float v=.515+asin(h)*1.04+altitude*.17;
        vec3 plate=texture2D(panorama,vec2(u,clamp(v,.02,.98))).rgb;
        vec3 highPlate=mix(plate,vec3(.24,.28,.48)*max(plate.b,.2),smoothstep(.02,.60,h)*altitude*.84);
        float blend=smoothstep(.018,.15,v)*(1.-smoothstep(.92,.99,v));
        sky=mix(sky,highPlate,blend*.97);
      }
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
        this.attachToDeck(riser, d);
        this.attachToDeck(lamp, d);
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
    this.roadFlow.visible = !this.classic && !s.failed;

    const terminal = delivered || s.failed;
    this.arrivalTime = terminal ? this.arrivalTime + elapsed : 0;
    const reveal = THREE.MathUtils.smoothstep(this.arrivalTime, 0, 2.35);

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
    if (delivered)
      this.ship.position.addScaledVector(tangent(d, this.track), 43 * reveal);
    const dir = tangent(d, this.track);
    const yaw = Math.atan2(-dir.x, -dir.z);
    const bank = curvature(this.track, d) * 12;
    this.ship.rotation.set(
      -s.thrust * Number(s.boostRemaining > 0) * 0.1,
      yaw - s.slip,
      bank - s.slip * 0.6,
    );
    if (s.failed) {
      this.fallingPanels ??= {
        pivot: center(d, this.track),
        panels: this.deckPanels
          .filter(({ from, to }) => d + 5 >= from && d - 5 < to)
          .map(({ group }) => ({ group, rest: group.position.clone() })),
      };
      const { pivot, panels } = this.fallingPanels;
      const pose = collapsePose(this.arrivalTime, s.lateral);
      const deckRotation = new THREE.Quaternion().setFromAxisAngle(
        dir,
        pose.deckRoll,
      );
      const podRotation = new THREE.Quaternion().setFromAxisAngle(
        dir,
        pose.podRoll,
      );
      const right = new THREE.Vector3(-dir.z, 0, dir.x);
      for (const { group, rest } of panels) {
        group.quaternion.copy(deckRotation);
        group.position
          .copy(rest)
          .sub(pivot)
          .applyQuaternion(deckRotation)
          .add(pivot);
      }
      // Follow the metal until the pod has cleared the edge, then keep its release angle.
      this.ship.position.copy(offset(d, pose.lateral, this.track));
      this.ship.position.y += 1.05;
      this.ship.position.sub(pivot).applyQuaternion(podRotation).add(pivot);
      this.ship.position.addScaledVector(right, pose.driftOut);
      this.ship.position.y -= pose.drop;
      this.ship.quaternion.premultiply(podRotation);
      this.ship.rotateX(-Math.min(0.55, pose.drop * 0.017));
    } else if (this.fallingPanels) {
      for (const { group, rest } of this.fallingPanels.panels) {
        group.quaternion.identity();
        group.position.copy(rest);
      }
      this.fallingPanels = undefined;
    }
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
    const side = delivered
      ? -24 - reveal * 87
      : active
        ? s.lateral * 0.72 - 1.6
        : -14;
    const height = delivered ? 18 + reveal * 62 : active ? 4.8 : 7;
    const cam = offset(cameraD, side, this.track).add(
      new THREE.Vector3(0, height, 0),
    );
    const target = offset(d + (active ? 24 : 20), active ? 0 : 7, this.track);
    target.y += active ? 3.3 : 9;
    if (delivered && this.orbital)
      target.lerp(
        this.orbital.dock.position
          .clone()
          .add(new THREE.Vector3(0, 42 + reveal * 17, 0))
          .addScaledVector(dir, 60 * reveal),
        0.86,
      );
    if (s.failed) {
      const slideSide = s.lateral < -0.25 ? -1 : 1;
      cam.copy(offset(d - 17, slideSide * 16, this.track));
      cam.y = this.ship.position.y + 8.5;
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
