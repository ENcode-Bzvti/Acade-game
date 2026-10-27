// ================= SHARED: SOUND + MUSIC =================
const bgm = document.getElementById("bgm");
const musicBtn = document.getElementById("musicBtn");
bgm.volume = 0.3;                       // music volume (0 to 1)
musicBtn.addEventListener("click", () => {
  if (bgm.paused) {
    bgm.play().catch(() => { musicBtn.textContent = "Music file missing"; });
    if (!bgm.paused || bgm.readyState) musicBtn.textContent = "Music: On";
  } else {
    bgm.pause();
    musicBtn.textContent = "Music: Off";
  }
});

let audioCtx;
function beep(freq, ms = 200) {         // makes a tone with no sound file
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.15;
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + ms / 1000);
}
function loadBest(key) { try { return +localStorage.getItem(key) || 0; } catch { return 0; } }
function saveBest(key, v) { try { localStorage.setItem(key, v); } catch {} }

// ================= GAME 1: MEMORY MATRIX =================
const TONES = [261, 329, 392, 523];     // one tone per tile
const SHOW_MS = 600;                    // gap between flashes (smaller = harder)
const tiles = document.querySelectorAll(".tile");
const mScore = document.getElementById("mScore");
const mBest = document.getElementById("mBest");
const mStatus = document.getElementById("mStatus");

let seq = [], step = 0, mPoints = 0, canClick = false, runId = 0;
mBest.textContent = loadBest("mmBest");

function flash(i) {
  tiles[i].classList.add("lit");
  beep(TONES[i], 250);
  setTimeout(() => tiles[i].classList.remove("lit"), 350);
}
function nextRound() {
  const id = runId;                      // stops old timers after a restart
  canClick = false; step = 0;
  seq.push(Math.floor(Math.random() * 4));
  mStatus.textContent = "Watch the pattern...";
  seq.forEach((tile, n) => {
    setTimeout(() => { if (id === runId) flash(tile); }, 700 + n * SHOW_MS);
  });
  setTimeout(() => {
    if (id !== runId) return;
    canClick = true;
    mStatus.textContent = "Your turn! Repeat the pattern.";
  }, 700 + seq.length * SHOW_MS);
}
function startMemory() {
  runId++; seq = []; mPoints = 0;
  mScore.textContent = 0;
  nextRound();
}
tiles.forEach(t => t.addEventListener("click", () => {
  if (!canClick) return;
  const i = +t.dataset.i;
  flash(i);
  if (i === seq[step]) {
    step++;
    if (step === seq.length) {           // finished the round
      mPoints++; mScore.textContent = mPoints;
      canClick = false;
      mStatus.textContent = "Correct! Next round...";
      if (mPoints > loadBest("mmBest")) { saveBest("mmBest", mPoints); mBest.textContent = mPoints; }
      const id = runId;
      setTimeout(() => { if (id === runId) nextRound(); }, 900);
    }
  } else {                               // wrong tile
    canClick = false;
    beep(110, 500);
    mStatus.textContent = "Game over! You reached round " + (mPoints + 1) + ". Press Restart.";
  }
}));
document.getElementById("mStart").addEventListener("click", startMemory);
document.getElementById("mRestart").addEventListener("click", startMemory);

// ================= GAME 2: SPEED REFLEX =================
const GAME_SECONDS = 30;                // game length
const arena = document.getElementById("arena");
const target = document.getElementById("target");
const rTime = document.getElementById("rTime");
const rScore = document.getElementById("rScore");
const rLast = document.getElementById("rLast");
const rAvg = document.getElementById("rAvg");
const rBest = document.getElementById("rBest");
const rStatus = document.getElementById("rStatus");

let hits = 0, times = [], shownAt = 0, endAt = 0, timer = null;
rBest.textContent = loadBest("reflexBest");

function moveTarget() {
  const maxX = arena.clientWidth - target.offsetWidth;
  const maxY = arena.clientHeight - target.offsetHeight;
  target.style.left = Math.random() * maxX + "px";
  target.style.top = Math.random() * maxY + "px";
  shownAt = performance.now();           // start the reaction stopwatch
}
function startReflex() {
  clearInterval(timer);
  hits = 0; times = [];
  rScore.textContent = 0; rLast.textContent = "- ms"; rAvg.textContent = "- ms";
  rStatus.textContent = "Go! Click the target!";
  arena.classList.add("live");
  endAt = performance.now() + GAME_SECONDS * 1000;
  moveTarget();
  timer = setInterval(tick, 100);
}
function tick() {
  const left = Math.max(0, endAt - performance.now());
  rTime.textContent = (left / 1000).toFixed(1);
  if (left === 0) endReflex();
}
function endReflex() {
  clearInterval(timer);
  arena.classList.remove("live");
  rStatus.textContent = "Time's up! You hit " + hits + " targets. Press Restart to try again.";
  if (hits > loadBest("reflexBest")) { saveBest("reflexBest", hits); rBest.textContent = hits; }
}
target.addEventListener("click", () => {
  const ms = Math.round(performance.now() - shownAt);   // reaction time
  hits++; times.push(ms);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  rScore.textContent = hits;
  rLast.textContent = ms + " ms";
  rAvg.textContent = avg + " ms";
  beep(660, 80);
  moveTarget();
});
document.getElementById("rStart").addEventListener("click", startReflex);
document.getElementById("rRestart").addEventListener("click", startReflex);
