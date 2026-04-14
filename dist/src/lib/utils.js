export const formatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatValue(value) {
  return Number.isFinite(value) ? formatter.format(value) : "Sin dato";
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function groupBy(items, field) {
  return items.reduce((acc, item) => {
    const group = item[field];
    if (!acc.has(group)) acc.set(group, []);
    acc.get(group).push(item);
    return acc;
  }, new Map());
}

export function minMax(items, field) {
  const values = items.map((item) => item[field]).filter(Number.isFinite);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function colorScale(value, min, max) {
  if (!Number.isFinite(value)) return "#edf3f1";
  const range = max - min || 1;
  const t = Math.max(0, Math.min(1, (value - min) / range));
  const hue = 174;
  const saturation = 48;
  const lightness = 92 - t * 52;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function firstBy(items, field, value) {
  return items.find((item) => item[field] === value);
}

export function sortByLabel(values) {
  return [...values].sort((a, b) => a.localeCompare(b, "es"));
}
