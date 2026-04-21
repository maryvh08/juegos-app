// =====================
// STATE
// =====================
let data = {};
let currentGame = null;
let currentLevel = null;
let pendingMode = null;

// =====================
// HELPERS
// =====================
function getCard() {
  return document.getElementById("card");
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  renderPlayers();

  document.getElementById("startGame").onclick = () => {
    if (!GameEngine.state.players.length) return alert("Agrega jugadores");

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("gameSelector").classList.remove("hidden");
  };

  document.querySelectorAll("[data-game]").forEach(btn => {
    btn.onclick = () => {
      currentGame = btn.dataset.game;

      document.getElementById("gameSelector").classList.add("hidden");
      document.getElementById("levelSelector").classList.remove("hidden");
    };
  });

  document.querySelectorAll("[data-level]").forEach(btn => {
    btn.onclick = async () => {
      currentLevel = btn.dataset.level;

      document.getElementById("levelSelector").classList.add("hidden");
      document.getElementById("gameUI").classList.remove("hidden");

      await startGame();
    };
  });

  document.getElementById("backMenu").onclick = () => {
    document.getElementById("gameUI").classList.add("hidden");
    document.getElementById("gameSelector").classList.remove("hidden");
  };

  document.getElementById("chooseTruth").onclick = () => startMode("verdad");
  document.getElementById("chooseDare").onclick = () => startMode("reto");
});

// =====================
// DATA
// =====================
async function loadData(file = currentGame) {
  const res = await fetch(`data/${file}.json`);
  data = await res.json();
}

function getRandomQuestion() {
  const list = data[currentLevel];

  if (!list || !list.length) return { opcion1: "Sin datos", opcion2: "Sin datos" };

  return list[Math.floor(Math.random() * list.length)];
}

// =====================
// START GAME
// =====================
async function startGame() {
  await loadData();

  if (currentGame === "verdad_reto") {
    showModeSelector();
    return;
  }

  renderCard();
}

// =====================
// MODE SELECTOR
// =====================
function showModeSelector() {
  document.getElementById("modeSelector").classList.remove("hidden");
  document.querySelector(".swipe-container").classList.add("hidden");
}

async function startMode(mode) {
  pendingMode = mode;

  await loadData(mode === "verdad" ? "verdad_shot" : "verdad_reto");

  document.getElementById("modeSelector").classList.add("hidden");
  document.querySelector(".swipe-container").classList.remove("hidden");

  renderCard();
}

// =====================
// MAIN FLOW
// =====================
function nextTurn() {
  GameEngine.nextPlayer();

  if (currentGame === "verdad_reto") {
    showModeSelector();
    return;
  }

  renderCard();
}

// =====================
// CARD RENDER
// =====================
function renderCard() {
  const container = document.querySelector(".swipe-container");
  container.innerHTML = "";
  container.classList.remove("hidden");

  const q = getRandomQuestion();

  // 🔥 MODO QUÉ PREFIERES
  if (currentGame === "que_prefieres") {
    const container = document.querySelector(".swipe-container");
    container.innerHTML = "";
  
    const q = getRandomQuestion();
  
    const card1 = document.createElement("div");
    const card2 = document.createElement("div");
  
    card1.className = "card choice-card";
    card2.className = "card choice-card";
  
    card1.innerHTML = `<p>${q.opcion1}</p>`;
    card2.innerHTML = `<p>${q.opcion2}</p>`;
  
    // 👉 click = elegir
    card1.onclick = () => chooseCard(card1, -1);
    card2.onclick = () => chooseCard(card2, 1);
  
    container.appendChild(card1);
    container.appendChild(card2);
  
    updateUI();
    return;
  }

  // 🧱 RESTO DE JUEGOS (normal)
  const card = document.createElement("div");
  card.className = "card";
  card.id = "card";

  card.innerHTML = `<p>${q.texto || q}</p>`;

  container.appendChild(card);

  bindCard();
  animateIn();
  updateUI();
}

