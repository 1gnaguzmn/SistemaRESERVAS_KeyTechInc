const SENSITIVE_KEY = /contrasena|password|hash|token|csrf|secret/i;
function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .map(([key, item]) => [key, sanitize(item)]),
    );
  return value;
}
function csvCell(value) {
  let text = value == null ? "" : String(value);
  // Evita que Excel interprete el contenido como fórmula (CSV injection).
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
module.exports = { sanitize, csvCell };
