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
function $(id) {
  return document.getElementById(id);
}

function getCard() {
  return $("card");
}

function getContainer() {
  return document.querySelector(".swipe-container");
}


// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {

  renderPlayers();
  updateUI();

  // =====================
  // BOTÓN: EMPEZAR JUEGO
  // =====================
  const startGameBtn = $("startGame");

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
      currentLevel = null;
      pendingMode = null;
      data = {};

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
  // VOLVER A JUEGOS
  // =====================
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


  // =====================
  // VOLVER A INICIO
  // =====================
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


  // =====================
  // VOLVER DESDE NIVEL
  // =====================
  const backToGamesBtn = $("backToGames");

  if (backToGamesBtn) {

    backToGamesBtn.onclick = () => {

      currentGame = null;
      currentLevel = null;
      pendingMode = null;
      data = {};

      $("levelSelector")?.classList.add("hidden");
      $("gameSelector")?.classList.remove("hidden");
    };

  }


  // =====================
  // VERDAD
  // =====================
  const chooseTruthBtn = $("chooseTruth");

  if (chooseTruthBtn) {

    chooseTruthBtn.onclick = () => {
      startMode("verdad");
    };

  }


  // =====================
  // RETO
  // =====================
  const chooseDareBtn = $("chooseDare");

  if (chooseDareBtn) {

    chooseDareBtn.onclick = () => {
      startMode("reto");
    };

  }


  // =====================
  // AGREGAR JUGADOR
  // =====================
  const addPlayerBtn = $("addPlayer");

  if (addPlayerBtn) {

    addPlayerBtn.onclick = () => {

      const input = $("playerInput");

      if (!input) return;

      addPlayer(input.value);

      input.value = "";
      input.focus();
    };

  }


  // =====================
  // ENTER EN INPUT
  // =====================
  const playerInput = $("playerInput");

  if (playerInput) {

    playerInput.addEventListener("keydown", event => {

      if (event.key === "Enter") {

        event.preventDefault();

        addPlayer(playerInput.value);

        playerInput.value = "";
      }

    });

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

  GameEngine.resetTurn();
}


