/**
 * Idioma de la interfaz (español / inglés).
 *
 * - Los textos propios se piden con I18n.t('clave').
 * - En index.html se marcan con data-i18n="clave" y
 *   data-i18n-attr="placeholder:clave;aria-label:clave".
 * - Los módulos anteriores (gráficos y exportación) escriben sus textos en
 *   español; aquí se traducen al vuelo con una tabla de frases, sin tocar
 *   su código. Lo que no esté en la tabla se queda en español.
 */
(function(InventorySystem) {
    'use strict';

    const STORAGE_KEY = 'idioma';
    const LOCALES = { es: 'es-ES', en: 'en-US' };

    /* ---------- Textos propios ---------- */
    const TEXTS = {
        'app.title': { es: 'Análisis de inventario', en: 'Inventory analysis' },
        'app.skip': { es: 'Ir al contenido', en: 'Skip to content' },
        'app.history': { es: 'Análisis histórico', en: 'Historical analysis' },
        'app.language': { es: 'Idioma', en: 'Language' },

        'upload.region': { es: 'Archivo de inventario', en: 'Inventory file' },
        'upload.title': { es: 'Cargue el stock exportado de Axapta', en: 'Load the stock export from Axapta' },
        'upload.text': {
            es: 'Arrastre aquí el Excel o elíjalo desde su equipo. Sirve la exportación en español o en inglés, con las columnas en cualquier orden.',
            en: 'Drag the Excel file here or pick it from your computer. Spanish and English exports both work, with the columns in any order.'
        },
        'upload.choose': { es: 'Elegir archivo', en: 'Choose file' },
        'upload.required': { es: 'Columnas obligatorias', en: 'Required columns' },
        'upload.privacy': {
            es: 'El archivo se analiza en este navegador; no se sube a ningún servidor.',
            en: 'The file is analyzed in this browser; it is not uploaded to any server.'
        },
        'upload.drop': { es: 'Suelte el archivo para analizarlo', en: 'Drop the file to analyze it' },
        'upload.reading': { es: 'Leyendo el archivo…', en: 'Reading the file…' },

        'file.saved': { es: 'Inventario guardado', en: 'Saved inventory' },
        'file.change': { es: 'Cambiar archivo', en: 'Change file' },
        'file.remove': { es: 'Quitar', en: 'Remove' },
        'file.updated': { es: 'Última actualización: {date}', en: 'Last updated: {date}' },
        'file.rows': { es: '{n} filas', en: '{n} rows' },
        'file.lang.es': { es: 'Axapta en español', en: 'Axapta in Spanish' },
        'file.lang.en': { es: 'Axapta en inglés', en: 'Axapta in English' },
        'file.columns': { es: '{n} columnas reconocidas', en: '{n} columns recognized' },
        'file.headerRow': { es: 'encabezados en la fila {n}', en: 'headers on row {n}' },
        'file.missing': { es: 'Sin {list}', en: 'Missing {list}' },
        'file.missingHelp': {
            es: 'Estas columnas no venían en el archivo; sus valores se muestran como 0.',
            en: 'These columns were not in the file; their values are shown as 0.'
        },

        'stats.negative': { es: 'Productos con inventario negativo', en: 'Products with negative inventory' },
        'stats.products': { es: 'Filas de inventario', en: 'Inventory rows' },
        'stats.distinct': { es: 'Productos distintos', en: 'Distinct products' },
        'stats.physical': { es: 'Total de inventario físico', en: 'Total physical inventory' },
        'stats.pallets': { es: 'Pallets únicos', en: 'Unique pallets' },

        'tabs.label': { es: 'Vistas del inventario', en: 'Inventory views' },
        'tabs.negative': { es: 'Inventario negativo', en: 'Negative inventory' },
        'tabs.pallet': { es: 'Por pallet', en: 'By pallet' },
        'tabs.all': { es: 'Inventario completo', en: 'Full inventory' },
        'tabs.dashboard': { es: 'Dashboard', en: 'Dashboard' },

        'search.negative': { es: 'Código o nombre', en: 'Code or name' },
        'search.negative.label': { es: 'Buscar producto por código o nombre', en: 'Search product by code or name' },
        'search.pallet': { es: 'ID de pallet', en: 'Pallet ID' },
        'search.pallet.label': { es: 'Buscar por ID de pallet', en: 'Search by pallet ID' },
        'search.all': { es: 'Código, nombre o pallet', en: 'Code, name or pallet' },
        'search.all.label': { es: 'Buscar por código, nombre o pallet', en: 'Search by code, name or pallet' },

        'filter.warehouse.label': { es: 'Filtrar por almacén', en: 'Filter by warehouse' },
        'filter.status.label': { es: 'Filtrar por estado del inventario', en: 'Filter by inventory status' },
        'filter.status.all': { es: 'Todos los estados', en: 'All statuses' },
        'filter.status.positive': { es: 'Inventario positivo', en: 'Positive inventory' },
        'filter.status.negative': { es: 'Inventario negativo', en: 'Negative inventory' },
        'filter.status.zero': { es: 'Inventario en cero', en: 'Zero inventory' },
        'filter.pallet.label': { es: 'Filtrar por pallet', en: 'Filter by pallet' },
        'filter.pallet.all': { es: 'Con y sin pallet', en: 'With and without pallet' },
        'filter.pallet.with': { es: 'Con ID de pallet', en: 'With pallet ID' },
        'filter.pallet.without': { es: 'Sin ID de pallet', en: 'No pallet ID' },
        'filter.clear': { es: 'Limpiar filtros', en: 'Clear filters' },
        'filter.pageSize.label': { es: 'Filas por página', en: 'Rows per page' },
        'filter.pageSize': { es: '{n} por página', en: '{n} per page' },

        'ms.all': { es: 'Todos los almacenes', en: 'All warehouses' },
        'ms.search': { es: 'Buscar almacén...', en: 'Search warehouse...' },
        'ms.selectAll': { es: 'Todos', en: 'All' },
        'ms.clear': { es: 'Limpiar', en: 'Clear' },
        'ms.apply': { es: 'Aplicar filtro', en: 'Apply filter' },
        'ms.none': { es: 'No se encontraron almacenes', en: 'No warehouses found' },
        'ms.count': { es: '{n} almacenes seleccionados', en: '{n} warehouses selected' },

        'col.code': { es: 'Código', en: 'Code' },
        'col.name': { es: 'Nombre', en: 'Name' },
        'col.warehouses': { es: 'Almacenes', en: 'Warehouses' },
        'col.warehouse': { es: 'Almacén', en: 'Warehouse' },
        'col.pallets': { es: 'Pallets', en: 'Pallets' },
        'col.balance': { es: 'Balance total', en: 'Total balance' },
        'col.available': { es: 'Disponible', en: 'Available' },
        'col.detail': { es: 'Detalle', en: 'Detail' },
        'col.palletId': { es: 'ID de pallet', en: 'Pallet ID' },
        'col.products': { es: 'Productos', en: 'Products' },
        'col.negativeProducts': { es: 'Productos negativos', en: 'Negative products' },
        'col.totalInventory': { es: 'Inventario total', en: 'Total inventory' },
        'col.physical': { es: 'Inventario físico', en: 'Physical inventory' },
        'col.palletBalance': { es: 'Balance del pallet', en: 'Pallet balance' },
        'col.sortBy': { es: 'Ordenar por {column}', en: 'Sort by {column}' },

        'action.viewDetail': { es: 'Ver detalle', en: 'View detail' },
        'action.viewDetailOf': { es: 'Ver detalle de {code}', en: 'View detail of {code}' },
        'action.viewProducts': { es: 'Ver productos', en: 'View products' },
        'action.viewProductsOf': { es: 'Ver productos del pallet {id}', en: 'View products on pallet {id}' },
        'action.close': { es: 'Cerrar', en: 'Close' },
        'action.closeDetail': { es: 'Cerrar detalle', en: 'Close detail' },
        'action.closeToast': { es: 'Cerrar aviso', en: 'Dismiss' },

        'value.noPallet': { es: 'Sin pallet', en: 'No pallet' },
        'value.noWarehouse': { es: 'Sin almacén', en: 'No warehouse' },
        'value.noName': { es: 'Producto sin nombre', en: 'Unnamed product' },

        'empty.negative': { es: 'Ningún producto tiene inventario negativo.', en: 'No product has negative inventory.' },
        'empty.negative.filtered': {
            es: 'Ningún producto negativo coincide con la búsqueda o los almacenes elegidos.',
            en: 'No negative product matches the search or the selected warehouses.'
        },
        'empty.pallet': { es: 'El archivo no trae IDs de pallet.', en: 'The file has no pallet IDs.' },
        'empty.pallet.filtered': { es: 'Ningún pallet coincide con la búsqueda.', en: 'No pallet matches the search.' },
        'empty.all': { es: 'No hay filas de inventario.', en: 'There are no inventory rows.' },
        'empty.all.filtered': {
            es: 'Ninguna fila coincide con la búsqueda y los filtros.',
            en: 'No row matches the search and filters.'
        },

        'count.negative_one': { es: '{n} producto', en: '{n} product' },
        'count.negative_other': { es: '{n} productos', en: '{n} products' },
        'count.pallet_one': { es: '{n} pallet', en: '{n} pallet' },
        'count.pallet_other': { es: '{n} pallets', en: '{n} pallets' },
        'count.all_one': { es: '{n} fila', en: '{n} row' },
        'count.all_other': { es: '{n} filas', en: '{n} rows' },
        'count.range': { es: '{first}–{last} de {total}', en: '{first}–{last} of {total}' },
        'page.prev': { es: 'Página anterior', en: 'Previous page' },
        'page.next': { es: 'Página siguiente', en: 'Next page' },

        'detail.label': { es: 'Detalle del producto', en: 'Product detail' },
        'detail.code': { es: 'Código {code}', en: 'Code {code}' },
        'detail.balance': { es: 'Balance total', en: 'Total balance' },
        'detail.available': { es: 'Disponible total', en: 'Total available' },
        'detail.error': { es: 'No se pudo abrir el detalle del producto', en: 'Could not open the product detail' },

        'msg.notExcel': { es: 'Ese archivo no es un Excel', en: 'That file is not an Excel file' },
        'msg.notExcel.detail': {
            es: 'Use la exportación de Axapta en formato .xlsx, .xls o .csv.',
            en: 'Use the Axapta export in .xlsx, .xls or .csv format.'
        },
        'msg.noReader': { es: 'No se pudo cargar el lector de Excel', en: 'The Excel reader could not be loaded' },
        'msg.noReader.detail': {
            es: 'Revise la conexión a internet y recargue la página.',
            en: 'Check the internet connection and reload the page.'
        },
        'msg.noRows': { es: 'El archivo no tiene filas de inventario', en: 'The file has no inventory rows' },
        'msg.noRows.detail': {
            es: 'Se encontraron los encabezados, pero ninguna fila con código de artículo.',
            en: 'The headers were found, but no row has an item number.'
        },
        'msg.loaded': { es: 'Archivo analizado: {n} filas', en: 'File analyzed: {n} rows' },
        'msg.loaded.missing': {
            es: 'No venían {n} columnas opcionales; se tratan como 0.',
            en: '{n} optional columns were missing; they are treated as 0.'
        },
        'msg.loaded.format.es': { es: 'Formato de Axapta en español.', en: 'Axapta format in Spanish.' },
        'msg.loaded.format.en': { es: 'Formato de Axapta en inglés.', en: 'Axapta format in English.' },
        'msg.unreadable': { es: 'No se pudo leer el archivo', en: 'The file could not be read' },
        'msg.unreadable.detail': {
            es: 'Puede estar dañado o protegido. Vuelva a exportarlo desde Axapta e inténtelo de nuevo.',
            en: 'It may be damaged or protected. Export it again from Axapta and retry.'
        },
        'msg.unreadable.open': { es: 'Compruebe que no esté abierto en Excel.', en: 'Make sure it is not open in Excel.' },
        'msg.unknownColumns': { es: 'No se reconocen las columnas del archivo', en: 'The columns in the file are not recognized' },
        'msg.unknownColumns.detail': {
            es: 'Se espera la exportación de stock de Axapta, en español o en inglés, con columnas como "Código" / "Item number" e "Inventario físico" / "Physical stock".',
            en: 'The Axapta stock export is expected, in Spanish or English, with columns such as "Código" / "Item number" and "Inventario físico" / "Physical stock".'
        },
        'msg.missingOne': { es: 'Falta una columna obligatoria', en: 'A required column is missing' },
        'msg.missingMany': { es: 'Faltan columnas obligatorias', en: 'Required columns are missing' },
        'msg.missing.detail': {
            es: 'No se encontró {list}. Añádala a la exportación de Axapta y cargue el archivo de nuevo.',
            en: '{list} was not found. Add it to the Axapta export and load the file again.'
        },
        'msg.missing.item': { es: '"{es}" (en inglés "{en}")', en: '"{en}" (in Spanish "{es}")' },
        'msg.missing.join': { es: ' ni ', en: ' and ' },
        'msg.removed': { es: 'Inventario quitado', en: 'Inventory removed' },
        'msg.removed.detail': { es: 'Cargue otro archivo cuando quiera.', en: 'Load another file whenever you like.' },

        'field.code': { es: 'Código de artículo', en: 'Item number' },
        'field.name': { es: 'Nombre del producto', en: 'Product name' },
        'field.searchName': { es: 'Nombre de búsqueda', en: 'Search name' },
        'field.warehouse': { es: 'Almacén', en: 'Warehouse' },
        'field.palletId': { es: 'ID de pallet', en: 'Pallet ID' },
        'field.serialNumber': { es: 'Número de serie', en: 'Serial number' },
        'field.physicalInventory': { es: 'Inventario físico', en: 'Physical stock' },
        'field.reserved': { es: 'Física reservada', en: 'Physical reserved' },
        'field.available': { es: 'Física disponible', en: 'Available physical' },
        'field.totalOrder': { es: 'Pedido en total', en: 'Ordered in total' },
        'field.inOrder': { es: 'En pedido', en: 'On order' },
        'field.reservedOrder': { es: 'Ordenada reservada', en: 'Ordered reserved' },
        'field.totalAvailable': { es: 'Total disponible', en: 'Total available' },

        'hist.title': { es: 'Análisis histórico de inventarios', en: 'Historical inventory analysis' },
        'hist.text': {
            es: 'Se abrirá en una ventana nueva la herramienta de análisis histórico de inventarios negativos.',
            en: 'The historical analysis tool for negative inventory will open in a new window.'
        },
        'hist.f1': { es: 'Análisis histórico detallado', en: 'Detailed historical analysis' },
        'hist.f2': { es: 'Filtros avanzados por fecha', en: 'Advanced date filters' },
        'hist.f3': { es: 'Exportación de reportes', en: 'Report export' },
        'hist.note': {
            es: 'Esta herramienta funciona con Streamlit. Si la aplicación está inactiva, pulse el botón "Yes, get this app back up" para activarla; tarda unos segundos.',
            en: 'This tool runs on Streamlit. If the app is asleep, press the "Yes, get this app back up" button to wake it; it takes a few seconds.'
        },
        'hist.cancel': { es: 'Cancelar', en: 'Cancel' },
        'hist.open': { es: 'Abrir análisis histórico', en: 'Open historical analysis' },

        /* Informe para PDF */
        'report.title': { es: 'Informe de inventario', en: 'Inventory report' },
        'report.scope.pallet': { es: 'Análisis por pallet', en: 'Pallet analysis' },
        'report.scope.dashboard': { es: 'Resumen del inventario', en: 'Inventory summary' },
        'report.scope.complete': { es: 'Informe completo', en: 'Full report' },
        'report.meta.file': { es: 'Archivo', en: 'File' },
        'report.meta.loaded': { es: 'Datos cargados', en: 'Data loaded' },
        'report.meta.generated': { es: 'Informe generado', en: 'Report generated' },
        'report.meta.filters': { es: 'Filtros aplicados', en: 'Filters applied' },
        'report.filter.search': { es: 'búsqueda "{text}"', en: 'search "{text}"' },
        'report.filter.warehouses': { es: 'almacenes {list}', en: 'warehouses {list}' },
        'report.kpi.rows': { es: 'Filas de inventario', en: 'Inventory rows' },
        'report.rankings': { es: 'Clasificaciones', en: 'Rankings' },
        'report.negative.title': { es: 'Productos con balance negativo', en: 'Products with a negative balance' },
        'report.negative.note': {
            es: 'Cada producto va seguido de sus registros por almacén y pallet.',
            en: 'Each product is followed by its records by warehouse and pallet.'
        },
        'report.pallets.negative': { es: 'Pallets con productos en negativo', en: 'Pallets with negative products' },
        'report.pallets.negative.note': {
            es: 'Solo los pallets que tienen algún producto en negativo.',
            en: 'Only pallets that hold at least one negative product.'
        },
        'report.complete.note': {
            es: 'El listado fila a fila no se incluye aquí: genere el informe desde la pestaña Inventario completo, con los filtros que necesite, o expórtelo a Excel.',
            en: 'The row-by-row listing is not included here: generate the report from the Full inventory tab, with the filters you need, or export it to Excel.'
        },
        'report.empty': { es: 'No hay registros que mostrar.', en: 'There are no records to show.' },
        'report.toolbar.hint': {
            es: 'Para obtener el PDF, pulse el botón y elija "Guardar como PDF" como destino.',
            en: 'To get the PDF, press the button and choose "Save as PDF" as the destination.'
        },
        'report.toolbar.pdf': { es: 'Guardar como PDF o imprimir', en: 'Save as PDF or print' },
        'report.toolbar.html': { es: 'Descargar HTML', en: 'Download HTML' },
        'report.noData': { es: 'Cargue un archivo antes de generar el informe', en: 'Load a file before generating the report' },
        'report.blocked': { es: 'El navegador bloqueó la pestaña del informe', en: 'The browser blocked the report tab' },
        'report.blocked.detail': {
            es: 'Permita las ventanas emergentes de este sitio y vuelva a intentarlo.',
            en: 'Allow pop-ups for this site and try again.'
        },
        'report.error': { es: 'No se pudo generar el informe', en: 'The report could not be generated' },

        /* Resumen del dashboard */
        'dash.summary': { es: 'Resumen', en: 'Summary' },
        'dash.charts': { es: 'Gráficos', en: 'Charts' },
        'dash.findings': { es: 'Qué revisar', en: 'What to review' },
        'dash.view': { es: 'Ver', en: 'View' },
        'dash.kpi.products': { es: 'Productos distintos', en: 'Distinct products' },
        'dash.kpi.warehouses': { es: 'Almacenes', en: 'Warehouses' },
        'dash.kpi.negativeUnits': { es: 'Unidades faltantes', en: 'Units short' },
        'dash.kpi.negativeRows': { es: 'Filas en negativo', en: 'Negative rows' },
        'dash.kpi.reserved': { es: 'Unidades reservadas', en: 'Reserved units' },
        'dash.kpi.onOrder': { es: 'Unidades en pedido', en: 'Units on order' },
        'dash.find.short_one': {
            es: '{n} producto tiene balance negativo: faltan {units} unidades.',
            en: '{n} product has a negative balance: {units} units short.'
        },
        'dash.find.short_other': {
            es: '{n} productos tienen balance negativo: faltan {units} unidades en total.',
            en: '{n} products have a negative balance: {units} units short in total.'
        },
        'dash.find.short_none': {
            es: 'Ningún producto tiene balance negativo.',
            en: 'No product has a negative balance.'
        },
        'dash.find.offset_one': {
            es: '{rows} filas están en negativo pero su producto cierra en positivo ({n} producto). Hay que regularizar pallet a pallet.',
            en: '{rows} rows are negative while their product nets positive ({n} product). They need fixing pallet by pallet.'
        },
        'dash.find.offset_other': {
            es: '{rows} filas están en negativo pero su producto cierra en positivo ({n} productos). Hay que regularizar pallet a pallet.',
            en: '{rows} rows are negative while their product nets positive ({n} products). They need fixing pallet by pallet.'
        },
        'dash.find.noPallet': {
            es: '{rows} filas no tienen ID de pallet ({units} unidades).',
            en: '{rows} rows have no pallet ID ({units} units).'
        },
        'dash.find.zero': {
            es: '{rows} filas tienen el inventario en cero.',
            en: '{rows} rows have zero inventory.'
        },
        'dash.rank.short': { es: 'Mayores faltantes', en: 'Largest shortages' },
        'dash.rank.short.help': {
            es: 'Productos con balance negativo, sumando todos sus pallets.',
            en: 'Products with a negative balance across all their pallets.'
        },
        'dash.rank.offset': { es: 'Negativos compensados entre pallets', en: 'Negatives offset between pallets' },
        'dash.rank.offset.help': {
            es: 'El producto cierra en positivo, pero tiene pallets en negativo.',
            en: 'The product nets positive, but some of its pallets are negative.'
        },
        'dash.rank.warehouse': { es: 'Stock por almacén', en: 'Stock by warehouse' },
        'dash.rank.warehouse.help': { es: 'Unidades de inventario físico.', en: 'Units of physical inventory.' },
        'dash.rank.top': { es: 'Productos con más stock', en: 'Products with the most stock' },
        'dash.rank.top.help': { es: 'Unidades de inventario físico por producto.', en: 'Units of physical inventory per product.' },
        'dash.rank.empty': { es: 'Nada que mostrar.', en: 'Nothing to show.' },
        'dash.rank.more': { es: 'y {n} más', en: 'and {n} more' },
        'dash.rank.pallets_one': { es: '{n} pallet en negativo', en: '{n} negative pallet' },
        'dash.rank.pallets_other': { es: '{n} pallets en negativo', en: '{n} negative pallets' },
        'dash.rank.rows': { es: '{n} filas', en: '{n} rows' },
        'dash.rank.rowsNeg': { es: '{n} filas, {neg} en negativo', en: '{n} rows, {neg} negative' },
        'dash.open': { es: 'Abrir {name} en la tabla', en: 'Open {name} in the table' }
    };

    /* ---------- Frases de los módulos anteriores (español → inglés) ---------- */
    const PHRASES = {
        // Exportación
        'Informe PDF': 'PDF report',
        'Exportar a PDF': 'Export to PDF',
        'Exportar a Excel': 'Export to Excel',
        'Imprimir': 'Print',
        'Exportar Dashboard a PDF': 'Export dashboard to PDF',
        'Imprimir Dashboard': 'Print dashboard',
        'Exportar Reporte Completo': 'Export full report',
        'Opciones de Exportación': 'Export options',
        'Formato de salida': 'Output format',
        'Impresión directa': 'Print directly',
        'Orientación de página (PDF)': 'Page orientation (PDF)',
        'Horizontal': 'Landscape',
        'Vertical': 'Portrait',
        'Incluir detalles de productos (subitems)': 'Include product details (sub-items)',
        'Cancelar': 'Cancel',
        'Exportar': 'Export',
        'Ascendente': 'Ascending',
        'Descendente': 'Descending',
        'Balance Negativo Mínimo (Absoluto)': 'Minimum negative balance (absolute)',
        'Balance Total (Abs.)': 'Total balance (abs.)',
        'Código': 'Code',
        'Nombre': 'Name',
        'Filtrar por Códigos (separados por coma)': 'Filter by codes (comma separated)',
        'Filtros Avanzados (Inventario Completo)': 'Advanced filters (full inventory)',
        'Filtros Avanzados (Negativos)': 'Advanced filters (negatives)',
        'Filtros Avanzados (Pallets)': 'Advanced filters (pallets)',
        'ID de Pallet': 'Pallet ID',
        'Inv. Físico Máximo': 'Maximum physical inventory',
        'Inv. Físico Mínimo': 'Minimum physical inventory',
        'Inventario Físico': 'Physical inventory',
        'Mínimo Productos Negativos por Pallet': 'Minimum negative products per pallet',
        'No hay productos visibles en la tabla actual.': 'There are no visible products in the current table.',
        'Orden': 'Order',
        'Ordenar por': 'Sort by',
        'Productos Negativos': 'Negative products',
        'Seleccionar Productos Específicos': 'Select specific products',
        'Total': 'Total',
        'Seleccionar Todos': 'Select all',
        'Deseleccionar Todos': 'Deselect all',
        'Ej: 1': 'E.g. 1',
        'Ej: 10': 'E.g. 10',
        'Ej: 27143, 67032': 'E.g. 27143, 67032',

        // Excel
        'Estadísticas Generales': 'General statistics',
        'Filas de Inventario': 'Inventory rows',
        'Estadísticas': 'Statistics',
        'Productos con Inventario Negativo': 'Products with negative inventory',
        'Total de Inventario Físico': 'Total physical inventory',
        'Pallets Únicos': 'Unique pallets',
        'Fecha de Exportación': 'Export date',
        'Última Actualización': 'Last updated',
        'Almacenes': 'Warehouses',
        'Nº Pallets': 'Pallets',
        'Nº Productos': 'Products',
        'Balance Total': 'Total balance',
        'Disponible Total': 'Total available',
        'Disponible': 'Available',
        'Inventario Total': 'Total inventory',
        'ID Pallet': 'Pallet ID',
        'Inv. Físico': 'Physical inv.',
        'Balance Ítem': 'Item balance',
        'Análisis por Pallet': 'Pallet analysis',
        'Inventario Completo': 'Full inventory',
        'Inventario Completo (Actual)': 'Full inventory (current)',

        // Dashboard (secciones y tablas)
        'Análisis Detallado de Inventario': 'Detailed inventory analysis',
        'Tipo de visualización': 'View',
        'Por Almacén': 'By warehouse',
        'Por Tipo de Producto': 'By product',
        'Por Pallet': 'By pallet',
        'Métrica': 'Metric',
        'Inventario Negativo': 'Negative inventory',
        'Material en Pedido': 'Material on order',
        'Aplicar Filtros': 'Apply filters',
        'Material en Pedido (Fuera de Bodega)': 'Material on order (outside the warehouse)',
        'Detalle de Material en Pedido': 'Material on order detail',
        'No hay material en pedido registrado': 'No material on order',
        'Almacén': 'Warehouse',
        'Cantidad en Pedido': 'Quantity on order',
        'Pallets': 'Pallets',

        // Gráficos
        'Distribución de Inventario': 'Inventory distribution',
        'Inventario Positivo': 'Positive inventory',
        'Inventario Cero': 'Zero inventory',
        'Distribución por Almacén': 'Distribution by warehouse',
        'Total de Productos': 'Total products',
        'Cantidad de Productos': 'Number of products',
        'Cantidad': 'Quantity',
        'Valor Absoluto': 'Absolute value',
        'Valor Absoluto (Unidades)': 'Absolute value (units)',
        'Valor Absoluto de Inventario Negativo': 'Absolute value of negative inventory',
        'Top 10 Productos con Mayor Inventario Negativo': 'Top 10 products with the largest negative inventory',
        'Material en Pedido por Almacén': 'Material on order by warehouse',
        'Inventario Físico por Almacén': 'Physical inventory by warehouse',
        'Inventario Negativo por Almacén (Valor Absoluto)': 'Negative inventory by warehouse (absolute value)',
        'Top 10 Productos por Inventario Físico': 'Top 10 products by physical inventory',
        'Top 10 Productos con Inventario Negativo': 'Top 10 products with negative inventory',
        'Top 10 Productos con Material en Pedido': 'Top 10 products with material on order',
        'Top 10 Pallets por Inventario Total': 'Top 10 pallets by total inventory',
        'Top 10 Pallets con Productos Negativos': 'Top 10 pallets with negative products',
        'Top 10 Pallets por Material en Pedido': 'Top 10 pallets by material on order'
    };

    // Frases con una parte variable
    const PATTERNS = [
        [/^Detalle de Productos en (.+)$/, 'Product detail in $1'],
        [/^Top 10 Productos por Inventario Físico en (.+)$/, 'Top 10 products by physical inventory in $1'],
        [/^Top 10 Productos por Inventario Negativo en (.+)$/, 'Top 10 products by negative inventory in $1'],
        [/^Top 10 Productos por Material en Pedido en (.+)$/, 'Top 10 products by material on order in $1']
    ];

    // Zonas de la página escritas por los módulos anteriores
    const LEGACY_ROOTS = '#dashboard-content, .export-buttons, #export-all-button, .export-options-modal';
    const LEGACY_ATTRS = ['placeholder', 'title'];

    let lang = 'es';
    const listeners = [];

    function detectLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'es' || saved === 'en') return saved;
        } catch (e) { /* sin acceso a localStorage */ }
        const browser = (navigator.language || 'es').toLowerCase();
        return browser.indexOf('en') === 0 ? 'en' : 'es';
    }

    /**
     * Texto en el idioma actual
     * @param {string} key - Clave del texto
     * @param {Object} [vars] - Valores para los {marcadores}
     */
    function t(key, vars) {
        const entry = TEXTS[key];
        let text = entry ? (entry[lang] || entry.es) : key;
        if (vars) {
            Object.keys(vars).forEach(name => {
                text = text.split('{' + name + '}').join(vars[name]);
            });
        }
        return text;
    }

    /**
     * Texto con singular y plural: usa clave_one o clave_other
     */
    function tn(key, count, vars) {
        const all = Object.assign({ n: count }, vars || {});
        return t(key + (count === 1 ? '_one' : '_other'), all);
    }

    /**
     * Traducir una frase escrita en español por los módulos anteriores.
     * Conserva emojis, signos y espacios alrededor ("📊 Título", "Orden:").
     * @returns {string|null} - null si no hay traducción
     */
    function translatePhrase(text) {
        if (lang !== 'en' || typeof text !== 'string') return null;
        const match = text.match(/^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N})]*)$/u);
        if (!match || !match[2]) return null;
        const core = match[2];
        let translated = Object.prototype.hasOwnProperty.call(PHRASES, core) ? PHRASES[core] : null;
        if (translated === null) {
            for (let i = 0; i < PATTERNS.length; i++) {
                if (PATTERNS[i][0].test(core)) {
                    translated = core.replace(PATTERNS[i][0], PATTERNS[i][1]);
                    break;
                }
            }
        }
        return translated === null ? null : match[1] + translated + match[3];
    }

    /* ---------- Textos de index.html ---------- */
    function applyStatic(root) {
        (root || document).querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        (root || document).querySelectorAll('[data-i18n-attr]').forEach(el => {
            el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
                const parts = pair.split(':');
                if (parts.length === 2) el.setAttribute(parts[0].trim(), t(parts[1].trim()));
            });
        });
    }

    /* ---------- Textos generados por los módulos anteriores ---------- */
    const originals = new WeakMap(); // nodo de texto -> { es, en }
    const attrOriginals = new WeakMap(); // elemento -> { atributo: { es, en } }

    function shouldSkip(node) {
        const parent = node.parentElement;
        // Los datos del inventario (celdas) y el resumen nuevo no se tocan
        return !parent || parent.closest('td, canvas, script, style, .dash-summary');
    }

    function translateTextNode(node) {
        if (shouldSkip(node)) return;
        const current = node.nodeValue;
        const known = originals.get(node);

        if (lang === 'en') {
            if (known && current === known.en) return;
            const translated = translatePhrase(current);
            if (translated !== null && translated !== current) {
                originals.set(node, { es: current, en: translated });
                node.nodeValue = translated;
            }
        } else if (known && current === known.en) {
            node.nodeValue = known.es;
        }
    }

    function translateAttributes(el) {
        LEGACY_ATTRS.forEach(attr => {
            if (!el.hasAttribute || !el.hasAttribute(attr)) return;
            const current = el.getAttribute(attr);
            const store = attrOriginals.get(el) || {};
            const known = store[attr];
            if (lang === 'en') {
                if (known && current === known.en) return;
                const translated = translatePhrase(current);
                if (translated !== null && translated !== current) {
                    store[attr] = { es: current, en: translated };
                    attrOriginals.set(el, store);
                    el.setAttribute(attr, translated);
                }
            } else if (known && current === known.en) {
                el.setAttribute(attr, known.es);
            }
        });
    }

    function translateTree(root) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        translateAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode();
        while (node) {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
            else translateAttributes(node);
            node = walker.nextNode();
        }
    }

    function translateLegacy() {
        try {
            document.querySelectorAll(LEGACY_ROOTS).forEach(translateTree);
        } catch (error) {
            console.warn('No se pudieron traducir algunos textos:', error);
        }
    }

    function isInLegacyRoot(node) {
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return !!(el && el.closest && el.closest(LEGACY_ROOTS));
    }

    function startObserver() {
        if (typeof MutationObserver === 'undefined') return;
        const observer = new MutationObserver(mutations => {
            try {
                mutations.forEach(mutation => {
                    if (mutation.type === 'characterData') {
                        if (isInLegacyRoot(mutation.target)) translateTextNode(mutation.target);
                        return;
                    }
                    mutation.addedNodes.forEach(node => {
                        if (isInLegacyRoot(node)) {
                            translateTree(node);
                        } else if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                            // Un contenedor nuevo puede traer dentro una zona anterior (p. ej. la ventana de exportación)
                            if (node.matches && node.matches(LEGACY_ROOTS)) translateTree(node);
                            node.querySelectorAll(LEGACY_ROOTS).forEach(translateTree);
                        }
                    });
                });
            } catch (error) {
                console.warn('No se pudieron traducir algunos textos:', error);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    /* ---------- Textos dentro de los gráficos ----------
     * Chart.js dibuja sus títulos en un canvas, así que se traduce la
     * configuración justo antes de crear cada gráfico. Si algo falla,
     * el gráfico se crea igual, en español. */
    // Quita el emoji inicial de títulos y leyendas ("📊 Título" -> "Título")
    function stripLeadingEmoji(text) {
        return /^[^\p{L}\p{N}]*\p{Extended_Pictographic}/u.test(text)
            ? text.replace(/^[^\p{L}\p{N}(]+/u, '')
            : text;
    }

    function chartText(text) {
        if (typeof text !== 'string') return text;
        const clean = stripLeadingEmoji(text);
        const translated = translatePhrase(clean);
        return translated !== null ? translated : clean;
    }

    function translateChartConfig(config) {
        if (!config) return;
        const fix = (obj, prop) => {
            if (!obj) return;
            if (typeof obj[prop] === 'string') {
                obj[prop] = chartText(obj[prop]);
            } else if (Array.isArray(obj[prop])) {
                obj[prop] = obj[prop].map(chartText);
            }
        };
        if (config.data) {
            fix(config.data, 'labels');
            (config.data.datasets || []).forEach(dataset => fix(dataset, 'label'));
        }
        const options = config.options || {};
        if (options.plugins && options.plugins.title) fix(options.plugins.title, 'text');
        if (options.scales) {
            Object.keys(options.scales).forEach(axis => {
                const scale = options.scales[axis];
                if (scale && scale.title) fix(scale.title, 'text');
            });
        }
    }

    function hookCharts() {
        try {
            if (typeof window.Chart !== 'function' || window.Chart.__i18n || typeof Proxy === 'undefined') return;
            const Original = window.Chart;
            const Wrapped = new Proxy(Original, {
                construct(target, args, newTarget) {
                    try { translateChartConfig(args[1]); } catch (e) { /* se deja en español */ }
                    return Reflect.construct(target, args, newTarget === Wrapped ? target : newTarget);
                },
                get(target, prop) {
                    if (prop === '__i18n') return true;
                    return Reflect.get(target, prop, target);
                }
            });
            window.Chart = Wrapped;
        } catch (error) {
            console.warn('Los gráficos se mostrarán en español:', error);
        }
    }

    /* ---------- Cambio de idioma ---------- */
    function applyAll() {
        document.documentElement.lang = lang;
        document.title = t('app.title');
        applyStatic(document);
        document.querySelectorAll('[data-lang]').forEach(button => {
            const active = button.getAttribute('data-lang') === lang;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        translateLegacy();
    }

    function setLang(next) {
        if ((next !== 'es' && next !== 'en') || next === lang) return;
        lang = next;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* sin acceso */ }
        applyAll();
        listeners.forEach(listener => {
            try { listener(lang); } catch (error) { console.error('Error al cambiar de idioma:', error); }
        });
        // Lo que los avisos anteriores hayan vuelto a dibujar
        translateLegacy();
    }

    function init() {
        applyAll();
        document.querySelectorAll('[data-lang]').forEach(button => {
            button.addEventListener('click', () => setLang(button.getAttribute('data-lang')));
        });
        hookCharts();
        startObserver();
    }

    lang = detectLanguage();

    InventorySystem.I18n = {
        t,
        tn,
        init,
        setLang,
        getLang: () => lang,
        getLocale: () => LOCALES[lang],
        onChange: listener => { listeners.push(listener); },
        translatePhrase,
        translateChartConfig,
        applyStatic
    };
})(window.InventorySystem || (window.InventorySystem = {}));
