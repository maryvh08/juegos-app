// --------------------
// STATE (Game Engine)
// --------------------
const GameEngine = {
  state: {
    players: JSON.parse(localStorage.getItem("players")) || [],
    scores: JSON.parse(localStorage.getItem("scores")) || {},
    shots: Number(localStorage.getItem("shots")) || 0,
    streak: 0,
    currentIndex: Number(localStorage.getItem("turn")) || 0
  },

  addPlayer(name) {
    this.state.players.push(name);
    this.state.scores[name] = 0;
    this.save();
  },

  addShot() {
    this.state.shots++;
    this.state.streak = 0;
    this.save();
  },

  addPoint(player) {
    if (!this.state.scores[player]) this.state.scores[player] = 0;
    this.state.scores[player]++;
    this.save();
  },

  nextPlayer() {
    this.state.currentIndex =
      (this.state.currentIndex + 1) % this.state.players.length;

    this.save();
  },

  resetStreak() {
    this.state.streak = 0;
    this.save();
  },

  save() {
    localStorage.setItem("players", JSON.stringify(this.state.players));
    localStorage.setItem("scores", JSON.stringify(this.state.scores));
    localStorage.setItem("shots", this.state.shots);
    localStorage.setItem("turn", this.state.currentIndex);
  },

  currentPlayer() {
    return this.state.players[this.state.currentIndex];
  }
};

// --------------------
// GAME CONFIG
// --------------------
let data = {};
let currentGame = "verdad";
let currentLevel = "suave";
let usedQuestions = [];
let skipTurnChange = false;

// --------------------
// DOM
// --------------------
const card = document.getElementById("card");
const questionEl = document.getElementById("question");

// --------------------
// INIT
// --------------------

function init() {
  renderPlayers();
  updateHUD();

  if (GameEngine.state.players.length > 0) {
    document.getElementById("setup").classList.add("hidden");
    document.getElementById("gameUI").classList.remove("hidden");
    startGame();
  }
}

// --------------------
// PLAYERS
// --------------------
document.getElementById("addPlayer").onclick = () => {
  const input = document.getElementById("playerInput");
  if (!input.value.trim()) return;

  GameEngine.addPlayer(input.value.trim());
  input.value = "";

  renderPlayers();
  updateHUD();
};

function renderPlayers() {
  document.getElementById("playersList").innerText =
    GameEngine.state.players.join(", ");
}

document.getElementById("startGame").onclick = () => {
  if (GameEngine.state.players.length === 0) {
    return alert("Agrega jugadores");
  }

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");

  startGame();
};

// --------------------
// DATA
// --------------------
function updateColor() {
  const card = document.getElementById("card");

  if (!card) return;

  if (currentLevel === "suave") {
    card.style.background =
      "linear-gradient(135deg, #2e7d32, #66bb6a)";
  }

  if (currentLevel === "medio") {
    card.style.background =
      "linear-gradient(135deg, #f9a825, #fdd835)";
  }

  if (currentLevel === "alto") {
    card.style.background =
      "linear-gradient(135deg, #c62828, #ef5350)";
  }
}

async function loadData() {
  try {
    const res = await fetch(`data/${currentGame}.json`);

    if (!res.ok) {
      throw new Error("No se pudo cargar el JSON");
    }

    data = await res.json();

    usedQuestions = [];

    showCard();
  } catch (e) {
    console.error(e);
    questionEl.innerText = "Error cargando preguntas 😢";
  }
}

function getRandomQuestion() {
  const preguntas = data[currentLevel];

  if (!preguntas?.length) return "Sin preguntas disponibles";

  if (usedQuestions.length === preguntas.length) {
    usedQuestions = [];
  }

  let q;
  do {
    q = preguntas[Math.floor(Math.random() * preguntas.length)];
  } while (usedQuestions.includes(q));

  usedQuestions.push(q);
  return q;
}

// --------------------
// FLOW
// --------------------
function startGame() {
  loadData().then(() => {
    updateUI();
    animateIn();
  });
}

function nextTurn() {
  if (!skipTurnChange) {
    GameEngine.nextPlayer();
  }

  skipTurnChange = false;
  GameEngine.state.streak++;

  updateUI();
  showCard();
}

// --------------------
// ACTION RESOLUTION (CLAVE)
// --------------------
function resolveAction(action) {
  const player = GameEngine.currentPlayer();

  switch (action) {
    case "accept":
      GameEngine.addPoint(player);
      break;

    case "shot":
      GameEngine.addShot();
      break;

    case "skip":
      GameEngine.resetStreak();
      break;
  }

  updateHUD();
}

// --------------------
// CARD
// --------------------
function showCard() {
  questionEl.innerText = event || getRandomQuestion();

  resetCard();
  updateColor();
}

