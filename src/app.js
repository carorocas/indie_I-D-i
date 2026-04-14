import { renderMap } from "./components/choroplethMap.js";
import { renderHeatmapList } from "./components/heatmapList.js";
import { loadData } from "./lib/data.js";
import { escapeHtml, firstBy, formatValue, groupBy } from "./lib/utils.js";

const state = {
  selectedDepartment: null,
  data: null,
};

const pages = ["inicio", "indicadores", "subpilares", "pilares", "total", "metodologia"];

function currentPage() {
  const hash = window.location.hash.replace("#", "");
  return pages.includes(hash) ? hash : "inicio";
}

function setActiveNavigation() {
  const page = currentPage();
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === page);
  });
  document.querySelectorAll("[data-page]").forEach((section) => {
    section.hidden = section.dataset.page !== page;
  });
  const intro = document.querySelector(".intro-band");
  if (intro) intro.hidden = page !== "inicio";
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function setupNavigation() {
  const nav = document.getElementById("site-nav");
  nav.addEventListener("click", setActiveNavigation);
  window.addEventListener("hashchange", setActiveNavigation);
  setActiveNavigation();
}

function fillSelect(select, options, labelField = "nombre") {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option[labelField])}">${escapeHtml(option[labelField])}</option>`)
    .join("");
}

function paragraph(label, value) {
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function list(items) {
  if (!items?.length) return "";
  return `<ul class="context-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function recordsBy(records, field, value) {
  return records.filter((record) => record[field] === value);
}

function setupIndicadores(data) {
  const select = document.getElementById("indicador-select");
  const context = document.getElementById("indicador-context");
  const listContainer = document.getElementById("indicador-list");
  fillSelect(select, data.metadata.indicadores);

  function update() {
    const selected = select.value;
    const info = data.metadata.indicadores.find((item) => item.nombre === selected);
    const records = recordsBy(data.indicadores, "indicador", selected);
    context.innerHTML = [paragraph("Pilar", info?.pilar), paragraph("Subpilar", info?.subpilar)].join("");
    renderHeatmapList(listContainer, records);
  }

  select.addEventListener("change", update);
  update();
}

function setupSubpilares(data) {
  const select = document.getElementById("subpilar-select");
  const context = document.getElementById("subpilar-context");
  const listContainer = document.getElementById("subpilar-list");
  fillSelect(select, data.metadata.subpilares);

  function update() {
    const selected = select.value;
    const info = data.metadata.subpilares.find((item) => item.nombre === selected);
    const records = recordsBy(data.subpilares, "subpilar", selected);
    const sample = records[0];
    context.innerHTML = [
      paragraph("Pilar", info?.pilar),
      "<strong>Indicadores que lo componen</strong>",
      list(sample?.indicadores_componentes || []),
    ].join("");
    renderHeatmapList(listContainer, records);
  }

  select.addEventListener("change", update);
  update();
}

function setupPilares(data) {
  const select = document.getElementById("pilar-select");
  const context = document.getElementById("pilar-context");
  const listContainer = document.getElementById("pilar-list");
  fillSelect(select, data.metadata.pilares);

  function update() {
    const selected = select.value;
    const records = recordsBy(data.pilares, "pilar", selected);
    const sample = records[0];
    context.innerHTML = ["<strong>Subpilares que lo componen</strong>", list(sample?.subpilares_componentes || [])].join("");
    renderHeatmapList(listContainer, records);
  }

  select.addEventListener("change", update);
  update();
}

function renderTerritoryPanel(record) {
  const panel = document.getElementById("territory-panel");
  if (!record) {
    panel.innerHTML = '<p class="empty">Seleccione un departamento en el mapa para consultar el resumen territorial.</p>';
    return;
  }

  const pillars = record.pilares
    .map(
      (item) => `
        <div class="score-row">
          <span>${escapeHtml(item.nombre)}</span>
          <strong>${formatValue(item.valor)}</strong>
        </div>
      `,
    )
    .join("");

  const subpillars = record.subpilares
    .map(
      (item) => `
        <div class="score-row">
          <span>${escapeHtml(item.nombre)}</span>
          <strong>${formatValue(item.valor)}</strong>
        </div>
      `,
    )
    .join("");

  panel.innerHTML = `
    <p class="eyebrow">Territorio seleccionado</p>
    <h3>${escapeHtml(record.departamento)}</h3>
    <div class="score">${formatValue(record.valor_total)}</div>
    <p>Posición nacional: <strong>#${record.ranking}</strong></p>
    <div class="panel-block">
      <h3>Pilares</h3>
      ${pillars}
    </div>
    <div class="panel-block">
      <h3>Subpilares</h3>
      ${subpillars}
    </div>
  `;
}

function setupTotal(data) {
  const mapRoot = document.getElementById("map-root");
  const rankingRoot = document.getElementById("total-ranking");
  const initial = data.total[0];
  state.selectedDepartment = initial?.departamento;

  function selectDepartment(department) {
    state.selectedDepartment = department;
    render();
  }

  function render() {
    renderMap(mapRoot, data.geojson, data.total, state.selectedDepartment, selectDepartment);
    renderTerritoryPanel(firstBy(data.total, "departamento", state.selectedDepartment));
    renderHeatmapList(rankingRoot, data.total, { valueField: "valor_total" });
  }

  render();
}

function setupStructureSummary(metadata) {
  const container = document.getElementById("structure-summary");
  container.innerHTML = metadata.pilares
    .map(
      (pilar) => `
        <article class="structure-item">
          <h3>${escapeHtml(pilar.nombre)}</h3>
          <ul class="mini-list">
            ${pilar.subpilares
              .map(
                (subpilar) => `
                  <li>
                    <strong>${escapeHtml(subpilar.nombre)}</strong><br />
                    ${subpilar.indicadores.length} indicadores
                  </li>
                `,
              )
              .join("")}
          </ul>
        </article>
      `,
    )
    .join("");
}

async function main() {
  setupNavigation();
  document.querySelectorAll(".result-panel, .map-root, .structure-summary").forEach((node) => {
    node.innerHTML = '<p class="loading">Cargando datos...</p>';
  });

  try {
    const data = await loadData();
    state.data = data;
    setupIndicadores(data);
    setupSubpilares(data);
    setupPilares(data);
    setupTotal(data);
    setupStructureSummary(data.metadata);
  } catch (error) {
    console.error(error);
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      `<div class="page-section"><p class="empty">No fue posible cargar los datos del visor: ${escapeHtml(error.message)}</p></div>`,
    );
  }
}

main();
