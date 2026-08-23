// ============================================================
// PARTY SWIPE - APP.JS
// ============================================================

// ============================================================
// STATE
// ============================================================

let data = {};
let currentGame = null;
let currentLevel = null;

// Control de preguntas utilizadas durante la partida.
// Estructura:
// {
//   "facil": Set,
//   "medio": Set,
//   "dificil": Set
// }
const usedQuestions = new Map();

let isTransitioning = false;


// ============================================================
// DOM HELPERS
// ============================================================

function $(id) {
  return document.getElementById(id);
}

function getCard() {
  return $("card");
}

function getContainer() {
  return document.querySelector(".swipe-container");
}


// ============================================================
// STORAGE HELPERS
// ============================================================

function getStoredJSON(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);

  } catch (error) {
    console.error(`Error leyendo localStorage "${key}":`, error);
    return fallback;
  }
}


function setStoredJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;

  } catch (error) {
    console.error(`Error guardando localStorage "${key}":`, error);
    return false;
  }
}


function getStoredNumber(key, fallback = 0) {
  const value = Number(localStorage.getItem(key));

  return Number.isFinite(value)
    ? value
    : fallback;
}


// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", init);


function init() {

  renderPlayers();
  updateUI();

  setupNavigation();
  setupGameSelection();
  setupLevelSelection();
  setupModeSelection();
  setupPlayerControls();
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

  // ----------------------------------------------------------
  // START GAME
  // ----------------------------------------------------------

  const startGameBtn = $("startGame");

  if (startGameBtn) {

    startGameBtn.onclick = () => {

      if (!GameEngine.state.players.length) {
        alert("Agrega al menos un jugador.");
        return;
      }

      $("setup")?.classList.add("hidden");
      $("gameSelector")?.classList.remove("hidden");
    };
  }


  // ----------------------------------------------------------
  // BACK TO GAMES
  // ----------------------------------------------------------

  const backMenuBtn = $("backMenu");

  if (backMenuBtn) {

    backMenuBtn.onclick = () => {

      resetCurrentGame();

      $("gameUI")?.classList.add("hidden");
      $("levelSelector")?.classList.add("hidden");
      $("modeSelector")?.classList.add("hidden");

      $("gameSelector")?.classList.remove("hidden");
    };
  }


  // ----------------------------------------------------------
  // BACK HOME
  // ----------------------------------------------------------

  const backHomeBtn = $("backHome");

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


  // ----------------------------------------------------------
  // BACK FROM LEVEL SELECTOR
  // ----------------------------------------------------------

  const backToGamesBtn = $("backToGames");

  if (backToGamesBtn) {

    backToGamesBtn.onclick = () => {

      currentGame = null;
      currentLevel = null;
      data = {};

      clearUsedQuestions();

      $("levelSelector")?.classList.add("hidden");
      $("gameSelector")?.classList.remove("hidden");
    };
  }
}


// ============================================================
// GAME SELECTION
// ============================================================

function setupGameSelection() {

  document.querySelectorAll("[data-game]").forEach(button => {

    button.addEventListener("click", () => {

      currentGame = button.dataset.game;
      currentLevel = null;
      data = {};

      clearUsedQuestions();

      localStorage.setItem("currentGame", currentGame);

      $("gameSelector")?.classList.add("hidden");
      $("levelSelector")?.classList.remove("hidden");
    });

  });
}


// ============================================================
// LEVEL SELECTION
// ============================================================

function setupLevelSelection() {

  document.querySelectorAll("[data-level]").forEach(button => {

    button.addEventListener("click", async () => {

      currentLevel = button.dataset.level;

      localStorage.setItem("currentLevel", currentLevel);

      $("levelSelector")?.classList.add("hidden");
      $("gameUI")?.classList.remove("hidden");

      await startGame();
    });

  });
}


// ============================================================
// MODE SELECTION
// ============================================================

function setupModeSelection() {

  const chooseTruthBtn = $("chooseTruth");

  if (chooseTruthBtn) {

    chooseTruthBtn.onclick = () => {
      startMode("verdad");
    };
  }


  const chooseDareBtn = $("chooseDare");

  if (chooseDareBtn) {

    chooseDareBtn.onclick = () => {
      startMode("reto");
    };
  }
}


// ============================================================
// PLAYER CONTROLS
// ============================================================

