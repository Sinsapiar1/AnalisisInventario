# Sistema de Análisis de Inventario

Aplicación web 100% cliente para analizar inventario desde un archivo Excel con formato fijo. Permite detectar inventario negativo consolidado por código y almacén, analizar por pallet, ver el inventario completo, generar un dashboard con gráficos y exportar reportes a PDF/Excel/CSV/Impresión.

## Características
- Carga de Excel (primera hoja) y parseo automático de columnas esperadas.
- Inventario negativo consolidado por código+almacén con detalle por pallet.
- Análisis por pallet y vista de inventario completo con filtros/búsqueda/paginación.
- Dashboard con gráficos (Chart.js) y KPIs mejorados.
- Exportaciones: PDF (incluye gráficos en 4K), Excel, CSV e impresión.
- Persistencia local (localStorage) del último inventario cargado.

## Estructura del proyecto
- `index.html`: punto de entrada de la app
- `css/`: estilos (`main.css`, `dashboard.css`, `export.css`, `enhanced-charts-styles.css`)
- `js/`:
  - `utils.js`: utilidades (formato de números/fechas, loading, captura de gráficos)
  - `auth.js`: autenticación local (admin/operador) y control de UI
  - `inventory.js`: carga/parsing del Excel, análisis y métricas base
  - `ui.js`: pestañas, tablas, filtros, paginación, modal de detalle
  - `charts.js`: dashboard base + drill-down y “material en pedido”
  - `charts-*.js`: mejoras visuales y métricas del dashboard
  - `export.js`: exportaciones (tab o reporte completo) y modal de opciones
  - `main.js`: orquestación de inicialización

## Requisitos
- No requiere backend. Se sirve como sitio estático. Las librerías se cargan por CDN.

## Credenciales demo
- Administrador: usuario `admin` / contraseña `pivet21`
- Operador: usuario `operador` / contraseña `operador123`

## Formato de Excel esperado (encabezados en español)
La app busca estas columnas en la primera fila (primera hoja). Mínimo requeridas: `Código` y `Inventario Físico`.
- `Código` (obligatoria)
- `Nombre del producto`
- `Nombre de búsqueda`
- `Almacén`
- `ID de Pallet`
- `Número de Serie`
- `Inventario Físico` (obligatoria)
- `Física Reservada`
- `Física Disponible`
- `Pedido en Total`
- `En Pedido`
- `Ordenada Reservada`
- `Total Disponible`

Notas:
- Se usa la primera hoja del archivo.
- El mapeo actual reconoce los encabezados por coincidencia de texto en español; mantener los nombres evita errores.

## Uso local
1. Clonar el repositorio.
2. Abrir `index.html` en el navegador.
3. Iniciar sesión (admin u operador).
4. Si eres admin, cargar el Excel (botón “Cargar y analizar”).
5. Navegar por las pestañas y usar exportaciones según necesidad.

Sugerencia: Si tu navegador restringe acceso a archivos locales, sirve el directorio con un servidor estático simple, por ejemplo:
```bash
# Python 3
python3 -m http.server 8000
# o Node.js
npx serve . -p 8000
```
Luego abre `http://localhost:8000/`.

## Exportaciones
- Reporte por pestaña: PDF/Excel/Impresión directamente desde cada sección.
- Reporte completo: botón “Exportar Reporte Completo” (incluye métricas, tablas y dashboard con gráficos 4K).

## Despliegue en GitHub Pages
Opción A (recomendada, sin CI):
1. Sube el código a la rama `main` del repositorio en GitHub.
2. En Settings → Pages → Build and deployment → Source: “Deploy from a branch”.
3. Branch: `main`; Folder: `/ (root)`. Guardar.
4. La URL pública quedará disponible como GitHub Pages del repo.

Opción B (con GitHub Actions):
- Puedes añadir un workflow que publique desde `main` a Pages. No es obligatorio para sitios estáticos simples.

## Subir al repositorio (git)
Si aún no tienes remoto configurado:
```bash
git add .
git commit -m "chore: initial import with README"
# Reemplaza TU_REPO_URL por el URL de tu repo (SSH o HTTPS)
git remote add origin TU_REPO_URL
git branch -M main
git push -u origin main
```
Si ya tienes remoto:
```bash
git add .
git commit -m "docs: add README"
git push
```

## Notas operativas
- Los datos guardados en `localStorage` se limitan a 1000 filas para evitar límites del navegador. Sube el Excel original al iniciar sesión para tener el dataset completo en memoria.
- No usar credenciales de producción; estas son solo para pruebas locales.

## Licencia
Este proyecto es de uso interno/demostración. Ajusta o añade una licencia si lo publicarás.