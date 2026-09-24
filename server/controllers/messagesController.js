import { loadAnswers } from "../data/answers.js";
import { loadMessages, saveMessages } from "../data/messages.js";

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

export async function getMessages(request, response) {
  const messages = await loadMessages();
  response.json(messages);
}

export async function createMessage(request, response) {
  const messages = await loadMessages();
  const question = (request.body?.question || "").trim();

  if (!question) {
    return response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
  }

  const message = { type: "question", text: question, createdAt: new Date().toISOString() };
  messages.push(message);

  const answerRules = await loadAnswers();
  const result = findBestAnswer(question, answerRules);
  const answerMessage = {
    type: "answer",
    text: result.answer,
    createdAt: new Date().toISOString()
  };
  messages.push(answerMessage);

  await saveMessages(messages);

  return response.json({ question: message, answer: answerMessage });
}

export async function deleteMessages(request, response) {
  await saveMessages([]);

  return response.json({ messages: [] });
}