// --------------------
// UI UPDATE
// --------------------
function updateUI() {
  const player = GameEngine.currentPlayer();

  const currentPlayerEl = document.getElementById("currentPlayer");
  const scoreEl = document.getElementById("score");
  const shotsEl = document.getElementById("shots");
  const streakEl = document.getElementById("streak");

  if (currentPlayerEl) {
    currentPlayerEl.innerText = "Turno: " + player;
  }

  if (scoreEl) {
    scoreEl.innerText =
      "⭐ " + (GameEngine.state.scores[player] || 0);
  }

  if (shotsEl) {
    shotsEl.innerText = "🍻 " + GameEngine.state.shots;
  }

  if (streakEl) {
    streakEl.innerText = "🔥 " + GameEngine.state.streak;
  }
}

function updateHUD() {
  const player = GameEngine.currentPlayer();

  const playerEl = document.getElementById("currentPlayer");
  const shotsEl = document.getElementById("shots");
  const streakEl = document.getElementById("streak");

  if (playerEl) playerEl.innerText = "Turno: " + player;
  if (shotsEl) shotsEl.innerText = "🍻 " + GameEngine.state.shots;
  if (streakEl) streakEl.innerText = "🔥 " + GameEngine.state.streak;
}

// --------------------
// SWIPE
// --------------------
let startX = 0;
let currentX = 0;
let velocity = 0;
let isDragging = false;
let lastX = 0;
let lastTime = 0;

card.addEventListener("mousedown", start);
card.addEventListener("touchstart", start);

function start(e) {
  isDragging = true;
  startX = getX(e);

  lastX = startX;
  lastTime = Date.now();

  card.style.transition = "none";

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

let frameRequested = false;

function move(e) {
  if (!isDragging) return;

  if (!frameRequested) {
    requestAnimationFrame(() => {
      handleMove(e);
      frameRequested = false;
    });
    frameRequested = true;
  }
}

function handleMove(e) {
  currentX = getX(e);
  const dx = currentX - startX;

  const now = Date.now();
  velocity = (currentX - lastX) / (now - lastTime);

  lastX = currentX;
  lastTime = now;

  const rotate = dx * 0.06;
  card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

  updateBadges(dx);
}

function end() {
  isDragging = false;

  card.style.transition = "transform 0.4s cubic-bezier(.22,1,.36,1)";

  const dx = currentX - startX;

  if (velocity > 0.5 || dx > 120) {
    swipe(1);
  } else if (velocity < -0.5 || dx < -120) {
    swipe(-1);
  } else {
    resetCard();
  }

  document.removeEventListener("mousemove", move);
  document.removeEventListener("touchmove", move);
}

function swipe(dir) {
  card.style.transform = `translateX(${dir * 800}px) rotate(${dir * 40}deg)`;

  if (dir === 1) {
    resolveAction("accept");
    card.style.boxShadow = "0 0 40px rgba(0,255,100,0.6)";
  } else {
    resolveAction("shot");
    card.style.boxShadow = "0 0 40px rgba(255,0,80,0.6)";
  }

  vibrate();

  setTimeout(() => {
    nextTurn();
    animateIn();
  }, 250);
}

function resetCard() {
  card.style.transform = "translateX(0) rotate(0)";
  hideBadges();
}

// --------------------
// ANIMATION
// --------------------
function animateIn() {
  card.style.transition = "none";
  card.style.transform = "scale(0.85) translateY(40px)";
  card.style.opacity = "0";

  setTimeout(() => {
    card.style.transition =
      "all 0.4s cubic-bezier(.22,1,.36,1)";
    card.style.transform = "scale(1) translateY(0)";
    card.style.opacity = "1";
  }, 10);
}

// --------------------
// BADGES
// --------------------
function updateBadges(dx) {
  const like = document.getElementById("likeBadge");
  const skip = document.getElementById("skipBadge");

  if (dx > 0) {
    like.style.opacity = Math.min(dx / 100, 1);
    skip.style.opacity = 0;
  } else {
    skip.style.opacity = Math.min(Math.abs(dx) / 100, 1);
    like.style.opacity = 0;
  }
}

function hideBadges() {
  document.getElementById("likeBadge").style.opacity = 0;
  document.getElementById("skipBadge").style.opacity = 0;
}

// --------------------
// UTILS
// --------------------
function vibrate() {
  if (navigator.vibrate) navigator.vibrate(30);
}

function getX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

// --------------------
// BUTTONS
// --------------------
document.getElementById("accept").onclick = () => swipe(1);
document.getElementById("skip").onclick = () => swipe(-1);

document.getElementById("shot").onclick = () => {
  resolveAction("shot");
  nextTurn();
};

// --------------------
// SELECTS
// --------------------
document.getElementById("game").onchange = async (e) => {
  currentGame = e.target.value;
  await loadData();
};

document.getElementById("level").onchange = (e) => {
  currentLevel = e.target.value;
  usedQuestions = [];
  showCard();
};

function $(id) {
  return document.getElementById(id);
}

const el = $("score");
if (el) el.innerText = "...";

document.addEventListener("DOMContentLoaded", init);

function get(id) {
  return document.getElementById(id);
}

