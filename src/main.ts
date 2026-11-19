import "./style.css";
import { World } from "./world";
import { Session } from "./session";
import { COURSE, PRACTICE, type Track } from "./simulation";
import { readRecords, saveRecord, compareRecords, type Store } from "./records";
import { AudioEngine } from "./audio";
import { GATES, approachCue, releaseCue } from "./ascent";
const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const params = new URLSearchParams(location.search);
const requestedFlight = params.get("flight");
const comparison = requestedFlight === "A" || requestedFlight === "B";
const classic = requestedFlight === "A";
let lastBoostCount = 0;
let lastGate = 0;
let warning = false;
const session = new Session(),
  audio = new AudioEngine();
let world: World;
let selected: Track = COURSE;
let arrivalAt = 0;
let lastPhase = "ready",
  lastFrame = performance.now(),
  lastFeedback = -10;
let held = false,
  low = matchMedia("(prefers-reduced-motion: reduce)").matches;
const store: Store = {
  getItem: (k) => window.localStorage.getItem(k),
  setItem: (k, v) => window.localStorage.setItem(k, v),
};
export function formatTime(time: number) {
  const ms = Math.round(time * 1000);
  return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}
function setLow(value: boolean) {
  low = value;
  world?.setLow(low);
  byId("effects").setAttribute("aria-pressed", String(low));
}
function start(track = selected) {
  if (comparison) track = PRACTICE;
  if (session.phase === "racing" || session.phase === "countdown") return;
  selected = track;
  arrivalAt = 0;
  byId("arrival").hidden = true;
  byId("arrival-results").hidden = true;
  if (!audio.enabled && !soundChosen) void toggleAudio(true);
  held = false;
  byId("drift").classList.remove("active");
  session.start(track, performance.now());
  world.setTrack(track);
  lastFeedback = -10;
  lastBoostCount = 0;
  lastGate = 0;
  warning = false;
  document.body.classList.remove("falling");
  byId("home").hidden = true;
  byId("home-instructions").hidden = true;
  byId("footer").hidden = true;
  byId("hud").hidden = false;
  byId("results").hidden = true;
  byId("paused").hidden = true;
  byId("gate-panel").hidden = track !== COURSE;
  byId("track-name").textContent = track.name.toUpperCase();
  document.body.classList.add("racing");
  byId("drift").focus({ preventScroll: true });
}
function home() {
  session.goHome();
  byId("arrival").hidden = true;
  selected = comparison ? PRACTICE : COURSE;
  document.body.classList.remove("falling");
  held = false;
  world.setTrack(selected);
  byId("hud").hidden = true;
  byId("results").hidden = true;
  byId("paused").hidden = true;
  byId("home").hidden = false;
  byId("home-instructions").hidden = false;
  byId("footer").hidden = false;
  document.body.classList.remove("racing");
  byId(comparison ? "practice" : "race").focus();
}
function interrupt() {
  session.interrupt();
  held = false;
  byId("drift").classList.remove("active");
  if (session.phase === "paused") {
    byId("paused").hidden = false;
    byId("hud").hidden = true;
    byId("resume").focus();
  }
}
function input(down: boolean) {
  if (down === held) return;
  if (session.phase !== "racing") return;
  held = down;
  session.input(performance.now(), down);
  byId("drift").classList.toggle("active", down);
}
byId("race").onclick = () => start(COURSE);
byId("practice").onclick = () => start(PRACTICE);
byId("again").onclick = () => (selected === COURSE ? home() : start());
byId("arrival-results").onclick = finish;
byId("replay-mission").onclick = () => start(COURSE);
byId("resume").onclick = () => start();
byId("back").onclick = home;
byId("pause-back").onclick = home;
byId("restart").onclick = () => {
  interrupt();
  start();
};
let soundChosen = false;
async function toggleAudio(enabled: boolean) {
  try {
    await audio.enable(enabled);
    byId("sound").textContent = audio.enabled ? "Sound on" : "Sound off";
    byId("sound").setAttribute("aria-pressed", String(audio.enabled));
  } catch {
    byId("sound").textContent = "Sound unavailable";
  }
}
byId("sound").onclick = () => {
  soundChosen = true;
  void toggleAudio(!audio.enabled);
};
byId("effects").onclick = () => setLow(!low);
byId("fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    byId("fullscreen").textContent = "Use browser full screen";
  }
};
document.addEventListener("fullscreenchange", () => {
  byId("fullscreen").textContent = document.fullscreenElement
    ? "Exit full screen ↙"
    : "Full screen ↗";
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    interrupt();
    return;
  }
  if (e.code !== "Space" || e.repeat) return;
  if (session.phase === "finished" && !byId("arrival").hidden) {
    e.preventDefault();
    finish();
    return;
  }
  const target = e.target as HTMLElement;
  if (target.tagName === "BUTTON" && target.id !== "drift") return;
  e.preventDefault();
  if (
    session.phase === "ready" ||
    session.phase === "finished" ||
    session.phase === "paused"
  )
    start();
  else input(true);
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    if (
      (e.target as HTMLElement).id === "drift" ||
      (e.target as HTMLElement).tagName !== "BUTTON"
    )
      e.preventDefault();
    input(false);
  }
});
byId("drift").addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  byId("drift").setPointerCapture(e.pointerId);
  input(true);
});
byId("drift").addEventListener("pointerup", () => input(false));
byId("drift").addEventListener("pointercancel", () => interrupt());
window.addEventListener("blur", () => interrupt());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) interrupt();
});
function finish() {
  if (session.phase !== "finished" || !byId("results").hidden) return;
  const s = session.sim.state;
  const mission = selected === COURSE;
  const best = comparison ? undefined : readRecords(store, selected.id)[0];
  const entry = {
    time: s.time,
    perfects: s.perfects,
    date: new Date().toISOString().slice(0, 10),
  };
  const saved =
    !comparison && !s.failed && saveRecord(store, selected.id, entry);
  byId("hud").hidden = true;
  byId("results").hidden = false;
  byId("replay-mission").hidden = !mission;
  byId("back").hidden = mission;
  if (!comparison)
    byId("again").textContent = mission
      ? "Next pilot · flight briefing"
      : "Practice again";
  byId("result-time").textContent = formatTime(s.time);
  byId("result-eyebrow").textContent = !mission
    ? "PRACTICE COMPLETE"
    : s.failed
      ? "MISSION FAILED"
      : "MISSION COMPLETE";
  byId("result-title").textContent = !mission
    ? "Ready for the ascent."
    : s.failed
      ? "Lost in the cloud sea"
      : "Docked at the mothership";
  byId("arrival").hidden = true;
  byId("sector-results").hidden = !mission;
  if (mission)
    byId("sector-results").textContent =
      `${s.gatesCleared} / ${GATES.length} gates cleared` +
      (s.failed ? ` · ${GATES[s.gatesCleared].name} closed` : "");
  byId("personal-best").textContent = comparison
    ? "Try the other flight through the same turn."
    : s.failed
      ? "Release at the exit for a stronger boost."
      : !saved
        ? "Local records could not be saved."
        : !best || compareRecords(entry, best) < 0
          ? "NEW DEVICE RECORD"
          : `Device best · ${formatTime(best.time)}`;
  byId("result-perfect").textContent =
    `${s.perfects}/${selected.corners.length}`;
  byId("result-boost").textContent = String(s.boosts);
  byId("result-contact").textContent = String(s.contacts);
  byId("records").replaceChildren(
    ...readRecords(store, selected.id)
      .slice(0, 5)
      .map((r, i) => {
        const li = document.createElement("li");
        const left = document.createElement("span");
        left.textContent = `${String(i + 1).padStart(2, "0")}   ${r.date}`;
        const right = document.createElement("span");
        right.textContent = formatTime(r.time);
        li.append(left, right);
        return li;
      }),
  );
  held = false;
  byId("drift").classList.remove("active");

  byId("again").focus();
}
function frame(now: number) {
  const gap = now - lastFrame;
  lastFrame = now;
  if (
    gap > 1500 &&
    (session.phase === "racing" || session.phase === "countdown")
  )
    interrupt();
  session.update(now);
  const phase = session.phase,
    s = session.sim.state,
    active = phase !== "ready";
  document.body.dataset.phase = phase;
  if (phase === "finished" && lastPhase !== "finished") {
    arrivalAt = now;
    if (selected === COURSE) {
      byId("arrival-stage").textContent = s.failed
        ? "Gate closed"
        : "Docking corridor reached";
      byId("arrival-line").textContent = s.failed
        ? "Lift lost. Descending into the cloud sea."
        : "Five gates cleared.";
      byId("arrival").hidden = false;
      byId("hud").hidden = true;
      document.body.classList.toggle("falling", s.failed);
      audio.chime(s.failed ? "fall" : "arrival");
    } else finish();
  }
  if (phase === "finished" && !byId("arrival").hidden) {
    const since = now - arrivalAt;
    if (since >= (s.failed ? 2450 : 3800)) finish();
    else if (since >= (s.failed ? 1200 : 800)) {
      byId("arrival-results").hidden = false;
      if (!s.failed) byId("arrival-stage").textContent = "Mothership reached";
    }
  }
  if (phase === "countdown")
    byId("countdown").textContent = String(
      Math.max(1, Math.ceil((session.startAt - now) / 1000)),
    );
  else
    byId("countdown").textContent =
      phase === "racing" && s.time < 0.65 ? "GO" : "";
  if (phase === "racing" || phase === "countdown") {
    byId("timer").textContent = formatTime(s.time);
    byId("speed").textContent = String(Math.round(s.speed * 3.6));
    byId("progress").style.width = `${(s.distance / selected.length) * 100}%`;
    byId("distance").textContent =
      `${Math.floor(s.distance)} / ${selected.length} M`;
    if (selected === COURSE) {
      const gate = GATES[s.gatesCleared];
      const left = Math.max(0, s.deadline - s.time);
      byId("sector").textContent =
        `GATE ${s.gatesCleared + 1} / ${GATES.length} · ${gate.name}`;
      byId("gate-time").textContent =
        `${(Math.ceil(left * 10) / 10).toFixed(1)} s`;
      byId("gate-panel").classList.toggle("urgent", left <= 2);
      const meter = byId<HTMLProgressElement>("gate-meter");
      meter.max = gate.seconds;
      meter.value = Math.min(left, gate.seconds);
      if (s.gatesCleared !== lastGate) {
        lastGate = s.gatesCleared;
        warning = false;
        audio.chime("gate");
      }
      if (!warning && left <= 2) {
        warning = true;
        audio.chime("warning");
      }
    }
    const next = selected.corners.find((c) => s.distance < c.end + 15);
    byId("corner-label").textContent = next ? "FLIGHT PATH" : "FINAL STRAIGHT";
    let cue = next
      ? s.drifting
        ? releaseCue(s.distance, next.end - 10, s.speed)
        : approachCue(s.distance, next.start - 20, s.speed)
      : "FLY TO THE GATE";
    if (!s.drifting && s.boostRemaining > 0)
      cue = comparison ? "" : "BOOSTING ↗";
    const cueElement = byId("cue");
    if (cueElement.textContent !== cue) cueElement.textContent = cue;
    cueElement.classList.toggle(
      "action",
      cue.startsWith("HOLD NOW") || cue.startsWith("RELEASE"),
    );
    byId("energy").style.width = `${s.energy * 100}%`;
    byId("energy-label").textContent = "DRIFT ENERGY";
    const passedGate =
      selected === COURSE &&
      s.gatesCleared > 0 &&
      s.deadline - s.time > GATES[s.gatesCleared].seconds - 1.15;
    byId("feedback").textContent = passedGate
      ? "GATE CLEARED · CLOCK RESET"
      : s.time - s.feedbackAt < 1.25 &&
          !(comparison && s.feedback.includes("BOOST"))
        ? s.feedback
        : "";
    if (s.boosts > lastBoostCount) {
      if (classic) audio.chime("boost");
      else audio.ignition(s.thrust);
      lastBoostCount = s.boosts;
    }
    if (s.feedbackAt !== lastFeedback) {
      if (s.feedback === "RAIL CONTACT") audio.chime("contact");
      lastFeedback = s.feedbackAt;
    }
  }
  audio.update(s.speed, s.drifting, s.boostRemaining > 0, phase === "racing");
  try {
    world.render(s, active, now / 1000);
  } catch {
    interrupt();
    byId("graphics-message").textContent =
      "The flight display stopped. Reload to start fresh.";
    byId("graphics-error").hidden = false;
    return;
  }
  lastPhase = phase;
  requestAnimationFrame(frame);
}
try {
  world = new World(byId<HTMLCanvasElement>("world"));
  world.setClassicBoost(classic);
  if (comparison) {
    selected = PRACTICE;
    world.setTrack(PRACTICE);
    byId("race").hidden = true;
    byId("speed-block").hidden = true;
    byId("leaderboard").hidden = true;
    byId("energy-label").hidden = true;
    byId("other-flight").hidden = false;
    byId<HTMLAnchorElement>("other-flight").href = classic
      ? "?flight=B"
      : "?flight=A";
    byId<HTMLAnchorElement>("comparison-link").href = "./";
    byId("comparison-link").textContent = "Back to the mission ↗";
    byId("practice").textContent = "Launch flight " + requestedFlight;
    byId("again").textContent = "Replay flight " + requestedFlight;
    const title = document.querySelector("#home h1")!;
    title.textContent = "Flight " + requestedFlight;
    document.querySelector("#home .intro")!.textContent =
      "Fly the harbor turn. Hold to drift and release at the exit.";
    document.querySelector<HTMLElement>("#home .course-summary")!.hidden = true;
  }
  setLow(low);
  byId("world").addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    interrupt();
    byId("graphics-message").textContent =
      "The graphics connection was interrupted. Reload to start fresh.";
    byId("graphics-error").hidden = false;
  });
  requestAnimationFrame(frame);
} catch {
  byId("graphics-error").hidden = false;
}
