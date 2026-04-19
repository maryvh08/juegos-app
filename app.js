let data = {};
let currentGame = "verdad";
let currentLevel = "suave";
let usedQuestions = [];

const card = document.getElementById("card");
const questionEl = document.getElementById("question");

let startX = 0;
let currentX = 0;
let isDragging = false;

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
    const index = Math.floor(Math.random() * preguntas.length);
    pregunta = preguntas[index];
  } while (usedQuestions.includes(pregunta));

  usedQuestions.push(pregunta);
  return pregunta;
}

function showNewCard() {
  const pregunta = getRandomQuestion();
  questionEl.innerText = pregunta;

  card.style.transform = "translateX(0) rotate(0)";
}

// --------------------
// SWIPE LOGIC
// --------------------
card.addEventListener("mousedown", startDrag);
card.addEventListener("touchstart", startDrag);

function startDrag(e) {
  isDragging = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("touchmove", onDrag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);
}

function onDrag(e) {
  if (!isDragging) return;

  currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const diff = currentX - startX;

  card.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
}

function endDrag() {
  isDragging = false;

  const diff = currentX - startX;

  if (diff > 100) {
    swipeRight();
  } else if (diff < -100) {
    swipeLeft();
  } else {
    card.style.transform = "translateX(0) rotate(0)";
  }

  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("touchmove", onDrag);
}

function swipeRight() {
  card.style.transform = "translateX(500px) rotate(20deg)";
  setTimeout(showNewCard, 300);
}

function swipeLeft() {
  card.style.transform = "translateX(-500px) rotate(-20deg)";
  setTimeout(showNewCard, 300);
}

// --------------------
// BOTONES
// --------------------
document.getElementById("skip").onclick = swipeLeft;
document.getElementById("next").onclick = swipeRight;

// --------------------
// SELECTORES
// --------------------
document.getElementById("game").addEventListener("change", async (e) => {
  currentGame = e.target.value;
  await loadData();
});

document.getElementById("level").addEventListener("change", (e) => {
  currentLevel = e.target.value;
  usedQuestions = [];
  showNewCard();
});

// INIT
loadData();
