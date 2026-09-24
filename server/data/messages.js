import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesFilePath = path.join(__dirname, "messages.json");

export async function loadMessages() {
  const data = await fs.readFile(messagesFilePath, "utf8");
  return JSON.parse(data);
}

export async function saveMessages(value) {
  await fs.writeFile(messagesFilePath, JSON.stringify(value, null, 2));
}
