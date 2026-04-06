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

function login() {
  let email = document.getElementById("email").value;

  fetch(API + "?action=verify&email=" + email, { method: "POST" })
    .then(res => res.json())
    .then(res => {
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

function loadTimer(isResume) {
  fetch(API + "?action=time", { method: "POST" })
    .then(res => res.json())
    .then(res => {
      timePerQ = res.time;
      answerDisplayTime = res.answer_time;

      if (!isResume || remainingTime <= 0) {
        remainingTime = timePerQ;
      }

      showQuestion();
    });
}

function showQuestion() {
  if (currentQ >= questions.length) {
    submitQuiz();
    return;
  }

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

  html += `<div class="timer" id="timer"></div>`;

  document.getElementById("quiz").innerHTML = html;

  startTimer();
}

function selectOption(selectedVal) {
  if (answered) return;

  clearInterval(timer);
  showCorrectAnswer(selectedVal);
}

function showCorrectAnswer(selectedVal) {
  answered = true;

  let q = questions[currentQ];
  let correct = q.answer;

  let options = document.querySelectorAll(".option");

  options.forEach((opt) => {
    let val = opt.getAttribute("data-val");

    if (val === correct) {
      opt.classList.add("correct");
    } else if (val === selectedVal) {
      opt.classList.add("wrong");
    }
  });

  answers[currentQ] = selectedVal;

  setTimeout(() => {
    currentQ++;
    remainingTime = timePerQ;
    showQuestion();
  }, answerDisplayTime * 1000);
}

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
        showCorrectAnswer("");
      }
    }
  }, 1000);
}

function saveState() {
  localStorage.setItem("quizState", JSON.stringify({
    currentQ: currentQ,
    answers: answers,
    remainingTime: remainingTime
  }));
}

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

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    submitQuiz();
  }
});

window.addEventListener("beforeunload", function () {
  submitQuiz();
});
