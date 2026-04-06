const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";

const API = "PASTE_YOUR_WEB_APP_URL";

let user = {};
let questions = [];
let currentQ = 0;
let answers = [];
let timePerQ = 10;
let timer = null;
let remainingTime = 0;

// 🔐 LOGIN
function login() {
  let email = document.getElementById("email").value;

  fetch(API + "?action=verify&email=" + email, { method: "POST" })
    .then(res => res.json())
    .then(res => {
      if (res.status === "allowed") {
        user = res;
        localStorage.setItem("user", JSON.stringify(user));
        loadQuiz();
      } else {
        alert("❌ Not allowed");
      }
    });
}

// 🔄 LOAD STATE
function loadState() {
  let state = localStorage.getItem("quizState");
  let savedUser = localStorage.getItem("user");

  if (state && savedUser) {
    user = JSON.parse(savedUser);

    let data = JSON.parse(state);
    currentQ = data.currentQ;
    answers = data.answers;
    remainingTime = data.remainingTime;

    loadQuiz(true);
  }
}

window.onload = loadState;

// 📥 LOAD QUESTIONS
function loadQuiz(isResume = false) {
  fetch(API + "?action=questions", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      questions = data;

      if (!isResume) {
        currentQ = 0;
        answers = [];
      }

      loadTimer(isResume);
    });
}

// ⏱️ LOAD TIMER
function loadTimer(isResume) {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      timePerQ = res.time;

      if (!isResume) remainingTime = timePerQ;

      showQuestion();
    });
}

// 📊 SHOW QUESTION
function showQuestion() {
  if (currentQ >= questions.length) {
    submitQuiz();
    return;
  }

  let q = questions[currentQ];

  let html = `
    <h3>Q ${currentQ+1} / ${questions.length}</h3>
    <p>${q.q}</p>
  `;

  q.options.forEach((opt, j) => {
    let val = ["A","B","C","D"][j];
    html += `<input type="radio" name="q" value="${val}">${opt}<br>`;
  });

  html += `<h3 id="timer"></h3>`;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

// ⏱️ TIMER
function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    document.getElementById("timer").innerText =
      "Time: " + remainingTime;

    remainingTime--;

    saveState();

    if (remainingTime < 0) {
      clearInterval(timer);
      saveAnswer();
      currentQ++;
      remainingTime = timePerQ;
      showQuestion();
    }
  }, 1000);
}

// 💾 SAVE STATE
function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentQ,
    answers,
    remainingTime
  }));
}

// 💾 SAVE ANSWER
function saveAnswer() {
  let selected = document.querySelector('input[name="q"]:checked');
  answers[currentQ] = selected ? selected.value : "";
}

// 📤 SUBMIT
function submitQuiz() {
  if (timer) clearInterval(timer);

  localStorage.removeItem("quizState");

  fetch(API + "?action=submit", {
    method: "POST",
    body: JSON.stringify({
      rollno: user.rollno,
      email: user.email,
      name: user.name,
      answers: answers
    })
  })
    .then(res => res.json())
    .then(res => {
      document.getElementById("quiz").innerHTML =
        `<h2>Score: ${res.score}</h2>`;
    });
}
