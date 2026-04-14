const dataBase = new URL("./public/data/", document.baseURI);

async function readJson(filename) {
  const response = await fetch(new URL(filename, dataBase));
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${filename}: ${response.status}`);
  }
  return response.json();
}

export async function loadData() {
  const [indicadores, subpilares, pilares, total, metadata, geojson] = await Promise.all([
    readJson("indicadores.json"),
    readJson("subpilares.json"),
    readJson("pilares.json"),
    readJson("total.json"),
    readJson("metadata.json"),
    readJson("colombia_departamentos.geojson"),
  ]);

  return { indicadores, subpilares, pilares, total, metadata, geojson };
}
