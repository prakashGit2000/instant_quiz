const API = "https://script.google.com/macros/s/AKfycbzT1m0ezJ8CXP2C4OkdviL-4ExkwV_x4tZtxpjsKjbptEWox1aaNk7IjDjSSchV-kf7/exec";

let user = {};
let questions = [];
let time = 30;

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
      alert("Not allowed");
    }
  });
}

// 📥 LOAD QUESTIONS
function loadQuiz() {
  fetch(API + "?action=questions", { method: "POST" })
  .then(res => res.json())
  .then(data => {
    questions = data;
    renderQuiz();
    loadTimer();
  });
}

// ⏱️ TIMER
function loadTimer() {
  fetch(API + "?action=time", { method: "POST" })
  .then(res => res.json())
  .then(res => {
    time = res.time;
    startTimer();
  });
}

function startTimer() {
  let t = setInterval(() => {
    document.getElementById("timer").innerText = "Time: " + time--;
    if (time < 0) {
      clearInterval(t);
      submitQuiz();
    }
  }, 1000);
}

// 🧾 RENDER
function renderQuiz() {
  let html = "";

  questions.forEach((q, i) => {
    html += `<p>${i+1}. ${q.q}</p>`;

    q.options.forEach((opt, j) => {
      let val = ["A","B","C","D"][j];
      html += `<input type="radio" name="q${i}" value="${val}">${opt}<br>`;
    });
  });

  document.getElementById("quiz").innerHTML = html;
}

// 📤 SUBMIT
function submitQuiz() {
  let answers = questions.map((_, i) => {
    let s = document.querySelector(`input[name="q${i}"]:checked`);
    return s ? s.value : "";
  });

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
      alert(res.error);
    } else {
      document.getElementById("result").innerText =
        "Score: " + res.score;
    }
  });
}
