/**
 * Utilidades de fecha y zona horaria para Taller Bautista.
 * Zona oficial del negocio: America/El_Salvador (UTC-6 sin horario de verano).
 *
 * Regla de calidad: Trabajar con fechas civiles YYYY-MM-DD y evitar
 * new Date('YYYY-MM-DD') para visualización que sufra desfases de zona local del navegador.
 */

export const TIMEZONE_EL_SALVADOR = "America/El_Salvador";

/**
 * Obtiene la fecha civil de hoy en la zona horaria de El Salvador en formato YYYY-MM-DD.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getTodayCivilDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_EL_SALVADOR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Obtiene la fecha civil de mañana en la zona horaria de El Salvador en formato YYYY-MM-DD.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getTomorrowCivilDate() {
  const todayStr = getTodayCivilDate();
  const [year, month, day] = todayStr.split("-").map(Number);

  // Usar Date UTC para cálculos puros de calendario civil
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  dateObj.setUTCDate(dateObj.getUTCDate() + 1);

  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Obtiene la fecha mínima permitida para agendamiento.
 * Para portal público: desde mañana, según la regla acordada (no 24 horas exactas).
 * Para registro manual interno: hoy (el personal puede agendar el mismo día si hay cupo).
 *
 * @param {boolean} isStaffManual - Indica si es registro manual de secretaría
 * @returns {string} YYYY-MM-DD
 */
export function getMinimumBookingDate(isStaffManual = false) {
  return isStaffManual ? getTodayCivilDate() : getTomorrowCivilDate();
}

export function getMaximumBookingDate() {
  const todayStr = getTodayCivilDate();
  const [year, month, day] = todayStr.split("-").map(Number);

  const dateObj = new Date(Date.UTC(year, month + 1, day));
  dateObj.setUTCDate(dateObj.getUTCDate());

  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formatea una fecha civil YYYY-MM-DD a texto legible en español
 * (ejemplo: "lunes, 28 de septiembre de 2026") sin desfase horario.
 *
 * @param {string} dateStr - Cadena YYYY-MM-DD
 * @returns {string} Fecha formateada
 */
export function formatDateLongEs(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return dateObj.toLocaleDateString("es-ES", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Verifica si una fecha YYYY-MM-DD es anterior a la fecha actual en El Salvador.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isDateInPast(dateStr) {
  const today = getTodayCivilDate();
  return dateStr < today;
}

/**
 * Suma días a una fecha civil YYYY-MM-DD sin depender de la zona del navegador.
 */
export function addDaysCivil(dateStr, days) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day + days));
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Suma meses conservando el día; si no existe (31 de febrero) usa el último día del mes.
 */
export function addMonthsCivil(dateStr, months) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const lastDay = new Date(
    Date.UTC(year, month - 1 + months + 1, 0),
  ).getUTCDate();
  const dateObj = new Date(
    Date.UTC(year, month - 1 + months, Math.min(day, lastDay)),
  );
  return dateObj.toISOString().slice(0, 10);
}

/** Días civiles entre dos fechas YYYY-MM-DD, contando ambos extremos. */
export function countCivilDays(from, to) {
  return (
    Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        86400000,
    ) + 1
  );
}

export const WORKSHOP_PERIODS = [
  { value: "HOY", label: "Hoy" },
  { value: "ULTIMOS_15", label: "Últimos 15 días" },
  { value: "PROXIMOS_15", label: "Próximos 15 días" },
  { value: "ULTIMO_MES", label: "Último mes" },
  { value: "PROXIMO_MES", label: "Próximo mes" },
  { value: "PERSONALIZADO", label: "Rango personalizado" },
];

/**
 * Rango [desde, hasta] (ambos incluidos) para un período del tablero,
 * calculado sobre la fecha civil de El Salvador.
 */
export function getPeriodRange(period, today = getTodayCivilDate()) {
  switch (period) {
    case "ULTIMOS_15":
      return { desde: addDaysCivil(today, -14), hasta: today };
    case "PROXIMOS_15":
      return { desde: today, hasta: addDaysCivil(today, 14) };
    case "ULTIMO_MES":
      return { desde: addMonthsCivil(today, -1), hasta: today };
    case "PROXIMO_MES":
      return { desde: today, hasta: addMonthsCivil(today, 1) };
    default:
      return { desde: today, hasta: today };
  }
}

/** Formato corto dd/mm/aaaa para fechas civiles. */
export function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
