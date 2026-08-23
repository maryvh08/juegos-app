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

function getContainer() {
  return document.querySelector(".swipe-container");
}

function $(id) {
  return document.getElementById(id);
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  renderPlayers();

  const startGameBtn = $("startGame");
  const backMenuBtn = $("backMenu");
  const chooseTruthBtn = $("chooseTruth");
  const chooseDareBtn = $("chooseDare");
  const backHomeBtn = $("backHome");
  const addPlayerBtn = $("addPlayer");

  // =====================
  // INICIAR
  // =====================
  if (startGameBtn) {
    startGameBtn.onclick = () => {
      if (!GameEngine.state.players.length) {
        alert("Agrega jugadores");
        return;
      }

      $("setup")?.classList.add("hidden");
      $("gameSelector")?.classList.remove("hidden");
    };
  }

  // =====================
  // SELECCIONAR JUEGO
  // =====================
  document.querySelectorAll("[data-game]").forEach(btn => {
    btn.onclick = () => {
      currentGame = btn.dataset.game;
      pendingMode = null;

      $("gameSelector")?.classList.add("hidden");
      $("levelSelector")?.classList.remove("hidden");
    };
  });

  // =====================
  // SELECCIONAR NIVEL
  // =====================
  document.querySelectorAll("[data-level]").forEach(btn => {
    btn.onclick = async () => {
      currentLevel = btn.dataset.level;

      $("levelSelector")?.classList.add("hidden");
      $("gameUI")?.classList.remove("hidden");

      await startGame();
    };
  });

  // =====================
  // VOLVER AL MENÚ DE JUEGOS
  // =====================
  if (backMenuBtn) {
    backMenuBtn.onclick = () => {
      resetCurrentGame();

      $("gameUI")?.classList.add("hidden");
      $("levelSelector")?.classList.add("hidden");
      $("gameSelector")?.classList.remove("hidden");
    };
  }

  // =====================
  // VERDAD
  // =====================
  if (chooseTruthBtn) {
    chooseTruthBtn.onclick = () => startMode("verdad");
  }

  // =====================
  // RETO
  // =====================
  if (chooseDareBtn) {
    chooseDareBtn.onclick = () => startMode("reto");
  }

  // =====================
  // VOLVER A HOME
  // =====================
  if (backHomeBtn) {
    backHomeBtn.onclick = () => {
      resetCurrentGame();

      $("gameUI")?.classList.add("hidden");
      $("gameSelector")?.classList.add("hidden");
      $("levelSelector")?.classList.add("hidden");
      $("modeSelector")?.classList.add("hidden");

      $("setup")?.classList.remove("hidden");

      localStorage.removeItem("currentGame");
      localStorage.removeItem("currentLevel");
    };
  }

  // =====================
  // AGREGAR JUGADOR
  // =====================
  if (addPlayerBtn) {
    addPlayerBtn.onclick = () => {
      const input = $("playerInput");

      if (!input) return;

      addPlayer(input.value);
      input.value = "";
      input.focus();
    };
  }
  const backToGamesBtn = $("backToGames");

  if (backToGamesBtn) {
    backToGamesBtn.onclick = () => {
      currentGame = null;
      currentLevel = null;
      pendingMode = null;
      data = {};
  
      const container = getContainer();
  
      if (container) {
        container.innerHTML = "";
        container.classList.remove("qp-mode");
      }
  
      $("levelSelector")?.classList.add("hidden");
      $("gameUI")?.classList.add("hidden");
      $("modeSelector")?.classList.add("hidden");
  
      $("gameSelector")?.classList.remove("hidden");
    };
  }
});

// =====================
// RESET GAME
// =====================
function resetCurrentGame() {
  currentGame = null;
  currentLevel = null;
  pendingMode = null;
  data = {};

  const container = getContainer();

  if (container) {
    container.classList.remove("qp-mode");
    container.classList.remove("hidden");
    container.innerHTML = "";
  }

  $("modeSelector")?.classList.add("hidden");

  // Reiniciar turno al jugador inicial
  GameEngine.resetTurn();
}

// =====================
// DATA
// =====================
async function loadData(file = currentGame) {
  if (!file) {
    data = {};
    return;
  }

  try {
    const res = await fetch(`data/${file}.json`);

    if (!res.ok) {
      throw new Error(`No se pudo cargar data/${file}.json`);
    }

    data = await res.json();
  } catch (error) {
    console.error("Error cargando datos:", error);

    data = {};

    alert(`No se pudo cargar el juego "${file}".`);
  }
}

function getRandomQuestion() {
  const list = data[currentLevel];

  if (!Array.isArray(list) || !list.length) {
    return {
      texto: "Sin datos disponibles",
      opcion1: "Sin datos",
      opcion2: "Sin datos"
    };
  }

  return list[Math.floor(Math.random() * list.length)];
}

