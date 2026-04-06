const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";

let user = {};
let questions = [];
let currentQ = 0;
let answers = [];
let timePerQ = 10;
let answerDisplayTime = 3;
let timer = null;
let remainingTime = 0;
let answered = false;

// Loader
function showLoader(msg = "Loading...") {
  let loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "block";
    loader.querySelector("p").innerText = msg;
  }
}

function hideLoader() {
  let loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

// Login
function login() {
  let email = document.getElementById("email").value;

  showLoader("Verifying...");

  fetch(API + "?action=verify&email=" + email, { method: "POST" })
    .then(res => res.json())
    .then(res => {
      hideLoader();

      if (res.status === "allowed") {
        user = res;
        document.getElementById("loginBox").style.display = "none";
        loadQuiz();
      } else {
        alert("❌ Not allowed");
      }
    });
}

// Load quiz
function loadQuiz() {
  showLoader("Loading questions...");

  fetch(API + "?action=questions", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      questions = data;

      currentQ = 0;
      answers = [];

      loadTimer();
    });
}

// Load timer
function loadTimer() {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      hideLoader();

      timePerQ = Number(res.time) || 10;
      answerDisplayTime = Number(res.answer_time) || 3;

      remainingTime = timePerQ;

      showQuestion();
    });
}

// Show question
function showQuestion() {
  if (currentQ >= questions.length) return;

  answered = false;

  let q = questions[currentQ];

  let html = `
    <h3>Question ${currentQ + 1} / ${questions.length}</h3>
    <p>${q.q}</p>
  `;

  q.options.forEach((opt, j) => {
    let val = ["A","B","C","D"][j];

    html += `
      <div class="option" onclick="selectOption('${val}')">
        <b>${val}.</b> ${opt}
      </div>
    `;
  });

  html += `<div id="timer"></div>`;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

// Select option
function selectOption(val) {
  if (answered) return;

  answered = true;
  answers[currentQ] = val;

  moveNext();
}

// Timer
function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    let t = document.getElementById("timer");
    if (t) t.innerText = "⏱️ " + remainingTime + " sec";

    remainingTime--;

    if (remainingTime < 0) {
      clearInterval(timer);

      if (!answered) {
        answered = true;
        answers[currentQ] = "";
        moveNext();
      }
    }
  }, 1000);
}

// Move to next question
function moveNext() {
  clearInterval(timer);

  setTimeout(() => {
    if (currentQ >= questions.length - 1) {
      submitQuiz();
    } else {
      currentQ++;
      remainingTime = timePerQ;
      showQuestion();
    }
  }, answerDisplayTime * 1000);
}

// Submit quiz
function submitQuiz() {
  clearInterval(timer);

  showLoader("Submitting...");

  fetch(API + "?action=submit", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      rollno: user.rollno,
      name: user.name,
      answers: answers
    })
  })
    .then(res => res.json())
    .then(res => {
      hideLoader();

      document.getElementById("quiz").innerHTML = `
        <h2>🎯 Quiz Completed</h2>
        <h3>Score: ${res.score} / ${questions.length}</h3>
      `;
    });
}
