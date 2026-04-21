// --------------------
// STATE
// --------------------
let data = {};
let currentGame = null;
let currentLevel = null;
let pendingMode = null;
let currentPref = null;

// --------------------
// ENGINE (igual)
// --------------------
function initApp() {

  // BOTÓN INICIAR
  const startBtn = document.getElementById("startGame");
  if (startBtn) {
    startBtn.onclick = () => {
      if (!GameEngine.state.players.length) {
        alert("Agrega jugadores");
        return;
      }

      document.getElementById("setup").classList.add("hidden");
      document.getElementById("gameSelector").classList.remove("hidden");
    };
  }

  // BOTONES DE JUEGOS
  document.querySelectorAll("[data-game]").forEach(btn => {
    btn.onclick = () => {
      currentGame = btn.dataset.game;

      document.getElementById("gameSelector").classList.add("hidden");
      document.getElementById("levelSelector").classList.remove("hidden");
    };
  });

  // NIVELES
  document.querySelectorAll("[data-level]").forEach(btn => {
    btn.onclick = async () => {
      currentLevel = btn.dataset.level;

      document.getElementById("levelSelector").classList.add("hidden");
      document.getElementById("gameUI").classList.remove("hidden");

      await startGame();
    };
  });

  console.log("✅ App inicializada correctamente");
}

const GameEngine = {
  state: {
    players: JSON.parse(localStorage.getItem("players")) || [],
    currentIndex: Number(localStorage.getItem("turn")) || 0
  },

  nextPlayer() {
    if (!this.state.players.length) return;
    this.state.currentIndex =
      (this.state.currentIndex + 1) % this.state.players.length;

    localStorage.setItem("turn", this.state.currentIndex);
  },

  currentPlayer() {
    return this.state.players[this.state.currentIndex];
  }
};

function resetGameUI() {
  document.querySelector(".swipe-container").innerHTML = "";
  document.getElementById("modeSelector")?.classList.add("hidden");
  document.getElementById("prefSelector")?.classList.add("hidden");
}

// --------------------
// HELPERS
// --------------------
function getCard() {
  return document.getElementById("card");
}

function isPrefieres() {
  return currentGame === "que_prefieres";
}

// --------------------
// INIT
// --------------------
document.addEventListener("DOMContentLoaded", init);

function renderPlayers() {
  const list = document.getElementById("playersList");
  if (!list) return;

  list.innerHTML = "";

  GameEngine.state.players.forEach((name, index) => {
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <span>${name}</span>
    `;

    list.appendChild(card);
  });
}

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
// LOAD DATA
// --------------------
async function loadData(file = currentGame) {
  const res = await fetch(`data/${file}.json`);
  data = await res.json();
}

// --------------------
// START GAME
// --------------------
async function startGame() {
  await loadData();

  if (currentGame === "verdad_reto") {
    showModeSelector();
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

// --------------------
// MODE SELECTOR (VERDAD/RETO)
// --------------------
function showModeSelector() {
  document.getElementById("modeSelector").classList.remove("hidden");
  document.querySelector(".swipe-container").classList.add("hidden");
}

async function startMode(mode) {
  pendingMode = mode;

  const file = mode === "verdad" ? "verdad_shot" : "verdad_reto";

  await loadData(file);

  document.getElementById("modeSelector").classList.add("hidden");
  document.querySelector(".swipe-container").classList.remove("hidden");

  showCard();
  animateIn();
  updateUI();
}

// --------------------
// QUE PREFIERES
// --------------------
function showPrefieres() {
  document.querySelector(".swipe-container").classList.add("hidden");

  const pref = document.getElementById("prefSelector");
  pref.classList.remove("hidden");

  const q = getRandomQuestion();
  currentPref = q;

  document.getElementById("opt1").innerText = q.opcion1;
  document.getElementById("opt2").innerText = q.opcion2;
}

// --------------------
// QUESTIONS
// --------------------
function getRandomQuestion() {
  const list = data[currentLevel];
  return list[Math.floor(Math.random() * list.length)];
}

// --------------------
// CARD
// --------------------
function showCard() {
  const container = document.querySelector(".swipe-container");
  container.innerHTML = "";

  container.classList.remove("hidden");

  const q = getRandomQuestion();

  const card = document.createElement("div");
  card.className = "card dynamic-card";
  card.id = "card";

  if (isPrefieres()) {
    card.innerHTML = `
      <div class="prefieres">
        <div class="option left">👈 ${q.opcion2}</div>
        <div class="divider">VS</div>
        <div class="option right">${q.opcion1} 👉</div>
      </div>
    `;
  } else {
    card.innerHTML = `<p>${q.texto || q}</p>`;
  }

  container.appendChild(card);

  bindCard();
}

// --------------------
// FLOW NEXT
// --------------------
function nextTurn() {
  GameEngine.nextPlayer();

  if (currentGame === "que_prefieres") {
    showPrefieres();
    return;
  }

  if (currentGame === "verdad_reto") {
    showModeSelector();
    return;
  }

  showCard();
  animateIn();
  updateUI();
}

// --------------------
// SWIPE SIMPLIFICADO
// --------------------
function swipe(dir) {
  const card = getCard();
  if (!card) return;

  card.style.transform = `translateX(${dir * 800}px)`;

  setTimeout(() => {
    nextTurn();
  }, 200);
}

// --------------------
// CLICK PREF
// --------------------
document.getElementById("opt1").onclick = () => {
  console.log("Opción 1:", currentPref.opcion1);
  nextTurn();
};

document.getElementById("opt2").onclick = () => {
  console.log("Opción 2:", currentPref.opcion2);
  nextTurn();
};

// --------------------
// MODE BUTTONS
// --------------------
document.getElementById("chooseTruth").onclick = () => {
  startMode("verdad");
};

document.getElementById("chooseDare").onclick = () => {
  startMode("reto");
};

// --------------------
// UI
// --------------------
function updateUI() {
  document.getElementById("currentPlayer").innerText =
    "Turno: " + GameEngine.currentPlayer();
}

function animateIn() {
  const card = getCard();
  if (!card) return;

  card.style.opacity = 0;
  card.style.transform = "scale(0.9)";

  setTimeout(() => {
    card.style.transition = "0.3s";
    card.style.opacity = 1;
    card.style.transform = "scale(1)";
  }, 50);
}

// --------------------
// SWIPE BIND (IMPORTANTE)
// --------------------
function bindCard() {
  const card = getCard();
  if (!card) return;

  if (currentGame === "verdad_reto" || currentGame === "que_prefieres") return;

  let startX = 0;

  card.onmousedown = (e) => {
    startX = e.clientX;

    document.onmouseup = (ev) => {
      const diff = ev.clientX - startX;

      if (diff > 80) swipe(1);
      else if (diff < -80) swipe(-1);

      document.onmouseup = null;
    };
  };
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

document.getElementById("backMenu").onclick = () => {

  // 🧼 ocultar juego
  document.getElementById("gameUI").classList.add("hidden");
  document.getElementById("modeSelector")?.classList.add("hidden");
  document.getElementById("prefSelector")?.classList.add("hidden");

  // 🧼 limpiar cartas
  const container = document.querySelector(".swipe-container");
  if (container) container.innerHTML = "";

  // 🎮 volver a selector
  document.getElementById("gameSelector").classList.remove("hidden");

  // ⚠️ importante: reset parcial de estado de juego
  currentGame = null;
  currentLevel = null;
  pendingMode = null;
  currentPref = null;
};
