import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { loadAnswers } from "./data/answers.js";
import { loadMessages, saveMessages } from "./data/messages.js";
import answersRouter from "./routes/answers.js";
import messagesRouter from "./routes/messages.js";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(__dirname, "..", "client");
const dataDirectory = path.join(__dirname, "data");
const port = 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(clientDirectory));
app.use("/messages", messagesRouter);
app.use("/answers", answersRouter);

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && "body" in error && error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Ugyldigt JSON-format. Tjek den sendte data." });
  }

  return next(error);
});

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

function countMatches(keywords, normalizedQuestion) {
  return keywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(normalizedQuestion)
  ).length;
}

function findBestAnswer(question, answerGroups) {
  const normalizedQuestion = question.toLowerCase();
  let bestScore = 0;
  let bestAnswer = "Det kender jeg ikke svaret på endnu.";
  let bestCategory = "";

  for (const answerGroup of answerGroups) {
    const score = countMatches(answerGroup.keywords, normalizedQuestion);

    if (score > bestScore) {
      const answerTexts = answerGroup.answer !== undefined
        ? [answerGroup.answer]
        : answerGroup.answers;
      const randomIndex = Math.floor(Math.random() * answerTexts.length);
      bestScore = score;
      bestAnswer = answerTexts[randomIndex];
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

app.post("/api/ask", async (request, response) => {
  const question = sanitizeQuestion(request.body?.question || "").trim();

  if (!question) {
    return response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
  }

  const messages = await loadMessages();
  const topicStats = await loadTopicStats();
  const answerRules = await loadAnswers();
  const result = findBestAnswer(question, answerRules);

  messages.push({ type: "question", text: question, time: getCurrentTime() });
  messages.push({ type: "answer", text: result.answer, time: getCurrentTime() });

  if (result.category) {
    topicStats[result.category] = (topicStats[result.category] || 0) + 1;
  }

  await saveMessages(messages);
  await writeJson("topic-stats.json", topicStats);

  return response.json({
    messages,
    topicStats,
    answer: result.answer,
    currentTime: getCurrentTime()
  });
});


app.post("/api/clear-messages", async (request, response) => {
  await saveMessages([]);
  return response.json({ messages: [] });
});

app.post("/api/reset-history", async (request, response) => {
  await saveMessages([]);

  const topicStats = await loadTopicStats();
  const resetTopicStats = Object.fromEntries(
    Object.keys(topicStats).map((category) => [category, 0])
  );
  await writeJson("topic-stats.json", resetTopicStats);

  return response.json({ messages: [], topicStats: resetTopicStats });
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
