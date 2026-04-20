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
    if (!this.state.players.length) return;

    this.state.currentIndex =
      (this.state.currentIndex + 1) % this.state.players.length;

    this.save();
  },

  resetStreak() {
    this.state.streak = 0;
    this.save();
  },

  currentPlayer() {
    return this.state.players[this.state.currentIndex];
  },

  save() {
    localStorage.setItem("players", JSON.stringify(this.state.players));
    localStorage.setItem("scores", JSON.stringify(this.state.scores));
    localStorage.setItem("shots", this.state.shots);
    localStorage.setItem("turn", this.state.currentIndex);
  }
};

// --------------------
// CONFIG
// --------------------
let data = {};
let currentGame = "verdad";
const games = ["verdad", "reto", "nunca"];
let gameIndex = 0;

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
document.addEventListener("DOMContentLoaded", init);

function init() {
  renderPlayers();
  updateUI();

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
  updateUI();
};

function renderPlayers() {
  document.getElementById("playersList").innerText =
    GameEngine.state.players.join(", ");
}

document.getElementById("startGame").onclick = () => {
  if (!GameEngine.state.players.length) {
    return alert("Agrega jugadores");
  }

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");

  startGame();
};

// --------------------
// GAME SWITCH
// --------------------
function nextGame() {
  gameIndex = (gameIndex + 1) % games.length;
  currentGame = games[gameIndex];
}

// --------------------
// DATA
// --------------------
async function loadData() {
  try {
    const res = await fetch(`data/${currentGame}.json`);
    if (!res.ok) throw new Error("Error cargando JSON");

    data = await res.json();
    usedQuestions = [];
  } catch (e) {
    console.error(e);
    questionEl.innerText = "Error cargando preguntas 😢";
  }
}

// --------------------
// FLOW
// --------------------
async function startGame() {
  await loadData();
  updateUI();
  animateIn();
}

async function changeGame() {
  nextGame();
  await loadData();
  showCard();
  updateUI();
}

function nextTurn() {
  if (!skipTurnChange) {
    GameEngine.nextPlayer();
  }

  skipTurnChange = false;
  GameEngine.state.streak++;

  changeGame();
}

// --------------------
// QUESTIONS
// --------------------
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
// CARD
// --------------------
function showCard() {
  const question = getRandomQuestion();
  questionEl.innerText = question;

  resetCard();
  updateColor();
}

// --------------------
// UI
// --------------------
function updateUI() {
  const player = GameEngine.currentPlayer();

  const currentPlayerEl = document.getElementById("currentPlayer");
  const shotsEl = document.getElementById("shots");
  const streakEl = document.getElementById("streak");
  const scoreEl = document.getElementById("score");

  if (currentPlayerEl) {
    currentPlayerEl.innerText = "Turno: " + player;
  }

  if (shotsEl) {
    shotsEl.innerText = "🍻 " + GameEngine.state.shots;
  }

  if (streakEl) {
    streakEl.innerText = "🔥 " + GameEngine.state.streak;
  }

  if (scoreEl) {
    scoreEl.innerText = "⭐ " + (GameEngine.state.scores[player] || 0);
  }
}
// --------------------
// COLOR
// --------------------
function updateColor() {
  const colors = {
    suave: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    medio: "linear-gradient(135deg, #f9a825, #fdd835)",
    alto: "linear-gradient(135deg, #c62828, #ef5350)"
  };

  card.style.background = colors[currentLevel] || colors.suave;
}

// --------------------
// SWIPE (FIXED)
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
  if (!e.target.closest("#card")) return;

  isDragging = true;
  startX = getX(e);

  lastX = startX;
  lastTime = Date.now();

  card.style.transition = "none";

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, { passive: false });
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

function move(e) {
  if (!isDragging) return;

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

  const dx = currentX - startX;

  card.style.transition = "transform 0.4s cubic-bezier(.22,1,.36,1)";

  if (velocity > 0.5 || dx > 120) swipe(1);
  else if (velocity < -0.5 || dx < -120) swipe(-1);
  else resetCard();

  document.removeEventListener("mousemove", move);
  document.removeEventListener("touchmove", move);
}

// --------------------
// SWIPE RESULT
// --------------------
function swipe(dir) {
  card.style.transform =
    `translateX(${dir * 800}px) rotate(${dir * 40}deg)`;

  if (dir === 1) GameEngine.addPoint(GameEngine.currentPlayer());
  else GameEngine.addShot();

  vibrate();

  setTimeout(() => {
    nextTurn();
    animateIn();
  }, 250);
}

// --------------------
// CARD FX
// --------------------
function resetCard() {
  card.style.transform = "translateX(0) rotate(0)";
  hideBadges();
}

function animateIn() {
  card.style.transition = "none";
  card.style.transform = "scale(0.85) translateY(40px)";
  card.style.opacity = "0";

  setTimeout(() => {
    card.style.transition =
      "all 0.4s cubic-bezier(.22,1,.36,1)";
    card.style.transform = "scale(1)";
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
  GameEngine.addShot();
  nextTurn();
};
