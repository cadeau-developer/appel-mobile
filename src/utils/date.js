const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Accepts both "YYYY-MM-DD" and full ISO timestamps (e.g. from the API).
function parseDay(value) {
  if (!value) return null;
  const iso = value instanceof Date ? toISO(value) : String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayISO() {
  return toISO(new Date());
}

export function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function formatFullDate(iso) {
  const d = parseDay(iso);
  if (!d) return "";
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatWeekday(iso) {
  const d = parseDay(iso);
  if (!d) return "";
  return DAYS[d.getDay()];
}

export function formatShortDate(iso) {
  const d = parseDay(iso);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; // e.g. "5 Sep"
}

export function isToday(iso) {
  return String(iso || "").slice(0, 10) === todayISO();
}

export function relativeLabel(iso) {
  if (iso === todayISO()) return "Today";
  if (iso === shiftDate(todayISO(), -1)) return "Yesterday";
  return formatWeekday(iso);
}