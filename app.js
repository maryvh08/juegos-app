let data = {};
let currentGame = "verdad";
let currentLevel = "suave";

async function loadData() {
  const res = await fetch(`data/${currentGame}.json`);
  data = await res.json();
}

function getRandomQuestion() {
  const preguntas = data[currentLevel];
  const randomIndex = Math.floor(Math.random() * preguntas.length);
  return preguntas[randomIndex];
}

async function nextQuestion() {
  if (!data[currentLevel]) {
    await loadData();
  }

  const pregunta = getRandomQuestion();
  document.getElementById("question").innerText = pregunta;
}
