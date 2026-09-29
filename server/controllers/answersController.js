import { loadAnswers, saveAnswers } from "../data/answers.js";

// Denne funktion er min sikkerhedsnet. Jeg bruger den til at tjekke, om en svarregel faktisk har den struktur, jeg forventer, så jeg ikke gemmer noget rod og senere får en dårlig chatbot.
function isValidAnswerRule(body) {
  return typeof body?.category === "string"
    && body.category.trim().length > 0
    && Array.isArray(body.keywords)
    && body.keywords.length > 0
    && body.keywords.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0)
    && typeof body.answer === "string"
    && body.answer.trim().length > 0;
}

// Jeg bruger den her, når jeg vil hente alle svarreglerne på én gang. Det gør det nemt at inspicere eller debugge de data, jeg faktisk bruger til at besvare spørgsmål.
export async function getAnswers(request, response) {
  const answers = await loadAnswers();
  response.json(answers);
}

// Denne funktion er til, når jeg vil hente en enkelt kategori på en præcis måde. Det er praktisk, hvis jeg vil arbejde med én bestemt svarregel uden at rode rundt i resten af listen.
export async function getAnswerByCategory(request, response) {
  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  if (!answerRule) {
    return response.status(404).json({ error: "Kategorien blev ikke fundet." });
  }

  response.json(answerRule);
}

// Jeg bruger den her, når jeg vil lære chatbotten noget nyt. Den tilføjer en ny svarregel til listen, så jeg kan udvide den uden at hakke direkte i JSON-filen.
export async function createAnswer(request, response) {
  if (!isValidAnswerRule(request.body)) {
    return response.status(400).json({
      error: "En svarregel skal have kategori, nøgleord og et svar."
    });
  }

  const answers = await loadAnswers();
  const newAnswerRule = {
    category: request.body.category,
    keywords: request.body.keywords,
    answer: request.body.answer
  };

  answers.push(newAnswerRule);
  await saveAnswers(answers);

  response.status(201).json(newAnswerRule);
}

// Den her er til at rette en eksisterende svarregel. Jeg bruger den, når jeg vil justere nøgleord eller svar, uden at skulle slette og oprette hele kategorien igen.
export async function updateAnswer(request, response) {
  if (!isValidAnswerRule({ ...request.body, category: request.params.category })) {
    return response.status(400).json({
      error: "En svarregel skal have nøgleord og et svar."
    });
  }

  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  if (!answerRule) {
    return response.status(404).json({ error: "Kategorien blev ikke fundet." });
  }

  answerRule.keywords = request.body.keywords;
  answerRule.answer = request.body.answer;

  await saveAnswers(answers);

  response.json(answerRule);
}

// Jeg bruger den her, når jeg vil rydde op i en kategori. Den fjerner en svarregel og holder dataene konsistente, så jeg ikke efterlader halvfærdige eller forældede svar.
export async function deleteAnswer(request, response) {
  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  if (!answerRule) {
    return response.status(404).json({ error: "Kategorien blev ikke fundet." });
  }

  const updatedAnswers = answers.filter(
    (answerRule) => answerRule.category !== request.params.category
  );

  await saveAnswers(updatedAnswers);

  response.status(204).send();
}
