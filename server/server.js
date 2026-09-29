import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { loadAnswers } from "./data/answers.js";
import { loadMessages, saveMessages } from "./data/messages.js";
import answersRouter from "./routes/answers.js";
import messagesRouter from "./routes/messages.js";
import cors from "cors";
import { escapeHtml } from "./utils/escapeHtml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(__dirname, "..", "client");
const dataDirectory = path.join(__dirname, "data");
const port = 3000;

const app = express();
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"]
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(clientDirectory));
app.use("/messages", messagesRouter);
app.use("/answers", answersRouter);

// Jeg har den her, når jeg vil læse JSON-filer på en ensartet måde. Det gør det nemt at hente de nyeste data uden at skrive den samme fil-logik flere steder.
async function readJson(fileName) {
  const data = await fs.readFile(path.join(dataDirectory, fileName), "utf8");
  return JSON.parse(data);
}

// Denne funktion skriver data tilbage til disk. Jeg bruger den til at opdatere statistik og andre lagrede værdier, så de forbliver konsistente mellem requests.
async function writeJson(fileName, value) {
  await fs.writeFile(
    path.join(dataDirectory, fileName),
    JSON.stringify(value, null, 2)
  );
}

// Jeg bruger den her til at hente de gemte emnestatistikker. Så kan jeg vise, hvor mange gange hver kategori har været brugt, uden at holde den state i hovedet.
async function loadTopicStats() {
  return readJson("topic-stats.json");
}

// Den her er min lille tidsformatfunktion. Jeg bruger den til at få et rent dansk tidsformat, så hver besked får et timestamp, der er nemt at læse.
function getCurrentTime() {
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Copenhagen"
  }).format(new Date());
}

// Jeg bruger den her til at tælle, hvor mange nøgleord et spørgsmål matcher i en svarregel. Det er min simple måde at finde det mest relevante svar på.
function countMatches(keywords, normalizedQuestion) {
  return keywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(normalizedQuestion)
  ).length;
}

// Denne funktion vælger det bedste svar blandt flere regler. Den er vigtig, når flere kategorier har lignende nøgleord, fordi den sørger for, at den mest relevante regel får prioritet.
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

// Jeg bruger den her til at rydde op i spørgsmål, før de bliver behandlet. Det fjerner uhensigtsmæssige control-tegn, så inputtet holder sig rent og forudsigeligt.
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

  messages.push({ type: "question", text: escapeHtml(question), time: getCurrentTime() });
  messages.push({ type: "answer", text: escapeHtml(result.answer), time: getCurrentTime() });

  if (result.category) {
    topicStats[result.category] = (topicStats[result.category] || 0) + 1;
  }

  await saveMessages(messages);
  await writeJson("topic-stats.json", topicStats);

  return response.json({
    messages,
    topicStats,
    answer: escapeHtml(result.answer),
    currentTime: getCurrentTime()
  });
});


app.post("/api/clear-messages", async (request, response) => {
  await saveMessages([]);
  return response.json({ messages: [] });
});

app.post("/key-press", (request, response) => {
  const key = request.body?.key;

  if (typeof key !== "string" || key.length === 0) {
    return response.status(400).json({ error: "Der mangler en tast." });
  }

  console.log("Tast trykket i browseren:", key);
  return response.sendStatus(204);
});

app.use((request, response) => {
  return response.status(404).json({ error: "Ruten blev ikke fundet." });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error && error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Ugyldigt JSON-format. Tjek den sendte data." });
  }

  console.error(error);
  return response.status(500).json({ error: "Der opstod en intern serverfejl." });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
