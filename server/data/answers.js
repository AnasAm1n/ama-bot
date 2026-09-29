import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const answersFilePath = path.join(__dirname, "answers.json");

// Jeg bruger den her til at hente mine svarregler fra disk. Det gør det nemt at ændre chatbotten uden at have faste data liggende i koden.
export async function loadAnswers() {
  try {
    const data = await fs.readFile(answersFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error("Kunne ikke indlæse svarregler.", { cause: error });
  }
}

// Denne funktion gemmer svarreglerne tilbage til filen. Jeg bruger den, når jeg vil opdatere chatbotten og sikre, at ændringerne bliver bevaret mellem sessions.
export async function saveAnswers(value) {
  await fs.writeFile(answersFilePath, JSON.stringify(value, null, 2));
}
