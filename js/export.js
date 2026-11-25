// --- START OF FILE export.js - VERSIÓN CORREGIDA COMPLETA ---

(function(InventorySystem) {
    // Módulo de exportación
    InventorySystem.Export = (function() {
        // Objeto para almacenar la API del módulo
        let moduleAPI = {};

        // *** SINGLETON MODAL - SOLUCIÓN ROBUSTA Y DEFINITIVA ***
        let exportModalSingleton = null;
        let isModalCurrentlyOpen = false;
        let modalOpenDebounceTimer = null;

        // --- Funciones Auxiliares de Datos y Procesamiento ---

        /**
         * Prepara los datos brutos aplicando los filtros de la UI y los filtros avanzados de exportación/impresión.
         * Se encarga de la consolidación si es necesario (ej. para inventario negativo).
         * @param {string} category - Categoría de datos (negative, pallet, all)
         * @param {Object} advancedFilters - Objeto con filtros y opciones de ordenamiento adicionales.
         * @returns {Array<Object>} - Array de objetos de datos procesados (no formateados para tabla)
         */
        function getProcessedRawDataForExport(category, advancedFilters = {}) {
            const fullInventoryData = InventorySystem.Inventory.getInventoryData();
            const currentUIData = InventorySystem.Inventory.getFilteredData();

            let baseData = [];

            if (category === 'negative') {
                if (advancedFilters.includeDetails) {
                    baseData = [...(window.currentNegativeProducts || [])];
                } else {
                    baseData = [...(currentUIData.negative || [])];
                }
            } else if (category === 'pallet') {
                baseData = [...(currentUIData.pallet || [])];
            } else if (category === 'all') {
                baseData = [...fullInventoryData];

                // Limitar volumen si se solicita vista resumida
                if (advancedFilters.maxRows && Number.isFinite(advancedFilters.maxRows)) {
                    baseData = baseData.slice(0, advancedFilters.maxRows);
                }

                const allSearchEl = document.getElementById('all-search');
                const allStatusFilterEl = document.getElementById('all-status-filter');

                const searchTerm = allSearchEl ? allSearchEl.value.toLowerCase() : '';
                const statusFilter = allStatusFilterEl ? allStatusFilterEl.value : '';
                
                // MULTI-SELECT: Obtener almacenes seleccionados
                const selectedWarehouses = (typeof InventorySystem !== 'undefined' && 
                    InventorySystem.UI && 
                    InventorySystem.UI.getSelectedAllWarehouses) ? 
                    InventorySystem.UI.getSelectedAllWarehouses() : [];

                baseData = baseData.filter(item => {
                    const matchesSearch = searchTerm === '' ||
                        (item.code && String(item.code).toLowerCase().includes(searchTerm)) ||
                        (item.name && String(item.name).toLowerCase().includes(searchTerm)) ||
                        (item.palletId && String(item.palletId).toLowerCase().includes(searchTerm));

                    const matchesWarehouse = selectedWarehouses.length === 0 || 
                        selectedWarehouses.includes(item.warehouse);

                    let matchesStatus = true;
                    if (statusFilter === 'positive') {
                        matchesStatus = item.physicalInventory > 0;
                    } else if (statusFilter === 'negative') {
                        matchesStatus = item.physicalInventory < 0;
                    } else if (statusFilter === 'zero') {
                        matchesStatus = item.physicalInventory === 0;
                    }
                    const palletFilterEl = document.getElementById('all-pallet-filter');
                    const palletFilter = palletFilterEl ? palletFilterEl.value : '';
                    const matchesPallet = palletFilter === '' ||
                        (palletFilter === 'with' ? !!item.palletId : !item.palletId);
                    return matchesSearch && matchesWarehouse && matchesStatus && matchesPallet;
                });
            } else if (category === 'dashboard') {
                return [];
            } else {
                return [];
            }

            // Aplicar filtros adicionales de advancedFilters
            if (category === 'negative') {
                const minAbsNeg = parseFloat(advancedFilters.minAbsoluteNegativeBalance);
                if (!isNaN(minAbsNeg) && minAbsNeg > 0) {
                    baseData = baseData.filter(item => Math.abs(item.totalNegative) >= minAbsNeg);
                }

                const codesFilter = advancedFilters.filterCodes;
                if (codesFilter) {
                    const targetCodes = codesFilter.split(',').map(code => String(code).trim().toLowerCase()).filter(c => c !== '');
                    if (targetCodes.length > 0) {
                        baseData = baseData.filter(item => targetCodes.includes(String(item.code).toLowerCase()));
                    }
                }

                if (advancedFilters.sortBy) {
                    baseData.sort((a, b) => {
                        let valA = getValueForSort(a, advancedFilters.sortBy);
                        let valB = getValueForSort(b, advancedFilters.sortBy);
                        return sortComparison(valA, valB, advancedFilters.sortOrder);
                    });
                }
            } else if (category === 'pallet') {
                const minNegProducts = parseFloat(advancedFilters.minNegativeProductsPallet);
                if (!isNaN(minNegProducts) && minNegProducts >= 0) {
                    baseData = baseData.filter(pallet => pallet.negativeProducts >= minNegProducts);
                }
                if (advancedFilters.sortBy) {
                    baseData.sort((a, b) => {
                        let valA = getValueForSort(a, advancedFilters.sortBy);
                        let valB = getValueForSort(b, advancedFilters.sortBy);
                        return sortComparison(valA, valB, advancedFilters.sortOrder);
                    });
                }
            } else if (category === 'all' && !advancedFilters.isCompleteReport) {
                const minPhysical = parseFloat(advancedFilters.minPhysicalInventory);
                const maxPhysical = parseFloat(advancedFilters.maxPhysicalInventory);

                if (!isNaN(minPhysical)) {
                    baseData = baseData.filter(item => item.physicalInventory >= minPhysical);
                }
                if (!isNaN(maxPhysical)) {
                    baseData = baseData.filter(item => item.physicalInventory <= maxPhysical);
                }

                // Filtro por códigos específicos para inventario completo
                const allCodesFilter = advancedFilters.allCodesFilter;
                if (allCodesFilter) {
                    const targetCodes = allCodesFilter.split(',').map(code => String(code).trim().toLowerCase()).filter(c => c !== '');
                    if (targetCodes.length > 0) {
                        baseData = baseData.filter(item => targetCodes.includes(String(item.code).toLowerCase()));
                    }
                }

                if (advancedFilters.sortBy) {
                    baseData.sort((a, b) => {
                        let valA = getValueForSort(a, advancedFilters.sortBy);
                        let valB = getValueForSort(b, advancedFilters.sortBy);
                        return sortComparison(valA, valB, advancedFilters.sortOrder);
                    });
                }
            }
            return baseData;
        }

        function getValueForSort(item, key) {
            if (key === 'totalNegative') return Math.abs(item.totalNegative);
            if (key === 'palletCount') return item.palletCount;
            if (key === 'productsCount') return item.products ? item.products.length : 0;
            return item[key];
        }

        function sortComparison(valA, valB, order) {
            if (typeof valA === 'string' && typeof valB === 'string') {
                return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return order === 'asc' ? valA - valB : valB - valA;
        }

        function getFormattedTableData(category, processedData, options = {}) {
            const data = [];
            if (category === 'negative') {
                if (options.includeDetails) {
                    processedData.forEach(consolidatedProduct => {
                        if (consolidatedProduct.records && Array.isArray(consolidatedProduct.records)) {
                            consolidatedProduct.records.forEach(record => {
                                if (typeof record.physicalInventory === 'number' && record.physicalInventory < 0) {
                                    data.push([
                                        record.code || consolidatedProduct.code,
                                        record.name || consolidatedProduct.name || '',
                                        record.warehouse || '',
                                        record.palletId || 'N/A',
                                        record.physicalInventory,
                                        record.available || 0,
                                        record.physicalInventory
                                    ]);
                                }
                            });
                        }
                    });
                } else {
                    processedData.forEach(product => {
                        data.push([
                            product.code,
                            product.name || '',
                            Array.from(product.warehouses || []).join(', '),
                            product.palletCount || 0,
                            product.totalNegative || 0,
                            product.totalAvailable || 0
                        ]);
                    });
                }
            } else if (category === 'pallet') {
                processedData.forEach(pallet => {
                    data.push([
                        pallet.palletId || '',
                        pallet.products ? (Array.isArray(pallet.products) ? pallet.products.length : 0) : 0,
                        pallet.negativeProducts || 0,
                        pallet.totalInventory || 0
                    ]);
                });
            } else if (category === 'all') {
                processedData.forEach(item => {
                    data.push([
                        item.code,
                        item.name || '',
                        item.warehouse || '',
                        item.palletId || 'N/A',
                        item.physicalInventory,
                        item.available || 0
                    ]);
                });
            }
            return data;
        }

        // --- Funciones de Generación de Reportes ---

        function getGeneralStats() {
            const totalProductsEl = document.getElementById('total-products');
            const negativeInventoryEl = document.getElementById('negative-inventory');
            const totalInventoryValueEl = document.getElementById('total-inventory-value');
            const uniquePalletsEl = document.getElementById('unique-pallets');
            const lastUpdateTextEl = document.getElementById('last-update');

            return {
                totalProducts: totalProductsEl ? totalProductsEl.textContent : 'N/A',
                negativeInventoryCount: negativeInventoryEl ? negativeInventoryEl.textContent : 'N/A',
                totalInventoryValue: totalInventoryValueEl ? totalInventoryValueEl.textContent : 'N/A',
                uniquePallets: uniquePalletsEl ? uniquePalletsEl.textContent : 'N/A',
                lastUpdateContent: lastUpdateTextEl ? lastUpdateTextEl.textContent : 'N/A',
                exportDate: InventorySystem.Utils.formatDate(new Date())
            };
        }

        // 🎨 FUNCIÓN MEJORADA: Captura de gráficos en calidad 4K
        function generateReportExcel(reportType, category, options = {}) {
            if (!window.XLSX) {
                InventorySystem.Utils.showError('Biblioteca XLSX no disponible.');
                return;
            }
            // Encabezados y nombres de hoja en el idioma elegido
            const tx = text => {
                const i18n = InventorySystem.I18n;
                return (i18n && typeof text === 'string' && i18n.translatePhrase(text)) || text;
            };
            const wb = XLSX.utils.book_new();
            const now = new Date();
            const dateForFilename = now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '_');
            const stats = getGeneralStats();

            const statsData = [
                ['Estadísticas Generales', ''],
                ['Filas de Inventario', stats.totalProducts],
                ['Productos con Inventario Negativo', stats.negativeInventoryCount],
                ['Total de Inventario Físico', stats.totalInventoryValue],
                ['Pallets Únicos', stats.uniquePallets],
                ['', ''],
                ['Fecha de Exportación', stats.exportDate],
                ['Última Actualización', stats.lastUpdateContent.replace(/^[^:]*:\s*/, '')]
            ].map(row => [tx(row[0]), row[1]]);
            const statsWs = XLSX.utils.aoa_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, tx('Estadísticas'));

            function addSheet(sheetName, headers, processedData, formatOptions) {
                headers = headers.map(tx);
                const safeSheetName = tx(sheetName).substring(0, 31);
                const formattedData = getFormattedTableData(formatOptions.category, processedData, formatOptions);
                const ws = XLSX.utils.aoa_to_sheet([headers]);

                // Añadir filas en bloques para reducir picos de memoria en datasets grandes
                const CHUNK_SIZE = 2000;
                for (let i = 0; i < formattedData.length; i += CHUNK_SIZE) {
                    const chunk = formattedData.slice(i, i + CHUNK_SIZE);
                    XLSX.utils.sheet_add_aoa(ws, chunk, { origin: -1 });
                }

                // Tipado/formatos numéricos
                formattedData.forEach((row, rIdx) => {
                    row.forEach((cell, cIdx) => {
                        if (typeof cell === 'number') {
                            const cellRef = XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx });
                            if (ws[cellRef]) {
                                ws[cellRef].t = 'n';
                                ws[cellRef].z = '#,##0.00;[Red]-#,##0.00';
                            }
                        }
                    });
                });
                ws['!cols'] = headers.map(h => ({ wch: Math.max(18, h.length + 5) }));
                XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
            }

            if (reportType === 'complete') {
                let negHeadersExcel;
                let negProcessedDataExcel = getProcessedRawDataForExport('negative', { isCompleteReport: true });
                if (options.includeDetails) {
                    negHeadersExcel = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible', 'Balance Ítem'];
                } else {
                    negHeadersExcel = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                }
                addSheet('Inventario Negativo', negHeadersExcel, negProcessedDataExcel, { category: 'negative', includeDetails: options.includeDetails });

                const palletHeadersExcel = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                const palletProcessedDataExcel = getProcessedRawDataForExport('pallet', { isCompleteReport: true });
                addSheet('Análisis por Pallet', palletHeadersExcel, palletProcessedDataExcel, { category: 'pallet' });

                const allHeadersExcel = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inventario Físico', 'Disponible'];
                const allProcessedDataExcel = getProcessedRawDataForExport('all', { isCompleteReport: true });
                addSheet('Inventario Completo', allHeadersExcel, allProcessedDataExcel, { category: 'all' });

                XLSX.writeFile(wb, `reporte_completo_${dateForFilename}.xlsx`);

            } else if (reportType === 'tab') {
                let sheetTitle = '';
                let reportHeaders = [];
                const processedData = getProcessedRawDataForExport(category, options);

                switch (category) {
                    case 'negative':
                        sheetTitle = 'Inventario Negativo';
                        reportHeaders = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                        break;
                    case 'pallet':
                        sheetTitle = 'Análisis por Pallet';
                        reportHeaders = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                        break;
                    case 'all':
                        sheetTitle = 'Inventario Completo (Actual)';
                        reportHeaders = ['Código', 'Nombre', 'Almacén', 'ID de Pallet', 'Inventario Físico', 'Disponible'];
                        break;
                    default:
                        InventorySystem.Utils.showError('Categoría de reporte Excel desconocida.');
                        return;
                }
                addSheet(sheetTitle, reportHeaders, processedData, { category: category, includeDetails: options.includeDetails });
                XLSX.writeFile(wb, `reporte_${category}_${dateForFilename}.xlsx`);
            }
        }

        function exportCompleteReportToCSV(options) {
            try {
                const now = new Date();
                const dateForFilename = now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '_');

                function arrayToCSV(array, headers) {
                    let csv = headers.join(',') + '\n';
                    const CHUNK_SIZE = 5000;
                    for (let i = 0; i < array.length; i += CHUNK_SIZE) {
                        const chunk = array.slice(i, i + CHUNK_SIZE);
                        chunk.forEach(row => {
                            csv += row.map(cell => {
                                if (cell === null || cell === undefined) return '';
                                const cellStr = String(cell).replace(/"/g, '""');
                                return (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) ? `"${cellStr}"` : cellStr;
                            }).join(',') + '\n';
                        });
                    }
                    return csv;
                }

                function downloadCSV(csv, filename) {
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    if (navigator.msSaveBlob) { navigator.msSaveBlob(blob, filename); }
                    else {
                        link.href = URL.createObjectURL(blob);
                        link.setAttribute('download', filename);
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                    }
                }

                let negHeadersCSV;
                let negProcessedDataCSV = getProcessedRawDataForExport('negative', { isCompleteReport: true });
                let negFormattedDataCSV;
                if (options.includeDetails) {
                    negHeadersCSV = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible', 'Balance Ítem'];
                    negFormattedDataCSV = getFormattedTableData('negative', negProcessedDataCSV, { includeDetails: true });
                } else {
                    negHeadersCSV = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                    negFormattedDataCSV = getFormattedTableData('negative', negProcessedDataCSV, { includeDetails: false });
                }
                downloadCSV(arrayToCSV(negFormattedDataCSV, negHeadersCSV), `inventario_negativo_${dateForFilename}.csv`);

                const palletHeadersCSV = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                const palletProcessedDataCSV = getProcessedRawDataForExport('pallet', { isCompleteReport: true });
                const palletFormattedDataCSV = getFormattedTableData('pallet', palletProcessedDataCSV);
                setTimeout(() => downloadCSV(arrayToCSV(palletFormattedDataCSV, palletHeadersCSV), `analisis_pallet_${dateForFilename}.csv`), 500);

                const allHeadersCSV = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inventario Físico', 'Disponible'];
                const allProcessedDataCSV = getProcessedRawDataForExport('all', { isCompleteReport: true });
                const allFormattedDataCSV = getFormattedTableData('all', allProcessedDataCSV);
                setTimeout(() => downloadCSV(arrayToCSV(allFormattedDataCSV, allHeadersCSV), `inventario_completo_${dateForFilename}.csv`), 1000);

            } catch (error) {
                console.error('Error al exportar a CSV:', error);
                InventorySystem.Utils.showError('Error al exportar a CSV: ' + error.message);
            }
        }

        // *** MODAL SINGLETON - SOLUCIÓN DEFINITIVA ***

        function createExportModalSingleton() {
            console.log('🔧 Creando singleton del modal de exportación...');
            
            let modalElement = null;
            let currentCallback = null;
            let currentCategory = '';
            let currentIsCompleteReport = false;

            // *** CREAR ELEMENTO DOM UNA SOLA VEZ ***
            function createModalDOM() {
                modalElement = document.createElement('div');
                modalElement.className = 'export-options-modal hidden';
                modalElement.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.7); z-index: 10000;
                    display: flex; justify-content: center; align-items: center;
                    padding: 20px; box-sizing: border-box;
                `;
                
                modalElement.innerHTML = `
                    <div class="export-options-content" style="
                        background: white; padding: 20px; border-radius: 8px; 
                        width: 95%; max-width: 900px; max-height: 95vh; overflow: hidden;
                        position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        display: flex; flex-direction: column;
                    ">
                        <style>
                            @media (max-width: 768px) {
                                .export-options-content {
                                    width: 98% !important;
                                    padding: 15px !important;
                                    max-height: 98vh !important;
                                }
                                .export-option label {
                                    font-size: 14px !important;
                                }
                                .btn {
                                    padding: 8px 15px !important;
                                    font-size: 13px !important;
                                }
                            }
                        </style>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-shrink: 0;">
                            <h2 style="margin: 0; color: var(--primary-color, #2c3e50); font-size: 20px;">Opciones de Exportación</h2>
                            <button type="button" class="modal-close-x" style="
                                background: none; border: none; font-size: 24px; cursor: pointer;
                                color: #666; padding: 5px; width: 35px; height: 35px;
                                display: flex; align-items: center; justify-content: center;
                                border-radius: 50%; transition: background-color 0.2s;
                            " title="Cerrar">&times;</button>
                        </div>
                        
                        <form class="export-form" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                            <div id="global-export-options" style="flex-shrink: 0;">
                                <div class="export-option" id="output-format-option">
                                    <label for="output-format" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 15px;">Formato de salida:</label>
                                    <select id="output-format" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                                        <option value="pdf">Informe PDF</option>
                                        <option value="excel">Excel (.xlsx)</option>
                                        <option value="csv">CSV</option>
                                    </select>
                                </div>
                                
                                <div class="export-option pdf-option" id="page-orientation-option" style="display: none;">
                                    <label for="page-orientation" style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 15px;">Orientación de página (PDF):</label>
                                    <select id="page-orientation" style="width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                                        <option value="landscape">Horizontal</option>
                                        <option value="portrait">Vertical</option>
                                    </select>
                                </div>
                                
                                <div class="export-option hidden" id="include-details-option">
                                    <label style="display: flex; align-items: center; margin-bottom: 15px; cursor: pointer; font-size: 15px;">
                                        <input type="checkbox" id="include-details" checked style="margin-right: 8px; transform: scale(1.1);">
                                        <span style="font-weight: bold;">Incluir detalles de productos (subitems)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div id="dynamic-category-options" style="flex: 1; overflow-y: auto; min-height: 0;"></div>
                            
                            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; flex-shrink: 0; padding-top: 15px; border-top: 1px solid #eee;">
                                <button type="button" class="btn btn-cancel" style="
                                    background-color: #95a5a6; color: white; padding: 10px 20px;
                                    border: none; border-radius: 4px; cursor: pointer; font-size: 14px;
                                    transition: background-color 0.2s;
                                ">Cancelar</button>
                                <button type="submit" class="btn btn-confirm" id="export-options-confirm" style="
                                    background-color: var(--primary-color, #3498db); color: white; padding: 10px 20px;
                                    border: none; border-radius: 4px; cursor: pointer; font-size: 14px;
                                    transition: background-color 0.2s;
                                ">Exportar</button>
                            </div>
                        </form>
                    </div>
                `;
                
                document.body.appendChild(modalElement);
                console.log('✅ Modal DOM creado');
                
                setupEventListeners();
            }

            // *** SETUP EVENT LISTENERS ***
            function setupEventListeners() {
                const modalContent = modalElement.querySelector('.export-options-content');
                const cancelButton = modalElement.querySelector('.btn-cancel');
                const closeXButton = modalElement.querySelector('.modal-close-x');
                const form = modalElement.querySelector('.export-form');
                const outputFormatSelect = modalElement.querySelector('#output-format');

                // *** CIERRE FORZADO DEFINITIVO ***
                const forceCloseModal = () => {
                    console.log('💥 CIERRE FORZADO DEL MODAL');
                    
                    // Reset completo del estado
                    isModalCurrentlyOpen = false;
                    currentCallback = null;
                    
                    // Múltiples métodos de ocultamiento
                    modalElement.classList.add('hidden');
                    modalElement.style.display = 'none !important';
                    modalElement.style.visibility = 'hidden';
                    modalElement.style.opacity = '0';
                    
                    // Fallback con timeout múltiple
                    setTimeout(() => {
                        modalElement.classList.add('hidden');
                        modalElement.style.display = 'none';
                        isModalCurrentlyOpen = false;
                    }, 10);
                    
                    setTimeout(() => {
                        if (modalElement && modalElement.parentNode) {
                            modalElement.remove();
                            exportModalSingleton = null; // Forzar recreación
                        }
                    }, 1000);
                    
                    console.log('✅ Modal cerrado forzadamente');
                };

                // X button
                closeXButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    forceCloseModal();
                });

                // Cancel button  
                cancelButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    forceCloseModal();
                });

                // Backdrop click
                modalElement.addEventListener('click', (e) => {
                    if (e.target === modalElement) {
                        forceCloseModal();
                    }
                });

                // Escape key
                const escapeHandler = (e) => {
                    if (e.key === 'Escape' && isModalCurrentlyOpen) {
                        e.preventDefault();
                        forceCloseModal();
                    }
                };
                document.addEventListener('keydown', escapeHandler);

                modalContent.addEventListener('click', (e) => e.stopPropagation());

                // *** FORM SUBMIT - FLUJO MEJORADO ***
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('📝 Form submit interceptado');
                    
                    if (!currentCallback) {
                        console.warn('⚠️ No callback, cerrando');
                        forceCloseModal();
                        return;
                    }

                    const options = extractFormOptions();
                    const callbackToExecute = currentCallback;
                    
                    console.log('🔄 Ejecutando flujo CLOSE-FIRST definitivo');
                    
                    // *** PASO 1: CERRAR INMEDIATAMENTE ***
                    forceCloseModal();
                    
                    // *** PASO 2: EJECUTAR CALLBACK CON DELAY MÍNIMO ***
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            try {
                                console.log('▶️ Ejecutando callback');
                                callbackToExecute(options);
                                console.log('✅ Callback completado');
                            } catch (error) {
                                console.error('❌ Error en callback:', error);
                                InventorySystem.Utils.showError('Error al generar reporte: ' + error.message);
                            }
                        }, 100);
                    });
                });

                outputFormatSelect.addEventListener('change', function() {
                    const pageOrientationOption = modalElement.querySelector('#page-orientation-option');
                    pageOrientationOption.style.display = 'none'; // el informe HTML no necesita orientación
                });

                console.log('✅ Event listeners configurados');
            }

            function extractFormOptions() {
                // Para inventario completo, obtener códigos seleccionados de los checkboxes
                let selectedCodes = '';
                if (currentCategory === 'all' && !currentIsCompleteReport) {
                    const selectedCheckboxes = modalElement.querySelectorAll('.product-code-checkbox:checked');
                    if (selectedCheckboxes.length > 0) {
                        selectedCodes = Array.from(selectedCheckboxes).map(cb => cb.value).join(',');
                    }
                }
                
                return {
                    outputFormat: modalElement.querySelector('#output-format').value,
                    pageOrientation: modalElement.querySelector('#page-orientation').value,
                    includeDetails: modalElement.querySelector('#include-details-option').classList.contains('hidden') ? 
                        false : modalElement.querySelector('#include-details').checked,
                    category: currentCategory,
                    isCompleteReport: currentIsCompleteReport,
                    minAbsoluteNegativeBalance: modalElement.querySelector('#min-absolute-negative')?.value,
                    filterCodes: modalElement.querySelector('#negative-codes-filter')?.value,
                    allCodesFilter: selectedCodes || modalElement.querySelector('#all-codes-filter')?.value,
                    sortBy: modalElement.querySelector(`#${currentCategory}-sort-by`)?.value,
                    sortOrder: modalElement.querySelector(`#${currentCategory}-sort-order`)?.value,
                    minNegativeProductsPallet: modalElement.querySelector('#min-negative-products-pallet')?.value,
                    minPhysicalInventory: modalElement.querySelector('#min-physical-inventory')?.value,
                    maxPhysicalInventory: modalElement.querySelector('#max-physical-inventory')?.value,
                };
            }

            function populateDynamicOptions(category, isCompleteReportMode) {
                const container = modalElement.querySelector('#dynamic-category-options');
                container.innerHTML = '';
                
                let optionsHtml = '';
                const optionStyle = 'width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px;';
                const labelStyle = 'display: block; margin-bottom: 5px; font-weight: bold;';
                
                if (category === 'negative') {
                    optionsHtml = `
                        <h4 style="margin-top: 20px; margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">Filtros Avanzados (Negativos)</h4>
                        <div class="dynamic-export-option export-option">
                            <label for="min-absolute-negative" style="${labelStyle}">Balance Negativo Mínimo (Absoluto):</label>
                            <input type="number" id="min-absolute-negative" placeholder="Ej: 10" step="any" style="${optionStyle}">
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="negative-codes-filter" style="${labelStyle}">Filtrar por Códigos (separados por coma):</label>
                            <input type="text" id="negative-codes-filter" placeholder="Ej: 27143, 67032" style="${optionStyle}">
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="negative-sort-by" style="${labelStyle}">Ordenar por:</label>
                            <select id="negative-sort-by" style="${optionStyle}">
                                <option value="totalNegative" selected>Balance Total (Abs.)</option>
                                <option value="code">Código</option>
                                <option value="name">Nombre</option>
                            </select>
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="negative-sort-order" style="${labelStyle}">Orden:</label>
                            <select id="negative-sort-order" style="${optionStyle}">
                                <option value="desc" selected>Descendente</option>
                                <option value="asc">Ascendente</option>
                            </select>
                        </div>`;
                } else if (category === 'pallet') {
                    optionsHtml = `
                        <h4 style="margin-top: 20px; margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">Filtros Avanzados (Pallets)</h4>
                        <div class="dynamic-export-option export-option">
                            <label for="min-negative-products-pallet" style="${labelStyle}">Mínimo Productos Negativos por Pallet:</label>
                            <input type="number" id="min-negative-products-pallet" placeholder="Ej: 1" min="0" style="${optionStyle}">
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="pallet-sort-by" style="${labelStyle}">Ordenar por:</label>
                            <select id="pallet-sort-by" style="${optionStyle}">
                                <option value="negativeProducts" selected>Productos Negativos</option>
                                <option value="palletId">ID de Pallet</option>
                            </select>
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="pallet-sort-order" style="${labelStyle}">Orden:</label>
                            <select id="pallet-sort-order" style="${optionStyle}">
                                <option value="desc" selected>Descendente</option>
                                <option value="asc">Ascendente</option>
                            </select>
                        </div>`;
                } else if (category === 'all' && !isCompleteReportMode) {
                    // Obtener productos únicos por código de los actualmente visibles en la tabla
                    const uniqueProducts = getUniqueVisibleProducts();
                    
                    let productCheckboxes = '';
                    if (uniqueProducts.length > 0) {
                        productCheckboxes = uniqueProducts.map(product => `
                            <label class="product-item" style="
                                display: flex; align-items: center; margin-bottom: 8px; 
                                padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                                cursor: pointer; transition: all 0.2s; background: white;
                            " onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='#3498db';" 
                               onmouseout="this.style.backgroundColor='white'; this.style.borderColor='#ddd';">
                                
                                <input type="checkbox" class="product-code-checkbox" value="${product.code}" 
                                       style="margin-right: 10px; width: 16px; height: 16px; flex-shrink: 0;">
                                
                                <div style="flex: 1; min-width: 0; margin-right: 10px;">
                                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px; flex-wrap: wrap;">
                                        <span style="
                                            font-weight: bold; color: #2980b9; font-size: 14px;
                                            background: #ecf0f1; padding: 2px 6px; border-radius: 3px;
                                        ">${product.code}</span>
                                        ${product.instances > 1 ? `<span style="
                                            font-size: 10px; color: #7f8c8d; background: #bdc3c7; 
                                            padding: 1px 5px; border-radius: 8px; font-weight: bold;
                                        ">${product.instances}x</span>` : ''}
                                    </div>
                                    <div style="
                                        color: #2c3e50; font-size: 12px; line-height: 1.2;
                                        overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; 
                                        -webkit-box-orient: vertical; font-weight: 500;
                                    ">${product.name || 'Sin nombre'}</div>
                                </div>
                                
                                <div style="
                                    text-align: center; flex-shrink: 0; min-width: 50px;
                                ">
                                    <div style="
                                        font-weight: bold; font-size: 13px;
                                        color: ${product.totalInventory < 0 ? '#e74c3c' : product.totalInventory > 0 ? '#27ae60' : '#7f8c8d'};
                                        background: ${product.totalInventory < 0 ? '#fdf2f2' : product.totalInventory > 0 ? '#f0f9f4' : '#f8f9fa'};
                                        padding: 3px 6px; border-radius: 3px; border: 1px solid;
                                        border-color: ${product.totalInventory < 0 ? '#fca5a5' : product.totalInventory > 0 ? '#86efac' : '#d1d5db'};
                                    ">${product.totalInventory}</div>
                                    <div style="font-size: 9px; color: #95a5a6; margin-top: 1px;">Total</div>
                                </div>
                            </label>
                        `).join('');
                        
                        productCheckboxes += `<div style="
                            font-size: 12px; color: #666; margin-top: 15px; padding: 8px;
                            background: #f8f9fa; border-radius: 4px; text-align: center;
                            border: 1px dashed #bdc3c7;
                        ">
                            <strong>${uniqueProducts.length}</strong> códigos únicos encontrados
                        </div>`;
                    } else {
                        productCheckboxes = `<div style="
                            color: #666; font-style: italic; text-align: center; padding: 20px;
                            background: #f8f9fa; border-radius: 4px; border: 1px dashed #bdc3c7;
                        ">
                            <div style="font-size: 24px; margin-bottom: 8px;">📦</div>
                            <div>No hay productos visibles en la tabla actual.</div>
                            <div style="font-size: 11px; margin-top: 5px; color: #95a5a6;">
                                Aplique filtros en la tabla principal para ver productos.
                            </div>
                        </div>`;
                    }
                    
                    optionsHtml = `
                        <h4 style="margin-top: 20px; margin-bottom: 15px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 5px;">Filtros Avanzados (Inventario Completo)</h4>
                        
                        <div class="dynamic-export-option export-option">
                            <label style="${labelStyle}">Seleccionar Productos Específicos:</label>
                            <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" id="select-all-products" style="
                                    padding: 8px 16px; background: #3498db; color: white; 
                                    border: none; border-radius: 5px; cursor: pointer; font-size: 13px; 
                                    transition: all 0.2s; font-weight: 500; flex: 1; min-width: 120px;
                                ">✓ Seleccionar Todos</button>
                                <button type="button" id="deselect-all-products" style="
                                    padding: 8px 16px; background: #95a5a6; color: white; 
                                    border: none; border-radius: 5px; cursor: pointer; font-size: 13px;
                                    transition: all 0.2s; font-weight: 500; flex: 1; min-width: 120px;
                                ">✗ Deseleccionar Todos</button>
                            </div>
                            <div id="products-checkbox-container" style="
                                max-height: 350px; overflow-y: auto; border: 1px solid #ddd; 
                                border-radius: 6px; padding: 8px; background: #fafafa;
                                scrollbar-width: thin; scrollbar-color: #bdc3c7 #ecf0f1;
                            ">
                                <style>
                                    #products-checkbox-container::-webkit-scrollbar { width: 10px; }
                                    #products-checkbox-container::-webkit-scrollbar-track { background: #ecf0f1; border-radius: 5px; }
                                    #products-checkbox-container::-webkit-scrollbar-thumb { background: #bdc3c7; border-radius: 5px; }
                                    #products-checkbox-container::-webkit-scrollbar-thumb:hover { background: #95a5a6; }
                                </style>
                                ${productCheckboxes}
                            </div>
                        </div>
                        
                        <div class="dynamic-export-option export-option">
                            <label for="min-physical-inventory" style="${labelStyle}">Inv. Físico Mínimo:</label>
                            <input type="number" id="min-physical-inventory" step="any" style="${optionStyle}">
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="max-physical-inventory" style="${labelStyle}">Inv. Físico Máximo:</label>
                            <input type="number" id="max-physical-inventory" step="any" style="${optionStyle}">
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="all-sort-by" style="${labelStyle}">Ordenar por:</label>
                            <select id="all-sort-by" style="${optionStyle}">
                                <option value="physicalInventory" selected>Inventario Físico</option>
                                <option value="code">Código</option>
                            </select>
                        </div>
                        <div class="dynamic-export-option export-option">
                            <label for="all-sort-order" style="${labelStyle}">Orden:</label>
                            <select id="all-sort-order" style="${optionStyle}">
                                <option value="desc" selected>Descendente</option>
                                <option value="asc">Ascendente</option>
                            </select>
                        </div>`;
                }
                
                container.innerHTML = optionsHtml;
                
                // Agregar event listeners para los botones de selección múltiple
                if (category === 'all' && !isCompleteReportMode) {
                    const selectAllBtn = modalElement.querySelector('#select-all-products');
                    const deselectAllBtn = modalElement.querySelector('#deselect-all-products');
                    
                    if (selectAllBtn) {
                        selectAllBtn.addEventListener('click', () => {
                            const checkboxes = modalElement.querySelectorAll('.product-code-checkbox');
                            checkboxes.forEach(cb => cb.checked = true);
                            selectAllBtn.style.transform = 'scale(0.95)';
                            setTimeout(() => { selectAllBtn.style.transform = 'scale(1)'; }, 100);
                        });
                    }
                    
                    if (deselectAllBtn) {
                        deselectAllBtn.addEventListener('click', () => {
                            const checkboxes = modalElement.querySelectorAll('.product-code-checkbox');
                            checkboxes.forEach(cb => cb.checked = false);
                            deselectAllBtn.style.transform = 'scale(0.95)';
                            setTimeout(() => { deselectAllBtn.style.transform = 'scale(1)'; }, 100);
                        });
                    }
                }
            }

            // Función auxiliar para obtener productos únicos por código de los actualmente visibles
            function getUniqueVisibleProducts() {
                try {
                    const currentUIData = InventorySystem.Inventory.getFilteredData();
                    if (!currentUIData || !currentUIData.all) {
                        return [];
                    }
                    
                    let visibleData = [...currentUIData.all];
                    
                    // Aplicar filtros de la UI actual
                    const allSearchEl = document.getElementById('all-search');
                    const allStatusFilterEl = document.getElementById('all-status-filter');

                    const searchTerm = allSearchEl ? allSearchEl.value.toLowerCase() : '';
                    const statusFilter = allStatusFilterEl ? allStatusFilterEl.value : '';
                    
                    // MULTI-SELECT: Obtener almacenes seleccionados
                    const selectedWarehouses = (typeof InventorySystem !== 'undefined' && 
                        InventorySystem.UI && 
                        InventorySystem.UI.getSelectedAllWarehouses) ? 
                        InventorySystem.UI.getSelectedAllWarehouses() : [];

                    visibleData = visibleData.filter(item => {
                        const matchesSearch = searchTerm === '' ||
                            (item.code && String(item.code).toLowerCase().includes(searchTerm)) ||
                            (item.name && String(item.name).toLowerCase().includes(searchTerm)) ||
                            (item.palletId && String(item.palletId).toLowerCase().includes(searchTerm));

                        const matchesWarehouse = selectedWarehouses.length === 0 || 
                            selectedWarehouses.includes(item.warehouse);

                        let matchesStatus = true;
                        if (statusFilter === 'positive') {
                            matchesStatus = item.physicalInventory > 0;
                        } else if (statusFilter === 'negative') {
                            matchesStatus = item.physicalInventory < 0;
                        } else if (statusFilter === 'zero') {
                            matchesStatus = item.physicalInventory === 0;
                        }
                        return matchesSearch && matchesWarehouse && matchesStatus;
                    });
                    
                    // Agrupar por código único y sumar inventarios
                    const groupedByCode = {};
                    visibleData.forEach(item => {
                        const code = item.code;
                        if (!groupedByCode[code]) {
                            groupedByCode[code] = {
                                code: code,
                                name: item.name || 'Sin nombre',
                                totalInventory: 0,
                                instances: 0,
                                allInstances: []
                            };
                        }
                        groupedByCode[code].totalInventory += (item.physicalInventory || 0);
                        groupedByCode[code].instances += 1;
                        groupedByCode[code].allInstances.push(item);
                        
                        if (item.name && item.name.length > groupedByCode[code].name.length) {
                            groupedByCode[code].name = item.name;
                        }
                    });
                    
                    // Convertir a array y ordenar por inventario total descendente
                    const uniqueProducts = Object.values(groupedByCode)
                        .sort((a, b) => b.totalInventory - a.totalInventory);
                    
                    return uniqueProducts;
                } catch (error) {
                    console.warn('Error al obtener productos únicos visibles:', error);
                    return [];
                }
            }

            createModalDOM();

            return {
                isOpen: () => isModalCurrentlyOpen,
                
                setup: function(category, defaultFormat, isCompleteReportMode) {
                    console.log(`🔧 Setup modal: ${category}, formato: ${defaultFormat}`);
                    
                    currentCategory = category;
                    currentIsCompleteReport = isCompleteReportMode;
                    
                    modalElement.querySelector('.export-form').reset();
                    
                    const includeDetailsOption = modalElement.querySelector('#include-details-option');
                    const outputFormatOption = modalElement.querySelector('#output-format-option');
                    
                    includeDetailsOption.classList.toggle('hidden', !isCompleteReportMode);
                    outputFormatOption.classList.toggle('hidden', !!defaultFormat);
                    
                    const outputFormatSelect = modalElement.querySelector('#output-format');
                    if (defaultFormat) {
                        outputFormatSelect.value = defaultFormat;
                    }
                    
                    const pageOrientationOption = modalElement.querySelector('#page-orientation-option');
                    pageOrientationOption.style.display = 'none';
                    
                    populateDynamicOptions(category, isCompleteReportMode);
                    
                    console.log('✅ Modal configurado');
                },
                
                show: function(callback) {
                    if (isModalCurrentlyOpen) {
                        console.warn('⚠️ Modal ya abierto');
                        return false;
                    }
                    
                    console.log('🚀 Abriendo modal');
                    currentCallback = callback;
                    isModalCurrentlyOpen = true;
                    modalElement.classList.remove('hidden');
                    modalElement.style.display = 'flex';
                    modalElement.style.visibility = 'visible';
                    modalElement.style.opacity = '1';
                    
                    setTimeout(() => {
                        const firstInput = modalElement.querySelector('select, input');
                        if (firstInput) firstInput.focus();
                    }, 100);
                    
                    console.log('✅ Modal abierto');
                    return true;
                }
            };
        }

        function showExportPrintOptionsModal(category, defaultOutputFormat, callback, isCompleteReport = false) {
            if (modalOpenDebounceTimer) {
                console.warn('⚠️ Debouncing activo');
                return;
            }
            
            modalOpenDebounceTimer = setTimeout(() => {
                modalOpenDebounceTimer = null;
            }, 500);

            if (isModalCurrentlyOpen) {
                console.warn('⚠️ Modal ya abierto');
                return;
            }

            if (!exportModalSingleton) {
                console.log('🏗️ Creando singleton');
                exportModalSingleton = createExportModalSingleton();
            }

            try {
                exportModalSingleton.setup(category, defaultOutputFormat, isCompleteReport);

                // Sugerencias de rendimiento para datasets grandes
                try {
                    const inv = InventorySystem.Inventory.getInventoryData?.() || [];
                    if (category === 'all' && Array.isArray(inv) && inv.length > 5000 && typeof exportModalSingleton.injectPerformanceHints === 'function') {
                        exportModalSingleton.injectPerformanceHints({
                            suggestions: [
                                'Activar "Vista resumida" (ej. 5000 filas) para evitar cuelgues del navegador',
                                'Preferir Excel/CSV para exportaciones completas (>10.000 filas)',
                                'Evitar incluir Dashboard en exportaciones masivas'
                            ],
                            defaults: { maxRows: 5000 }
                        });
                    }
                } catch (e) {
                    console.warn('No se pudieron inyectar hints de rendimiento:', e);
                }

                exportModalSingleton.show(callback);
            } catch (error) {
                console.error('❌ Error al mostrar modal:', error);
                InventorySystem.Utils.showError('Error al abrir opciones de exportación: ' + error.message);
            }
        }

        // --- Funciones de Interfaz ---

        function init() {
            if (!window.XLSX) {
                console.error('XLSX no disponible');
                InventorySystem.Utils.showError('Funcionalidad Excel no disponible');
            }

            const sections = [
                document.getElementById('negative-inventory-content'),
                document.getElementById('pallet-analysis-content'),
                document.getElementById('all-inventory-content'),
                document.getElementById('dashboard-content')
            ];

            const allSectionsExist = sections.every(sec => sec);

            if (!allSectionsExist) {
                console.warn('Secciones no disponibles, reintentando...');
                setTimeout(init, 500);
                return;
            }

            addExportButtons();
            addExportAllButton();
        }

        function addExportButtons() {
            const sectionsConfig = [
                { id: 'negative-inventory-content', category: 'negative', searchClass: '.filter-container' },
                { id: 'pallet-analysis-content', category: 'pallet', searchClass: '.search-container' },
                { id: 'all-inventory-content', category: 'all', searchClass: '.filter-container' }
            ];

            sectionsConfig.forEach(sec => {
                const sectionElement = document.getElementById(sec.id);
                if (sectionElement && !sectionElement.querySelector('.export-buttons')) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'export-buttons';

                    // El informe HTML (js/report.js) sustituye al PDF y a la impresión anteriores:
                    // respeta los filtros y el orden de la tabla, y el navegador lo guarda como PDF.
                    const pdfButton = document.createElement('button');
                    pdfButton.className = 'btn';
                    pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Informe PDF';
                    pdfButton.addEventListener('click', () => {
                        InventorySystem.Report.open(sec.category);
                    });

                    const excelButton = document.createElement('button');
                    excelButton.className = 'btn';
                    excelButton.innerHTML = '<i class="fas fa-file-excel"></i> Exportar a Excel';
                    excelButton.addEventListener('click', () => showExportPrintOptionsModal(sec.category, 'excel', (options) => generateReportExcel('tab', sec.category, options)));

                    buttonContainer.appendChild(pdfButton);
                    buttonContainer.appendChild(excelButton);

                    const insertReferenceNode = sectionElement.querySelector(sec.searchClass);
                    const tableNode = sectionElement.querySelector('table');

                    if (insertReferenceNode) {
                        insertReferenceNode.parentNode.insertBefore(buttonContainer, insertReferenceNode.nextSibling);
                    } else if (tableNode) {
                        sectionElement.insertBefore(buttonContainer, tableNode);
                    } else {
                        sectionElement.insertBefore(buttonContainer, sectionElement.firstChild);
                    }
                }
            });

            const dashboardSection = document.getElementById('dashboard-content');
            if (dashboardSection && !dashboardSection.querySelector('.export-buttons')) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'export-buttons';

                const pdfButton = document.createElement('button');
                pdfButton.className = 'btn';
                pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Informe PDF';
                pdfButton.addEventListener('click', () => {
                    InventorySystem.Report.open('dashboard');
                });

                buttonContainer.appendChild(pdfButton);
                dashboardSection.insertBefore(buttonContainer, dashboardSection.firstChild);
            }
        }

        function addExportAllButton() {
            const container = document.querySelector('.container');
            if (!container || document.getElementById('export-all-button')) return;

            const exportAllButton = document.createElement('button');
            exportAllButton.id = 'export-all-button';
            exportAllButton.className = 'btn';
            exportAllButton.style.marginTop = '1rem';
            exportAllButton.style.marginBottom = '1rem';
            exportAllButton.innerHTML = '<i class="fas fa-file-export"></i> Exportar Reporte Completo';

            const inventoryAnalysisCard = document.getElementById('inventory-analysis');
            const adminControlsCard = document.getElementById('admin-controls');

            const exportAllSlot = document.getElementById('export-all-slot');

            if (exportAllSlot) {
                exportAllButton.style.marginTop = '';
                exportAllButton.style.marginBottom = '';
                exportAllSlot.appendChild(exportAllButton);
            } else if (adminControlsCard && adminControlsCard.offsetParent !== null) {
                adminControlsCard.parentNode.insertBefore(exportAllButton, adminControlsCard.nextSibling);
            } else if (inventoryAnalysisCard && inventoryAnalysisCard.offsetParent !== null) {
                container.insertBefore(exportAllButton, inventoryAnalysisCard);
            } else {
                const header = document.querySelector('header');
                if (header) {
                    header.parentNode.insertBefore(exportAllButton, header.nextSibling);
                } else {
                    container.insertBefore(exportAllButton, container.firstChild);
                }
            }

            exportAllButton.addEventListener('click', () => {
                showExportPrintOptionsModal('all', null, (options) => exportCompleteReport(options), true);
            });
        }

        // --- API pública ---
        function exportToPDF(category) {
            InventorySystem.Report.open(category);
        }

        function exportToExcel(category, options) {
            try {
                generateReportExcel('tab', category, options);
            } catch (error) {
                console.error(`Error exportar ${category} Excel:`, error);
                InventorySystem.Utils.showError(`Error exportar ${category} Excel: ` + error.message);
            }
        }

        function exportDashboardToPDF() {
            InventorySystem.Report.open('dashboard');
        }

        function printData(category) {
            InventorySystem.Report.open(category, { print: true });
        }

        function exportCompleteReport(options) {
            try {
                const outputFormat = options.outputFormat || 'pdf';
                switch (outputFormat) {
                    case 'pdf':
                        InventorySystem.Report.open('complete');
                        break;
                    case 'excel':
                        generateReportExcel('complete', 'all', options);
                        break;
                    case 'csv':
                        exportCompleteReportToCSV(options);
                        break;
                    case 'print':
                        InventorySystem.Report.open('complete', { print: true });
                        break;
                    default:
                        InventorySystem.Utils.showError('Formato de exportación no soportado.');
                }
            } catch (error) {
                console.error('Error exportar reporte completo:', error);
                InventorySystem.Utils.showError('Error exportar reporte completo: ' + error.message);
            }
        }

        // *** EXPONER FUNCIONES PARA USO EXTERNO ***
        moduleAPI = {
            init,
            exportToPDF,
            exportToExcel,
            exportDashboardToPDF,
            exportCompleteReport,
            printData
        };

        return moduleAPI;
    })();
})(window.InventorySystem || (window.InventorySystem = {}));

// --- END OF FILE export.js ---