function setupPlayerControls() {

  const addPlayerBtn = $("addPlayer");

  if (addPlayerBtn) {

    addPlayerBtn.onclick = () => {

      const input = $("playerInput");

      if (!input) {
        return;
      }

      addPlayer(input.value);

      input.value = "";
      input.focus();
    };
  }


  const playerInput = $("playerInput");

  if (playerInput) {

    playerInput.addEventListener("keydown", event => {

      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();

      addPlayer(playerInput.value);

      playerInput.value = "";
    });
  }
}


// ============================================================
// RESET CURRENT GAME
// ============================================================

function resetCurrentGame() {

  currentGame = null;
  currentLevel = null;
  data = {};

  clearUsedQuestions();

  isTransitioning = false;

  const container = getContainer();

  if (container) {

    container.classList.remove("qp-mode");
    container.classList.remove("hidden");

    container.innerHTML = "";
  }

  $("modeSelector")?.classList.add("hidden");

  GameEngine.resetTurn();
}


// ============================================================
// DATA
// ============================================================

async function loadData(file) {

  if (!file) {

    data = {};

    return false;
  }

  try {

    const response = await fetch(`data/${file}.json`, {
      cache: "no-cache"
    });

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status} al cargar data/${file}.json`
      );
    }

    const json = await response.json();

    if (!json || typeof json !== "object") {

      throw new Error(
        `El archivo data/${file}.json no contiene un objeto válido.`
      );
    }

    data = json;

    clearUsedQuestions();

    return true;

  } catch (error) {

    console.error("Error cargando datos:", error);

    data = {};

    alert(`No se pudo cargar el archivo "${file}.json"`);

    return false;
  }
}


// ============================================================
// QUESTION MANAGEMENT
// ============================================================

function clearUsedQuestions() {

  usedQuestions.clear();
}


function getQuestionKey(question, index) {

  if (!question) {
    return String(index);
  }

  // Si posteriormente agregas un ID a las preguntas,
  // automáticamente será utilizado.
  if (question.id !== undefined) {
    return String(question.id);
  }

  return JSON.stringify(question);
}


function getRandomQuestion() {

  const list = data?.[currentLevel];

  if (!Array.isArray(list) || !list.length) {

    return {
      texto: "Sin datos disponibles",
      opcion1: "Sin datos",
      opcion2: "Sin datos"
    };
  }


  if (!usedQuestions.has(currentLevel)) {
    usedQuestions.set(currentLevel, new Set());
  }


  const used = usedQuestions.get(currentLevel);


  // ----------------------------------------------------------
  // Si ya usamos todas las preguntas, reiniciamos el conjunto
  // ----------------------------------------------------------

  if (used.size >= list.length) {
    used.clear();
  }


  // ----------------------------------------------------------
  // Buscar preguntas disponibles
  // ----------------------------------------------------------

  const availableIndexes = [];

  list.forEach((question, index) => {

    const key = getQuestionKey(question, index);

    if (!used.has(key)) {
      availableIndexes.push(index);
    }
  });


  // ----------------------------------------------------------
  // Selección aleatoria
  // ----------------------------------------------------------

  const randomPosition =
    Math.floor(Math.random() * availableIndexes.length);

  const selectedIndex =
    availableIndexes[randomPosition];

  const selectedQuestion =
    list[selectedIndex];


  used.add(
    getQuestionKey(
      selectedQuestion,
      selectedIndex
    )
  );


  return selectedQuestion;
}


// ============================================================
// START GAME
// ============================================================

async function startGame() {

  const container = getContainer();

  if (!container) {
    console.error("No se encontró .swipe-container");
    return;
  }


  isTransitioning = false;

  container.classList.remove("qp-mode");
  container.classList.remove("hidden");
  container.innerHTML = "";


  // ----------------------------------------------------------
  // VERDAD O RETO
  // ----------------------------------------------------------

  if (currentGame === "verdad_reto") {

    showModeSelector();

    return;
  }


  // ----------------------------------------------------------
  // OTROS JUEGOS
  // ----------------------------------------------------------

  const loaded = await loadData(currentGame);

  if (!loaded) {
    return;
  }


  renderCard();
}


// ============================================================
// MODE SELECTOR
// ============================================================

function showModeSelector() {

  $("modeSelector")?.classList.remove("hidden");

  const container = getContainer();

  if (container) {

    container.classList.add("hidden");
    container.classList.remove("qp-mode");

    container.innerHTML = "";
  }
}


// ============================================================
// START MODE
// ============================================================

async function startMode(mode) {

  let file = null;


  if (mode === "verdad") {

    file = "verdad_shot";

  } else if (mode === "reto") {

    file = "verdad_reto";

  } else {

    console.warn("Modo desconocido:", mode);
    return;
  }


  const loaded = await loadData(file);

  if (!loaded) {
    return;
  }


  $("modeSelector")?.classList.add("hidden");

  const container = getContainer();

  if (!container) {
    return;
  }


  container.classList.remove("qp-mode");
  container.classList.remove("hidden");

  container.innerHTML = "";


  renderCard();
}


// ============================================================
// NEXT TURN
// ============================================================

function nextTurn() {

  if (!GameEngine.state.players.length) {
    return;
  }


  GameEngine.nextPlayer();

  const container = getContainer();

  if (container) {

    container.classList.remove("qp-mode");
    container.innerHTML = "";
  }


  // ----------------------------------------------------------
  // VERDAD O RETO
  // ----------------------------------------------------------

  if (currentGame === "verdad_reto") {

    showModeSelector();

    updateUI();

    return;
  }


  // ----------------------------------------------------------
  // RESTO DE JUEGOS
  // ----------------------------------------------------------

  renderCard();
}


// ============================================================
// RENDER CARD
// ============================================================

function renderCard() {

  const container = getContainer();

  if (!container) {
    return;
  }


  if (isTransitioning) {
    return;
  }


  container.innerHTML = "";

  container.classList.remove("hidden");
  container.classList.remove("qp-mode");


  const question = getRandomQuestion();


  // ==========================================================
  // QUÉ PREFIERES
  // ==========================================================

  if (currentGame === "que_prefieres") {

    renderChoiceCards(
      container,
      question
    );

    updateUI();

    return;
  }


  // ==========================================================
  // QUIÉN ES MÁS PROBABLE
  // ==========================================================

  if (currentGame === "quien_es_mas_probable") {

    const card = document.createElement("div");

    card.className = "card probable-card";
    card.id = "card";


    const content = document.createElement("div");

    content.className = "probable-content";


    const emoji = document.createElement("div");

    emoji.className = "emoji";
    emoji.textContent = "🤔";


    const title = document.createElement("h2");

    title.textContent =
      "¿Quién es más probable que...?";


    const questionText = document.createElement("p");

    questionText.className = "question";

    questionText.textContent =
      question?.texto || "Sin pregunta";


    const instruction = document.createElement("small");

    instruction.textContent =
      "👇 Todos señalen al mismo tiempo";


    content.appendChild(emoji);
    content.appendChild(title);
    content.appendChild(questionText);
    content.appendChild(instruction);

    card.appendChild(content);

    container.appendChild(card);


    bindCard();
    animateIn();
    updateUI();

    return;
  }


  // ==========================================================
  // RESTO DE JUEGOS
  // ==========================================================

  const card = document.createElement("div");

  card.className = "card";
  card.id = "card";


  const text = document.createElement("p");

  text.textContent =
    question?.texto || "Sin pregunta";


  card.appendChild(text);

  container.appendChild(card);


  bindCard();
  animateIn();
  updateUI();
}


// ============================================================
// QUÉ PREFIERES
// ============================================================

function renderChoiceCards(container, question) {

  container.classList.add("qp-mode");


  const card1 =
    document.createElement("div");

  const card2 =
    document.createElement("div");


  card1.className =
    "card choice-card";

  card2.className =
    "card choice-card";


  const text1 =
    document.createElement("p");

  const text2 =
    document.createElement("p");


  text1.textContent =
    question?.opcion1 || "Sin opción";

  text2.textContent =
    question?.opcion2 || "Sin opción";


  card1.appendChild(text1);
  card2.appendChild(text2);


  // ----------------------------------------------------------
  // IZQUIERDA
  // ----------------------------------------------------------

  card1.addEventListener("click", () => {

    chooseCard(
      card1,
      -1
    );
  });


  // ----------------------------------------------------------
  // DERECHA
  // ----------------------------------------------------------

  card2.addEventListener("click", () => {

    chooseCard(
      card2,
      1
    );
  });


  container.appendChild(card1);
  container.appendChild(card2);


  animateChoiceCards();
}


// ============================================================
// ANIMATE CHOICE CARDS
// ============================================================

function animateChoiceCards() {

  const cards =
    document.querySelectorAll(".choice-card");


  cards.forEach((card, index) => {

    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";


    requestAnimationFrame(() => {

      setTimeout(() => {

        card.style.transition =
          "opacity 0.3s ease, transform 0.3s ease";

        card.style.opacity = "1";
        card.style.transform = "scale(1)";

      }, 50 + index * 50);

    });

  });
}


// ============================================================
// CHOOSE CARD
// ============================================================

function chooseCard(card, direction) {

  const cards =
    document.querySelectorAll(".choice-card");


  if (!cards.length || isTransitioning) {
    return;
  }


  isTransitioning = true;


  cards.forEach(currentCard => {

    currentCard.style.pointerEvents = "none";

    currentCard.style.transition =
      "transform 0.25s ease, opacity 0.25s ease";


    if (currentCard === card) {

      currentCard.style.transform =
        `translateX(${direction * 800}px) scale(1.05)`;

      currentCard.style.opacity = "0";

    } else {

      currentCard.style.transform =
        "scale(0.8)";

      currentCard.style.opacity = "0";
    }

  });


  setTimeout(() => {

    isTransitioning = false;

    nextTurn();

  }, 250);
}


// ============================================================
// SWIPE - POINTER EVENTS
// ============================================================

function bindCard() {

  const card = getCard();

  if (!card) {
    return;
  }


  let startX = null;
  let startY = null;
  let dragging = false;
  let pointerId = null;


  // ----------------------------------------------------------
  // POINTER DOWN
  // ----------------------------------------------------------

  card.onpointerdown = event => {

    if (isTransitioning) {
      return;
    }


    // Solo botón izquierdo para mouse
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }


    startX = event.clientX;
    startY = event.clientY;

    dragging = true;
    pointerId = event.pointerId;


    card.style.transition = "none";


    try {
      card.setPointerCapture(event.pointerId);
    } catch (error) {
      // Algunos navegadores pueden no soportarlo.
    }
  };


  // ----------------------------------------------------------
  // POINTER MOVE
  // ----------------------------------------------------------

  card.onpointermove = event => {

    if (
      !dragging ||
      startX === null ||
      event.pointerId !== pointerId
    ) {
      return;
    }


    const diffX =
      event.clientX - startX;

    const diffY =
      event.clientY - startY;


    // --------------------------------------------------------
    // Evita interpretar un desplazamiento principalmente
    // vertical como swipe horizontal.
    // --------------------------------------------------------

    if (
      Math.abs(diffY) > Math.abs(diffX) * 1.5
    ) {

      return;
    }


    card.style.transform =
      `translateX(${diffX}px) rotate(${diffX / 20}deg)`;


    // --------------------------------------------------------
    // FEEDBACK VISUAL
    // --------------------------------------------------------

    if (diffX > 50) {

      card.style.background =
        "rgba(0,255,100,0.15)";

    } else if (diffX < -50) {

      card.style.background =
        "rgba(255,80,80,0.15)";

    } else {

      card.style.background = "";
    }
  };


  // ----------------------------------------------------------
  // POINTER UP
  // ----------------------------------------------------------

  card.onpointerup = event => {

    if (
      !dragging ||
      startX === null ||
      event.pointerId !== pointerId
    ) {
      return;
    }


    const diff =
      event.clientX - startX;


    finishSwipe(
      card,
      diff
    );


    resetPointerState();
  };


  // ----------------------------------------------------------
  // POINTER CANCEL
  // ----------------------------------------------------------

  card.onpointercancel = () => {

    if (!dragging) {
      return;
    }


    resetCardPosition(card);
    resetPointerState();
  };


  // ----------------------------------------------------------
  // POINTER LEAVE
  // ----------------------------------------------------------

  card.onpointerleave = event => {

    // Para mouse solamente.
    // En touch no queremos cancelar el gesto
    // simplemente porque salió del elemento.
    if (event.pointerType !== "mouse") {
      return;
    }


    if (!dragging) {
      return;
    }


    resetCardPosition(card);
    resetPointerState();
  };


  function resetPointerState() {

    startX = null;
    startY = null;
    dragging = false;
    pointerId = null;
  }
}


// ============================================================
// RESET CARD POSITION
// ============================================================

function resetCardPosition(card) {

  if (!card) {
    return;
  }


  card.style.transition =
    "transform 0.2s ease, background 0.2s ease";

  card.style.transform = "";
  card.style.background = "";
}


// ============================================================
// FINISH SWIPE
// ============================================================

function finishSwipe(card, diff) {

  if (!card || isTransitioning) {
    return;
  }


  card.style.transition =
    "transform 0.2s ease, opacity 0.2s ease";


  if (diff > 80) {

    swipe(1);

  } else if (diff < -80) {

    swipe(-1);

  } else {

    resetCardPosition(card);
  }
}


// ============================================================
// SWIPE CARD
// ============================================================

function swipe(direction) {

  const card = getCard();

  if (!card || isTransitioning) {
    return;
  }


  isTransitioning = true;


  card.style.transition =
    "transform 0.2s ease, opacity 0.2s ease";


  card.style.transform =
    `translateX(${direction * 800}px) rotate(${direction * 10}deg)`;


  card.style.opacity = "0";


  setTimeout(() => {

    isTransitioning = false;

    nextTurn();

  }, 200);
}


// ============================================================
// UI
// ============================================================

function updateUI() {

  const currentPlayer =
    $("currentPlayer");


  if (!currentPlayer) {
    return;
  }


  const player =
    GameEngine.currentPlayer();


  currentPlayer.textContent =
    player
      ? `Turno: ${player}`
      : "Sin jugadores";
}


// ============================================================
// CARD ANIMATION
// ============================================================

function animateIn() {

  const card = getCard();

  if (!card) {
    return;
  }


  card.style.opacity = "0";

  card.style.transform =
    "scale(0.9)";


  requestAnimationFrame(() => {

    setTimeout(() => {

      if (!card.isConnected) {
        return;
      }


      card.style.transition =
        "opacity 0.3s ease, transform 0.3s ease";

      card.style.opacity = "1";

      card.style.transform =
        "scale(1)";

    }, 50);

  });
}


// ============================================================
// PLAYERS
// ============================================================

function renderPlayers() {

  const list =
    $("playersList");


  if (!list) {
    return;
  }


  list.innerHTML = "";


  GameEngine.state.players.forEach(
    (name, index) => {

      const div =
        document.createElement("div");


      div.className =
        "player-card";


      // --------------------------------------------------------
      // NAME
      // --------------------------------------------------------

      const playerName =
        document.createElement("span");


      playerName.className =
        "player-name";


      playerName.textContent =
        name;


      // --------------------------------------------------------
      // ACTIONS
      // --------------------------------------------------------

      const actions =
        document.createElement("div");


      actions.className =
        "player-actions";


      // --------------------------------------------------------
      // EDIT
      // --------------------------------------------------------

      const editBtn =
        document.createElement("button");


      editBtn.className =
        "edit";

      editBtn.type =
        "button";

      editBtn.textContent =
        "✏️";


      editBtn.setAttribute(
        "aria-label",
        `Editar ${name}`
      );


      // --------------------------------------------------------
      // DELETE
      // --------------------------------------------------------

      const deleteBtn =
        document.createElement("button");


      deleteBtn.className =
        "delete";

      deleteBtn.type =
        "button";

      deleteBtn.textContent =
        "❌";


      deleteBtn.setAttribute(
        "aria-label",
        `Eliminar ${name}`
      );


      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);


      div.appendChild(playerName);
      div.appendChild(actions);


      // --------------------------------------------------------
      // DELETE PLAYER
      // --------------------------------------------------------

      deleteBtn.onclick = () => {

        GameEngine.removePlayer(index);

        renderPlayers();
        updateUI();
      };


      // --------------------------------------------------------
      // EDIT PLAYER
      // --------------------------------------------------------

      editBtn.onclick = () => {

        const newName =
          prompt(
            "Nuevo nombre:",
            name
          );


        if (
          newName === null ||
          !newName.trim()
        ) {
          return;
        }


        GameEngine.editPlayer(
          index,
          newName.trim()
        );


        renderPlayers();
        updateUI();
      };


      list.appendChild(div);
    }
  );
}


// ============================================================
// ADD PLAYER
// ============================================================

function addPlayer(name) {

  const cleanName =
    String(name ?? "").trim();


  if (!cleanName) {
    return;
  }


  // ----------------------------------------------------------
  // Evitar jugadores duplicados
  // ----------------------------------------------------------

  const exists =
    GameEngine.state.players.some(
      player =>
        player.toLowerCase() ===
        cleanName.toLowerCase()
    );


  if (exists) {

    alert("Ese jugador ya está agregado.");

    return;
  }


  GameEngine.state.players.push(
    cleanName
  );


  GameEngine.savePlayers();

  renderPlayers();
  updateUI();
}


// ============================================================
// GAME ENGINE
// ============================================================

const GameEngine = {

  // ==========================================================
  // STATE
  // ==========================================================

  state: {

    players:
      getStoredJSON(
        "players",
        []
      ),

    currentIndex:
      getStoredNumber(
        "turn",
        0
      )
  },


  // ==========================================================
  // VALIDATE STATE
  // ==========================================================

  validateState() {

    if (!Array.isArray(this.state.players)) {

      this.state.players = [];
    }


    if (!this.state.players.length) {

      this.state.currentIndex = 0;

      return;
    }


    if (
      this.state.currentIndex < 0 ||
      this.state.currentIndex >=
      this.state.players.length
    ) {

      this.state.currentIndex = 0;
    }
  },


  // ==========================================================
  // NEXT PLAYER
  // ==========================================================

  nextPlayer() {

    this.validateState();


    if (!this.state.players.length) {
      return;
    }


    this.state.currentIndex =
      (
        this.state.currentIndex + 1
      ) %
      this.state.players.length;


    this.saveTurn();
  },


  // ==========================================================
  // CURRENT PLAYER
  // ==========================================================

  currentPlayer() {

    this.validateState();


    return (
      this.state.players[
        this.state.currentIndex
      ] || null
    );
  },


  // ==========================================================
  // SAVE PLAYERS
  // ==========================================================

  savePlayers() {

    setStoredJSON(
      "players",
      this.state.players
    );
  },


  // ==========================================================
  // SAVE TURN
  // ==========================================================

  saveTurn() {

    localStorage.setItem(
      "turn",
      String(
        this.state.currentIndex
      )
    );
  },


  // ==========================================================
  // RESET TURN
  // ==========================================================

  resetTurn() {

    this.state.currentIndex = 0;

    this.saveTurn();

    updateUI();
  },


  // ==========================================================
  // REMOVE PLAYER
  // ==========================================================

  removePlayer(index) {

    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }


    const removedIndex = index;


    this.state.players.splice(
      removedIndex,
      1
    );


    // --------------------------------------------------------
    // No quedan jugadores
    // --------------------------------------------------------

    if (!this.state.players.length) {

      this.state.currentIndex = 0;

      this.savePlayers();
      this.saveTurn();

      return;
    }


    // --------------------------------------------------------
    // Si eliminamos un jugador anterior al jugador actual,
    // debemos desplazar el índice una posición hacia atrás.
    // --------------------------------------------------------

    if (
      removedIndex <
      this.state.currentIndex
    ) {

      this.state.currentIndex--;
    }


    // --------------------------------------------------------
    // Si el índice queda fuera de rango,
    // lo llevamos al primer jugador.
    // --------------------------------------------------------

    if (
      this.state.currentIndex >=
      this.state.players.length
    ) {

      this.state.currentIndex = 0;
    }


    this.savePlayers();
    this.saveTurn();
  },


  // ==========================================================
  // EDIT PLAYER
  // ==========================================================

  editPlayer(index, newName) {

    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }


    const cleanName =
      String(newName ?? "").trim();


    if (!cleanName) {
      return;
    }


    // --------------------------------------------------------
    // Evitar duplicados
    // --------------------------------------------------------

    const duplicate =
      this.state.players.some(
        (player, playerIndex) =>
          playerIndex !== index &&
          player.toLowerCase() ===
          cleanName.toLowerCase()
      );


    if (duplicate) {

      alert(
        "Ya existe un jugador con ese nombre."
      );

      return;
    }


    this.state.players[index] =
      cleanName;


    this.savePlayers();
  }
};


// ============================================================
// INITIAL STATE VALIDATION
// ============================================================

GameEngine.validateState();
