const API_URL = "http://localhost:3000";

const messagesContainer = document.querySelector("#messages");
const gameboy = document.querySelector(".phone");
const questionForm = document.querySelector("#question-form");
const questionInput = document.querySelector("#question");
const clearMessagesButton = document.querySelector("#clear-messages-button");
const counterValue = document.querySelector("#char-count");
const counter = document.querySelector(".char-counter");
const sendButton = questionForm.querySelector('button[type="submit"]');
let typingInterval;

// Jeg har denne funktion, når jeg vil genopbygge chatten ud fra den aktuelle state. Den sørger for at vise alle beskeder korrekt og holder det sidste svar i samme flow, så det kan blive skrevet ud med en lille type-effekt.
function renderMessages(messages = [], animateLastAnswer = false) {
  clearInterval(typingInterval);
  messagesContainer.innerHTML = "";

  messages.forEach((message, index) => {
    const article = document.createElement("article");
    article.className = message.type;

    const text = document.createElement("p");
    const shouldAnimate = animateLastAnswer
      && index === messages.length - 1
      && message.type === "answer"
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const answerText = Array.from(message.text || "");

    if (shouldAnimate) {
      text.classList.add("typing");
      text.setAttribute("aria-label", message.text);
    } else {
      text.textContent = message.text;
    }

    const time = document.createElement("time");
    time.className = "chat-timestamp";
    time.textContent = message.time || message.createdAt || "";

    article.append(text, time);
    messagesContainer.append(article);
    if (shouldAnimate) {
      let visibleCharacters = 0;
      typingInterval = setInterval(() => {
        visibleCharacters += 1;
        text.textContent = answerText.slice(0, visibleCharacters).join("");

        if (visibleCharacters >= answerText.length) {
          clearInterval(typingInterval);
          text.classList.remove("typing");
        }
      }, 24);
    }
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Denne funktion er min hurtige “status-omdeler”. Jeg bruger den til at tage de rå statistikker og omsætte dem til det visuelle niveau, total og stof, så jeg kan se, hvad der fylder mest uden at kigge i dataene.
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

// Jeg bruger den her, når jeg vil holde øje med længden af mit spørgsmål. Den fortæller mig, om jeg er i normal-grænsen, i advarselszonen eller allerede over den tilladte grænse.
function updateCharCounter() {
  const characterCount = questionInput.value.length;
  counterValue.textContent = characterCount;
  sendButton.disabled = characterCount >= 200;

  counter.classList.remove("warning", "danger");

  if (characterCount >= 150 && characterCount < 200) {
    counter.classList.add("warning");
  }

  if (characterCount >= 200) {
    counter.classList.add("danger");
  }
}

// Denne funktion er min “startopdatering”. Jeg henter appens aktuelle state fra serveren, så chatten og statistikkerne altid kommer op med den rigtige data, når siden loader.
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
  if (sendButton.disabled) {
    return;
  }

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

  renderMessages(data.messages || [], true);
  renderStats(data.topicStats || {});
  questionInput.value = "";
  updateCharCounter();
});

clearMessagesButton.addEventListener("click", async () => {
  const response = await fetch(`${API_URL}/api/clear-messages`, { method: "POST" });

  if (!response.ok) {
    throw new Error("Kunne ikke rydde beskederne.");
  }

  renderMessages([]);
  questionInput.value = "";
  updateCharCounter();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gameboy.classList.remove("wiggle");
    void gameboy.offsetWidth;
    gameboy.classList.add("wiggle");
    gameboy.addEventListener("animationend", () => {
      gameboy.classList.remove("wiggle");
    }, { once: true });
  }
});

updateCharCounter();
loadState();