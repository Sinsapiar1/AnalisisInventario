/**
 * Módulo de interfaz de usuario para el sistema
 */

// Esperar a que Utils esté disponible
(function(InventorySystem) {
    // Módulo de UI
    InventorySystem.UI = (function() {
        // Variables privadas
        const ITEMS_PER_PAGE = 10;
        let currentPage = {
            negative: 1,
            pallet: 1,
            all: 1
        };
        
        // Elementos DOM para pestañas
        const tabs = document.querySelectorAll('.tab');
        
        // Elementos de tabla
        const negativeInventoryTable = document.getElementById('negative-inventory-table').querySelector('tbody');
        const palletAnalysisTable = document.getElementById('pallet-analysis-table').querySelector('tbody');
        const allInventoryTable = document.getElementById('all-inventory-table').querySelector('tbody');
        
        // Elementos de paginación
        const negativePagination = document.getElementById('negative-pagination');
        const palletPagination = document.getElementById('pallet-pagination');
        const allPagination = document.getElementById('all-pagination');
        
        // Elementos de búsqueda y filtro
        const negativeSearch = document.getElementById('negative-search');
        const palletSearch = document.getElementById('pallet-search');
        const allSearch = document.getElementById('all-search');
        const negativeWarehouseFilter = document.getElementById('negative-warehouse-filter');
        const allWarehouseFilter = document.getElementById('all-warehouse-filter');
        const allStatusFilter = document.getElementById('all-status-filter');
        
        /**
         * Inicializar el módulo de UI
         */
        function init() {
            // Configurar event listeners para las pestañas
            setupTabEventListeners();
            
            // Configurar event listeners para búsqueda y filtros
            setupSearchFilterEventListeners();
        }
        
        /**
         * Configurar event listeners para las pestañas
         */
        function setupTabEventListeners() {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.getAttribute('data-tab');
                    switchTab(tabId);
                });
            });
        }
        
        /**
         * Configurar event listeners para búsqueda y filtros
         */
        function setupSearchFilterEventListeners() {
            // Eventos de búsqueda
            negativeSearch.addEventListener('input', filterNegativeInventory);
            palletSearch.addEventListener('input', filterPalletAnalysis);
            allSearch.addEventListener('input', filterAllInventory);
            
            // Eventos de filtro
            negativeWarehouseFilter.addEventListener('change', filterNegativeInventory);
            allWarehouseFilter.addEventListener('change', filterAllInventory);
            allStatusFilter.addEventListener('change', filterAllInventory);
        }
        
        /**
         * Cambiar pestaña
         * @param {string} tabId - ID de la pestaña a mostrar
         */
        function switchTab(tabId) {
            // Limpiar vista antes de cambiar de pestaña
            resetInventoryView();
            
            // Actualizar pestañas activas
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.getAttribute('data-tab') === tabId) {
                    tab.classList.add('active');
                }
            });
            
            // Actualizar contenido de pestañas
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId + '-content').classList.add('active');
            
            // Actualizar datos según la pestaña
            if (tabId === 'negative-inventory') {
                filterNegativeInventory();
            } else if (tabId === 'pallet-analysis') {
                filterPalletAnalysis();
            } else if (tabId === 'all-inventory') {
                filterAllInventory();
            } else if (tabId === 'dashboard') {
                if (typeof InventorySystem.Charts !== 'undefined') {
                    InventorySystem.Charts.renderDashboard();
                }
            }
        }
        
        /**
         * Filtrar inventario negativo
         */
                /**
         * Filtrar inventario negativo
         */
        function filterNegativeInventory() {
            try {
                resetInventoryView(); // Limpiar la vista antes de filtrar
                
                const searchTerm = negativeSearch.value.toLowerCase();
                const warehouseFilter = negativeWarehouseFilter.value;
                
                if (!window.productBalances) {
                    console.error('productBalances no está definido. No se puede filtrar inventario negativo.');
                    InventorySystem.Inventory.setFilteredData('negative', []); // Asegurar que los datos filtrados estén vacíos
                    renderConsolidatedNegativeTable([]); // Renderizar tabla vacía
                    renderPagination(negativePagination, 0, 1, 'negative'); // Limpiar paginación
                    return;
                }
                
                // Paso 1: Obtener todos los 'productBalance' que son negativos en su propio contexto (code-warehouse)
                let initialNegativeProducts = Object.values(window.productBalances)
                    .filter(pb => InventorySystem.Utils.isValidNumber(pb.totalInventory) && parseFloat(pb.totalInventory) < 0);
                
                // Paso 2: Aplicar filtros de la UI (búsqueda, almacén) sobre estos 'productBalance'
                if (warehouseFilter !== '') {
                    initialNegativeProducts = initialNegativeProducts.filter(pb => pb.warehouse === warehouseFilter);
                }
                
                initialNegativeProducts = initialNegativeProducts.filter(pb => 
                    searchTerm === '' || 
                    pb.code.toString().toLowerCase().includes(searchTerm) || 
                    (pb.name && pb.name.toLowerCase().includes(searchTerm))
                );
                
                // Paso 3: Consolidar los 'productBalance' filtrados por CÓDIGO DE PRODUCTO
                const consolidatedProductsMap = new Map();
                
                initialNegativeProducts.forEach(pbProduct => { // pbProduct es un item de productBalances (agrupado por code+warehouse)
                    const code = pbProduct.code;
                    let consolidated = consolidatedProductsMap.get(code);

                    if (!consolidated) {
                        consolidated = {
                            code: code,
                            name: pbProduct.name, // Tomar el nombre del primer productBalance encontrado
                            totalNegative: 0,
                            totalAvailable: 0,
                            warehouses: new Set(),
                            palletIds: new Set(), // Usar un Set para contar pallets únicos por producto consolidado
                            palletCount: 0, // Se calculará al final a partir de palletIds.size
                            records: [] // Colección de todos los records originales que componen este producto consolidado
                        };
                        consolidatedProductsMap.set(code, consolidated);
                    }

                    // Acumular el balance negativo del productBalance actual
                    consolidated.totalNegative += pbProduct.totalInventory; // pbProduct.totalInventory ya es el balance de ese code+warehouse
                    consolidated.warehouses.add(pbProduct.warehouse);

                    // Acumular 'records', 'available' y 'palletIds' de los registros individuales
                    if (pbProduct.records && Array.isArray(pbProduct.records)) {
                        pbProduct.records.forEach(record => {
                            consolidated.records.push(record); // Guardar el record original
                            if (InventorySystem.Utils.isValidNumber(record.available)) {
                                consolidated.totalAvailable += parseFloat(record.available);
                            }
                            if (record.palletId) {
                                consolidated.palletIds.add(record.palletId);
                            }
                        });
                    }
                });

                // Convertir el Map a un array y calcular palletCount final
                const finalConsolidatedList = Array.from(consolidatedProductsMap.values()).map(prod => {
                    prod.palletCount = prod.palletIds.size; // Contar pallets únicos para este producto
                    delete prod.palletIds; // Eliminar el Set auxiliar si ya no se necesita
                    return prod;
                });

                // Filtrar de nuevo para asegurar que el *consolidado* totalNegative es realmente negativo
                // (aunque el filtro inicial ya debería haberlo hecho, esto es una doble verificación)
                // Y ordenar.
                const filteredAndSortedNegative = finalConsolidatedList
                    .filter(product => InventorySystem.Utils.isValidNumber(product.totalNegative) && parseFloat(product.totalNegative) < 0)
                    .sort((a, b) => Math.abs(b.totalNegative) - Math.abs(a.totalNegative));
                
                // ***** ESTA ES LA FUENTE DE DATOS PARA LA UI Y PARA EXPORTACIÓN/IMPRESIÓN CONSOLIDADA *****
                window.currentNegativeProducts = filteredAndSortedNegative; 
                InventorySystem.Inventory.setFilteredData('negative', filteredAndSortedNegative);
                
                currentPage.negative = 1;
                renderConsolidatedNegativeTable(filteredAndSortedNegative);
                renderPagination(negativePagination, filteredAndSortedNegative.length, currentPage.negative, 'negative');

            } catch (error) {
                console.error('Error en filterNegativeInventory:', error);
                // Opcional: Mostrar un error al usuario
                // InventorySystem.Utils.showError('Error al filtrar inventario negativo.');
            }
        }
        
        /**
         * Renderizar tabla consolidada de inventario negativo
         * @param {Array} filteredData - Datos filtrados
         */
        function renderConsolidatedNegativeTable(filteredData) {
            negativeInventoryTable.innerHTML = '';
            
            const startIndex = (currentPage.negative - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
            
            if (filteredData.length === 0) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 7;
                cell.textContent = 'No se encontraron productos con inventario negativo';
                cell.style.textAlign = 'center';
                row.appendChild(cell);
                negativeInventoryTable.appendChild(row);
                return;
            }
            
            // Actualizar encabezado de la tabla para la vista consolidada
            const headerRow = negativeInventoryTable.parentElement.querySelector('thead tr');
            if (headerRow) {
                headerRow.innerHTML = `
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Almacenes</th>
                    <th>Pallets</th>
                    <th>Balance Total</th>
                    <th>Disponible</th>
                    <th>Acciones</th>
                `;
            }
            
            // Renderizar filas consolidadas
            for (let i = startIndex; i < endIndex; i++) {
                const product = filteredData[i];
                const row = document.createElement('tr');
                row.classList.add('negative-row');
                row.setAttribute('data-product-code', product.code);
                
                // Código
                const codeCell = document.createElement('td');
                codeCell.textContent = product.code;
                codeCell.setAttribute('data-label', 'Código');
                row.appendChild(codeCell);
                
                // Nombre
                const nameCell = document.createElement('td');
                nameCell.textContent = product.name || '';
                nameCell.setAttribute('data-label', 'Nombre');
                row.appendChild(nameCell);
                
                // Almacenes
                const warehousesCell = document.createElement('td');
                warehousesCell.textContent = Array.from(product.warehouses).join(', ');
                warehousesCell.setAttribute('data-label', 'Almacenes');
                row.appendChild(warehousesCell);
                
                // Pallets
                const palletsCell = document.createElement('td');
                palletsCell.textContent = product.palletCount;
                palletsCell.setAttribute('data-label', 'Pallets');
                row.appendChild(palletsCell);
                
                // Balance Total
                const balanceCell = document.createElement('td');
                balanceCell.textContent = InventorySystem.Utils.formatNumber(product.totalNegative);
                balanceCell.style.color = 'red';
                balanceCell.style.fontWeight = 'bold';
                balanceCell.setAttribute('data-label', 'Balance Total');
                row.appendChild(balanceCell);
                
                // Disponible
                const availableCell = document.createElement('td');
                availableCell.textContent = InventorySystem.Utils.formatNumber(product.totalAvailable);
                availableCell.setAttribute('data-label', 'Disponible');
                row.appendChild(availableCell);
                
                // Acciones
                const actionsCell = document.createElement('td');
                const detailBtn = document.createElement('button');
                detailBtn.className = 'btn';
                detailBtn.innerHTML = '<i class="fas fa-search"></i> Ver Detalle';
                detailBtn.addEventListener('click', () => {
                    showProductDetailedView(product.code);
                });
                actionsCell.appendChild(detailBtn);
                actionsCell.setAttribute('data-label', 'Acciones');
                row.appendChild(actionsCell);
                
                negativeInventoryTable.appendChild(row);
            }
        }
        
        /**
         * Mostrar vista detallada de un producto
         * @param {string} productCode - Código del producto
         */
        function showProductDetailedView(productCode) {
            try {
                // Buscar el producto en la lista actual
                const filteredData = InventorySystem.Inventory.getFilteredData().negative;
                const product = filteredData.find(p => p.code === productCode);
                
                if (!product) {
                    console.error('Producto no encontrado:', productCode);
                    return;
                }
                
                // Usar la plantilla para crear el modal
                const template = document.getElementById('product-detail-modal-template');
                const modal = document.importNode(template.content, true).querySelector('.modal');
                
                // Configurar el título
                modal.querySelector('.product-title').textContent = `Detalle del Producto: ${product.name} (${product.code})`;
                
                // Configurar el resumen
                const summary = modal.querySelector('.product-summary');
                
                // Datos del resumen
                const summaryItems = [
                    { label: 'Balance Total', value: InventorySystem.Utils.formatNumber(product.totalNegative), isNegative: true },
                    { label: 'Disponible Total', value: InventorySystem.Utils.formatNumber(product.totalAvailable) },
                    { label: 'Almacenes', value: product.warehouses.size },
                    { label: 'Pallets', value: product.palletCount }
                ];
                
                summaryItems.forEach(item => {
                    const summaryItem = document.createElement('div');
                    summaryItem.className = 'summary-item';
                    
                    const label = document.createElement('div');
                    label.textContent = item.label;
                    label.style.fontSize = '0.9rem';
                    label.style.color = '#666';
                    summaryItem.appendChild(label);
                    
                    const value = document.createElement('div');
                    value.textContent = item.value;
                    value.style.fontSize = '1.5rem';
                    value.style.fontWeight = 'bold';
                    if (item.isNegative) {
                        value.style.color = 'red';
                    }
                    summaryItem.appendChild(value);
                    
                    summary.appendChild(summaryItem);
                });
                
                // Configurar la tabla de detalles
                const tableBody = modal.querySelector('.detail-table tbody');
                
                // Ordenar registros por almacén y luego por ID de pallet
                const sortedRecords = [...product.records].sort((a, b) => {
                    // Comparar almacenes primero
                    const warehouseA = a.warehouse || '';
                    const warehouseB = b.warehouse || '';
                    const warehouseCompare = warehouseA.localeCompare(warehouseB);
                    
                    if (warehouseCompare !== 0) {
                        return warehouseCompare;
                    }
                    
                    // Si los almacenes son iguales, comparar pallets
                    const palletA = a.palletId ? a.palletId.toString() : '';
                    const palletB = b.palletId ? b.palletId.toString() : '';
                    return palletA.localeCompare(palletB);
                });
                
                // Agrupar por almacén y ID de pallet para el balance total
                const groupedRecords = {};
                product.records.forEach(record => {
                    const warehouse = record.warehouse || 'N/A';
                    const palletId = record.palletId ? record.palletId.toString() : 'N/A';
                    const key = `${warehouse}-${palletId}`;
                    
                    if (!groupedRecords[key]) {
                        groupedRecords[key] = {
                            warehouse: warehouse,
                            palletId: palletId,
                            totalInventory: 0
                        };
                    }
                    groupedRecords[key].totalInventory += record.physicalInventory;
                });
                
                sortedRecords.forEach(record => {
                    const row = document.createElement('tr');
                    
                    // Almacén
                    const warehouseCell = document.createElement('td');
                    warehouseCell.textContent = record.warehouse || 'N/A';
                    row.appendChild(warehouseCell);
                    
                    // ID de Pallet
                    const palletIdCell = document.createElement('td');
                    palletIdCell.textContent = record.palletId || 'N/A';
                    row.appendChild(palletIdCell);
                    
                    // Inventario Físico
                    const physicalInventoryCell = document.createElement('td');
                    physicalInventoryCell.textContent = InventorySystem.Utils.formatNumber(record.physicalInventory);
                    if (record.physicalInventory < 0) {
                        physicalInventoryCell.style.color = 'red';
                        physicalInventoryCell.style.fontWeight = 'bold';
                    }
                    row.appendChild(physicalInventoryCell);
                    
                    // Disponible
                    const availableCell = document.createElement('td');
                    availableCell.textContent = InventorySystem.Utils.formatNumber(record.available);
                    row.appendChild(availableCell);
                    
                    // Balance Total por Almacén
                    const warehouse = record.warehouse || 'N/A';
                    const palletId = record.palletId ? record.palletId.toString() : 'N/A';
                    const key = `${warehouse}-${palletId}`;
                    
                    const balanceCell = document.createElement('td');
                    if (groupedRecords[key]) {
                        balanceCell.textContent = InventorySystem.Utils.formatNumber(groupedRecords[key].totalInventory);
                        if (groupedRecords[key].totalInventory < 0) {
                            balanceCell.style.color = 'red';
                            balanceCell.style.fontWeight = 'bold';
                        }
                    } else {
                        balanceCell.textContent = 'N/A';
                    }
                    row.appendChild(balanceCell);
                    
                    tableBody.appendChild(row);
                });
                
                // Configurar eventos de cierre
                modal.querySelector('.close-btn').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.querySelector('.close-button').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
                
                // Agregar modal al body
                document.body.appendChild(modal);
            } catch (error) {
                console.error('Error al mostrar detalle del producto:', error);
                InventorySystem.Utils.showError('Ha ocurrido un error al mostrar el detalle del producto');
            }
        }
        
        /**
         * Filtrar análisis por pallet
         */
        function filterPalletAnalysis() {
            // Limpiar vista primero
            resetInventoryView();
            
            const searchTerm = palletSearch.value.toLowerCase();
            const palletDetails = InventorySystem.Inventory.getPalletDetails();
            
            // Convertir objeto palletDetails a array y filtrar
            const filteredPallets = Object.values(palletDetails).filter(pallet => 
                searchTerm === '' || 
                pallet.palletId.toString().toLowerCase().includes(searchTerm)
            );
            
            // Ordenar por número de productos negativos (descendente)
            filteredPallets.sort((a, b) => b.negativeProducts - a.negativeProducts);
            
            // Actualizar datos filtrados
            InventorySystem.Inventory.setFilteredData('pallet', filteredPallets);
            
            // Restablecer a la primera página
            currentPage.pallet = 1;
            
            // Renderizar tabla y paginación
            renderPalletTable(filteredPallets);
            renderPagination(palletPagination, filteredPallets.length, currentPage.pallet, 'pallet');
        }
        
        /**
         * Renderizar tabla de análisis por pallet
         * @param {Array} filteredData - Datos filtrados
         */
        function renderPalletTable(filteredData) {
            palletAnalysisTable.innerHTML = '';
            
            const startIndex = (currentPage.pallet - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
            
            if (filteredData.length === 0) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.textContent = 'No se encontraron pallets';
                cell.style.textAlign = 'center';
                row.appendChild(cell);
                palletAnalysisTable.appendChild(row);
                return;
            }
            
            for (let i = startIndex; i < endIndex; i++) {
                const pallet = filteredData[i];
                const row = document.createElement('tr');
                
                // ID de Pallet
                const palletIdCell = document.createElement('td');
                palletIdCell.textContent = pallet.palletId;
                palletIdCell.setAttribute('data-label', 'ID de Pallet');
                row.appendChild(palletIdCell);
                
                // Número de Productos
                const productsCell = document.createElement('td');
                productsCell.textContent = pallet.products.length;
                productsCell.setAttribute('data-label', 'Número de Productos');
                row.appendChild(productsCell);
                
                // Productos Negativos
                const negativeProductsCell = document.createElement('td');
                if (pallet.negativeProducts > 0) {
                    const badge = document.createElement('span');
                    badge.classList.add('badge', 'badge-danger');
                    badge.textContent = pallet.negativeProducts;
                    negativeProductsCell.appendChild(badge);
                } else {
                    negativeProductsCell.textContent = '0';
                }
                negativeProductsCell.setAttribute('data-label', 'Productos Negativos');
                row.appendChild(negativeProductsCell);
                
                // Inventario Total
                const totalInventoryCell = document.createElement('td');
                totalInventoryCell.textContent = InventorySystem.Utils.formatNumber(pallet.totalInventory);
                if (pallet.totalInventory < 0) {
                    totalInventoryCell.style.color = 'red';
                    totalInventoryCell.style.fontWeight = 'bold';
                }
                totalInventoryCell.setAttribute('data-label', 'Inventario Total');
                row.appendChild(totalInventoryCell);
                
                // Acciones
                const actionsCell = document.createElement('td');
                const detailsBtn = document.createElement('button');
                detailsBtn.classList.add('btn');
                detailsBtn.textContent = 'Ver Detalle';
                detailsBtn.addEventListener('click', () => {
                    showPalletDetails(pallet.palletId);
                });
                actionsCell.appendChild(detailsBtn);
                actionsCell.setAttribute('data-label', 'Acciones');
                row.appendChild(actionsCell);
                
                palletAnalysisTable.appendChild(row);
            }
        }
        
        /**
         * Mostrar detalles de un pallet específico
         * @param {string} palletId - ID del pallet
         */
        function showPalletDetails(palletId) {
            // Filtrar para mostrar solo los productos de este pallet
            allSearch.value = '';
            allWarehouseFilter.value = '';
            allStatusFilter.value = '';
            allSearch.value = palletId;
            
            // Cambiar a la pestaña de inventario completo
            switchTab('all-inventory');
            
            // Filtrar
            filterAllInventory();
        }
        
        /**
         * Filtrar inventario completo
         */
        function filterAllInventory() {
            // Limpiar vista primero
            resetInventoryView();
            
            const searchTerm = allSearch.value.toLowerCase();
            const warehouseFilter = allWarehouseFilter.value;
            const statusFilter = allStatusFilter.value;
            const inventoryData = InventorySystem.Inventory.getInventoryData();
            
            // Filtrar productos
            const filteredInventory = inventoryData.filter(item => {
                // Filtro de búsqueda
                const matchesSearch = 
                    searchTerm === '' || 
                    item.code.toString().toLowerCase().includes(searchTerm) || 
                    (item.name && item.name.toLowerCase().includes(searchTerm)) || 
                    (item.palletId && item.palletId.toString().toLowerCase().includes(searchTerm));
                
                // Filtro de almacén
                const matchesWarehouse = warehouseFilter === '' || item.warehouse === warehouseFilter;
                
                // Filtro de estado
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
            
            // Actualizar datos filtrados
            InventorySystem.Inventory.setFilteredData('all', filteredInventory);
            
            // Restablecer a la primera página
            currentPage.all = 1;
            
            // Renderizar tabla y paginación
            renderAllTable(filteredInventory);
            renderPagination(allPagination, filteredInventory.length, currentPage.all, 'all');
        }
        
        /**
         * Renderizar tabla de inventario completo
         * @param {Array} filteredData - Datos filtrados
         */
        function renderAllTable(filteredData) {
            allInventoryTable.innerHTML = '';
            
            const startIndex = (currentPage.all - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length);
            
            if (filteredData.length === 0) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.textContent = 'No se encontraron productos';
                cell.style.textAlign = 'center';
                row.appendChild(cell);
                allInventoryTable.appendChild(row);
                return;
            }
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = filteredData[i];
                const row = document.createElement('tr');
                
                // Agregar clase si el inventario es negativo
                if (item.physicalInventory < 0) {
                    row.classList.add('negative-row');
                }
                
                // Código
                const codeCell = document.createElement('td');
                codeCell.textContent = item.code;
                codeCell.setAttribute('data-label', 'Código');
                row.appendChild(codeCell);
                
                // Nombre
                const nameCell = document.createElement('td');
                nameCell.textContent = item.name || '';
                nameCell.setAttribute('data-label', 'Nombre');
                row.appendChild(nameCell);
                
                // Almacén
                const warehouseCell = document.createElement('td');
                warehouseCell.textContent = item.warehouse || '';
                warehouseCell.setAttribute('data-label', 'Almacén');
                row.appendChild(warehouseCell);
                
                // ID de Pallet
                const palletIdCell = document.createElement('td');
                palletIdCell.textContent = item.palletId || 'N/A';
                palletIdCell.setAttribute('data-label', 'ID de Pallet');
                row.appendChild(palletIdCell);
                
                // Inventario Físico
                const physicalInventoryCell = document.createElement('td');
                physicalInventoryCell.textContent = InventorySystem.Utils.formatNumber(item.physicalInventory);
                if (item.physicalInventory < 0) {
                    physicalInventoryCell.style.color = 'red';
                    physicalInventoryCell.style.fontWeight = 'bold';
                }
                physicalInventoryCell.setAttribute('data-label', 'Inventario Físico');
                row.appendChild(physicalInventoryCell);
                
                // Disponible
                const availableCell = document.createElement('td');
                availableCell.textContent = InventorySystem.Utils.formatNumber(item.available);
                availableCell.setAttribute('data-label', 'Disponible');
                row.appendChild(availableCell);
                
                allInventoryTable.appendChild(row);
            }
        }
        
        /**
         * Renderizar paginación
         * @param {HTMLElement} paginationElement - Elemento de paginación
         * @param {number} totalItems - Total de elementos
         * @param {number} currentPageNum - Página actual
         * @param {string} pageType - Tipo de página (negative, pallet, all)
         */
        function renderPagination(paginationElement, totalItems, currentPageNum, pageType) {
            paginationElement.innerHTML = '';
            
            if (totalItems === 0) {
                return;
            }
            
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            
            // Botón de página anterior
            if (totalPages > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.innerHTML = '«';
                prevBtn.disabled = currentPageNum === 1;
                prevBtn.addEventListener('click', () => {
                    if (currentPageNum > 1) {
                        currentPage[pageType] = currentPageNum - 1;
                        refreshPageContent(pageType);
                    }
                });
                paginationElement.appendChild(prevBtn);
                
                // Botones de número de página
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.textContent = i;
                    if (i === currentPageNum) {
                        pageBtn.classList.add('active');
                    }
                    pageBtn.addEventListener('click', () => {
                        currentPage[pageType] = i;
                        refreshPageContent(pageType);
                    });
                    paginationElement.appendChild(pageBtn);
                }
                
                // Botón de página siguiente
                const nextBtn = document.createElement('button');
                nextBtn.innerHTML = '»';
                nextBtn.disabled = currentPageNum === totalPages;
                nextBtn.addEventListener('click', () => {
                    if (currentPageNum < totalPages) {
                        currentPage[pageType] = currentPageNum + 1;
                        refreshPageContent(pageType);
                    }
                });
                paginationElement.appendChild(nextBtn);
            }
        }
        
        /**
         * Actualizar contenido de página según el tipo
         * @param {string} pageType - Tipo de página (negative, pallet, all)
         */
        function refreshPageContent(pageType) {
            const filteredData = InventorySystem.Inventory.getFilteredData();
            
            if (pageType === 'negative') {
                renderConsolidatedNegativeTable(filteredData.negative);
                renderPagination(negativePagination, filteredData.negative.length, currentPage.negative, 'negative');
            } else if (pageType === 'pallet') {
                renderPalletTable(filteredData.pallet);
                renderPagination(palletPagination, filteredData.pallet.length, currentPage.pallet, 'pallet');
            } else if (pageType === 'all') {
                renderAllTable(filteredData.all);
                renderPagination(allPagination, filteredData.all.length, currentPage.all, 'all');
            }
        }
        
        /**
         * Actualizar filtros de almacén
         */
        function updateWarehouseFilters() {
            // Obtener almacenes únicos
            const warehouses = new Set();
            const inventoryData = InventorySystem.Inventory.getInventoryData();
            
            inventoryData.forEach(item => {
                if (item.warehouse) {
                    warehouses.add(item.warehouse);
                }
            });
            
            // Actualizar selectores de filtro
            const warehouseOptions = Array.from(warehouses).sort();
            
            // Filtro de almacén para inventario negativo
            negativeWarehouseFilter.innerHTML = '<option value="">Todos los almacenes</option>';
            warehouseOptions.forEach(warehouse => {
                const option = document.createElement('option');
                option.textContent = warehouse;
                negativeWarehouseFilter.appendChild(option);
            });
            
            // Filtro de almacén para todo el inventario
            allWarehouseFilter.innerHTML = '<option value="">Todos los almacenes</option>';
            warehouseOptions.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse;
                option.textContent = warehouse;
                allWarehouseFilter.appendChild(option);
            });
        }
        
        /**
         * Limpiar datos y contenedores antes de mostrar nueva información
         */
        function resetInventoryView() {
            // Limpiar tablas
            if (negativeInventoryTable) negativeInventoryTable.innerHTML = '';
            if (palletAnalysisTable) palletAnalysisTable.innerHTML = '';
            if (allInventoryTable) allInventoryTable.innerHTML = '';
            
            // Limpiar paginación
            if (negativePagination) negativePagination.innerHTML = '';
            if (palletPagination) palletPagination.innerHTML = '';
            if (allPagination) allPagination.innerHTML = '';
            
            // Limpiar gráficos si estamos en la pestaña de dashboard
            const dashboardContent = document.getElementById('dashboard-content');
            if (dashboardContent && dashboardContent.classList.contains('active')) {
                // Limpiar gráficos existentes
                destroyCharts();
                
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
            }
            
            // Eliminar cualquier modal que pudiera estar abierto
            const existingModals = document.querySelectorAll('.modal');
            existingModals.forEach(modal => {
                document.body.removeChild(modal);
            });
        }
        
        /**
         * Destruir todos los gráficos existentes
         */
        function destroyCharts() {
            const chartIds = [
                'inventory-chart', 'warehouse-chart', 'negative-chart',
                'main-chart', 'detail-chart', 'in-order-chart'
            ];
            
            chartIds.forEach(chartId => {
                const chartInstance = Chart.getChart(chartId);
                if (chartInstance) {
                    chartInstance.destroy();
                }
            });
        }
        
        /**
         * Obtener paginación actual
         */
        function getCurrentPage() {
            return currentPage;
        }
        
        /**
         * Actualizar paginación
         */
        function setCurrentPage(type, page) {
            currentPage[type] = page;
        }
        
        // Exportar funciones públicas
        return {
            init,
            switchTab,
            filterNegativeInventory,
            filterPalletAnalysis,
            filterAllInventory,
            updateWarehouseFilters,
            resetInventoryView,
            getCurrentPage,
            setCurrentPage,
            renderPagination,
            refreshPageContent
        };
    })();
})(window.InventorySystem || {});