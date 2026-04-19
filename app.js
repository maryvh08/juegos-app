let data = {};
let currentGame = "verdad";
let currentLevel = "suave";

let players = [];
let currentPlayerIndex = 0;
let shots = 0;

let usedQuestions = [];

const card = document.getElementById("card");
const questionEl = document.getElementById("question");

// --------------------
// PLAYERS
// --------------------
document.getElementById("addPlayer").onclick = () => {
  const input = document.getElementById("playerInput");
  if (!input.value) return;

  players.push(input.value);
  input.value = "";
  renderPlayers();
};

function renderPlayers() {
  document.getElementById("playersList").innerText = players.join(", ");
}

document.getElementById("startGame").onclick = async () => {
  if (players.length === 0) return alert("Agrega jugadores");

  document.querySelector(".setup").classList.add("hidden");
  document.querySelector(".game").classList.remove("hidden");

  await loadData();
  updatePlayer();
};

// --------------------
// DATA
// --------------------
async function loadData() {
  const res = await fetch(`data/${currentGame}.json`);
  data = await res.json();
  usedQuestions = [];
  showNewCard();
}

function getRandomQuestion() {
  const preguntas = data[currentLevel];

  if (usedQuestions.length === preguntas.length) {
    usedQuestions = [];
  }

  let pregunta;
  do {
    pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
  } while (usedQuestions.includes(pregunta));

  usedQuestions.push(pregunta);
  return pregunta;
}

// --------------------
// GAME FLOW
// --------------------
function updatePlayer() {
  document.getElementById("currentPlayer").innerText =
    "Turno: " + players[currentPlayerIndex];
}

function nextTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updatePlayer();
  showNewCard();
}

function showNewCard() {
  questionEl.innerText = getRandomQuestion();
  updateCardColor();
}

function updateCardColor() {
  if (currentLevel === "suave") card.style.background = "#2e7d32";
  if (currentLevel === "medio") card.style.background = "#f9a825";
  if (currentLevel === "alto") card.style.background = "#c62828";
}

// --------------------
// ACTIONS
// --------------------
document.getElementById("next").onclick = nextTurn;

document.getElementById("skip").onclick = nextTurn;

document.getElementById("shot").onclick = () => {
  shots++;
  document.getElementById("shots").innerText = "🍻 " + shots;
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
  showNewCard();
};