// =====================
// START GAME
// =====================
async function startGame() {
  await loadData();

  const container = getContainer();

  if (!container) return;

  container.classList.remove("qp-mode");
  container.innerHTML = "";

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
  $("modeSelector")?.classList.remove("hidden");

  const container = getContainer();

  if (container) {
    container.classList.add("hidden");
    container.classList.remove("qp-mode");
    container.innerHTML = "";
  }
}

async function startMode(mode) {
  pendingMode = mode;

  /*
   * Ajusta estos nombres si tus archivos JSON son diferentes.
   *
   * Ejemplo:
   * data/verdad_shot.json
   * data/verdad_reto.json
   */
  const file = mode === "verdad"
    ? "verdad_shot"
    : "verdad_reto";

  await loadData(file);

  $("modeSelector")?.classList.add("hidden");

  const container = getContainer();

  if (!container) return;

  container.classList.remove("qp-mode");
  container.classList.remove("hidden");
  container.innerHTML = "";

  renderCard();
}

// =====================
// MAIN FLOW
// =====================
function nextTurn() {
  if (!GameEngine.state.players.length) return;

  GameEngine.nextPlayer();

  const container = getContainer();

  if (container) {
    container.classList.remove("qp-mode");
    container.innerHTML = "";
  }

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
  const container = getContainer();

  if (!container) return;

  container.innerHTML = "";
  container.classList.remove("hidden");
  container.classList.remove("qp-mode");

  const q = getRandomQuestion();

  // =========================
  // QUÉ PREFIERES
  // =========================
  if (currentGame === "que_prefieres") {
    renderChoiceCards(container, q);
    updateUI();
    return;
  }

  // =========================
  // QUIÉN ES MÁS PROBABLE
  // =========================
  if (currentGame === "quien_es_mas_probable") {
    const card = document.createElement("div");

    card.className = "card probable-card";
    card.id = "card";

    const content = document.createElement("div");
    content.className = "probable-content";

    content.innerHTML = `
      <div class="emoji">🤔</div>
      <h2>¿Quién es más probable que...?</h2>
      <p class="question"></p>
      <small>👇 Todos señalen al mismo tiempo</small>
    `;

    content.querySelector(".question").textContent =
      q.texto || "Sin pregunta";

    card.appendChild(content);
    container.appendChild(card);

    bindCard();
    animateIn();
    updateUI();

    return;
  }

  // =========================
  // RESTO DE JUEGOS
  // =========================
  const card = document.createElement("div");

  card.className = "card";
  card.id = "card";

  const text = document.createElement("p");
  text.textContent = q.texto || q || "Sin pregunta";

  card.appendChild(text);
  container.appendChild(card);

  bindCard();
  animateIn();
  updateUI();
}

// =====================
// QUÉ PREFIERES
// =====================
function renderChoiceCards(container, q) {
  container.classList.add("qp-mode");

  const card1 = document.createElement("div");
  const card2 = document.createElement("div");

  card1.className = "card choice-card";
  card2.className = "card choice-card";

  const text1 = document.createElement("p");
  const text2 = document.createElement("p");

  text1.textContent = q.opcion1 || "Sin opción";
  text2.textContent = q.opcion2 || "Sin opción";

  card1.appendChild(text1);
  card2.appendChild(text2);

  card1.onclick = () => chooseCard(card1, -1);
  card2.onclick = () => chooseCard(card2, 1);

  container.appendChild(card1);
  container.appendChild(card2);

  animateChoiceCards();
}

function animateChoiceCards() {
  const cards = document.querySelectorAll(".choice-card");

  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";

    setTimeout(() => {
      card.style.transition = "0.3s";
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    }, 50 + index * 50);
  });
}

function chooseCard(card, dir) {
  const cards = document.querySelectorAll(".choice-card");

  if (!cards.length) return;

  cards.forEach(c => {
    c.style.pointerEvents = "none";
  });

  cards.forEach(c => {
    if (c === card) {
      c.style.transition = "0.25s";
      c.style.transform =
        `translateX(${dir * 800}px) scale(1.05)`;
      c.style.opacity = "0";
    } else {
      c.style.transition = "0.25s";
      c.style.transform = "scale(0.8)";
      c.style.opacity = "0";
    }
  });

  setTimeout(nextTurn, 250);
}

