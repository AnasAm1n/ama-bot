import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesFilePath = path.join(__dirname, "messages.json");

// Jeg bruger den her til at hente chat-historikken fra disk. Så kan appen genoprette samtalen og jeg kan debugge den uden at miste kontekst.
export async function loadMessages() {
  try {
    const data = await fs.readFile(messagesFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error("Kunne ikke indlæse beskeder.", { cause: error });
  }
}

// Denne funktion gemmer samtalen tilbage til filen. Jeg bruger den, når jeg tester løsningen eller opdaterer den, så historikken faktisk bliver bevaret.
export async function saveMessages(value) {
  await fs.writeFile(messagesFilePath, JSON.stringify(value, null, 2));
}
