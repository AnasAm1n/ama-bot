import express from "express";

const app = express();
const port = 3000;
const messages = [];
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

const answers = [
  {
    keywords: ["navn", "hedder", "hvem er du"],
    answer: "Jeg hedder Anas. Hvad vil du ellers vide om mig?"
  },
  {
    keywords: ["bor", "by", "fra"],
    answer: "Jeg bor i Aarhus."
  },
  {
    keywords: ["fritid", "hobby", "kan lide"],
    answer: "I min fritid kan jeg godt lide at game og træne."
  }
];
 
function findAnswer(question) {
  const normalizedQuestion = question.toLowerCase();

  for (const answerGroup of answers) {
    const hasMatch = answerGroup.keywords.some((keyword) => normalizedQuestion.includes(keyword));

    if (hasMatch) {
      return answerGroup.answer;
    }
  }

  return "Det kender jeg ikke svaret på endnu.";
}


app.post("/ask", (request, response) => {
  const question = request.body.question.trim();
  let error = "";

  if (!question) {
    error = "Skriv et spørgsmål, før du sender.";
  } else {
    messages.push({ type: "question", text: question });
    const answer = findAnswer(question);
    messages.push({ type: "answer", text: answer });
  }

  response.render("index", { messages, error, question });
});
app.get("/", (request, response) => {
  response.render("index", { messages, error: "", question: "" });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});