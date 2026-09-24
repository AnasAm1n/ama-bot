import { loadAnswers, saveAnswers } from "../data/answers.js";

export async function getAnswers(request, response) {
  const answers = await loadAnswers();
  response.json(answers);
}

export async function getAnswerByCategory(request, response) {
  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  response.json(answerRule);
}

export async function createAnswer(request, response) {
  const answers = await loadAnswers();
  const newAnswerRule = {
    category: request.body.category,
    keywords: request.body.keywords,
    answer: request.body.answer
  };

  answers.push(newAnswerRule);
  await saveAnswers(answers);

  response.json(newAnswerRule);
}

export async function updateAnswer(request, response) {
  const answers = await loadAnswers();
  const answerRule = answers.find((a) => a.category === request.params.category);

  answerRule.keywords = request.body.keywords;
  answerRule.answer = request.body.answer;

  await saveAnswers(answers);

  response.json(answerRule);
}

export async function deleteAnswer(request, response) {
  const answers = await loadAnswers();
  const updatedAnswers = answers.filter(
    (answerRule) => answerRule.category !== request.params.category
  );

  await saveAnswers(updatedAnswers);

  response.send();
}
