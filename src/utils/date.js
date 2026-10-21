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

export function todayISO() {
  return toISO(new Date());
}

export function shiftDate(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function formatFullDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatWeekday(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return DAYS[d.getDay()];
}

export function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; // e.g. "5 Sep"
}

export function isToday(iso) {
  return iso === todayISO();
}

export function relativeLabel(iso) {
  if (iso === todayISO()) return "Today";
  if (iso === shiftDate(todayISO(), -1)) return "Yesterday";
  return formatWeekday(iso);
}