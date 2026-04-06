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
  remainingTime = timePerQ;

  let q = questions[currentQ];

  let html = `
    <h3>Question ${currentQ + 1} / ${questions.length}</h3>
    <p>${q.q}</p>
  `;

  q.options.forEach((opt, j) => {
    let val = ["A","B","C","D"][j];

    html += `
      <div class="option" data-val="${val}" onclick="selectOption('${val}')">
        <b>${val}.</b> ${opt}
      </div>
    `;
  });

  html += `<div id="answerBox"></div><div id="timer"></div>`;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

// Select option
function selectOption(selectedVal) {
  if (answered) return;

  answered = true;
  clearInterval(timer);

  let options = document.querySelectorAll(".option");
  options.forEach(opt => {
    opt.style.pointerEvents = "none";
  });

  answers[currentQ] = selectedVal;

  showAnswer(selectedVal);
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
        showAnswer("");
      }
    }
  }, 1000);
}

// Show answer
function showAnswer(selectedVal) {
  let q = questions[currentQ];

  let correct = (q.answer || "")
    .toString()
    .replace(/[^A-D]/g, '')
    .toUpperCase();

  if (!correct) {
    setTimeout(moveNext, answerDisplayTime * 1000);
    return;
  }

  let options = document.querySelectorAll(".option");

  options.forEach(opt => {
    let val = opt.getAttribute("data-val");

    opt.classList.remove("correct", "wrong");

    if (val === correct) {
      opt.classList.add("correct");
    }

    if (selectedVal && val === selectedVal && val !== correct) {
      opt.classList.add("wrong");
    }
  });

  setTimeout(moveNext, answerDisplayTime * 1000);
}

// Move next
function moveNext() {
  clearInterval(timer);

  if (currentQ >= questions.length - 1) {
    submitQuiz();
  } else {
    currentQ++;
    answered = false;
    remainingTime = timePerQ;
    showQuestion();
  }
}

// Submit
function submitQuiz() {
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

      if (res.error) {
        document.getElementById("quiz").innerHTML =
          `<h2 style="color:red;">${res.error}</h2>`;
        return;
      }

      showReview(res);
    });
}

// Review
function showReview(res) {
  let html = `
    <h2>🎯 Quiz Completed</h2>
    <h3>Score: ${res.score} / ${res.questions.length}</h3>
    <hr>
  `;

  res.questions.forEach((q, i) => {
    let correct = q.answer;
    let userAns = answers[i] || "";

    html += `<div style="margin-bottom:20px;">`;
    html += `<p><b>Q${i + 1}. ${q.q}</b></p>`;

    q.options.forEach((opt, j) => {
      let val = ["A","B","C","D"][j];

      let style = "";
      if (val === correct) style = "color:green;font-weight:bold;";
      if (val === userAns && val !== correct) style = "color:red;font-weight:bold;";

      html += `<div style="${style}">${val}. ${opt}</div>`;
    });

    html += `<p>Your Answer: ${userAns || "Not Attempted"}</p>`;
    html += `<p>Correct Answer: ${correct}</p>`;
    html += `<hr></div>`;
  });

  document.getElementById("quiz").innerHTML = html;
}
