import { colorScale, escapeHtml, formatValue, minMax } from "../lib/utils.js";

export function renderHeatmapList(container, records, options = {}) {
  if (!records?.length) {
    container.innerHTML = '<p class="empty">No hay datos disponibles para esta selección.</p>';
    return;
  }

  const valueField = options.valueField || "valor";
  const { min, max } = minMax(records, valueField);
  const rows = records
    .slice()
    .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))
    .map((record) => {
      const value = record[valueField];
      const percent = Number.isFinite(value) ? Math.max(2, ((value - min) / (max - min || 1)) * 100) : 0;
      const fill = colorScale(value, min, max);
      return `
        <div class="heatmap-row" style="background: ${fill}">
          <div class="rank">#${record.ranking}</div>
          <div>${escapeHtml(record.departamento)}</div>
          <div class="value">${formatValue(value)}</div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="heatmap-header" aria-hidden="true">
      <span>Posición</span>
      <span>Territorio</span>
      <span>Valor</span>
      <span>Comparación</span>
    </div>
    ${rows}
  `;
}
