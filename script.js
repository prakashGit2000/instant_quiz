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
        loadQuiz(false);
      } else {
        alert("❌ Not allowed");
      }
    });
}

// 🔄 LOAD STATE ON REFRESH
function loadState() {
  let savedState = localStorage.getItem("quizState");
  let savedUser = localStorage.getItem("user");

  if (savedState && savedUser) {
    user = JSON.parse(savedUser);

    let data = JSON.parse(savedState);
    currentQ = data.currentQ || 0;
    answers = data.answers || [];
    remainingTime = data.remainingTime || 0;

    loadQuiz(true); // resume
  }
}

window.onload = loadState;

// 📥 LOAD QUESTIONS
function loadQuiz(isResume) {
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

// ⏱️ LOAD TIMER FROM SHEET
function loadTimer(isResume) {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      timePerQ = res.time;

      if (!isResume || remainingTime <= 0) {
        remainingTime = timePerQ;
      }

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
    <h3>Question ${currentQ + 1} / ${questions.length}</h3>
    <p>${q.q}</p>
  `;

  q.options.forEach((opt, j) => {
    let val = ["A","B","C","D"][j];

    // ✅ restore selected option
    let checked = answers[currentQ] === val ? "checked" : "";

    html += `
      <div>
        <input type="radio" name="q" value="${val}" ${checked}>
        ${opt}
      </div>
    `;
  });

  html += `<h3 id="timer"></h3>`;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

// ⏱️ TIMER PER QUESTION
function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    document.getElementById("timer").innerText =
      "⏱️ Time left: " + remainingTime + " sec";

    remainingTime--;

    saveState(); // 🔥 save continuously

    if (remainingTime < 0) {
      clearInterval(timer);

      saveAnswer(); // save current answer

      currentQ++;
      remainingTime = timePerQ;

      showQuestion();
    }
  }, 1000);
}

// 💾 SAVE CURRENT ANSWER
function saveAnswer() {
  let selected = document.querySelector('input[name="q"]:checked');
  answers[currentQ] = selected ? selected.value : "";
}

// 💾 SAVE STATE (FOR REFRESH)
function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentQ: currentQ,
    answers: answers,
    remainingTime: remainingTime
  }));
}

// 📤 SUBMIT QUIZ
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
      if (res.error) {
        document.getElementById("quiz").innerHTML =
          `<h2 style="color:red;">${res.error}</h2>`;
      } else {
        document.getElementById("quiz").innerHTML = `
          <h2>🎯 Quiz Completed</h2>
          <h3>Score: ${res.score} / ${questions.length}</h3>
        `;
      }
    });
}
