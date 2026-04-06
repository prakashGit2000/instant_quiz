const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";


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

// 🔄 LOAD STATE
function loadState() {
  let savedState = localStorage.getItem("quizState");
  let savedUser = localStorage.getItem("user");

  if (savedState && savedUser) {
    user = JSON.parse(savedUser);

    let data = JSON.parse(savedState);
    currentQ = data.currentQ || 0;
    answers = data.answers || [];
    remainingTime = data.remainingTime || 0;

    loadQuiz(true);
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

// ⏱️ LOAD TIMER
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

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("quizBox").style.display = "block";

  let html = `<h3>${q.q}</h3>`;

  q.options.forEach((opt, j) => {
    let val = ["A","B","C","D"][j];
    let selected = answers[currentQ] === val;

    html += `
      <div onclick="selectOption('${val}', this)"
      style="
        border:1px solid #ddd;
        padding:12px;
        margin:10px 0;
        border-radius:8px;
        cursor:pointer;
        background:${selected ? '#2563eb' : '#fff'};
        color:${selected ? '#fff' : '#000'};
      ">
        ${opt}
      </div>
    `;
  });

  document.getElementById("quiz").innerHTML = html;

  document.getElementById("progress").innerText =
    "Question " + (currentQ + 1) + " of " + questions.length;

  startTimer();
}

// 🎯 SELECT OPTION
function selectOption(value, el) {
  answers[currentQ] = value;

  let options = document.querySelectorAll("#quiz div");

  options.forEach(o => {
    o.style.background = "#fff";
    o.style.color = "#000";
  });

  el.style.background = "#2563eb";
  el.style.color = "#fff";

  saveState();
}

// ⏱️ TIMER
function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    document.getElementById("timer").innerText =
      remainingTime + " sec";

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

// 💾 SAVE ANSWER
function saveAnswer() {
  let selected = document.querySelector('input[name="q"]:checked');
  answers[currentQ] = selected ? selected.value : "";
}

// 💾 SAVE STATE
function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentQ,
    answers,
    remainingTime
  }));
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
      if (res.error) {
        document.getElementById("quiz").innerHTML =
          `<h2 style="color:red;">${res.error}</h2>`;
      } else {
        document.getElementById("quiz").innerHTML =
          `<h2>🎯 Score: ${res.score} / ${questions.length}</h2>`;
      }
    });
}
