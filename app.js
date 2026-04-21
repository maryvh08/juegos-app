// =====================
// STATE
// =====================
let data = {};
let currentGame = null;
let currentLevel = null;

// =====================
// ENGINE
// =====================
const GameEngine = {
  state: {
    players: JSON.parse(localStorage.getItem("players")) || [],
    currentIndex: 0
  },

  addPlayer(name) {
    this.state.players.push(name);
    this.save();
  },

  removePlayer(index) {
    this.state.players.splice(index, 1);
    this.save();
  },

  editPlayer(index, newName) {
    this.state.players[index] = newName;
    this.save();
  },

  nextPlayer() {
    if (!this.state.players.length) return;
    this.state.currentIndex =
      (this.state.currentIndex + 1) % this.state.players.length;
  },

  currentPlayer() {
    return this.state.players[this.state.currentIndex];
  },

  save() {
    localStorage.setItem("players", JSON.stringify(this.state.players));
  }
};

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {

  renderPlayers();

  // AGREGAR JUGADOR
  document.getElementById("addPlayer").onclick = () => {
    const input = document.getElementById("playerInput");
    if (!input.value.trim()) return;

    GameEngine.addPlayer(input.value.trim());
    input.value = "";

    renderPlayers();
  };

  // INICIAR
  document.getElementById("startGame").onclick = () => {
    if (!GameEngine.state.players.length) {
      alert("Agrega jugadores");
      return;
    }

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("gameSelector").classList.remove("hidden");
  };

  // JUEGOS
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

  // VOLVER
  document.getElementById("backMenu").onclick = () => {
    document.getElementById("gameUI").classList.add("hidden");
    document.getElementById("gameSelector").classList.remove("hidden");
  };

  document.getElementById("chooseTruth").onclick = () => startMode("verdad");
  document.getElementById("chooseDare").onclick = () => startMode("reto");
});

// =====================
// PLAYERS UI
// =====================
function renderPlayers() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  GameEngine.state.players.forEach((name, index) => {

    const div = document.createElement("div");
    div.className = "player-card";

    div.innerHTML = `
      <span>${name}</span>
      <div>
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

// =====================
// DATA
// =====================
async function loadData(file = currentGame) {
  const res = await fetch(`data/${file}.json`);
  data = await res.json();
}

function getRandomQuestion() {
  const list = data[currentLevel];
  return list[Math.floor(Math.random() * list.length)];
}

// =====================
// GAME
// =====================
async function startGame() {
  await loadData();

  if (currentGame === "verdad_reto") {
    document.getElementById("modeSelector").classList.remove("hidden");
    return;
  }

  renderCard();
}

async function startMode(mode) {
  await loadData(mode === "verdad" ? "verdad_shot" : "verdad_reto");

  document.getElementById("modeSelector").classList.add("hidden");

  renderCard();
}

function nextTurn() {
  GameEngine.nextPlayer();

  if (currentGame === "verdad_reto") {
    document.getElementById("modeSelector").classList.remove("hidden");
    return;
  }

  renderCard();
}

// =====================
// CARD
// =====================
function renderCard() {
  const container = document.querySelector(".swipe-container");
  container.innerHTML = "";

  const q = getRandomQuestion();

  const card = document.createElement("div");
  card.className = "card";
  card.id = "card";

  card.innerHTML = `<p>${q.texto || q}</p>`;

  container.appendChild(card);

  card.onclick = nextTurn; // 👈 CLAVE: CLICK SIMPLE
  updateUI();
}

// =====================
// UI
// =====================
function updateUI() {
  document.getElementById("currentPlayer").innerText =
    "Turno: " + GameEngine.currentPlayer();
}
