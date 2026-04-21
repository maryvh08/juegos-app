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
let pendingMode = null; // "verdad" | "reto"
let currentPref = null;

// --------------------
// DOM
// --------------------
const questionEl = document.getElementById("question");
const needsModeSelector = (game) => game === "verdad_reto";

// 👉 NUEVO: siempre obtener la carta actual
function getCard() {
  return document.getElementById("card");
}

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
  if (!list) return;

  list.innerHTML = "";

  GameEngine.state.players.forEach((name, index) => {
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <span class="player-name">${name}</span>

      <div class="player-actions">
        <button class="edit">✏️</button>
        <button class="delete">❌</button>
      </div>
    `;

    // ❌ eliminar jugador
    card.querySelector(".delete").onclick = () => {
      GameEngine.state.players.splice(index, 1);
      delete GameEngine.state.scores[name];

      // ajustar turno si es necesario
      if (GameEngine.state.currentIndex >= GameEngine.state.players.length) {
        GameEngine.state.currentIndex = 0;
      }

      GameEngine.save();
      renderPlayers();
    };

    // ✏️ editar jugador
    card.querySelector(".edit").onclick = () => {
      const newName = prompt("Nuevo nombre:", name);

      if (!newName || !newName.trim()) return;

      const clean = newName.trim();

      // actualizar scores
      GameEngine.state.scores[clean] = GameEngine.state.scores[name] || 0;
      delete GameEngine.state.scores[name];

      GameEngine.state.players[index] = clean;

      GameEngine.save();
      renderPlayers();
    };

    list.appendChild(card);
  });
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

    document.getElementById("modeSelector")?.classList.add("hidden");

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

  showModeSelectorIfNeeded();

  if (currentGame !== "verdad_reto") {
    showCard();
    animateIn();
  }

  updateUI();

  localStorage.setItem("currentGame", currentGame);
  localStorage.setItem("currentLevel", currentLevel);
}

function nextCardFlow() {

  hideAllGameUIs();

  if (currentGame === "verdad_reto") {
    document.getElementById("modeSelector").classList.remove("hidden");
    document.querySelector(".swipe-container").classList.add("hidden");
    return;
  }

  if (currentGame === "que_prefieres") {
    showPrefieres();
    return;
  }

  showCard();
  animateIn();
  updateUI();
}

function nextTurn() {
  if (currentGame !== "nunca") {
    GameEngine.nextPlayer();
  }

  GameEngine.state.streak++;

  // ocultar selects
  document.getElementById("prefSelector")?.classList.add("hidden");

  nextCardFlow();
}

function showModeSelectorIfNeeded() {
  const mode = document.getElementById("modeSelector");
  const swipe = document.querySelector(".swipe-container");

  if (currentGame === "verdad_reto") {
    mode.classList.remove("hidden");
    swipe.classList.add("hidden");
  } else {
    mode?.classList.add("hidden");
    swipe.classList.remove("hidden");
  }
}
// --------------------
// QUESTIONS
// --------------------
function getRandomQuestion() {
  const preguntas = data[currentLevel];

  if (!preguntas?.length) return "Sin preguntas disponibles";

  const q = preguntas[Math.floor(Math.random() * preguntas.length)];

  // 👉 normalizar salida
  if (currentGame === "que_prefieres") {
    return {
      opcion1: q.opcion1,
      opcion2: q.opcion2
    };
  }

  return q;
}

async function loadModeData() {
  try {
    let file;

    if (pendingMode === "verdad") {
      file = "verdad_shot";
    } 
    else if (pendingMode === "reto") {
      file = "verdad_reto";
    } 
    else {
      throw new Error("Modo no definido");
    }

    const res = await fetch(`data/${file}.json`);
    if (!res.ok) throw new Error("Error cargando JSON");

    data = await res.json();
    usedQuestions = [];

  } catch (e) {
    console.error(e);
    questionEl.innerText = "Error cargando preguntas 😢";
  }
}

function hideAllSelectors() {
  document.getElementById("modeSelector")?.classList.add("hidden");
  document.getElementById("prefSelector")?.classList.add("hidden");
  document.querySelector(".swipe-container").classList.remove("hidden");
}

function hideAllGameUIs() {
  document.getElementById("modeSelector")?.classList.add("hidden");
  document.getElementById("prefSelector")?.classList.add("hidden");
  document.querySelector(".swipe-container").classList.remove("hidden");
}

// --------------------
// CARD
// --------------------
function showCard() {
  const container = document.querySelector(".swipe-container");

  container.querySelectorAll(".dynamic-card").forEach(c => c.remove());

  for (let i = 2; i >= 0; i--) {
    const newCard = document.createElement("div");
    newCard.className = "card dynamic-card";

    if (i === 0) {
      newCard.id = "card";

      const q = getRandomQuestion();

      // 🔥 modo ¿Qué prefieres?
      if (isPrefieres() && typeof q === "object") {

        const opcion1 = q.opcion1 || "Opción 1";
        const opcion2 = q.opcion2 || "Opción 2";

        newCard.innerHTML = `
          <div class="prefieres">
            <div class="option left">👈 ${opcion2}</div>
            <div class="divider">VS</div>
            <div class="option right">${opcion1} 👉</div>
          </div>
        `;

      } else {
        // 🎴 modo normal
        newCard.innerHTML = `<p>${q}</p>`;
      }
    }

    newCard.style.transform = `scale(${1 - i * 0.05}) translateY(${i * 10}px)`;
    newCard.style.zIndex = 10 - i;

    container.appendChild(newCard);
  }

  bindCard();
  updateColor();
}
function bindCard() {
  const card = getCard();
  if (!card) return;

  card.addEventListener("mousedown", start);
  card.addEventListener("touchstart", start);
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

  if (currentGame === "nunca") {
    currentPlayerEl.innerText = "Todos juegan 🍻";
  } else {
    currentPlayerEl.innerText = "Turno: " + player;
  }
}

// --------------------
// COLOR
// --------------------
function updateColor() {
  const card = getCard();
  if (!card) return;

  // 🚫 NO aplicar en qué prefieres
  if (currentGame === "que_prefieres") return;

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
let moved = false;

function start(e) {
  if (!e.target.closest("#card")) return;

  isDragging = true;
  moved = false;

  startX = getX(e);
  currentX = startX;

  lastX = startX;
  lastTime = Date.now();

  const card = getCard();
  if (card) card.style.transition = "none";

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move, { passive: false });
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

function move(e) {
  if (!isDragging) return;

  currentX = getX(e);
  const dx = currentX - startX;

  if (Math.abs(dx) > 10) moved = true;

  const now = Date.now();
  velocity = 0.8 * velocity + 0.2 * ((currentX - lastX) / (now - lastTime));

  lastX = currentX;
  lastTime = now;

  const card = getCard();
  if (!card) return;

  const rotate = dx * 0.06;
  card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
}

function end() {
  if (!isDragging) return;
  isDragging = false;

  const dx = currentX - startX;
  const card = getCard();
  if (!card) return;

  card.style.transition = "transform 0.3s ease";

  if (!moved) {
    nextTurn();
    animateIn();
  } else if (velocity > 0.5 || dx > 120) {
    swipe(1);
  } else if (velocity < -0.5 || dx < -120) {
    swipe(-1);
  } else {
    resetCard();
  }

  document.removeEventListener("mousemove", move);
  document.removeEventListener("touchmove", move);
}

// --------------------
// ACTIONS
// --------------------
function swipe(dir) {
  const card = getCard();
  if (!card) return;

  // 👉 detectar elección
  if (isPrefieres()) {
    const choice = dir === 1 ? "opcion1" : "opcion2";
    console.log("Elegido:", choice);
  }

  card.style.transform =
    `translateX(${dir * 800}px) rotate(${dir * 40}deg)`;

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
  const card = getCard();
  if (!card) return;

  card.style.transform = "translateX(0) rotate(0)";
}

function animateIn() {
  const card = getCard();
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
// UTILS
// --------------------
function vibrate() {
  if (navigator.vibrate) navigator.vibrate(30);
}

function getX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

function startQuestionRound() {
  document.getElementById("modeSelector").classList.add("hidden");
  document.querySelector(".swipe-container").classList.remove("hidden");

  loadModeData().then(() => {
    showCard();
    animateIn();
    updateUI();
  });
}

function isPrefieres() {
  return currentGame === "que_prefieres";
}

function showPrefieres() {

  hideAllGameUIs();

  const q = getRandomQuestion();

  const pref = document.getElementById("prefSelector");
  pref.classList.remove("hidden");

  document.getElementById("opt1").innerText = q.opcion1;
  document.getElementById("opt2").innerText = q.opcion2;
}

// --------------------
// BUTTONS
// --------------------
document.getElementById("backMenu").onclick = () => {
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("gameSelector").classList.remove("hidden");
};

document.getElementById("backHome").onclick = () => {
  // ocultar todo
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("gameSelector").classList.add("hidden");
  document.getElementById("levelSelector").classList.add("hidden");

  // mostrar setup (pantalla inicial)
  document.getElementById("setup").classList.remove("hidden");

  // limpiar estado de partida actual (pero NO jugadores)
  localStorage.removeItem("currentGame");
  localStorage.removeItem("currentLevel");

  currentGame = null;
  currentLevel = null;
};

document.getElementById("resetAll").onclick = () => {

  const ok = confirm("¿Seguro que quieres borrar TODO?");

  if (!ok) return;

  // 🧹 limpiar localStorage
  localStorage.removeItem("players");
  localStorage.removeItem("scores");
  localStorage.removeItem("shots");
  localStorage.removeItem("turn");
  localStorage.removeItem("currentGame");
  localStorage.removeItem("currentLevel");

  // 🧠 reset estado en memoria
  GameEngine.state.players = [];
  GameEngine.state.scores = {};
  GameEngine.state.shots = 0;
  GameEngine.state.streak = 0;
  GameEngine.state.currentIndex = 0;

  currentGame = null;
  currentLevel = null;
  usedQuestions = [];

  // 🔄 volver a pantalla inicial
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("gameSelector").classList.add("hidden");
  document.getElementById("levelSelector").classList.add("hidden");

  document.getElementById("setup").classList.remove("hidden");

  // 🧼 limpiar UI
  renderPlayers();
  updateUI();
};

document.getElementById("chooseTruth").onclick = () => {
  pendingMode = "verdad";
  startQuestionRound();
};

document.getElementById("chooseDare").onclick = () => {
  pendingMode = "reto";
  startQuestionRound();
};

document.getElementById("opt1").onclick = () => {
  console.log("Eligió:", currentPref.opcion1);
  nextTurn();
};

document.getElementById("opt2").onclick = () => {
  console.log("Eligió:", currentPref.opcion2);
  nextTurn();
};
