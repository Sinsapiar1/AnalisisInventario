# 📊 Sistema de Análisis de Inventario

<div align="center">

**Aplicación web profesional para análisis avanzado de inventario**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

[Características](#-características-principales) •
[Instalación](#-instalación) •
[Uso](#-guía-de-uso) •
[Documentación](#-documentación-técnica) •
[Demo](#-demo-online)

</div>

---

## 📋 Descripción General

Sistema web **100% cliente** (sin backend) para análisis exhaustivo de inventario. Carga archivos Excel, identifica inventario negativo, analiza por pallets, genera dashboards interactivos y exporta reportes profesionales en múltiples formatos.

### 🎯 Casos de Uso

- ✅ **Detección de inventario negativo** consolidado por código y almacén
- ✅ **Análisis histórico** con herramienta Streamlit integrada
- ✅ **Gestión de pallets** con métricas detalladas
- ✅ **Generación de reportes** en PDF, Excel, CSV e impresión
- ✅ **Dashboards interactivos** con gráficos drill-down
- ✅ **Exportación de datos** para análisis externos

---

## ✨ Características Principales

### 🚀 Funcionalidades Core

| Característica | Descripción |
|----------------|-------------|
| **Carga de Excel** | Importación automática con detección inteligente de columnas |
| **Hard Refresh** | Limpieza automática al cargar nuevos archivos (sin datos residuales) |
| **Inventario Negativo** | Consolidación por código + almacén con vista detallada |
| **Análisis por Pallet** | Métricas agregadas por ID de pallet |
| **Dashboard Interactivo** | Gráficos con drill-down, filtros y visualizaciones avanzadas |
| **Exportación Multi-formato** | PDF (con gráficos 4K), Excel, CSV, Impresión |
| **Cards Persistentes** | Métricas siempre visibles durante la navegación |
| **Análisis Avanzado** | Integración con Streamlit para históricos |

### 🎨 Interfaz de Usuario

- ✅ **Diseño responsivo** (móvil, tablet, desktop)
- ✅ **Navegación por pestañas** fluida y sin pérdida de datos
- ✅ **Búsqueda y filtros** en tiempo real
- ✅ **Paginación inteligente** (10 items por página)
- ✅ **Modales informativos** con animaciones suaves
- ✅ **Cards mejoradas** con gradientes y efectos visuales
- ✅ **Modo oscuro** en gráficos (Chart.js)

### 🔒 Seguridad y Validaciones

#### **Validación de Datos**:
- ✅ Verificación de columnas obligatorias (`Código`, `Inventario Físico`)
- ✅ Validación de tipos numéricos con `isValidNumber()`
- ✅ Manejo de valores `null`, `undefined` y cadenas vacías
- ✅ Sanitización de entradas en búsquedas y filtros
- ✅ Prevención de XSS en renderizado de tablas

#### **Seguridad del Cliente**:
- ✅ Procesamiento 100% local (sin envío de datos a servidor)
- ✅ Sin cookies, solo `localStorage` opcional
- ✅ Enlaces externos con `noopener,noreferrer`
- ✅ Validación de extensiones de archivo (`.xlsx`, `.xls`)
- ✅ Límite de tamaño implícito del navegador

#### **Persistencia de Datos**:
- ✅ `localStorage` para último inventario (máx. 1000 filas)
- ✅ Limpieza automática al cerrar sesión
- ✅ Datos volátiles (se pierden al recargar si no se guarda)

---

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos

```
AnalisisInventario/
│
├── index.html                      # Punto de entrada principal
│
├── css/                            # Estilos modulares
│   ├── main.css                    # Estilos base y layout
│   ├── dashboard.css               # Estilos del dashboard
│   ├── export.css                  # Estilos de exportación
│   ├── enhanced-charts-styles.css  # Estilos de gráficos mejorados
│   └── streamlit-button.css        # Estilos del botón Streamlit
│
├── js/                             # Módulos JavaScript
│   ├── utils.js                    # Utilidades (formato, validación)
│   ├── auth.js                     # Autenticación (acceso directo admin)
│   ├── inventory.js                # Carga y análisis de Excel
│   ├── ui.js                       # Gestión de UI y pestañas
│   ├── charts.js                   # Gráficos base y drill-down
│   ├── charts-enhanced-v2.js       # Cards mejoradas del dashboard
│   ├── charts-visual-enhanced.js   # Mejoras visuales adicionales
│   ├── enhanced-charts-visibility.js # Control de visibilidad
│   ├── export.js                   # Exportación multi-formato
│   ├── streamlit-modal.js          # Modal de análisis avanzado
│   └── main.js                     # Orquestación e inicialización
│
├── logo.svg                        # Logo del sistema
│
└── README.md                       # Este archivo
```

### 🔄 Flujo de Datos

```
Usuario carga Excel
      ↓
performHardRefresh()        # Limpia TODOS los datos anteriores
      ↓
Parsing con XLSX.js         # Lee primera hoja
      ↓
processInventoryData()      # Mapea columnas y valida
      ↓
analyzeData()               # Calcula métricas y consolida
      ↓
Renderización UI            # Actualiza tablas, gráficos, cards
      ↓
localStorage (opcional)     # Guarda último estado (máx. 1000 filas)
```

---

## 📦 Instalación

### Opción 1: Uso Directo (Recomendado)

**No requiere instalación**. Simplemente abre `index.html` en tu navegador.

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/AnalisisInventario.git
cd AnalisisInventario

# Abrir en navegador
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Opción 2: Servidor Local (Para desarrollo)

Si tu navegador restringe acceso a archivos locales:

**Con Python**:
```bash
python3 -m http.server 8000
# Abrir: http://localhost:8000
```

**Con Node.js**:
```bash
npx serve . -p 8000
# Abrir: http://localhost:8000
```

**Con PHP**:
```bash
php -S localhost:8000
# Abrir: http://localhost:8000
```

### Opción 3: GitHub Pages (Producción)

1. Sube el código a la rama `main` en GitHub
2. Ve a **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main`, **Folder**: `/ (root)`
5. Guarda y espera el despliegue
6. URL: `https://TU_USUARIO.github.io/AnalisisInventario/`

---

## 🚀 Guía de Uso

### Paso 1: Acceso al Sistema

1. Abre la aplicación en tu navegador
2. **No se requiere login** - acceso directo como administrador
3. Verás el panel de administrador listo para usar

### Paso 2: Cargar Archivo Excel

1. Haz clic en **"Seleccionar archivo"**
2. Elige tu archivo Excel (`.xlsx` o `.xls`)
3. Haz clic en **"Cargar y analizar"**
4. Espera la confirmación ✅ "Archivo cargado exitosamente"

**Nota**: El sistema ejecuta un **hard refresh automático** que:
- Limpia todos los datos anteriores
- Destruye gráficos existentes
- Resetea cards y tablas
- Carga los datos nuevos desde cero

### Paso 3: Navegar por las Pestañas

#### 📊 **Dashboard**
- **Cards superiores**: Métricas clave (persistentes al navegar)
  - Total de Productos
  - Inventario Negativo
  - Inventario Total
  - Pallets Únicos
  - Material en Pedido
  
- **Gráficos interactivos**:
  - Distribución de Inventario (Pie Chart)
  - Distribución por Almacén (Bar Chart)
  - Top 10 Inventario Negativo (Horizontal Bar)
  - Análisis Detallado (Drill-down con filtros)
  - Material en Pedido (Pie Chart + Tabla)

#### ⚠️ **Inventario Negativo**
- Vista consolidada por **código de producto**
- Agrupa por código + almacén
- Muestra balance total negativo
- Botón "Ver Detalle" para desglose completo
- **Filtros**: Búsqueda y almacén
- **Exportación**: PDF, Excel, CSV, Impresión

#### 🏷️ **Análisis por Pallet**
- Lista de pallets únicos
- Métricas por pallet:
  - Número de productos
  - Productos negativos
  - Inventario total
- Botón "Ver Detalle" para productos del pallet
- **Búsqueda**: Por ID de pallet

#### 📋 **Inventario Completo**
- Todos los productos (sin consolidación)
- **Filtros múltiples**:
  - Búsqueda por código/nombre/pallet
  - Filtro por almacén
  - Filtro por estado (positivo, negativo, cero)
- **Paginación**: 10 items por página
- **Exportación**: Completa o filtrada

### Paso 4: Análisis Avanzado (Streamlit)

1. Haz clic en el botón **"📊 Análisis Avanzado"** (header derecho)
2. Lee el modal informativo
3. Haz clic en **"Abrir Análisis Avanzado"**
4. Se abre nueva pestaña con Streamlit
5. Si está inactivo, presiona **"Yes, get this app back up"**

**URL**: https://inventory-analyzer-web.streamlit.app/

**Funcionalidades en Streamlit**:
- Análisis histórico de inventarios negativos
- Filtros avanzados por fecha
- Comparación temporal
- Exportación de reportes históricos

### Paso 5: Exportar Reportes

#### **Exportación por Pestaña**:
Cada pestaña tiene su botón de exportación específico.

#### **Exportación Completa**:
1. Haz clic en **"Exportar Reporte Completo"** (botón azul superior)
2. Selecciona formato:
   - **PDF**: Incluye métricas, tablas y gráficos en 4K
   - **Excel**: Datos tabulados con formato
   - **CSV**: Datos sin formato
   - **Imprimir**: Vista previa de impresión
3. Espera la generación
4. Descarga automática o impresión

---

## 📄 Formato de Excel Requerido

### Columnas Obligatorias ⚠️

| Columna | Tipo | Obligatoria | Descripción |
|---------|------|-------------|-------------|
| **Código** | Texto/Número | ✅ **SÍ** | Código único del producto |
| **Inventario Físico** | Número | ✅ **SÍ** | Cantidad en inventario |

### Columnas Opcionales (Recomendadas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| Nombre del producto | Texto | Nombre descriptivo |
| Nombre de búsqueda | Texto | Alias para búsquedas |
| Almacén | Texto | Ubicación del producto |
| ID de Pallet | Texto/Número | Identificador del pallet |
| Número de Serie | Texto | Serie del producto |
| Física Reservada | Número | Cantidad reservada |
| Física Disponible | Número | Cantidad disponible |
| Pedido en Total | Número | Total en pedido |
| En Pedido | Número | Cantidad en pedido |
| Ordenada Reservada | Número | Cantidad ordenada reservada |
| Total Disponible | Número | Disponible total |

### Notas Importantes

✅ **Se usa la primera hoja del archivo**  
✅ **Los encabezados deben estar en la primera fila**  
✅ **Usa los nombres exactos en español** (mayúsculas/minúsculas flexibles)  
✅ **Columnas vacías se rellenan con 0 o cadena vacía**  
✅ **Valores no numéricos en columnas numéricas se convierten a 0**  

### Ejemplo de Formato

```
Código | Nombre del producto | Almacén | ID de Pallet | Inventario Físico
-------|---------------------|---------|--------------|-------------------
P001   | Producto A          | ALM-01  | PAL-100      | 50
P002   | Producto B          | ALM-01  | PAL-100      | -10
P003   | Producto C          | ALM-02  | PAL-200      | 30
```

---

## 🔧 Validaciones y Controles

### Validación de Archivo

| Validación | Comportamiento |
|------------|----------------|
| **Archivo vacío** | ❌ Error: "El archivo está vacío o no tiene datos suficientes" |
| **Sin columna Código** | ❌ Error: "El archivo no contiene las columnas necesarias" |
| **Sin Inventario Físico** | ❌ Error: "El archivo no contiene las columnas necesarias" |
| **Formato incorrecto** | ❌ Error: "Error al procesar el archivo" |
| **Extensión inválida** | ⚠️ Navegador no permite seleccionar |

### Validación de Datos

```javascript
// Función de validación en utils.js
isValidNumber(value) {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           !isNaN(parseFloat(value));
}
```

**Aplicada en**:
- Inventario Físico
- Física Reservada
- Física Disponible
- En Pedido
- Totales calculados

### Consolidación de Datos

**Inventario Negativo**:
1. Agrupa por `código + almacén`
2. Suma `Inventario Físico` por grupo
3. Filtra grupos con suma < 0
4. Consolida por `código` para vista final
5. Ordena por valor absoluto (mayor a menor)

**Análisis por Pallet**:
1. Agrupa por `ID de Pallet`
2. Cuenta productos por pallet
3. Suma inventario total
4. Cuenta productos negativos
5. Ordena por productos negativos (descendente)

---

## 📊 Características Técnicas

### Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **HTML5** | - | Estructura semántica |
| **CSS3** | - | Estilos y animaciones |
| **JavaScript (ES6+)** | - | Lógica de negocio |
| **XLSX.js** | 0.18.5 | Parsing de Excel |
| **Chart.js** | 3.9.1 | Gráficos interactivos |
| **jsPDF** | 2.5.1 | Generación de PDFs |
| **jsPDF-AutoTable** | 3.5.28 | Tablas en PDFs |
| **Font Awesome** | 6.1.1 | Iconografía |

### Performance

| Métrica | Valor | Optimización |
|---------|-------|--------------|
| **Carga inicial** | < 2s | Scripts con `defer` |
| **Procesamiento Excel** | ~100ms/1000 filas | Procesamiento síncrono optimizado |
| **Renderizado tablas** | < 50ms | Paginación (10 items) |
| **Generación gráficos** | < 300ms | Chart.js con `animation: false` |
| **Exportación PDF** | 2-5s | Captura 4K + compresión |
| **Memoria localStorage** | < 5MB | Límite 1000 filas |

### Optimizaciones Implementadas

✅ **Hard Refresh automático**: Sin datos residuales al cargar archivo  
✅ **Cards persistentes**: No re-renderiza al cambiar pestañas  
✅ **Lazy loading**: Gráficos se crean solo al entrar al Dashboard  
✅ **Paginación inteligente**: Solo renderiza 10 items visibles  
✅ **Destrucción de gráficos**: Libera memoria al cambiar contexto  
✅ **Debounce en búsquedas**: Reduce llamadas innecesarias  

---

## 🎨 Características de UI/UX

### Responsive Design

| Dispositivo | Breakpoint | Adaptaciones |
|-------------|------------|--------------|
| **Desktop** | > 1024px | Vista completa, botón con texto |
| **Tablet** | 768px - 1024px | Layout adaptativo, iconos + texto |
| **Mobile** | < 768px | Tablas colapsadas, solo iconos |
| **Small Mobile** | < 480px | UI compacta, fuentes reducidas |

### Animaciones

- ✅ Fade-in para modales (300ms)
- ✅ Slide-up para contenido (400ms cubic-bezier)
- ✅ Hover effects en botones y cards (300ms ease)
- ✅ Animación de partículas en cards (sutil)
- ✅ Pulse para indicadores críticos (inventario negativo)

### Accesibilidad

- ✅ **ARIA labels** en botones y controles
- ✅ **Focus visible** en todos los interactivos
- ✅ **Contraste WCAG AA** en textos
- ✅ **Teclado navigation** (Tab, Enter, ESC)
- ✅ **Screen reader friendly** con semántica HTML5

---

## 🌐 Compatibilidad

### Navegadores Soportados

| Navegador | Versión Mínima | Estado |
|-----------|----------------|--------|
| **Chrome** | 90+ | ✅ Totalmente soportado |
| **Edge** | 90+ | ✅ Totalmente soportado |
| **Firefox** | 88+ | ✅ Totalmente soportado |
| **Safari** | 14+ | ✅ Totalmente soportado |
| **Opera** | 76+ | ✅ Totalmente soportado |

### Requisitos del Cliente

- ✅ JavaScript habilitado
- ✅ localStorage disponible (opcional)
- ✅ Cookies NO requeridas
- ✅ Conexión a internet (para CDNs)
- ✅ Resolución mínima: 320px

---

## 🐛 Troubleshooting

### Problemas Comunes

#### ❌ "Error al procesar el archivo"

**Posibles causas**:
- Archivo corrupto o protegido
- Formato no compatible (solo .xlsx, .xls)
- Columnas obligatorias faltantes

**Solución**:
1. Verifica que el archivo tenga columna `Código`
2. Verifica que tenga columna `Inventario Físico`
3. Abre el archivo en Excel y guárdalo de nuevo
4. Intenta con otro archivo

#### ❌ Las cards desaparecen

**Causa**: Bug ya resuelto en versión 2.1

**Solución**: 
- Recarga la página (Ctrl+F5)
- Las cards ahora son persistentes

#### ❌ Gráficos no se muestran

**Posibles causas**:
- CDN de Chart.js no carga
- Ad-blocker bloqueando scripts

**Solución**:
1. Verifica conexión a internet
2. Desactiva ad-blockers temporalmente
3. Abre consola (F12) y busca errores

#### ❌ Exportación PDF falla

**Posibles causas**:
- Bloqueador de popups activo
- Navegador sin permisos de descarga

**Solución**:
1. Permite popups para este sitio
2. Verifica permisos de descarga
3. Intenta con otro formato (Excel/CSV)

#### ⚠️ "Ventana bloqueada" al abrir Streamlit

**Causa**: Bloqueador de popups del navegador

**Solución**:
1. Permite ventanas emergentes para este sitio
2. Haz clic de nuevo en el botón
3. La ventana se abrirá correctamente

---

## 📚 Documentación Adicional

En el repositorio encontrarás documentación detallada:

| Archivo | Contenido |
|---------|-----------|
| `CAMBIOS_HARD_REFRESH.md` | Implementación del hard refresh |
| `CAMBIOS_STREAMLIT_BUTTON.md` | Botón de análisis avanzado |
| `CAMBIOS_DASHBOARD_CARDS_PERSISTENTES.md` | Cards persistentes |
| `INSTRUCCIONES_DE_PRUEBA.md` | Guías de testing |
| `RESUMEN_MODIFICACIONES.md` | Resumen de todas las mejoras |
| `LEEME_PRIMERO.txt` | Guía rápida visual |

---

## 🔄 Changelog

### Versión 2.1 (Octubre 2025)
- ✅ **Cards persistentes** al navegar entre pestañas
- ✅ **Hard refresh automático** al cargar archivos
- ✅ **Botón Streamlit** con modal informativo
- ✅ **Eliminado sistema de login** (acceso directo)
- ✅ **Mejoras de performance** en renderizado
- ✅ **Fix modal Streamlit** (sin alertas falsas)

### Versión 2.0 (Septiembre 2025)
- Dashboard mejorado con cards visuales
- Drill-down en gráficos
- Análisis de material en pedido
- Exportación multi-formato mejorada

### Versión 1.0 (Agosto 2025)
- Lanzamiento inicial
- Carga de Excel básica
- Inventario negativo
- Análisis por pallet
- Dashboard básico

---

## 🤝 Contribuir

Aunque este es un proyecto interno, las sugerencias son bienvenidas:

1. **Fork** el repositorio
2. Crea una **rama** (`git checkout -b feature/mejora`)
3. **Commit** tus cambios (`git commit -m 'feat: descripción'`)
4. **Push** a la rama (`git push origin feature/mejora`)
5. Abre un **Pull Request**

---

## 📜 Licencia

Este proyecto es de uso interno/demostración. 

**Nota**: Las librerías externas (Chart.js, XLSX.js, jsPDF) tienen sus propias licencias.

---

## 👥 Créditos

**Desarrollado para**: Análisis de Inventario Interno  
**Librerías utilizadas**:
- [XLSX.js](https://github.com/SheetJS/sheetjs) - Parsing de Excel
- [Chart.js](https://www.chartjs.org/) - Gráficos interactivos
- [jsPDF](https://github.com/parallax/jsPDF) - Generación de PDFs
- [Font Awesome](https://fontawesome.com/) - Iconos

---

## 📞 Soporte

Para problemas, bugs o sugerencias:

1. Abre un **Issue** en GitHub
2. Incluye:
   - Descripción del problema
   - Pasos para reproducir
   - Capturas de pantalla (si aplica)
   - Navegador y versión
   - Mensaje de error (consola F12)

---

## 🎯 Roadmap Futuro

- [ ] Comparación entre archivos Excel (diff)
- [ ] Alertas automáticas por email
- [ ] Exportación a Google Sheets
- [ ] API REST para integraciones
- [ ] Multi-idioma (inglés, portugués)
- [ ] Temas personalizables
- [ ] Modo offline completo

---

<div align="center">

**Sistema de Análisis de Inventario v2.1**

Hecho con ❤️ para análisis eficiente

[⬆ Volver arriba](#-sistema-de-análisis-de-inventario)

</div>
