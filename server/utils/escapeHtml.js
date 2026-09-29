// Jeg bruger den her, når jeg vil vise brugerinput sikkert i HTML. Den konverterer specialtegn, så jeg undgår ødelagte tags eller injection i chatten.
export function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
