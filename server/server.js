import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(__dirname, "..", "client");
const dataDirectory = path.join(__dirname, "data");
const port = 3000;

const app = express();
app.use(express.json());
app.use(express.static(clientDirectory));

async function readJson(fileName) {
  const data = await fs.readFile(path.join(dataDirectory, fileName), "utf8");
  return JSON.parse(data);
}

async function writeJson(fileName, value) {
  await fs.writeFile(
    path.join(dataDirectory, fileName),
    JSON.stringify(value, null, 2)
  );
}

async function loadMessages() {
  return readJson("messages.json");
}

async function loadTopicStats() {
  return readJson("topic-stats.json");
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Copenhagen"
  }).format(new Date());
}

const answers = [
  {
    category: "navn",
    keywords: ["navn", "hedder", "hvem er du"],
    answers: ["Jeg hedder Anas. Hvad vil du ellers vide om mig?"]
  },
  {
    category: "bosted",
    keywords: ["bor", "by", "fra"],
    answers: ["Jeg bor i Aarhus."]
  },
  {
    category: "fritid",
    keywords: ["fritid", "hobby", "kan lide"],
    answers: [
      "I min fritid kan jeg godt lide at læse.",
      "Jeg elsker at gå ture, når vejret tillader det."
    ]
  },
  {
    category: "alder",
    keywords: ["alder", "gammel", "ung"],
    answers: ["Jeg er 24 år gammel", "Jeg er 24 år ung"]
  },
  {
    category: "Hej",
    keywords: ["hej", "goddag", "hello"],
    answers: ["Hej med dig!", "Yo!", "Hello!"]
  },
  {
    category: "Går",
    keywords: ["Hvordan", "går", "har"],
    answers: ["Det går fint", "Det går stille og roligt"]
  }
];

function countMatches(keywords, normalizedQuestion) {
  return keywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(normalizedQuestion)
  ).length;
}

function findBestAnswer(question) {
  const normalizedQuestion = question.toLowerCase();
  let bestScore = 0;
  let bestAnswer = "Det kender jeg ikke svaret på endnu.";
  let bestCategory = "";

  for (const answerGroup of answers) {
    const score = countMatches(answerGroup.keywords, normalizedQuestion);

    if (score > bestScore) {
      const randomIndex = Math.floor(Math.random() * answerGroup.answers.length);
      bestScore = score;
      bestAnswer = answerGroup.answers[randomIndex];
      bestCategory = answerGroup.category;
    }
  }

  return { answer: bestAnswer, category: bestCategory };
}

function sanitizeQuestion(input) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "");
}

app.get("/api/state", async (request, response) => {
  const messages = await loadMessages();
  const topicStats = await loadTopicStats();
  return response.json({ messages, topicStats, currentTime: getCurrentTime() });
});

app.get("/messages", async (request, response) => {
  const messages = await loadMessages();

  response.json(messages);
});

app.post("/api/ask", async (request, response) => {
  const question = sanitizeQuestion(request.body?.question || "").trim();

  if (!question) {
    return response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
  }

  const messages = await loadMessages();
  const topicStats = await loadTopicStats();
  const result = findBestAnswer(question);

  messages.push({ type: "question", text: question, time: getCurrentTime() });
  messages.push({ type: "answer", text: result.answer, time: getCurrentTime() });

  if (result.category) {
    topicStats[result.category] = (topicStats[result.category] || 0) + 1;
  }

  await writeJson("messages.json", messages);
  await writeJson("topic-stats.json", topicStats);

  return response.json({
    messages,
    topicStats,
    answer: result.answer,
    currentTime: getCurrentTime()
  });
});

app.post("/api/clear-messages", async (request, response) => {
  await writeJson("messages.json", []);
  return response.json({ messages: [] });
});

app.post("/messages", async (request, response) => {
  const messages = await loadMessages();
  const question = (request.body?.question || "").trim();

  if (!question) {
    return response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
  }

  const message = { type: "question", text: question, createdAt: new Date().toISOString() };
  messages.push(message);

  const result = findBestAnswer(question);
  const answerMessage = {
    type: "answer",
    text: result.answer,
    createdAt: new Date().toISOString()
  };
  messages.push(answerMessage);

  await writeJson("messages.json", messages);

  return response.json({ question: message, answer: answerMessage });
});

app.post("/key-press", (request, response) => {
  const key = request.body?.key;

  if (typeof key !== "string" || key.length === 0) {
    return response.status(400).json({ error: "Der mangler en tast." });
  }

  console.log("Tast trykket i browseren:", key);
  return response.sendStatus(204);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
