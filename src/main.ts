import "./style.css";
import { World } from "./world";
import { Session } from "./session";
import {
  COURSE,
  PRACTICE,
  RESCUE,
  rescueCapacity,
  type Track,
} from "./simulation";
import { readRecords, saveRecord, compareRecords, type Store } from "./records";
import { AudioEngine } from "./audio";
import {
  approachCue,
  relayBriefs,
  relayChecks,
  rescueCue,
  rescuedTotal,
} from "./rescue";
const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const params = new URLSearchParams(location.search);
const rescue = params.get("mission") === "rescue";
const requestedFlight = rescue ? null : params.get("flight");
const comparison = requestedFlight === "A" || requestedFlight === "B";
const classic = requestedFlight === "A";
const exhibition = rescue || comparison;
let lastBoostCount = 0;
const session = new Session(),
  audio = new AudioEngine();
let world: World;
let selected: Track = rescue ? RESCUE : COURSE;
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
  if (rescue) track = RESCUE;
  else if (comparison) track = PRACTICE;
  if (session.phase === "racing" || session.phase === "countdown") return;
  selected = track;
  arrivalAt = 0;
  byId("arrival").hidden = true;
  byId("arrival-results").hidden = true;
  byId("relay-guide").hidden = true;
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
  const mission = rescueCapacity(track) > 0;
  byId("rescued-live").hidden = !mission;
  byId("rescue-results").hidden = !mission;
  byId("race-results").hidden = mission;
  byId("drift-action").textContent = mission
    ? "RELEASE TO OPEN RELAY"
    : "RELEASE TO BOOST";
  byId("drift").setAttribute(
    "aria-label",
    mission
      ? "Hold to charge the relay, release to open it"
      : "Hold to drift, release to boost",
  );
  byId("track-name").textContent = track.name.toUpperCase();
  document.body.classList.add("racing");
  byId("drift").focus({ preventScroll: true });
}
function home() {
  session.goHome();
  byId("arrival").hidden = true;
  byId("relay-guide").hidden = true;
  selected = rescue ? RESCUE : comparison ? PRACTICE : COURSE;
  held = false;
  world.setTrack(selected);
  byId("hud").hidden = true;
  byId("results").hidden = true;
  byId("paused").hidden = true;
  byId("home").hidden = false;
  byId("home-instructions").hidden = rescue;
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
  const capacity = rescueCapacity(selected);
  const ships = rescuedTotal(s.rescues);
  const best = exhibition ? undefined : readRecords(store, selected.id)[0];
  const entry = {
    time: s.time,
    perfects: s.perfects,
    date: new Date().toISOString().slice(0, 10),
    ships: capacity ? ships : undefined,
  };
  const saved = !exhibition && saveRecord(store, selected.id, entry);
  byId("hud").hidden = true;
  byId("results").hidden = false;
  byId("replay-mission").hidden = selected !== COURSE;
  byId("back").hidden = selected === COURSE;
  if (!exhibition)
    byId("again").textContent =
      selected === COURSE ? "Next pilot · flight briefing" : "Practice again";
  byId("result-time").textContent = formatTime(s.time);
  byId("result-eyebrow").textContent =
    selected === RESCUE
      ? "CONVOY RESCUE COMPLETE"
      : selected === PRACTICE
        ? "HARBOR PRACTICE COMPLETE"
        : "BEACON ONLINE";
  byId("result-title").textContent = capacity
    ? ships + " of " + capacity + " ships guided home."
    : "Ready for the real flight.";
  byId("arrival").hidden = true;
  if (capacity) {
    byId("rescue-results").textContent = s.rescues
      .map((value, index) => selected.corners[index].name + ": " + (value ?? 0))
      .join(" · ");
  }
  byId("personal-best").textContent = comparison
    ? "Try the other flight through the same turn."
    : rescue
      ? "Try a different release on your next flight."
      : !saved
        ? "Finished! Local records could not be saved."
        : best === undefined
          ? capacity
            ? "First convoy record on this device."
            : "First harbor time on this device."
          : compareRecords(entry, best) < 0
            ? "NEW DEVICE RECORD"
            : capacity
              ? "Device best · " +
                (best.ships ?? 0) +
                " ships · " +
                formatTime(best.time)
              : formatTime(best.time) + " is the fastest time on this device.";
  byId("leaderboard-name").textContent = capacity
    ? "CONVOY RECORDS"
    : "FASTEST FLIGHTS";
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
        left.textContent = `${String(i + 1).padStart(2, "0")}   ${capacity ? (r.ships ?? 0) + " ships" : r.date}`;
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
    if (selected === COURSE || rescue) {
      byId("arrival-stage").textContent = "Core delivered";
      byId("arrival-line").textContent = "Ignition sequence started.";
      byId("arrival").hidden = false;
      byId("hud").hidden = true;
      byId("relay-guide").hidden = true;
      audio.chime("arrival");
    } else finish();
  }
  if (
    phase === "finished" &&
    (selected === COURSE || rescue) &&
    !byId("arrival").hidden
  ) {
    const since = now - arrivalAt;
    if (since >= 4250) finish();
    else if (
      since >= 875 &&
      byId("arrival-stage").textContent !== "Beacon online"
    ) {
      byId("arrival-stage").textContent = "Beacon online";
      byId("arrival-results").hidden = false;
      const ships = rescuedTotal(s.rescues);
      byId("arrival-line").textContent = s.rescues.length
        ? ships === 0
          ? "The signal is ready for the next convoy."
          : ships === 1
            ? "One ship is following the signal."
            : ships + " ships are following the signal."
        : "The fleet is coming home.";
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
    let cue = "FLY IT HOME";
    if (next)
      cue = s.drifting
        ? s.distance > next.end - 45
          ? "RELEASE AT THE EXIT ↑"
          : "HOLD YOUR LINE"
        : approachCue(s.distance, next.start - 20, s.speed);
    const guide = byId("relay-guide");
    let showGuide = false;
    if (s.rescues.length) {
      const relay = s.rescues.indexOf(null);
      const escorted = rescuedTotal(s.rescues);
      byId("rescued-live").textContent =
        `${escorted} / ${rescueCapacity(selected)} SHIPS GUIDED HOME`;
      const turn = selected.corners[relay];
      const approach = {
        escorted,
        entryQuality: s.drifting ? s.entryQuality : 0,
        slip: s.slip,
        lateral: s.lateral,
      };
      if (!turn) cue = s.drifting ? "LET GO · FLY IT HOME" : "FLY IT HOME";
      else if (s.drifting && s.distance < turn.start - 110)
        cue = "LET GO · NEXT TURN AHEAD";
      else if (s.drifting)
        cue = rescueCue(relay, s.distance, s.energy, approach);
      else cue = approachCue(s.distance, turn.start - 20, s.speed);

      if (turn && (relay === 0 || s.distance >= turn.start - 130)) {
        showGuide = true;
        const brief = byId("relay-brief");
        if (brief.textContent !== relayBriefs[relay])
          brief.textContent = relayBriefs[relay];
        const checks = relayChecks(relay, s.energy, approach);
        for (const [index, id] of [
          "relay-check-a",
          "relay-check-b",
        ].entries()) {
          const item = byId(id);
          const check = checks[index];
          item.hidden = !check;
          if (check) {
            const label = `${check.met ? "✓" : "○"} ${check.label}`;
            if (item.textContent !== label) item.textContent = label;
            item.dataset.met = String(check.met);
          }
        }
      }
    } else if (s.boostRemaining > 0) cue = comparison ? "" : "BOOSTING ↗";
    guide.hidden = !showGuide;
    const cueElement = byId("cue");
    if (cueElement.textContent !== cue) cueElement.textContent = cue;
    cueElement.classList.toggle(
      "action",
      cue.startsWith("HOLD NOW") || cue.startsWith("RELEASE"),
    );
    byId("energy").style.width = `${s.energy * 100}%`;
    byId("energy-label").textContent = s.rescues.length
      ? "RELAY CHARGE"
      : s.boostRemaining > 0
        ? "EXIT SPEED"
        : "DRIFT ENERGY";
    byId("feedback").textContent =
      s.time - s.feedbackAt < (s.feedback.includes("RESCUED") ? 2.4 : 1.3) &&
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
  if (rescue) {
    document.body.classList.add("short-rescue");
    world.setTrack(RESCUE);
    byId("race").textContent = "Launch convoy rescue";
    byId("practice").hidden = true;
    byId("comparison-link").hidden = true;
    byId("leaderboard").hidden = true;
    byId("race-results").hidden = true;
    byId("rescue-results").hidden = false;
    byId("rescued-live").hidden = false;
    byId("energy-label").textContent = "RELAY CHARGE";
    byId("drift-action").textContent = "RELEASE TO OPEN RELAY";
    byId("drift").setAttribute(
      "aria-label",
      "Hold to charge the relay, release to open it",
    );
    byId("again").textContent = "Fly the rescue again";
    byId<HTMLAnchorElement>("rescue-link").href = "./";
    byId("rescue-link").textContent = "Back to Last Light ↗";
    document.querySelector("#home h1")!.textContent = "CONVOY RESCUE";
    document.querySelector("#home .intro")!.textContent =
      "Guide three ships home. Hold Space through each turn to charge the relay. Release when the ships enter its window.";
    document.querySelector<HTMLElement>("#home .course-summary")!.hidden = true;
    document.querySelector<HTMLElement>("#home-instructions")!.hidden = true;
  }
  if (comparison) {
    selected = PRACTICE;
    world.setTrack(PRACTICE);
    byId("race").hidden = true;
    byId("rescue-link").hidden = true;
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