// =====================
// DATA
// =====================
async function loadData(file) {

  if (!file) {

    data = {};
    return false;
  }

  try {

    const response = await fetch(`data/${file}.json`);

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status} al cargar data/${file}.json`
      );
    }

    data = await response.json();

    return true;

  } catch (error) {

    console.error("Error cargando datos:", error);

    data = {};

    alert(`No se pudo cargar el archivo "${file}.json"`);

    return false;
  }
}


// =====================
// RANDOM QUESTION
// =====================
function getRandomQuestion() {

  const list = data[currentLevel];

  if (!Array.isArray(list) || !list.length) {

    return {
      texto: "Sin datos disponibles",
      opcion1: "Sin datos",
      opcion2: "Sin datos"
    };
  }

  return list[
    Math.floor(Math.random() * list.length)
  ];
}


// =====================
// START GAME
// =====================
async function startGame() {

  const container = getContainer();

  if (!container) return;

  container.classList.remove("qp-mode");
  container.innerHTML = "";


  // =====================
  // VERDAD O RETO
  // =====================
  if (currentGame === "verdad_reto") {

    showModeSelector();

    return;
  }


  // =====================
  // OTROS JUEGOS
  // =====================
  const loaded = await loadData(currentGame);

  if (!loaded) return;

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


// =====================
// START MODE
// =====================
async function startMode(mode) {

  pendingMode = mode;


  // =====================
  // VERDAD
  // =====================
  if (mode === "verdad") {

    // Las preguntas de VERDAD
    // están en verdad_shot.json

    const loaded = await loadData("verdad_shot");

    if (!loaded) return;
  }


  // =====================
  // RETO
  // =====================
  else {

    // Los RETOS están en verdad_reto.json

    const loaded = await loadData("verdad_reto");

    if (!loaded) return;
  }


  // =====================
  // MOSTRAR CARTA
  // =====================
  $("modeSelector")?.classList.add("hidden");

  const container = getContainer();

  if (!container) return;

  container.classList.remove("qp-mode");
  container.classList.remove("hidden");
  container.innerHTML = "";

  renderCard();
}


// =====================
// NEXT TURN
// =====================
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


  // =====================
  // VERDAD O RETO
  // =====================
  if (currentGame === "verdad_reto") {

    showModeSelector();

    return;
  }


  // =====================
  // RESTO
  // =====================
  renderCard();
}


// =====================
// RENDER CARD
// =====================
function renderCard() {

  const container = getContainer();

  if (!container) return;

  container.innerHTML = "";

  container.classList.remove("hidden");
  container.classList.remove("qp-mode");


  const q = getRandomQuestion();


  // ==================================================
  // QUÉ PREFIERES
  // ==================================================
  if (currentGame === "que_prefieres") {

    renderChoiceCards(container, q);

    updateUI();

    return;
  }


  // ==================================================
  // QUIÉN ES MÁS PROBABLE
  // ==================================================
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


    const question = document.createElement("p");

    question.className = "question";
    question.textContent =
      q.texto || "Sin pregunta";


    const instruction = document.createElement("small");

    instruction.textContent =
      "👇 Todos señalen al mismo tiempo";


    content.appendChild(emoji);
    content.appendChild(title);
    content.appendChild(question);
    content.appendChild(instruction);

    card.appendChild(content);

    container.appendChild(card);


    bindCard();
    animateIn();
    updateUI();

    return;
  }


  // ==================================================
  // RESTO DE JUEGOS
  // ==================================================
  const card = document.createElement("div");

  card.className = "card";
  card.id = "card";


  const text = document.createElement("p");

  text.textContent =
    q.texto || "Sin pregunta";


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


  card1.className =
    "card choice-card";

  card2.className =
    "card choice-card";


  const text1 = document.createElement("p");
  const text2 = document.createElement("p");


  text1.textContent =
    q.opcion1 || "Sin opción";

  text2.textContent =
    q.opcion2 || "Sin opción";


  card1.appendChild(text1);
  card2.appendChild(text2);


  // IZQUIERDA
  card1.onclick = () => {
    chooseCard(card1, -1);
  };


  // DERECHA
  card2.onclick = () => {
    chooseCard(card2, 1);
  };


  container.appendChild(card1);
  container.appendChild(card2);


  animateChoiceCards();
}


// =====================
// ANIMATE CHOICE CARDS
// =====================
function animateChoiceCards() {

  const cards =
    document.querySelectorAll(".choice-card");


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


// =====================
// CHOOSE CARD
// =====================
function chooseCard(card, dir) {

  const cards =
    document.querySelectorAll(".choice-card");


  if (!cards.length) return;


  // Evita doble clic
  cards.forEach(c => {
    c.style.pointerEvents = "none";
  });


  cards.forEach(c => {

    c.style.transition = "0.25s";


    if (c === card) {

      c.style.transform =
        `translateX(${dir * 800}px) scale(1.05)`;

      c.style.opacity = "0";

    } else {

      c.style.transform =
        "scale(0.8)";

      c.style.opacity = "0";
    }

  });


  setTimeout(() => {
    nextTurn();
  }, 250);
}


// =====================
// SWIPE
// =====================
function bindCard() {

  const card = getCard();

  if (!card) return;


  let startX = null;
  let dragging = false;


  // ==================================================
  // MOUSE DOWN
  // ==================================================
  card.onmousedown = event => {

    startX = event.clientX;
    dragging = true;

    card.style.transition = "none";
  };


  // ==================================================
  // MOUSE MOVE
  // ==================================================
  card.onmousemove = event => {

    if (!dragging || startX === null) {
      return;
    }


    const diff =
      event.clientX - startX;


    card.style.transform =
      `translateX(${diff}px) rotate(${diff / 20}deg)`;


    if (diff > 50) {

      card.style.background =
        "rgba(0,255,100,0.15)";

    }

    else if (diff < -50) {

      card.style.background =
        "rgba(255,80,80,0.15)";

    }

    else {

      card.style.background = "";
    }
  };


  // ==================================================
  // MOUSE UP
  // ==================================================
  card.onmouseup = event => {

    if (!dragging || startX === null) {
      return;
    }


    const diff =
      event.clientX - startX;


    finishSwipe(card, diff);


    startX = null;
    dragging = false;
  };


  // ==================================================
  // MOUSE LEAVE
  // ==================================================
  card.onmouseleave = () => {

    if (!dragging) return;


    startX = null;
    dragging = false;


    card.style.transition = "0.2s";
    card.style.transform = "";
    card.style.background = "";
  };


  // ==================================================
  // TOUCH START
  // ==================================================
  card.ontouchstart = event => {

    if (!event.touches.length) {
      return;
    }


    startX =
      event.touches[0].clientX;

    dragging = true;

    card.style.transition = "none";
  };


  // ==================================================
  // TOUCH MOVE
  // ==================================================
  card.ontouchmove = event => {

    if (
      !dragging ||
      startX === null ||
      !event.touches.length
    ) {
      return;
    }


    const diff =
      event.touches[0].clientX - startX;


    card.style.transform =
      `translateX(${diff}px) rotate(${diff / 20}deg)`;


    if (diff > 50) {

      card.style.background =
        "rgba(0,255,100,0.15)";

    }

    else if (diff < -50) {

      card.style.background =
        "rgba(255,80,80,0.15)";

    }

    else {

      card.style.background = "";
    }
  };


  // ==================================================
  // TOUCH END
  // ==================================================
  card.ontouchend = event => {

    if (!dragging || startX === null) {
      return;
    }


    const touch =
      event.changedTouches?.[0];


    const endX =
      touch ? touch.clientX : startX;


    const diff =
      endX - startX;


    finishSwipe(card, diff);


    startX = null;
    dragging = false;
  };
}


// =====================
// FINISH SWIPE
// =====================
function finishSwipe(card, diff) {

  card.style.transition = "0.2s";


  if (diff > 80) {

    swipe(1);

  }

  else if (diff < -80) {

    swipe(-1);

  }

  else {

    card.style.transform = "";
    card.style.background = "";
  }
}


// =====================
// SWIPE CARD
// =====================
function swipe(dir) {

  const card = getCard();

  if (!card) return;


  card.style.transition =
    "0.2s";


  card.style.transform =
    `translateX(${dir * 800}px) rotate(${dir * 10}deg)`;


  card.style.opacity = "0";


  setTimeout(() => {

    nextTurn();

  }, 200);
}


// =====================
// UI
// =====================
function updateUI() {

  const currentPlayer =
    $("currentPlayer");


  if (!currentPlayer) return;


  const player =
    GameEngine.currentPlayer();


  currentPlayer.textContent =
    player
      ? `Turno: ${player}`
      : "Sin jugadores";
}


// =====================
// CARD ANIMATION
// =====================
function animateIn() {

  const card = getCard();

  if (!card) return;


  card.style.opacity = "0";

  card.style.transform =
    "scale(0.9)";


  setTimeout(() => {

    card.style.transition =
      "0.3s";

    card.style.opacity = "1";

    card.style.transform =
      "scale(1)";

  }, 50);
}


// =====================
// PLAYERS
// =====================
function renderPlayers() {

  const list =
    $("playersList");


  if (!list) return;


  list.innerHTML = "";


  GameEngine.state.players.forEach(
    (name, index) => {

      const div =
        document.createElement("div");


      div.className =
        "player-card";


      // =====================
      // NOMBRE
      // =====================
      const playerName =
        document.createElement("span");

      playerName.className =
        "player-name";

      playerName.textContent =
        name;


      // =====================
      // ACTIONS
      // =====================
      const actions =
        document.createElement("div");

      actions.className =
        "player-actions";


      // =====================
      // EDIT
      // =====================
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


      // =====================
      // DELETE
      // =====================
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


      // =====================
      // DELETE PLAYER
      // =====================
      deleteBtn.onclick = () => {

        GameEngine.removePlayer(index);

        renderPlayers();
        updateUI();
      };


      // =====================
      // EDIT PLAYER
      // =====================
      editBtn.onclick = () => {

        const newName =
          prompt(
            "Nuevo nombre:",
            name
          );


        if (
          !newName ||
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


// =====================
// ADD PLAYER
// =====================
function addPlayer(name) {

  const cleanName =
    name?.trim();


  if (!cleanName) {
    return;
  }


  GameEngine.state.players.push(
    cleanName
  );


  GameEngine.savePlayers();


  renderPlayers();
  updateUI();
}


// =====================
// GAME ENGINE
// =====================
const GameEngine = {

  state: {

    players:
      JSON.parse(
        localStorage.getItem("players")
      ) || [],

    currentIndex:
      Number(
        localStorage.getItem("turn")
      ) || 0

  },


  // =====================
  // NEXT PLAYER
  // =====================
  nextPlayer() {

    if (
      !this.state.players.length
    ) {
      return;
    }


    this.state.currentIndex =
      (
        this.state.currentIndex + 1
      ) %
      this.state.players.length;


    this.saveTurn();
  },


  // =====================
  // CURRENT PLAYER
  // =====================
  currentPlayer() {

    return (
      this.state.players[
        this.state.currentIndex
      ] || null
    );
  },


  // =====================
  // SAVE PLAYERS
  // =====================
  savePlayers() {

    localStorage.setItem(
      "players",
      JSON.stringify(
        this.state.players
      )
    );
  },


  // =====================
  // SAVE TURN
  // =====================
  saveTurn() {

    localStorage.setItem(
      "turn",
      String(
        this.state.currentIndex
      )
    );
  },


  // =====================
  // RESET TURN
  // =====================
  resetTurn() {

    this.state.currentIndex = 0;

    this.saveTurn();
  },


  // =====================
  // REMOVE PLAYER
  // =====================
  removePlayer(index) {

    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }


    this.state.players.splice(
      index,
      1
    );


    // No quedan jugadores
    if (
      !this.state.players.length
    ) {

      this.state.currentIndex = 0;

      this.savePlayers();
      this.saveTurn();

      return;
    }


    // Corregir índice
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


  // =====================
  // EDIT PLAYER
  // =====================
  editPlayer(index, newName) {

    if (
      index < 0 ||
      index >= this.state.players.length
    ) {
      return;
    }


    const cleanName =
      newName?.trim();


    if (!cleanName) {
      return;
    }


    this.state.players[index] =
      cleanName;


    this.savePlayers();
  }

};
