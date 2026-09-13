import fs from "node:fs/promises";
import express from "express";

const app = express();
const port = 3000;
// Jeg gemmer chatbeskederne i et array, så de kan vises igen efter hvert spørgsmål.
async function loadMessages() {
const data = await fs.readFile("./data/messages.json", "utf8");
return JSON.parse(data);

}

async function saveMessages(messages) {
const json = JSON.stringify(messages, null, 2);
await fs.writeFile("./data/messages.json", json);
}
// Jeg starter alle emnetællere på 0 og opdaterer den valgte kategori senere.
async function loadTopicStats() {
  const data = await fs.readFile("./data/topic-stats.json", "utf8");
  return JSON.parse(data);
}

async function saveTopicStats(topicStats) {
  const json = JSON.stringify(topicStats, null, 2);
  await fs.writeFile("./data/topic-stats.json", json);
}

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));


const answers = [
  {
    // Jeg bruger kategorien til statistik, mens keywords bruges til at finde et svar.
    category: "navn",
    keywords: ["navn", "hedder", "hvem er du"],
    answers: [
      "Jeg hedder Anas. Hvad vil du ellers vide om mig?"
    ]
  },
  {
    category: "bosted",
    keywords: ["bor", "by", "fra"],
    answers: [
      "Jeg bor i Aarhus."
    ]
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
    answers: [
      "Jeg er 24 år gammel",
      "Jeg er 24 år ung"
    ]
  },
  {
    category: "Hej",
    keywords: ["hej", "goddag", "hello"],
    answers: [
      "Hej med dig!",
      "Yo!",
      "Hello!"
    ]
  }
];

function countMatches(keywords, normalizedQuestion) {
  // Jeg filtrerer keywords, så jeg kun beholder dem, der findes i spørgsmålet.
  const matches = keywords.filter((keyword) => {
    return new RegExp(`\\b${keyword}\\b`).test(normalizedQuestion);
  });

  // Jeg bruger længden på det nye array som reglens score.
  return matches.length;
}

function findBestAnswer(question) {
  // Jeg gør spørgsmålet til små bogstaver, så store og små bogstaver ikke betyder noget.
  const normalizedQuestion = question.toLowerCase();
  let bestScore = 0;
  let bestAnswer = "Det kender jeg ikke svaret på endnu.";
  let bestCategory = "";

  for (const answerGroup of answers) {
    // Jeg undersøger alle svarregler i stedet for kun at bruge den første, der matcher.
    const score = countMatches(answerGroup.keywords, normalizedQuestion);

    if (score > bestScore) {
      // Jeg opdaterer kun vinderen ved en højere score, så den første regel vinder ved lige score.
      const randomIndex = Math.floor(Math.random() * answerGroup.answers.length);
      bestScore = score;
      bestAnswer = answerGroup.answers[randomIndex];
      bestCategory = answerGroup.category;
    }
  }

  return {
    // Jeg returnerer både teksten og kategorien, fordi begge dele skal bruges i POST-routen.
    answer: bestAnswer,
    category: bestCategory
  };
}

function sanitizeQuestion(input) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "");
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Copenhagen"
  }).format(new Date());
}

app.post("/ask", async (request, response) => {
  // Jeg henter spørgsmålet fra formularen og fjerner mellemrum i starten og slutningen.
  const question = sanitizeQuestion(request.body?.question || "").trim();
  let error = "";
  const messages = await loadMessages();

  if (!question) {
    // Jeg viser en fejl, hvis brugeren sender formularen uden et spørgsmål.
    error = "Skriv et spørgsmål, før du sender.";
  } else {
    // Jeg gemmer først brugerens spørgsmål, så både spørgsmål og svar kan vises i chatten.
    messages.push({ type: "question", text: question, time: getCurrentTime() });
    const result = findBestAnswer(question);
    messages.push({ type: "answer", text: result.answer, time: getCurrentTime() });

    if (result.category) {
      // Jeg bruger kategorien som property-navn for at tælle det valgte emne.
      topicStats[result.category] = topicStats[result.category] + 1;
    }

    await saveMessages(messages);
  }

  // Jeg sender chatten, fejlbeskeden og statistikken videre til EJS.
  response.render("index", {
    messages,
    error,
    question,
    topicStats,
    currentTime: getCurrentTime()
  });
});

app.get("/", async (request, response) => {
  const messages = await loadMessages();

  response.render("index", {
    messages,
    error: "",
    topicStats,
    currentTime: getCurrentTime()
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});