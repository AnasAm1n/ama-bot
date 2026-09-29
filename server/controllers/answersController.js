import { loadAnswers, saveAnswers } from "../data/answers.js";

function isValidAnswerRule(body) {
  return typeof body?.category === "string"
    && body.category.trim().length > 0
    && Array.isArray(body.keywords)
    && body.keywords.length > 0
    && body.keywords.every((keyword) => typeof keyword === "string" && keyword.trim().length > 0)
    && typeof body.answer === "string"
    && body.answer.trim().length > 0;
}

export async function getAnswers(request, response) {
  const answers = await loadAnswers();
  response.json(answers);
}

export async function getAnswerByCategory(request, response) {
  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  if (!answerRule) {
    return response.status(404).json({ error: "Kategorien blev ikke fundet." });
  }

  response.json(answerRule);
}

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
