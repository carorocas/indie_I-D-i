import { colorScale, escapeHtml, formatValue, minMax } from "../lib/utils.js";

function allCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

function allRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(1);
  return [];
}

function bounds(features) {
  const points = features.flatMap((feature) => allCoordinates(feature.geometry));
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function makeProjector(features, width, height, padding) {
  const box = bounds(features);
  const scale = Math.min(
    (width - padding * 2) / (box.maxX - box.minX),
    (height - padding * 2) / (box.maxY - box.minY),
  );
  const offsetX = (width - (box.maxX - box.minX) * scale) / 2;
  const offsetY = (height - (box.maxY - box.minY) * scale) / 2;

  return ([lon, lat]) => [
    offsetX + (lon - box.minX) * scale,
    height - (offsetY + (lat - box.minY) * scale),
  ];
}

function ringPath(ring, project) {
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ")
    .concat(" Z");
}

function featurePath(feature, project) {
  return allRings(feature.geometry).map((ring) => ringPath(ring, project)).join(" ");
}

function centroid(feature) {
  const points = allCoordinates(feature.geometry);
  const total = points.length || 1;
  return [
    points.reduce((sum, point) => sum + point[0], 0) / total,
    points.reduce((sum, point) => sum + point[1], 0) / total,
  ];
}

export function renderMap(container, geojson, totalRecords, selectedDepartment, onSelect) {
  const width = 760;
  const height = 760;
  const project = makeProjector(geojson.features, width, height, 26);
  const totalByDepartment = new Map(totalRecords.map((record) => [record.departamento, record]));
  const { min, max } = minMax(totalRecords, "valor_total");

  const paths = geojson.features
    .map((feature) => {
      const department = feature.properties.departamento;
      const record = totalByDepartment.get(department);
      const value = record?.valor_total;
      const active = department === selectedDepartment ? " active" : "";
      return `
        <path
          class="map-feature${active}"
          d="${featurePath(feature, project)}"
          fill="${colorScale(value, min, max)}"
          data-department="${escapeHtml(department)}"
          tabindex="0"
          role="button"
          aria-label="${escapeHtml(department)}: ${formatValue(value)}"
        ></path>
      `;
    })
    .join("");

  const labels = geojson.features
    .filter((feature) => feature.properties.departamento === "Bogotá D.C.")
    .map((feature) => {
      const [x, y] = project(centroid(feature));
      return `<text class="map-label" x="${x + 10}" y="${y - 8}">Bogotá D.C.</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Mapa coroplético del índice total">
      ${paths}
      ${labels}
    </svg>
  `;

  container.querySelectorAll(".map-feature").forEach((path) => {
    const activate = () => onSelect(path.dataset.department);
    path.addEventListener("click", activate);
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}
