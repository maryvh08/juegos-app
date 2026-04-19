let data = {};
let currentGame = "verdad";
let currentLevel = "suave";
let usedQuestions = [];

const gameSelect = document.getElementById("game");
const levelSelect = document.getElementById("level");
const questionEl = document.getElementById("question");
const card = document.getElementById("card");

async function loadData() {
  const res = await fetch(`data/${currentGame}.json`);
  data = await res.json();
  usedQuestions = [];
}

function getRandomQuestion() {
  const preguntas = data[currentLevel];

  if (usedQuestions.length === preguntas.length) {
    usedQuestions = []; // reset
  }

  let pregunta;
  do {
    const index = Math.floor(Math.random() * preguntas.length);
    pregunta = preguntas[index];
  } while (usedQuestions.includes(pregunta));

  usedQuestions.push(pregunta);
  return pregunta;
}

async function nextQuestion() {
  if (!data[currentLevel]) {
    await loadData();
  }

  const pregunta = getRandomQuestion();
  questionEl.innerText = pregunta;

  card.classList.add("animate");
  setTimeout(() => card.classList.remove("animate"), 200);
}

gameSelect.addEventListener("change", async () => {
  currentGame = gameSelect.value;
  await loadData();
  questionEl.innerText = "Juego cambiado 👀";
});

levelSelect.addEventListener("change", () => {
  currentLevel = levelSelect.value;
  usedQuestions = [];
  questionEl.innerText = "Nivel cambiado 🔥";
});

document.getElementById("nextBtn").addEventListener("click", nextQuestion);

// carga inicial
loadData();
