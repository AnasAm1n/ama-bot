import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const answersFilePath = path.join(__dirname, "answers.json");

export async function loadAnswers() {
  const data = await fs.readFile(answersFilePath, "utf8");
  return JSON.parse(data);
}

export async function saveAnswers(value) {
  await fs.writeFile(answersFilePath, JSON.stringify(value, null, 2));
}
