/**
 * Módulo de procesamiento de inventario para el sistema
 */

// Esperar a que Utils esté disponible
(function(InventorySystem) {
    // Módulo de inventario
    InventorySystem.Inventory = (function() {
        // Variables privadas
        let inventoryData = [];
        let lastUpdate = null;
        let sourceInfo = null; // nombre del archivo, idioma, columnas reconocidas
        let palletDetails = {};
        let filteredData = {
            negative: [],
            pallet: [],
            all: []
        };
        
        // Elementos DOM
        const fileInput = document.getElementById('file-input');
        const fileName = document.getElementById('file-name');
        const dropzone = document.getElementById('dropzone');
        const fileSummary = document.getElementById('file-summary');
        const clearDataBtn = document.getElementById('clear-data-btn');
        const lastUpdateEl = document.getElementById('last-update');
        
        // Elementos estadísticos
        const totalProducts = document.getElementById('total-products');
        const negativeInventory = document.getElementById('negative-inventory');
        const totalInventoryValue = document.getElementById('total-inventory-value');
        const uniquePallets = document.getElementById('unique-pallets');
        const distinctProducts = document.getElementById('distinct-products');
        const negativeTabCount = document.getElementById('negative-tab-count');
        
        /* =====================================================
         * Reconocimiento de columnas (Axapta en español e inglés)
         * Los encabezados se buscan por nombre, en cualquier posición.
         * Para admitir otro encabezado basta con añadirlo a la lista.
         * ===================================================== */
        const COLUMN_ALIASES = {
            code: {
                label: 'Código de artículo',
                es: ['codigo de articulo', 'codigo del articulo', 'codigo', 'numero de articulo', 'articulo', 'cod articulo'],
                en: ['item number', 'item id', 'item no', 'item code', 'product number', 'item']
            },
            name: {
                label: 'Nombre del producto',
                es: ['nombre del producto', 'nombre de producto', 'nombre del articulo', 'nombre de articulo', 'descripcion'],
                en: ['product name', 'item name', 'description']
            },
            searchName: {
                label: 'Nombre de búsqueda',
                es: ['nombre de busqueda'],
                en: ['search name']
            },
            warehouse: {
                label: 'Almacén',
                es: ['almacen'],
                en: ['warehouse']
            },
            palletId: {
                label: 'ID de pallet',
                es: ['id de pallet', 'id de palet', 'id pallet', 'identificador de pallet', 'pallet', 'palet'],
                en: ['pallet id', 'pallet', 'license plate']
            },
            serialNumber: {
                label: 'Número de serie',
                es: ['numero de serie'],
                en: ['serial number']
            },
            physicalInventory: {
                label: 'Inventario físico',
                es: ['inventario fisico', 'existencias fisicas', 'stock fisico'],
                en: ['physical inventory', 'physical stock']
            },
            reserved: {
                label: 'Física reservada',
                es: ['fisica reservada', 'reservada fisica', 'reservado fisico'],
                en: ['physical reserved', 'reserved physical']
            },
            available: {
                label: 'Física disponible',
                es: ['fisica disponible', 'disponible fisica', 'disponible fisico'],
                en: ['available physical', 'physical available']
            },
            totalOrder: {
                label: 'Pedido en total',
                es: ['pedido en total', 'total pedido'],
                en: ['ordered in total', 'total ordered']
            },
            inOrder: {
                label: 'En pedido',
                es: ['en pedido'],
                en: ['on order']
            },
            reservedOrder: {
                label: 'Ordenada reservada',
                es: ['ordenada reservada', 'pedida reservada', 'reservada ordenada'],
                en: ['ordered reserved', 'reserved ordered']
            },
            totalAvailable: {
                label: 'Total disponible',
                es: ['total disponible', 'disponible total'],
                en: ['total available', 'available total']
            }
        };
        const REQUIRED_FIELDS = ['code', 'physicalInventory'];
        const HEADER_SCAN_ROWS = 25;
        const t = (key, vars) => InventorySystem.I18n.t(key, vars);

        /**
         * Puntuar qué tan bien coincide un encabezado con un alias
         */
        function scoreHeader(header, alias) {
            if (!header) return 0;
            if (header === alias) return 1000 + alias.length;
            // Coincidencia por palabras completas: "inventario fisico (uds)" o "codigo de articulo"
            if ((' ' + header + ' ').indexOf(' ' + alias + ' ') !== -1) return 500 + alias.length;
            return 0;
        }

        /**
         * Relacionar una fila de encabezados con los campos del sistema
         * @param {Array} row - Fila candidata a encabezado
         * @returns {Object} - indices por campo, número de aciertos e idioma
         */
        function mapHeaderRow(row) {
            const normalize = InventorySystem.Utils.normalizeText;
            const headers = (row || []).map(normalize);
            const candidates = [];

            Object.keys(COLUMN_ALIASES).forEach(field => {
                ['es', 'en'].forEach(lang => {
                    COLUMN_ALIASES[field][lang].forEach(alias => {
                        headers.forEach((header, index) => {
                            const score = scoreHeader(header, alias);
                            if (score > 0) candidates.push({ field, lang, index, score });
                        });
                    });
                });
            });

            // Mejor coincidencia primero; en empate gana la columna más a la izquierda
            // (Axapta puede repetir "Inventario físico" / "Physical stock")
            candidates.sort((a, b) => b.score - a.score || a.index - b.index);

            const indices = {};
            const usedColumns = {};
            const langHits = { es: 0, en: 0 };
            candidates.forEach(c => {
                if (indices[c.field] !== undefined || usedColumns[c.index]) return;
                indices[c.field] = c.index;
                usedColumns[c.index] = true;
                langHits[c.lang]++;
            });

            Object.keys(COLUMN_ALIASES).forEach(field => {
                if (indices[field] === undefined) indices[field] = -1;
            });

            return {
                indices,
                matched: langHits.es + langHits.en,
                language: langHits.en > langHits.es ? 'en' : 'es'
            };
        }

        /**
         * Buscar la fila de encabezados dentro de una hoja.
         * No tiene que ser la primera: se revisan las primeras filas.
         */
        function findHeader(rows) {
            let best = null;
            const limit = Math.min(rows.length, HEADER_SCAN_ROWS);
            for (let i = 0; i < limit; i++) {
                const mapping = mapHeaderRow(rows[i]);
                if (!best || mapping.matched > best.matched) {
                    best = mapping;
                    best.rowIndex = i;
                }
            }
            if (best) {
                best.missingRequired = REQUIRED_FIELDS.filter(f => best.indices[f] === -1);
                best.valid = best.missingRequired.length === 0;
            }
            return best;
        }

        /**
         * Inicializar el módulo de inventario
         */
        function init() {
            setupEventListeners();
        }

        /**
         * Configurar event listeners para inventario
         */
        function setupEventListeners() {
            // Al elegir un archivo se analiza directamente, sin un segundo botón
            fileInput.addEventListener('change', function() {
                const file = fileInput.files[0];
                if (file) loadFile(file);
                // Permite volver a elegir el mismo archivo después de corregirlo
                fileInput.value = '';
            });

            if (clearDataBtn) clearDataBtn.addEventListener('click', clearData);

            // Arrastrar y soltar en cualquier punto de la página
            let dragDepth = 0;
            const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf('Files') !== -1;

            window.addEventListener('dragenter', e => {
                if (!hasFiles(e)) return;
                e.preventDefault();
                dragDepth++;
                document.body.classList.add('is-dragging');
            });
            window.addEventListener('dragover', e => {
                if (hasFiles(e)) e.preventDefault();
            });
            window.addEventListener('dragleave', e => {
                if (!hasFiles(e)) return;
                dragDepth = Math.max(0, dragDepth - 1);
                if (dragDepth === 0) document.body.classList.remove('is-dragging');
            });
            window.addEventListener('drop', e => {
                if (!hasFiles(e)) return;
                e.preventDefault();
                dragDepth = 0;
                document.body.classList.remove('is-dragging');
                const file = e.dataTransfer.files[0];
                if (file) loadFile(file);
            });

            // Botones "Elegir archivo" / "Cambiar archivo" y clic en el área de carga
            document.querySelectorAll('.js-pick-file').forEach(button => {
                button.addEventListener('click', e => {
                    e.stopPropagation();
                    fileInput.click();
                });
            });
            if (dropzone) {
                dropzone.addEventListener('click', () => fileInput.click());
            }
        }

        /**
         * Realizar un hard refresh completo del sistema
         * Limpia todos los datos, gráficos, tablas y estados
         */
        function performHardRefresh() {
            console.log('🔄 Iniciando hard refresh del sistema...');
            
            try {
                // 1. Limpiar datos en memoria
                inventoryData = [];
                palletDetails = {};
                filteredData = {
                    negative: [],
                    pallet: [],
                    all: []
                };
                window.productBalances = {};
                window.currentNegativeProducts = [];
                
                // 2. Limpiar estadísticas en el DOM
                if (totalProducts) totalProducts.textContent = '0';
                if (negativeInventory) negativeInventory.textContent = '0';
                if (totalInventoryValue) totalInventoryValue.textContent = '0';
                if (uniquePallets) uniquePallets.textContent = '0';
                if (distinctProducts) distinctProducts.textContent = '0';
                if (negativeTabCount) negativeTabCount.textContent = '';
                
                // 3. Limpiar UI (tablas, gráficos, paginación)
                if (typeof InventorySystem.UI !== 'undefined' && InventorySystem.UI.resetInventoryView) {
                    InventorySystem.UI.resetInventoryView();
                }
                
                // 4. Destruir todos los gráficos de Chart.js
                const chartIds = [
                    'inventory-chart', 'warehouse-chart', 'negative-chart',
                    'main-chart', 'detail-chart', 'in-order-chart'
                ];
                
                chartIds.forEach(chartId => {
                    const chartInstance = Chart.getChart(chartId);
                    if (chartInstance) {
                        console.log(`  ✓ Destruyendo gráfico: ${chartId}`);
                        chartInstance.destroy();
                    }
                });
                
                // 5. Limpiar contenedores del dashboard
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent) {
                    // Remover cards mejoradas del dashboard v2
                    const enhancedCards = dashboardContent.querySelector('.enhanced-metrics-cards-v2');
                    if (enhancedCards) {
                        console.log('  ✓ Removiendo cards mejoradas del dashboard');
                        enhancedCards.remove();
                    }
                    
                    // Remover el resumen (se vuelve a calcular con el archivo nuevo)
                    dashboardContent.querySelectorAll('.dash-summary, .dash-charts-title').forEach(el => el.remove());

                    // Remover mensajes de fuente de datos
                    const dataSources = dashboardContent.querySelectorAll('.data-source-info');
                    dataSources.forEach(el => el.remove());
                    
                    // Limpiar contenedores de gráficos avanzados
                    const mainChartContainer = document.getElementById('main-chart-container');
                    if (mainChartContainer) mainChartContainer.innerHTML = '';
                    
                    const detailChartContainer = document.getElementById('detail-chart-container');
                    if (detailChartContainer) {
                        detailChartContainer.innerHTML = '';
                        detailChartContainer.style.display = 'none';
                    }
                    
                    const detailTableContainer = document.getElementById('detail-table-container');
                    if (detailTableContainer) {
                        detailTableContainer.innerHTML = '';
                        detailTableContainer.style.display = 'none';
                    }
                    
                    // Limpiar tabla de material en pedido
                    const inOrderTableContainer = document.getElementById('in-order-table-container');
                    if (inOrderTableContainer) {
                        inOrderTableContainer.innerHTML = '';
                    }
                }
                
                // 6. Resetear el flag de renderizado del dashboard mejorado
                if (typeof InventorySystem.Charts !== 'undefined' && InventorySystem.Charts.resetEnhancedState) {
                    InventorySystem.Charts.resetEnhancedState();
                }
                
                // 7. Limpiar filtros, búsquedas y multi-selects de la UI
                console.log('  ✓ Limpiando filtros y búsquedas de UI...');
                
                try {
                    // Limpiar campos de búsqueda
                    const negativeSearch = document.getElementById('negative-search');
                    const palletSearch = document.getElementById('pallet-search');
                    const allSearch = document.getElementById('all-search');
                    
                    if (negativeSearch) {
                        negativeSearch.value = '';
                        console.log('  ✓ Búsqueda de Inventario Negativo limpiada');
                    }
                    if (palletSearch) {
                        palletSearch.value = '';
                        console.log('  ✓ Búsqueda de Análisis por Pallet limpiada');
                    }
                    if (allSearch) {
                        allSearch.value = '';
                        console.log('  ✓ Búsqueda de Inventario Completo limpiada');
                    }
                    
                    // Resetear filtro de estado
                    const allStatusFilter = document.getElementById('all-status-filter');
                    const allPalletFilter = document.getElementById('all-pallet-filter');
                    if (allPalletFilter) allPalletFilter.value = '';
                    if (allStatusFilter) {
                        allStatusFilter.value = '';
                        console.log('  ✓ Filtro de estado reseteado');
                    }
                    
                    // Resetear multi-selects de almacenes
                    if (typeof InventorySystem.UI !== 'undefined' && 
                        typeof InventorySystem.UI.resetMultiSelects === 'function') {
                        InventorySystem.UI.resetMultiSelects();
                    }
                } catch (error) {
                    console.warn('⚠️ Error al limpiar filtros UI:', error);
                    // No es crítico, continuar con la carga del archivo
                }
                
                // 8. Limpiar modales que pudieran estar abiertos
                const existingModals = document.querySelectorAll('.modal');
                existingModals.forEach(modal => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                });
                
                console.log('✅ Hard refresh completado');
                
            } catch (error) {
                console.error('❌ Error durante hard refresh:', error);
                // Continuar de todos modos para no bloquear la carga del archivo
            }
        }
        
        /**
         * Compatibilidad: abrir el selector de archivo
         */
        function uploadFile() {
            fileInput.click();
        }

        /**
         * Leer y analizar un archivo de inventario
         * @param {File} file - Archivo elegido o soltado
         */
        function loadFile(file) {
            if (!/\.(xlsx|xlsm|xls|csv)$/i.test(file.name)) {
                InventorySystem.Utils.showError(t('msg.notExcel'), t('msg.notExcel.detail'));
                return;
            }
            if (typeof XLSX === 'undefined') {
                InventorySystem.Utils.showError(t('msg.noReader'), t('msg.noReader.detail'));
                return;
            }

            InventorySystem.Utils.showLoading(true);

            const reader = new FileReader();
            reader.onload = function(e) {
                // Dejar que el navegador pinte el indicador de carga antes del trabajo pesado
                setTimeout(function() {
                    try {
                        const workbook = XLSX.read(new Uint8Array(e.target.result), {
                            type: 'array',
                            cellDates: true
                        });

                        // Usar la primera hoja que tenga los encabezados esperados
                        let chosen = null;
                        let bestAttempt = null;
                        for (let s = 0; s < workbook.SheetNames.length; s++) {
                            const sheetName = workbook.SheetNames[s];
                            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                                header: 1,
                                defval: null
                            });
                            if (!rows || rows.length === 0) continue;
                            const header = findHeader(rows);
                            if (!header) continue;
                            const attempt = { sheetName, rows, header };
                            if (!bestAttempt || header.matched > bestAttempt.header.matched) bestAttempt = attempt;
                            if (header.valid) { chosen = attempt; break; }
                        }

                        if (!chosen) {
                            reportUnreadableFile(bestAttempt);
                            return;
                        }

                        const items = buildItems(chosen.rows, chosen.header);
                        if (items.length === 0) {
                            InventorySystem.Utils.showError(t('msg.noRows'), t('msg.noRows.detail'));
                            return;
                        }

                        // Solo ahora, con un archivo válido, se reemplazan los datos anteriores
                        performHardRefresh();
                        inventoryData = items;
                        lastUpdate = new Date();
                        sourceInfo = describeSource(file.name, chosen, items.length);

                        showData();
                        saveData();

                        const optionalMissing = sourceInfo.missingOptional.length;
                        InventorySystem.Utils.showSuccess(
                            t('msg.loaded', { n: InventorySystem.Utils.formatNumber(items.length) }),
                            optionalMissing > 0
                                ? t('msg.loaded.missing', { n: optionalMissing })
                                : t('msg.loaded.format.' + sourceInfo.language)
                        );
                    } catch (error) {
                        console.error('Error al procesar el archivo:', error);
                        InventorySystem.Utils.showError(t('msg.unreadable'), t('msg.unreadable.detail'));
                    } finally {
                        InventorySystem.Utils.showLoading(false);
                    }
                }, 30);
            };

            reader.onerror = function() {
                InventorySystem.Utils.showError(t('msg.unreadable'), t('msg.unreadable.open'));
                InventorySystem.Utils.showLoading(false);
            };

            reader.readAsArrayBuffer(file);
        }

        /**
         * Explicar por qué no se pudo usar un archivo
         */
        function reportUnreadableFile(attempt) {
            if (!attempt || attempt.header.matched === 0) {
                InventorySystem.Utils.showError(t('msg.unknownColumns'), t('msg.unknownColumns.detail'));
                return;
            }
            const englishNames = { code: 'Item number', physicalInventory: 'Physical stock' };
            const missing = attempt.header.missingRequired.map(field =>
                t('msg.missing.item', { es: COLUMN_ALIASES[field].label, en: englishNames[field] })
            );
            InventorySystem.Utils.showError(
                t(missing.length === 1 ? 'msg.missingOne' : 'msg.missingMany'),
                t('msg.missing.detail', { list: missing.join(t('msg.missing.join')) })
            );
        }

        /**
         * Convertir las filas de la hoja en registros de inventario
         */
        function buildItems(rows, header) {
            const idx = header.indices;
            const locale = header.language;
            const parseNumber = InventorySystem.Utils.parseNumber;

            const text = (row, index) => {
                if (index === -1) return '';
                const value = row[index];
                if (value === null || value === undefined) return '';
                return typeof value === 'string' ? value.trim() : value;
            };
            const number = (row, index) => index === -1 ? 0 : parseNumber(row[index], locale);

            const items = [];
            for (let i = header.rowIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const code = text(row, idx.code);
                if (code === '') continue; // Filas vacías o de totales

                items.push({
                    id: i,
                    code: code,
                    name: String(text(row, idx.name)),
                    searchName: String(text(row, idx.searchName)),
                    warehouse: idx.warehouse !== -1 ?
                        InventorySystem.Utils.sanitizeWarehouse(row[idx.warehouse]) : '',
                    palletId: text(row, idx.palletId),
                    serialNumber: text(row, idx.serialNumber),
                    physicalInventory: number(row, idx.physicalInventory),
                    reserved: number(row, idx.reserved),
                    available: number(row, idx.available),
                    totalOrder: number(row, idx.totalOrder),
                    inOrder: number(row, idx.inOrder),
                    reservedOrder: number(row, idx.reservedOrder),
                    totalAvailable: number(row, idx.totalAvailable)
                });
            }
            return items;
        }

        /**
         * Resumen del archivo cargado para mostrarlo en pantalla
         */
        function describeSource(name, chosen, rowCount) {
            const fields = Object.keys(COLUMN_ALIASES);
            const found = fields.filter(f => chosen.header.indices[f] !== -1);
            const missingOptional = fields
                .filter(f => chosen.header.indices[f] === -1 && f !== 'serialNumber');
            return {
                fileName: name,
                sheetName: chosen.sheetName,
                language: chosen.header.language,
                headerRow: chosen.header.rowIndex + 1,
                rowCount: rowCount,
                foundCount: found.length,
                missingOptional: missingOptional
            };
        }

        /**
         * Pintar en pantalla los datos que están en memoria
         */
        function showData() {
            document.body.classList.add('has-data');
            renderFileSummary();

            analyzeData();

            if (typeof InventorySystem.UI !== 'undefined') {
                InventorySystem.UI.updateWarehouseFilters();
                InventorySystem.UI.switchTab('negative-inventory');
            }

            if (typeof InventorySystem.Export !== 'undefined') {
                InventorySystem.Export.init();
            }
        }

        /**
         * Mostrar qué archivo está cargado y cómo se interpretó
         */
        function renderFileSummary() {
            lastUpdateEl.textContent = lastUpdate ?
                t('file.updated', { date: InventorySystem.Utils.formatDate(lastUpdate) }) : '';
            if (!fileSummary) return;

            fileSummary.textContent = '';
            if (!sourceInfo) {
                fileName.textContent = t('file.saved');
                return;
            }

            fileName.textContent = sourceInfo.fileName;

            const facts = [
                t('file.rows', { n: InventorySystem.Utils.formatNumber(sourceInfo.rowCount) }),
                t('file.lang.' + (sourceInfo.language === 'en' ? 'en' : 'es')),
                t('file.columns', { n: sourceInfo.foundCount })
            ];
            if (sourceInfo.headerRow > 1) facts.push(t('file.headerRow', { n: sourceInfo.headerRow }));

            facts.forEach(fact => {
                const chip = document.createElement('span');
                chip.className = 'file-fact';
                chip.textContent = fact;
                fileSummary.appendChild(chip);
            });

            const missing = (sourceInfo.missingOptional || [])
                // Los archivos guardados con la versión anterior traen aquí el nombre ya escrito
                .map(field => COLUMN_ALIASES[field] ? t('field.' + field) : field);
            if (missing.length > 0) {
                const warn = document.createElement('span');
                warn.className = 'file-fact file-fact-warn';
                warn.textContent = t('file.missing', { list: missing.join(', ') });
                warn.title = t('file.missingHelp');
                fileSummary.appendChild(warn);
            }
        }

        /**
         * Volver a escribir los textos al cambiar de idioma
         */
        function refreshLanguage() {
            if (inventoryData.length === 0) return;
            renderFileSummary();
            analyzeData(); // las cifras cambian de formato (1.269,5 / 1,269.5)
        }

        /**
         * Quitar el inventario cargado y volver a la pantalla inicial
         */
        function clearData() {
            performHardRefresh();
            lastUpdate = null;
            sourceInfo = null;
            document.body.classList.remove('has-data');
            lastUpdateEl.textContent = '';
            if (fileSummary) fileSummary.textContent = '';
            deleteSavedData();
            InventorySystem.Utils.showToast('info', t('msg.removed'), t('msg.removed.detail'));
        }

        /**
         * Analizar datos para estadísticas y resúmenes
         */
        function analyzeData() {
    // Estadísticas generales
    totalProducts.textContent = InventorySystem.Utils.formatNumber(inventoryData.length);
    if (distinctProducts) {
        distinctProducts.textContent = InventorySystem.Utils.formatNumber(new Set(inventoryData.map(item => item.code)).size);
    }
    
    // Agrupar productos por código Y almacén, y calcular el balance total
    const productBalances = {};
    
    inventoryData.forEach(item => {
        const key = `${item.code}-${item.warehouse}`;
        
        if (!productBalances[key]) {
            productBalances[key] = {
                code: item.code,
                name: item.name || '',
                warehouse: item.warehouse || '',
                totalInventory: 0,
                records: []
            };
        }
        
        // Verificar que el inventario físico es un número válido antes de sumarlo
        if (InventorySystem.Utils.isValidNumber(item.physicalInventory)) {
            productBalances[key].totalInventory += parseFloat(item.physicalInventory);
        }
        
        productBalances[key].records.push(item);
    });
    
    // Filtrar productos con balance total negativo
    const negativeProducts = Object.values(productBalances).filter(product => 
        InventorySystem.Utils.isValidNumber(product.totalInventory) && 
        parseFloat(product.totalInventory) < 0
    );
    
    // Contador de productos negativos: por código, igual que la tabla y el dashboard
    // (un producto negativo en dos almacenes cuenta una vez)
    const negativeCount = new Set(negativeProducts.map(product => product.code)).size;
    negativeInventory.textContent = InventorySystem.Utils.formatNumber(negativeCount);
    if (negativeTabCount) {
        negativeTabCount.textContent = negativeCount > 0 ? InventorySystem.Utils.formatNumber(negativeCount) : '';
    }
    
    // Calcular suma total del inventario físico
    const totalPhysical = inventoryData.reduce((sum, item) => {
        // Asegurar que physicalInventory es un número válido
        if (InventorySystem.Utils.isValidNumber(item.physicalInventory)) {
            return sum + parseFloat(item.physicalInventory);
        }
        return sum;
    }, 0);
    
    totalInventoryValue.textContent = InventorySystem.Utils.formatNumber(totalPhysical);
    
    // Contar pallets únicos
    const uniquePalletIds = new Set();
    inventoryData.forEach(item => {
        if (item.palletId) {
            uniquePalletIds.add(item.palletId);
        }
    });
    uniquePallets.textContent = InventorySystem.Utils.formatNumber(uniquePalletIds.size);
    
    // Analizar datos por pallet
    analyzePalletData();
    
    // Guardar los balances de productos para usarlos en el filtrado
    window.productBalances = productBalances;
}
        
        /**
         * Analizar datos por pallet
         */
        function analyzePalletData() {
            palletDetails = {};
            
            // Agrupar productos por ID de pallet
            inventoryData.forEach(item => {
                if (item.palletId) {
                    if (!palletDetails[item.palletId]) {
                        palletDetails[item.palletId] = {
                            palletId: item.palletId,
                            products: [],
                            negativeProducts: 0,
                            totalInventory: 0
                        };
                    }
                    
                    palletDetails[item.palletId].products.push(item);
                    palletDetails[item.palletId].totalInventory += item.physicalInventory;
                    
                    if (item.physicalInventory < 0) {
                        palletDetails[item.palletId].negativeProducts++;
                    }
                }
            });
        }
        
        /* ---------- Guardado local (IndexedDB) ----------
         * Se guarda el inventario completo para que siga ahí al recargar.
         * Los datos no salen del navegador. */
        const DB_NAME = 'analisis-inventario';
        const STORE_NAME = 'estado';

        function openDatabase() {
            return new Promise((resolve, reject) => {
                if (!window.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        function saveData() {
            // La versión anterior guardaba aquí solo las primeras 1000 filas
            try { localStorage.removeItem('inventoryData'); } catch (e) { /* sin acceso */ }

            openDatabase().then(db => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put({
                    inventoryData: inventoryData,
                    lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
                    sourceInfo: sourceInfo
                }, 'actual');
                tx.oncomplete = () => db.close();
            }).catch(error => console.warn('No se pudo guardar el inventario en este navegador:', error));
        }

        function deleteSavedData() {
            try { localStorage.removeItem('inventoryData'); } catch (e) { /* sin acceso */ }
            openDatabase().then(db => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete('actual');
                tx.oncomplete = () => db.close();
            }).catch(() => {});
        }

        /**
         * Cargar datos guardados
         */
        function loadSavedData() {
            openDatabase().then(db => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const request = tx.objectStore(STORE_NAME).get('actual');
                request.onsuccess = () => {
                    db.close();
                    const saved = request.result;
                    // No pisar un archivo que el usuario haya cargado mientras tanto
                    if (!saved || !saved.inventoryData || saved.inventoryData.length === 0 || inventoryData.length > 0) return;
                    try {
                        inventoryData = saved.inventoryData;
                        lastUpdate = saved.lastUpdate ? new Date(saved.lastUpdate) : null;
                        sourceInfo = saved.sourceInfo || null;
                        showData();
                    } catch (error) {
                        console.error('Error al mostrar datos guardados:', error);
                    }
                };
            }).catch(error => console.warn('Sin datos guardados:', error));
        }

        /**
         * Obtener datos de inventario
         */
        function getInventoryData() {
            return inventoryData;
        }
        
        /**
         * Obtener datos de pallets
         */
        function getPalletDetails() {
            return palletDetails;
        }
        
        /**
         * Obtener datos filtrados
         */
        function getFilteredData() {
            return filteredData;
        }
        
        /**
         * Actualizar datos filtrados
         * @param {string} type - Tipo de datos (negative, pallet, all)
         * @param {Array} data - Datos filtrados
         */
        function setFilteredData(type, data) {
            filteredData[type] = data;
        }
        
        /**
         * Obtener la fecha de última actualización
         */
        function getLastUpdate() {
            return lastUpdate;
        }
        
        // Exportar funciones públicas
        return {
            init,
            uploadFile,
            loadFile,
            clearData,
            refreshLanguage,
            getSourceInfo: function() { return sourceInfo; },
            analyzeData,
            loadSavedData,
            getInventoryData,
            getPalletDetails,
            getFilteredData,
            setFilteredData,
            getLastUpdate
        };
    })();
})(window.InventorySystem || {});