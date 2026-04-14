# Visor Territorial del Índice I+D+i en Cáncer

Aplicación web estática para consulta pública de los resultados del **Índice de Capacidades de I+D+i para el control integral del cáncer**, medición 2026, con cobertura para los 32 departamentos de Colombia y Bogotá D.C.

El visor es de solo lectura: no carga archivos, no recalcula resultados en línea, no expone fórmulas y no usa backend ni base de datos.

El archivo Excel maestro, PDFs y `imgres.htm` están excluidos por `.gitignore` para reducir el riesgo de publicarlos por accidente.

## Decisión técnica

La tecnología solicitada inicialmente fue React + Vite + TypeScript. En este entorno no hay Node.js ni npm disponibles, y para evitar instalar toolchains externos se implementó una alternativa más estable para GitHub Pages: **HTML, CSS y módulos JavaScript nativos**, sin dependencias de runtime. La transformación de datos se hace con Python desde el Excel maestro hacia JSON estáticos.

## Estructura

```text
CODEX_IDi/
  .github/workflows/pages.yml
  index.html
  public/
    assets/
      logo-inc.png
    data/
      indicadores.json
      subpilares.json
      pilares.json
      total.json
      metadata.json
      colombia_departamentos.geojson
  scripts/
    build_data.py
    prepare_pages.py
  src/
    app.js
    components/
    lib/
    styles/
```

## Secciones del visor

- Inicio / Introducción
- Indicadores
- Subpilares
- Pilares
- Índice total
- Sobre el índice

## Requisitos

- Python 3.10 o superior
- Paquete `openpyxl` para regenerar datos desde Excel

Validación rápida:

```bash
python --version
python -c "import openpyxl"
```

Si `openpyxl` no está instalado:

```bash
python -m pip install openpyxl
```

## Ejecutar localmente

Desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000/
```

No abra `index.html` directamente con doble clic, porque algunos navegadores bloquean la carga local de JSON por seguridad.

## Regenerar JSON desde el Excel

El Excel fuente esperado es:

```text
CALCULO_resumenV2.xlsx
```

Para regenerar los archivos públicos:

```bash
python scripts/build_data.py
```

El script escribe:

```text
public/data/indicadores.json
public/data/subpilares.json
public/data/pilares.json
public/data/total.json
public/data/metadata.json
public/data/colombia_departamentos.geojson
```

El flujo reproducible es:

```text
Excel maestro -> scripts/build_data.py -> JSON públicos -> visor estático
```

Decisiones de limpieza documentadas en `metadata.json`:

- Se limpian espacios redundantes en encabezados y nombres.
- Se normalizan variantes de Bogotá D.C. y San Andrés.
- La variante `Productos de nuevo conocimeinto` se alinea con `Productos de nuevo conocimiento`.

## Cartografía

El mapa usa una capa GeoJSON departamental DANE 2018 incorporada como archivo estático en:

```text
public/data/colombia_departamentos.geojson
```

Fuente de referencia: repositorio público `caticoa3/colombia_mapa`, derivado de cartografía pública del DANE. La capa incluye Bogotá D.C. como entidad separada. La entidad `Archipiélago de San Andrés, Providencia y Santa Catalina` se etiqueta en el visor como `San Andrés y Providencia` para coincidir con el Excel.

## Preparar artefacto seguro para GitHub Pages

No publique la raíz completa del repositorio como fuente de Pages, porque allí vive el Excel maestro y podría quedar descargable. Use el workflow incluido o prepare manualmente la carpeta `dist/`.

```bash
python scripts/prepare_pages.py
```

Esto copia únicamente:

```text
index.html
.nojekyll
src/
public/
```

El Excel y otros documentos fuente no se copian a `dist/`.

## Desplegar en GitHub Pages

Opción recomendada:

1. Suba el proyecto a un repositorio de GitHub.
2. En GitHub, vaya a `Settings > Pages`.
3. En `Build and deployment`, seleccione `GitHub Actions`.
4. Ejecute manualmente el workflow `Deploy static viewer to GitHub Pages` desde la pestaña `Actions`.
5. El workflow `.github/workflows/pages.yml` prepara `dist/` y despliega solo los archivos públicos del visor.

El workflow queda configurado como ejecución manual para evitar consumos automáticos no deseados de GitHub Actions.

La URL esperada será:

```text
https://<USUARIO_GITHUB>.github.io/<NOMBRE_REPO>/
```

## Dominio personalizado

Cuando tenga un dominio personalizado, cree un archivo `CNAME` en la raíz del proyecto con el dominio, por ejemplo:

```text
visor.ejemplo.org
```

`scripts/prepare_pages.py` lo incluirá automáticamente en `dist/`.

## Cambiar el logo

Reemplace este archivo conservando el nombre:

```text
public/assets/logo-inc.png
```

Si cambia el nombre o formato, actualice las referencias en:

```text
index.html
src/styles/styles.css
```

## Actualizar el Excel en el futuro

1. Reemplace `CALCULO_resumenV2.xlsx` por la nueva versión, conservando las hojas `indicadores`, `subpilares`, `pilares` y `total`.
2. Ejecute `python scripts/build_data.py`.
3. Revise los JSON generados en `public/data/`.
4. Ejecute localmente con `python -m http.server 8000`.
5. Publique los cambios mediante GitHub Actions.