// =====================
// SWIPE
// =====================
function bindCard() {
  const card = getCard();
  if (!card) return;

  let startX = 0;

  card.onmousedown = (e) => startX = e.clientX;

  card.onmouseup = (e) => {
    const diff = e.clientX - startX;

    if (diff > 80) swipe(1);
    else if (diff < -80) swipe(-1);
    else nextTurn();
  };
}

function swipe(dir) {
  const card = getCard();
  if (!card) return;

  card.style.transform = `translateX(${dir * 800}px)`;

  setTimeout(() => nextTurn(), 200);
}

// =====================
// UI
// =====================
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

// =====================
// PLAYERS
// =====================
function renderPlayers() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  GameEngine.state.players.forEach((name, index) => {

    const div = document.createElement("div");
    div.className = "player-card";

    div.innerHTML = `
      <span class="player-name">${name}</span>
      <div class="player-actions">
        <button class="edit">✏️</button>
        <button class="delete">❌</button>
      </div>
    `;
    // ELIMINAR
    div.querySelector(".delete").onclick = () => {
      GameEngine.removePlayer(index);
      renderPlayers();
    };

    // EDITAR
    div.querySelector(".edit").onclick = () => {
      const newName = prompt("Nuevo nombre:", name);
      if (!newName) return;

      GameEngine.editPlayer(index, newName);
      renderPlayers();
    };

    list.appendChild(div);
  });
}

function addPlayer(name) {
  if (!name || !name.trim()) return;

  GameEngine.state.players.push(name.trim());
  GameEngine.savePlayers();
  renderPlayers();
}

// =====================
// ENGINE
// =====================
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
  },

  // ✅ ESTA FUNCIÓN FALTABA
  savePlayers() {
    localStorage.setItem("players", JSON.stringify(this.state.players));
  },

  // (opcional pero ya lo usas)
  removePlayer(index) {
    this.state.players.splice(index, 1);
    this.savePlayers();
  },

  editPlayer(index, newName) {
    this.state.players[index] = newName;
    this.savePlayers();
  }
};

// =====================
// PREFIERES
// =====================
function swipeChoice(choice) {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card, index) => {
    const dir = (index === 0 ? -1 : 1);
    card.style.transform = `translateX(${dir * 800}px)`;
  });

  setTimeout(() => nextTurn(), 200);
}

function bindChoiceSwipe() {
  const card = getCard();
  if (!card) return;

  let startX = 0;

  card.onmousedown = (e) => startX = e.clientX;

  card.onmouseup = (e) => {
    const diff = e.clientX - startX;

    if (diff > 80) {
      choose(2); // 👉 derecha
    } else if (diff < -80) {
      choose(1); // 👉 izquierda
    } else {
      nextTurn();
    }
  };
}

function choose(option) {
  const card = getCard();
  if (!card) return;

  const dir = option === 1 ? -1 : 1;

  card.style.transform = `translateX(${dir * 800}px) rotate(${dir * 10}deg)`;
  card.style.opacity = 0;

  setTimeout(() => nextTurn(), 250);
}

function chooseCard(card, dir) {
  const all = document.querySelectorAll(".choice-card");

  all.forEach(c => {
    if (c === card) {
      c.style.transform = `translateX(${dir * 800}px) scale(1.05)`;
      c.style.opacity = 1;
    } else {
      c.style.transform = `scale(0.8)`;
      c.style.opacity = 0;
    }
  });

  setTimeout(() => nextTurn(), 250);
}
// =====================
// BOTONES
// =====================
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

document.getElementById("addPlayer").onclick = () => {
  const input = document.getElementById("playerInput");

  addPlayer(input.value);

  input.value = "";
};

card.onmousemove = (e) => {
  if (!startX) return;

  const diff = e.clientX - startX;

  card.style.transform = `translateX(${diff}px) rotate(${diff / 20}deg)`;

  if (diff > 50) {
    card.style.background = "rgba(0,255,100,0.15)";
  } else if (diff < -50) {
    card.style.background = "rgba(255,80,80,0.15)";
  } else {
    card.style.background = "";
  }
};

card.onmouseleave = () => {
  card.style.transform = "";
  card.style.background = "";
};
