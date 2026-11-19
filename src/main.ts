import "./style.css";
import { World } from "./world";
import { Session } from "./session";
import { COURSE, PRACTICE, type Track } from "./simulation";
import { readRecords, saveRecord, type Store } from "./records";
import { AudioEngine } from "./audio";
const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const requestedFlight = new URLSearchParams(location.search).get("flight");
const comparison = requestedFlight === "A" || requestedFlight === "B";
const classic = requestedFlight === "A";
let lastBoostCount = 0;
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
  byId("radio").hidden = true;
  if (!audio.enabled && !soundChosen) void toggleAudio(true);
  held = false;
  byId("drift").classList.remove("active");
  session.start(track, performance.now());
  world.setTrack(track);
  lastFeedback = -10;
  lastBoostCount = 0;
  byId("home").hidden = true;
  byId("home-instructions").hidden = true;
  byId("footer").hidden = true;
  byId("hud").hidden = false;
  byId("results").hidden = true;
  byId("paused").hidden = true;
  byId("track-name").textContent = track.name.toUpperCase();
  document.body.classList.add("racing");
  byId("drift").focus({ preventScroll: true });
}
function home() {
  session.goHome();
  byId("arrival").hidden = true;
  byId("radio").hidden = true;
  selected = comparison ? PRACTICE : COURSE;
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
byId("again").onclick = () => start();
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
  const s = session.sim.state;
  const records = comparison ? [] : readRecords(store, selected.id);
  const best = records[0]?.time;
  const saved =
    !comparison &&
    saveRecord(store, selected.id, {
      time: s.time,
      perfects: s.perfects,
      date: new Date().toISOString().slice(0, 10),
    });
  byId("hud").hidden = true;
  byId("results").hidden = false;
  byId("result-time").textContent = formatTime(s.time);
  byId("result-eyebrow").textContent =
    selected === PRACTICE ? "HARBOR PRACTICE COMPLETE" : "BEACON ONLINE";
  byId("result-title").textContent =
    selected === PRACTICE
      ? "Ready for the real flight."
      : "The fleet has a way home.";
  byId("arrival").hidden = true;
  byId("personal-best").textContent = comparison
    ? "Try the other flight through the same turn."
    : !saved
      ? "Finished! Local records could not be saved."
      : best === undefined
        ? "Your first flight. Your next time to beat."
        : s.time < best
          ? "NEW PERSONAL BEST"
          : `${(s.time - best).toFixed(3)}s from your best. One more flight?`;
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
      byId("arrival-stage").textContent = "Core delivered";
      byId("arrival-line").textContent = "Ignition sequence started.";
      byId("arrival").hidden = false;
      byId("hud").hidden = true;
      byId("radio").hidden = true;
      audio.chime("arrival");
    } else finish();
  }
  if (phase === "finished" && selected === COURSE && !byId("arrival").hidden) {
    const since = now - arrivalAt;
    if (since >= 4250) finish();
    else if (
      since >= 875 &&
      byId("arrival-stage").textContent !== "Beacon online"
    ) {
      byId("arrival-stage").textContent = "Beacon online";
      byId("arrival-line").textContent = "The fleet is coming home.";
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
    const next = selected.corners.find((c) => s.distance < c.end + 15);
    const inCorner = next && s.distance >= next.start;
    byId("corner-label").textContent = next
      ? `${inCorner ? "" : "APPROACHING "}${next.name}`
      : "FINAL STRAIGHT";
    let cue = next ? "FIND THE GOLD LINE" : "FLY IT HOME";
    if (next && s.distance > next.start - 65 && !s.drifting)
      cue = "PRESS AT THE GOLD LINE ↓";
    if (s.drifting)
      cue =
        next && s.distance > next.end - 45
          ? "RELEASE AT THE EXIT ↑"
          : "HOLD YOUR LINE";
    if (s.boostRemaining > 0) cue = comparison ? "" : "BOOSTING ↗";
    byId("cue").textContent = cue;
    byId("energy").style.width = `${s.energy * 100}%`;
    byId("energy-label").textContent =
      s.boostRemaining > 0 ? "EXIT SPEED" : "DRIFT ENERGY";
    byId("feedback").textContent =
      s.time - s.feedbackAt < 1.3 &&
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
  if (selected === COURSE && phase === "racing") {
    const radio =
      s.distance < 120
        ? "HARBOR CONTROL · Core secured. The fleet is waiting."
        : s.distance >= 560 && s.distance < 700
          ? "HARBOR CONTROL · Entering the storm channel."
          : s.distance >= 1750 && s.distance < 1900
            ? "HARBOR CONTROL · Lighthouse ahead. Bring them home."
            : "";
    if (byId("radio").textContent !== radio) byId("radio").textContent = radio;
    byId("radio").hidden = !radio;
  } else byId("radio").hidden = true;
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
