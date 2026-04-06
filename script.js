const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";


let user = {};
let questions = [];
let currentQ = 0;
let answers = [];
let timePerQ = 10;
let timer = null;

// 🔐 LOGIN
function login() {
  let email = document.getElementById("email").value;

  fetch(API + "?action=verify&email=" + email, { method: "POST" })
    .then(res => res.json())
    .then(res => {
      if (res.status === "allowed") {
        user = res;
        loadQuiz();
      } else {
        alert("❌ Not allowed");
      }
    });
}

// 📥 LOAD QUESTIONS
function loadQuiz() {
  fetch(API + "?action=questions", { method: "POST" })
    .then(res => res.json())
    .then(data => {
      questions = data;
      loadTimer();
    });
}

// ⏱️ LOAD TIMER FROM SHEET
function loadTimer() {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      timePerQ = res.time;
      currentQ = 0;
      answers = [];
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
    let val = ["A", "B", "C", "D"][j];
    html += `
      <div>
        <input type="radio" name="q" value="${val}">
        ${opt}
      </div>
    `;
  });

  html += `<h3 id="timer"></h3>`;

  document.getElementById("quiz").innerHTML = html;

  startQuestionTimer();
}

// ⏱️ TIMER PER QUESTION
function startQuestionTimer() {
  let time = timePerQ;

  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    document.getElementById("timer").innerText =
      "⏱️ Time left: " + time + " sec";

    time--;

    if (time < 0) {
      clearInterval(timer);
      saveAnswer();
      currentQ++;
      showQuestion();
    }
  }, 1000);
}

// 💾 SAVE ANSWER
function saveAnswer() {
  let selected = document.querySelector('input[name="q"]:checked');
  answers[currentQ] = selected ? selected.value : "";
}

// 📤 SUBMIT QUIZ
function submitQuiz() {
  if (timer) clearInterval(timer);

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
