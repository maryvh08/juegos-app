// --------------------
// STATE
// --------------------
let data = {};
let currentGame = "verdad";
let currentLevel = "suave";
let scores = JSON.parse(localStorage.getItem("scores")) || {};
let players = JSON.parse(localStorage.getItem("players")) || [];
let currentPlayerIndex = 0;
let shots = Number(localStorage.getItem("shots")) || 0;
let streak = 0;

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
  scores[input.value] = 0;
  localStorage.setItem("scores", JSON.stringify(scores));
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

function addPoint(player) {
  scores[player] += 1;
  localStorage.setItem("scores", JSON.stringify(scores));
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
  addPoint(players[currentPlayerIndex]);
  updatePlayer();
  showCard();
}

function showCard() {
  let event = randomEvent();

  if (event) {
    questionEl.innerText = event;
    return;
  }
  
  questionEl.innerText = getRandomQuestion();
  questionEl.innerText = getRandomQuestion();
  resetCard();
  updateColor();
}

function randomEvent() {
  const chance = Math.random();

  if (chance < 0.15) {
    return "🔥 DOBLE TURNO: repite";
  }

  if (chance < 0.30) {
    return "🍻 TODOS BEBEN";
  }

  if (chance < 0.45) {
    return "⚡ RETO EXTRA";
  }

  return null;
}
function updatePlayer() {
  const player = players[currentPlayerIndex];
  document.getElementById("currentPlayer").innerText = "Turno: " + player;
  document.getElementById("score").innerText = "⭐ " + scores[player];
}

function updateColor() {
  if (currentLevel === "suave") {
    card.style.background = "linear-gradient(135deg, #2e7d32, #66bb6a)";
  }
  if (currentLevel === "medio") {
    card.style.background = "linear-gradient(135deg, #f9a825, #fdd835)";
  }
  if (currentLevel === "alto") {
    card.style.background = "linear-gradient(135deg, #c62828, #ef5350)";
  }
}

function tensionEvent() {
  const chance = Math.random();

  if (chance < 0.1) {
    return "👀 EL GRUPO DECIDE: ¿acepta o shot?";
  }

  return null;
}

// --------------------
// SWIPE FÍSICA
// --------------------
let startX = 0;
let currentX = 0;
let velocity = 0;
let isDragging = false;
let lastX = 0;
let lastTime = 0;

card.addEventListener("mousedown", start);
card.addEventListener("touchstart", start);

function start(e) {
  isDragging = true;
  startX = getX(e);
  lastX = startX;
  lastTime = Date.now();

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

  let now = Date.now();
  velocity = (currentX - lastX) / (now - lastTime);

  lastX = currentX;
  lastTime = now;

  // efecto elástico
  let rotate = dx * 0.06;
  card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

  updateBadges(dx);
}

function end() {
  isDragging = false;

  card.style.transition = "transform 0.4s cubic-bezier(.22,1,.36,1)";

  if (velocity > 0.5 || currentX - startX > 120) {
    swipe(1);
  } else if (velocity < -0.5 || currentX - startX < -120) {
    swipe(-1);
  } else {
    resetCard();
  }

  document.removeEventListener("mousemove", move);
  document.removeEventListener("touchmove", move);
}

function swipe(dir) {
  card.style.transform = `translateX(${dir * 800}px) rotate(${dir * 40}deg)`;

  vibrate();

  setTimeout(() => {
    nextTurn();
    animateIn();
  }, 250);
}

function resetCard() {
  card.style.transform = "translateX(0) rotate(0)";
  hideBadges();
}

// --------------------
// ANIMACIÓN ENTRADA
// --------------------
function animateIn() {
  card.style.transition = "none";
  card.style.transform = "scale(0.8) translateY(50px)";
  card.style.opacity = "0";

  setTimeout(() => {
    card.style.transition = "all 0.4s cubic-bezier(.22,1,.36,1)";
    card.style.transform = "scale(1) translateY(0)";
    card.style.opacity = "1";
  }, 10);
}

// --------------------
// BADGES
// --------------------
function updateBadges(dx) {
  const like = document.getElementById("likeBadge");
  const skip = document.getElementById("skipBadge");

  if (dx > 0) {
    like.style.opacity = Math.min(dx / 100, 1);
    like.style.transform = "scale(1)";
    skip.style.opacity = 0;
  } else {
    skip.style.opacity = Math.min(Math.abs(dx) / 100, 1);
    skip.style.transform = "scale(1)";
    like.style.opacity = 0;
  }
}

function hideBadges() {
  document.getElementById("likeBadge").style.opacity = 0;
  document.getElementById("skipBadge").style.opacity = 0;
}

// --------------------
// VIBRACIÓN
// --------------------
function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
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

document.getElementById("streak").innerText = "🔥 " + streak;
