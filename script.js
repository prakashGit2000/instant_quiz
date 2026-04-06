const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";

let user = {};
let questions = [];
let currentQ = 0;
let answers = [];
let timePerQ = 10;
let answerDisplayTime = 5;
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

  showLoader("Verifying user...");

  fetch(API + "?action=verify&email=" + email, { method: "POST" })
    .then(res => res.json())
    .then(res => {
      hideLoader();

      if (res.status === "allowed") {
        user = res;
        localStorage.setItem("user", JSON.stringify(user));
        document.getElementById("loginBox").style.display = "none";
        loadQuiz(false);
      } else {
        alert("❌ Not allowed");
      }
    });
}

// Load state
function loadState() {
  let savedState = localStorage.getItem("quizState");
  let savedUser = localStorage.getItem("user");

  if (savedState && savedUser) {
    user = JSON.parse(savedUser);

    let data = JSON.parse(savedState);
    currentQ = data.currentQ || 0;
    answers = data.answers || [];
    remainingTime = data.remainingTime || 0;

    document.getElementById("loginBox").style.display = "none";
    loadQuiz(true);
  }
}

window.onload = loadState;

// Load questions
function loadQuiz(isResume) {
  showLoader("Loading questions...");

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

// Load timer
function loadTimer(isResume) {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      hideLoader();

      timePerQ = Number(res.time) || 5;
      answerDisplayTime = Number(res.answer_time) || 3;

      if (!isResume || remainingTime <= 0) {
        remainingTime = timePerQ;
      }

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
      <div class="option" data-val="${val}" onclick="selectOption('${val}')">
        <span class="circle"></span>
        <span class="text"><b>${val}.</b> ${opt}</span>
      </div>
    `;
  });

  html += `
    <div id="answerBox" style="margin-top:10px;"></div>
    <div class="timer" id="timer"></div>
  `;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

// Select option
function selectOption(selectedVal) {
  if (answered) return;

  answered = true;
  clearInterval(timer);

  showCorrectAnswer(selectedVal);
}

// Show correct answer
function showCorrectAnswer(selectedVal) {
  let q = questions[currentQ];
  let correct = q.answer;

// ✅ fallback instead of stopping
if (!correct || correct === "") {
  console.error("❌ Missing answer, defaulting skip:", q);
  correct = "";
} else {
  correct = correct.toString().replace(/[^A-D]/g, '').toUpperCase();
}
 

  let options = document.querySelectorAll(".option");

  options.forEach((opt) => {
    let val = (opt.getAttribute("data-val") || "")
      .toString()
      .replace(/[^A-D]/g, '')
      .toUpperCase();

    opt.classList.remove("correct", "wrong");

    if (val === correct) {
      opt.classList.add("correct");
    }

    if (selectedVal && val === selectedVal && selectedVal !== correct) {
      opt.classList.add("wrong");
    }
  });

  answers[currentQ] = selectedVal;

  let index = ["A","B","C","D"].indexOf(correct);
  let correctText = index !== -1 ? q.options[index] : "";

  let answerBox = document.getElementById("answerBox");
  if (answerBox) {
    answerBox.innerHTML = `
      <p style="color:green;text-align:center;font-weight:bold;">
        ✔ Correct Answer: ${correct}. ${correctText}
      </p>
    `;
  }

  let delay = answerDisplayTime * 1000;

  setTimeout(() => {
    if (currentQ === questions.length - 1) {
      submitQuiz();
    } else {
      currentQ++;
      remainingTime = timePerQ;
      showQuestion();
    }
  }, delay);
}

// Timer
function startTimer() {
  if (timer) clearInterval(timer);

  timer = setInterval(() => {
    let t = document.getElementById("timer");
    if (t) {
      t.innerText = "⏱️ Time left: " + remainingTime + " sec";
    }

    remainingTime--;

    saveState();

    if (remainingTime < 0) {
      clearInterval(timer);

      if (!answered) {
        answered = true;
        showCorrectAnswer("");
      }
    }
  }, 1000);
}

// Save state
function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentQ: currentQ,
    answers: answers,
    remainingTime: remainingTime
  }));
}

// Submit
function submitQuiz() {
  if (timer) clearInterval(timer);

  showLoader("Submitting...");

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
      hideLoader();

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

// Anti-cheat
document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    submitQuiz();
  }
});

window.addEventListener("beforeunload", function () {
  submitQuiz();
});
