const API_URL = "http://localhost:3000";

const messagesContainer = document.querySelector("#messages");
const questionForm = document.querySelector("#question-form");
const questionInput = document.querySelector("#question");
const clearMessagesButton = document.querySelector("#clear-messages-button");
const resetHistoryButton = document.querySelector("#reset-history-button");
const counterValue = document.querySelector("#char-count");
const counter = document.querySelector(".char-counter");
const errorMessage = document.querySelector("#error-message");

function renderMessages(messages = []) {
  messagesContainer.innerHTML = "";

  for (const message of messages) {
    const article = document.createElement("article");
    article.className = message.type;

    const text = document.createElement("p");
    text.textContent = message.text;

    const time = document.createElement("time");
    time.className = "chat-timestamp";
    time.textContent = message.time || message.createdAt || "";

    article.append(text, time);
    messagesContainer.append(article);
  }

  messagesContainer.append(resetHistoryButton);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderStats(topicStats = {}) {
  const categories = ["navn", "bosted", "fritid", "alder"];
  const values = categories.map((category) => Number(topicStats[category]) || 0);
  const maxValue = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);
  const totalNode = document.querySelector("#stats-total");
  const levelNode = document.querySelector("#stats-level");
  const progressNode = document.querySelector(".stats-progress-track span");

  if (totalNode) totalNode.textContent = total;
  if (levelNode) levelNode.textContent = String(Math.min(99, Math.floor(total / 5) + 1)).padStart(2, "0");
  if (progressNode) progressNode.style.setProperty("--progress-fill", `${Math.min(100, (total % 5) * 20)}%`);

  categories.forEach((category, index) => {
    const statNode = document.querySelector(`#stat-${category}`);
    if (statNode) {
      const value = values[index];
      statNode.textContent = value;
      statNode.closest("li")?.style.setProperty("--stat-fill", `${(value / maxValue) * 100}%`);
    }
  });
}

function updateCharCounter() {
  const length = questionInput.value.length;
  counterValue.textContent = length;

  counter.classList.remove("warning", "danger");

  if (length >= 150) {
    counter.classList.add("warning");
  }

  if (length >= 200) {
    counter.classList.add("danger");
  }
}

async function loadState() {
  const response = await fetch(`${API_URL}/api/state`);

  if (!response.ok) {
    throw new Error("Kunne ikke hente samtale-status.");
  }

  const state = await response.json();
  renderMessages(state.messages || []);
  renderStats(state.topicStats || {});
}

questionInput.addEventListener("input", updateCharCounter);

questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();

  const response = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await response.json();

  if (!response.ok) {
    return;
  }

  renderMessages(data.messages || []);
  renderStats(data.topicStats || {});
  questionInput.value = "";
  updateCharCounter();
});

clearMessagesButton.addEventListener("click", async () => {
  await fetch(`${API_URL}/api/clear-messages`, { method: "POST" });
  renderMessages([]);
  questionInput.value = "";
  counterValue.textContent = "0";
  counter.classList.remove("warning", "danger");
});

resetHistoryButton.addEventListener("click", async () => {
  errorMessage.hidden = true;

  try {
    const response = await fetch(`${API_URL}/api/reset-history`, { method: "POST" });

    if (!response.ok) {
      throw new Error("Kunne ikke nulstille samtalehistorikken.");
    }

    const state = await response.json();
    renderMessages(state.messages);
    renderStats(state.topicStats);
    questionInput.value = "";
    updateCharCounter();
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
    console.error(error);
  }
});

updateCharCounter();
loadState();