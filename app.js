// --------------------
// STATE
// --------------------
let data = {};
let currentGame = "verdad";
let currentLevel = "suave";

let players = JSON.parse(localStorage.getItem("players")) || [];
let currentPlayerIndex = 0;
let shots = Number(localStorage.getItem("shots")) || 0;

let usedQuestions = [];

// DOM
const card = document.getElementById("card");
const questionEl = document.getElementById("question");

// --------------------
// INIT
// --------------------
init();

function init() {
  renderPlayers();
  document.getElementById("shots").innerText = "🍻 " + shots;

  if (players.length > 0) {
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
  if (!input.value) return;

  players.push(input.value);
  localStorage.setItem("players", JSON.stringify(players));
  input.value = "";
  renderPlayers();
};

function renderPlayers() {
  document.getElementById("playersList").innerText = players.join(", ");
}

document.getElementById("startGame").onclick = () => {
  if (players.length === 0) return alert("Agrega jugadores");

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");
  startGame();
};

async function startGame() {
  await loadData();
  updatePlayer();
}

// --------------------
// DATA
// --------------------
async function loadData() {
  const res = await fetch(`data/${currentGame}.json`);
  data = await res.json();
  usedQuestions = [];
  showCard();
}

function getRandomQuestion() {
  const preguntas = data[currentLevel];

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
// FLOW
// --------------------
function updatePlayer() {
  document.getElementById("currentPlayer").innerText =
    "Turno: " + players[currentPlayerIndex];
}

function nextTurn() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updatePlayer();
  showCard();
}

function showCard() {
  questionEl.innerText = getRandomQuestion();
  resetCard();
  updateColor();
}

function updateColor() {
  if (currentLevel === "suave") card.style.background = "#2e7d32";
  if (currentLevel === "medio") card.style.background = "#f9a825";
  if (currentLevel === "alto") card.style.background = "#c62828";
}

// --------------------
// SWIPE FÍSICA
// --------------------
let startX = 0;
let currentX = 0;
let velocity = 0;
let isDragging = false;

card.addEventListener("mousedown", start);
card.addEventListener("touchstart", start);

function start(e) {
  isDragging = true;
  startX = getX(e);
  card.style.transition = "none";

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);
  document.addEventListener("mouseup", end);
  document.addEventListener("touchend", end);
}

function move(e) {
  if (!isDragging) return;

  currentX = getX(e);
  let dx = currentX - startX;

  velocity = dx;

  card.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;

  // Mostrar badges
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

function end() {
  isDragging = false;

  card.style.transition = "transform 0.4s ease";

  if (velocity > 120) swipe(1);
  else if (velocity < -120) swipe(-1);
  else resetCard();

  document.removeEventListener("mousemove", move);
  document.removeEventListener("touchmove", move);
}

function swipe(dir) {
  card.style.transform = `translateX(${dir * 600}px) rotate(${dir * 30}deg)`;

  setTimeout(() => {
    nextTurn();
  }, 300);
}

function resetCard() {
  card.style.transform = "translateX(0) rotate(0)";
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
  shots++;
  localStorage.setItem("shots", shots);
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
  showCard();
};
