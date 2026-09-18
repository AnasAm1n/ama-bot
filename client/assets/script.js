const chatMessages = document.querySelector(".chat-messages");
const form = document.querySelector("#ask-form");
const input = document.querySelector("#question");
const counter = document.querySelector("#char-count");
const errorMessage = document.querySelector("#error-message");
const clearButton = document.querySelector("#clear-messages");

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

function renderStats(topicStats) {
  for (const category of ["navn", "bosted", "fritid", "alder"]) {
    document.querySelector(`#stat-${category}`).textContent = topicStats[category] || 0;
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

input.addEventListener("input", () => {
  counter.textContent = input.value.length;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError();

  try {
    const response = await fetch("/api/ask", {
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
    counter.textContent = "0";
  } catch (error) {
    showError("Der opstod en fejl. Prøv igen.");
    console.error(error);
  }
});

clearButton.addEventListener("click", async () => {
  showError();

  try {
    const response = await fetch("/messages", { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Kunne ikke rydde beskederne.");
    }

    const state = await fetch("/api/state").then((result) => result.json());
    renderMessages(state.messages, state.currentTime);
  } catch (error) {
    showError("Der opstod en fejl. Prøv igen.");
    console.error(error);
  }
});

loadState().catch((error) => {
  showError(error.message);
  console.error(error);
});
