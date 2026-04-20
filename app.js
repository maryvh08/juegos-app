// --------------------
// STATE (Game Engine)
// --------------------
const sounds = {
  shot: new Audio("cheersglass.mp3")
};

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
let currentGame = null;
let currentLevel = null;
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
  const savedGame = localStorage.getItem("currentGame");
  const savedLevel = localStorage.getItem("currentLevel");
  
  if (savedGame && savedLevel) {
    currentGame = savedGame;
    currentLevel = savedLevel;
  
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
};

function renderPlayers() {
  const list = document.getElementById("playersList");
  if (list) {
    list.innerText = GameEngine.state.players.join(", ");
  }
}

// --------------------
// START FLOW
// --------------------
document.getElementById("startGame").onclick = () => {
  if (!GameEngine.state.players.length) {
    return alert("Agrega jugadores");
  }

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("gameSelector").classList.remove("hidden");
};

// --------------------
// SELECT GAME
// --------------------
document.querySelectorAll("[data-game]").forEach(el => {
  el.onclick = () => {
    currentGame = el.dataset.game;

    document.getElementById("gameSelector").classList.add("hidden");
    document.getElementById("levelSelector").classList.remove("hidden");
  };
});

// --------------------
// SELECT LEVEL
// --------------------
document.querySelectorAll("[data-level]").forEach(el => {
  el.onclick = () => {
    currentLevel = el.dataset.level;

    document.getElementById("levelSelector").classList.add("hidden");
    document.getElementById("gameUI").classList.remove("hidden");

    startGame();
  };
});

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
    if (questionEl) {
      questionEl.innerText = "Error cargando preguntas 😢";
    }
  }
}

// --------------------
// GAME FLOW
// --------------------
async function startGame() {
  await loadData();
  showCard();
  updateUI();
  animateIn();
  localStorage.setItem("currentGame", currentGame);
  localStorage.setItem("currentLevel", currentLevel);
}

function nextTurn() {
  if (!skipTurnChange) {
    GameEngine.nextPlayer();
  }

  skipTurnChange = false;
  GameEngine.state.streak++;

  showCard();
  updateUI();
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
  const container = document.querySelector(".swipe-container");

  // eliminar cartas viejas
  container.querySelectorAll(".dynamic-card").forEach(c => c.remove());

  // crear 3 cartas (stack)
  for (let i = 2; i >= 0; i--) {
    const newCard = document.createElement("div");
    newCard.className = "card dynamic-card";

    if (i === 0) {
      newCard.id = "card"; // activa
      newCard.innerHTML = `
        <p>${getRandomQuestion()}</p>
        <div class="badge like" id="likeBadge">✔</div>
        <div class="badge skip" id="skipBadge">✖</div>
      `;
    }

    newCard.style.transform = `scale(${1 - i * 0.05}) translateY(${i * 10}px)`;
    newCard.style.zIndex = 10 - i;

    container.appendChild(newCard);
  }

  bindCard(); // 👈 importante
}

function bindCard() {
  const newCard = document.getElementById("card");
  if (!newCard) return;

  newCard.addEventListener("mousedown", start);
  newCard.addEventListener("touchstart", start);
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
    scoreEl.innerText =
      "⭐ " + (GameEngine.state.scores[player] || 0);
  }
}

// --------------------
// COLOR
// --------------------
function updateColor() {
  if (!card) return;

  const colors = {
    suave: "linear-gradient(135deg, #2e7d32, #66bb6a)",
    medio: "linear-gradient(135deg, #f9a825, #fdd835)",
    alto: "linear-gradient(135deg, #c62828, #ef5350)"
  };

  card.style.background = colors[currentLevel] || colors.suave;
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

if (card) {
  card.addEventListener("mousedown", start);
  card.addEventListener("touchstart", start);
}

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
  velocity = 0.8 * velocity + 0.2 * ((currentX - lastX) / (now - lastTime));

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
// ACTIONS
// --------------------
function swipe(dir) {
  card.style.transform =
    `translateX(${dir * 800}px) rotate(${dir * 40}deg)`;

  if (dir === 1) {
    GameEngine.addPoint(GameEngine.currentPlayer());
    sounds.accept.play();
  } else {
    GameEngine.addShot();
    sounds.reject.play();
    sounds.shot.play();
  }

  vibrate();

  setTimeout(() => {
    nextTurn();
    animateIn();
  }, 250);
}

// --------------------
// FX
// --------------------
function resetCard() {
  if (!card) return;
  card.style.transform = "translateX(0) rotate(0)";
  hideBadges();
}

function animateIn() {
  if (!card) return;

  card.style.transition = "none";
  card.style.transform = "scale(0.85) translateY(40px)";
  card.style.opacity = "0";

  setTimeout(() => {
    card.style.transition = "all 0.4s cubic-bezier(.22,1,.36,1)";
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

  if (!like || !skip) return;

  if (dx > 0) {
    like.style.opacity = Math.min(dx / 100, 1);
    skip.style.opacity = 0;
  } else {
    skip.style.opacity = Math.min(Math.abs(dx) / 100, 1);
    like.style.opacity = 0;
  }
}

function hideBadges() {
  const like = document.getElementById("likeBadge");
  const skip = document.getElementById("skipBadge");

  if (like) like.style.opacity = 0;
  if (skip) skip.style.opacity = 0;
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
document.getElementById("accept")?.addEventListener("click", () => swipe(1));
document.getElementById("skip")?.addEventListener("click", () => swipe(-1));

document.getElementById("shot")?.addEventListener("click", () => {
  GameEngine.addShot();
  nextTurn();
});

document.getElementById("backMenu").onclick = () => {
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("gameSelector").classList.remove("hidden");
};
