const chatMessages = document.querySelector(".chat-messages");
const form = document.querySelector("#question-form");
const input = document.querySelector("#question");
const counterValue = document.querySelector("#char-count");
const counter = document.querySelector(".char-counter");
const errorMessage = document.querySelector("#error-message");
const clearButton = document.querySelector("#clear-messages-button");

function renderMessages(messages, currentTime) {
  chatMessages.replaceChildren();

  const welcomeMessage = document.createElement("article");
  welcomeMessage.className = "answer";
  welcomeMessage.innerHTML = `<p>Hej! Hvad vil du gerne vide om mig?</p><time class="chat-timestamp">${currentTime}</time>`;
  chatMessages.append(welcomeMessage);

  for (const message of messages) {
    const article = document.createElement("article");
    article.className = message.type;

    const text = document.createElement("p");
    text.textContent = message.text;
    const time = document.createElement("time");
    time.className = "chat-timestamp";
    time.textContent = message.time;

    article.append(text, time);
    chatMessages.append(article);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderStats(topicStats = {}) {
  for (const category of ["navn", "bosted", "fritid", "alder"]) {
    const statNode = document.querySelector(`#stat-${category}`);
    if (statNode) {
      statNode.textContent = topicStats[category] || 0;
    }
  }
}

function showError(message = "") {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

async function loadState() {
  const response = await fetch("/api/state");
  if (!response.ok) {
    throw new Error("Kunne ikke hente chatten.");
  }

  const state = await response.json();
  renderMessages(state.messages, state.currentTime);
  renderStats(state.topicStats);
}

function updateCharCounter() {
  const length = input.value.length;
  counterValue.textContent = length;

  counter.classList.remove("warning", "danger");

  if (length >= 150) {
    counter.classList.add("warning");
  }

  if (length >= 200) {
    counter.classList.add("danger");
  }
}

input.addEventListener("input", updateCharCounter);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError();

  try {
    const response = await fetch("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input.value })
    });
    const result = await response.json();

    if (!response.ok) {
      showError(result.error);
      return;
    }

    renderMessages(result.messages, result.currentTime);
    renderStats(result.topicStats);
    form.reset();
    counterValue.textContent = "0";
    counter.classList.remove("warning", "danger");
  } catch (error) {
    showError("Der opstod en fejl. Prøv igen.");
    console.error(error);
  }
});

clearButton.addEventListener("click", async () => {
  showError();

  try {
    const response = await fetch("http://localhost:3000/api/clear-messages", { method: "POST" });
    if (!response.ok) {
      throw new Error("Kunne ikke rydde beskederne.");
    }

    const state = await fetch("http://localhost:3000/api/state").then((result) => result.json());
    renderMessages(state.messages, state.currentTime);
    form.reset();
    counterValue.textContent = "0";
    counter.classList.remove("warning", "danger");
  } catch (error) {
    showError("Der opstod en fejl. Prøv igen.");
    console.error(error);
  }
});

updateCharCounter();
loadState().catch((error) => {
  showError(error.message);
  console.error(error);
});