// =====================
// SWIPE
// =====================
function bindCard() {
  const card = getCard();

  if (!card) return;

  let startX = null;
  let dragging = false;

  // =====================
  // MOUSE
  // =====================
  card.onmousedown = e => {
    startX = e.clientX;
    dragging = true;

    card.style.transition = "none";
  };

  card.onmousemove = e => {
    if (!dragging || startX === null) return;

    const diff = e.clientX - startX;

    card.style.transform =
      `translateX(${diff}px) rotate(${diff / 20}deg)`;

    if (diff > 50) {
      card.style.background = "rgba(0,255,100,0.15)";
    } else if (diff < -50) {
      card.style.background = "rgba(255,80,80,0.15)";
    } else {
      card.style.background = "";
    }
  };

  card.onmouseup = e => {
    if (!dragging || startX === null) return;

    const diff = e.clientX - startX;

    finishSwipe(card, diff);

    startX = null;
    dragging = false;
  };

  card.onmouseleave = () => {
    if (!dragging) return;

    startX = null;
    dragging = false;

    card.style.transition = "0.2s";
    card.style.transform = "";
    card.style.background = "";
  };

  // =====================
  // TOUCH
  // =====================
  card.ontouchstart = e => {
    if (!e.touches.length) return;

    startX = e.touches[0].clientX;
    dragging = true;

    card.style.transition = "none";
  };

  card.ontouchmove = e => {
    if (!dragging || startX === null || !e.touches.length) {
      return;
    }

    const diff = e.touches[0].clientX - startX;

    card.style.transform =
      `translateX(${diff}px) rotate(${diff / 20}deg)`;

    if (diff > 50) {
      card.style.background = "rgba(0,255,100,0.15)";
    } else if (diff < -50) {
      card.style.background = "rgba(255,80,80,0.15)";
    } else {
      card.style.background = "";
    }
  };

  card.ontouchend = e => {
    if (!dragging || startX === null) return;

    const endX =
      e.changedTouches?.[0]?.clientX ?? startX;

    const diff = endX - startX;

    finishSwipe(card, diff);

    startX = null;
    dragging = false;
  };
}

function finishSwipe(card, diff) {
  card.style.transition = "0.2s";

  if (diff > 80) {
    swipe(1);
  } else if (diff < -80) {
    swipe(-1);
  } else {
    card.style.transform = "";
    card.style.background = "";

    /*
     * Si quieres que tocar una carta sin hacer swipe
     * avance al siguiente jugador, cambia esto por:
     *
     * nextTurn();
     */
  }
}

function swipe(dir) {
  const card = getCard();

  if (!card) return;

  card.style.transition = "0.2s";
  card.style.transform =
    `translateX(${dir * 800}px) rotate(${dir * 10}deg)`;
  card.style.opacity = "0";

  setTimeout(nextTurn, 200);
}

// =====================
// UI
// =====================
function updateUI() {
  const currentPlayer = $("currentPlayer");

  if (!currentPlayer) return;

  const player = GameEngine.currentPlayer();

  currentPlayer.innerText =
    player ? `Turno: ${player}` : "Sin jugadores";
}

function animateIn() {
  const card = getCard();

  if (!card) return;

  card.style.opacity = "0";
  card.style.transform = "scale(0.9)";

  setTimeout(() => {
    card.style.transition = "0.3s";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";
  }, 50);
}

// =====================
// PLAYERS
// =====================
function renderPlayers() {
  const list = $("playersList");

  if (!list) return;

  list.innerHTML = "";

  GameEngine.state.players.forEach((name, index) => {
    const div = document.createElement("div");

    div.className = "player-card";

    const playerName = document.createElement("span");
    playerName.className = "player-name";
    playerName.textContent = name;

    const actions = document.createElement("div");
    actions.className = "player-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.textContent = "✏️";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.textContent = "❌";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    div.appendChild(playerName);
    div.appendChild(actions);

    // =====================
    // ELIMINAR
    // =====================
    deleteBtn.onclick = () => {
      GameEngine.removePlayer(index);
      renderPlayers();
      updateUI();
    };

    // =====================
    // EDITAR
    // =====================
    editBtn.onclick = () => {
      const newName = prompt("Nuevo nombre:", name);

      if (!newName || !newName.trim()) return;

      GameEngine.editPlayer(index, newName.trim());
      renderPlayers();
      updateUI();
    };

    list.appendChild(div);
  });
}

function addPlayer(name) {
  const cleanName = name?.trim();

  if (!cleanName) return;

  GameEngine.state.players.push(cleanName);

  GameEngine.savePlayers();

  renderPlayers();
  updateUI();
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
      (this.state.currentIndex + 1) %
      this.state.players.length;

    this.saveTurn();
  },

  currentPlayer() {
    return this.state.players[this.state.currentIndex] || null;
  },

  savePlayers() {
    localStorage.setItem(
      "players",
      JSON.stringify(this.state.players)
    );
  },

  saveTurn() {
    localStorage.setItem(
      "turn",
      String(this.state.currentIndex)
    );
  },

  resetTurn() {
    this.state.currentIndex = 0;
    this.saveTurn();
  },

  removePlayer(index) {
    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }

    this.state.players.splice(index, 1);

    // No quedan jugadores
    if (!this.state.players.length) {
      this.state.currentIndex = 0;
      this.savePlayers();
      this.saveTurn();
      return;
    }

    // Si el índice quedó fuera del array
    if (
      this.state.currentIndex >=
      this.state.players.length
    ) {
      this.state.currentIndex =
        this.state.players.length - 1;
    }

    this.savePlayers();
    this.saveTurn();
  },

  editPlayer(index, newName) {
    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }

    this.state.players[index] = newName.trim();

    this.savePlayers();
  }
};
