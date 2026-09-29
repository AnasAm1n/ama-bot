import { loadAnswers } from "../data/answers.js";
import { loadMessages, saveMessages } from "../data/messages.js";
import { escapeHtml } from "../utils/escapeHtml.js";

// Jeg bruger den her til at tælle, hvor mange nøgleord der matcher et spørgsmål. Det er den simple måde at vurdere, hvilket svar der passer bedst, uden at gætte.
function countMatches(keywords, normalizedQuestion) {
  return keywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(normalizedQuestion)
  ).length;
}

// Denne funktion vælger det bedste svar ud fra matchscore. Den prioriterer det mest relevante svar, men lader stadig et svar med flere muligheder blive valgt tilfældigt, så samtalen ikke bliver for mekanisk.
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

// Jeg bruger den her, når jeg vil se hele samtalen i dens nuværende tilstand. Det er nyttigt, når jeg debugger eller bare vil kontrollere, at chatbotten opfører sig, som den skal.
export async function getMessages(request, response) {
  const messages = await loadMessages();
  response.json(messages);
}

// Denne funktion tager imod et nyt spørgsmål, finder et passende svar og gemmer begge dele. Det er den centrale “samtale”-funktion, fordi den holder historikken levende og brugbar.
export async function createMessage(request, response) {
  const messages = await loadMessages();
  const question = (request.body?.question || "").trim();

  if (!question) {
    return response.status(400).json({ error: "Skriv et spørgsmål, før du sender." });
  }

  const message = {
    type: "question",
    text: escapeHtml(question),
    createdAt: new Date().toISOString()
  };
  messages.push(message);

  const answerRules = await loadAnswers();
  const result = findBestAnswer(question, answerRules);
  const answerMessage = {
    type: "answer",
    text: escapeHtml(result.answer),
    createdAt: new Date().toISOString()
  };
  messages.push(answerMessage);

  await saveMessages(messages);

  return response.status(201).json({
    question: message,
    answer: answerMessage
  });
}

// Jeg bruger den her, når jeg vil nulstille samtalen. Det er praktisk, når jeg tester noget nyt eller vil starte forfra uden at blive hængende i gamle beskeder.
export async function deleteMessages(request, response) {
  await saveMessages([]);

  return response.status(204).send();
}
