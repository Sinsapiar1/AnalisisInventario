/**
 * Módulo de interfaz de usuario para el sistema
 */

// Esperar a que Utils esté disponible
(function(InventorySystem) {
    // Módulo de UI
    InventorySystem.UI = (function() {
        // Variables privadas
        const PAGE_SIZES = [10, 25, 50, 100];
        let pageSize = 25;
        let currentPage = {
            negative: 1,
            pallet: 1,
            all: 1
        };

        // Orden de cada tabla. key null = orden original del archivo
        const sortState = {
            negative: { key: 'totalNegative', dir: 'asc' },
            pallet: { key: 'negativeProducts', dir: 'desc' },
            all: { key: null, dir: 'asc' }
        };

        const fmt = n => InventorySystem.Utils.formatNumber(n);
        const t = (key, vars) => InventorySystem.I18n.t(key, vars);
        const tn = (key, count, vars) => InventorySystem.I18n.tn(key, count, vars);

        // Columnas de cada tabla: de aquí salen los encabezados, las celdas y el orden
        const COLUMNS = {
            negative: [
                { key: 'code', label: 'col.code', value: p => p.code },
                { key: 'name', label: 'col.name', value: p => p.name || '' },
                { key: 'warehouses', label: 'col.warehouses', value: p => Array.from(p.warehouses).sort().join(', ') },
                { key: 'palletCount', label: 'col.pallets', numeric: true, value: p => p.palletCount },
                { key: 'totalNegative', label: 'col.balance', numeric: true, value: p => p.totalNegative, signed: true },
                { key: 'totalAvailable', label: 'col.available', numeric: true, value: p => p.totalAvailable, signed: true },
                { key: null, label: 'col.detail', action: p => ({ text: t('action.viewDetail'), label: t('action.viewDetailOf', { code: p.code }), run: () => showProductDetailedView(p.code) }) }
            ],
            pallet: [
                { key: 'palletId', label: 'col.palletId', value: p => p.palletId },
                { key: 'productCount', label: 'col.products', numeric: true, value: p => p.products.length },
                { key: 'negativeProducts', label: 'col.negativeProducts', numeric: true, value: p => p.negativeProducts, badge: true },
                { key: 'totalInventory', label: 'col.totalInventory', numeric: true, value: p => p.totalInventory, signed: true },
                { key: null, label: 'col.detail', action: p => ({ text: t('action.viewProducts'), label: t('action.viewProductsOf', { id: p.palletId }), run: () => showPalletDetails(p.palletId) }) }
            ],
            all: [
                { key: 'code', label: 'col.code', value: i => i.code },
                { key: 'name', label: 'col.name', value: i => i.name || '' },
                { key: 'warehouse', label: 'col.warehouse', value: i => i.warehouse || '' },
                { key: 'palletId', label: 'col.palletId', value: i => i.palletId || '', empty: 'value.noPallet' },
                { key: 'physicalInventory', label: 'col.physical', numeric: true, value: i => i.physicalInventory, signed: true },
                { key: 'available', label: 'col.available', numeric: true, value: i => i.available, signed: true }
            ]
        };

        // Elementos DOM para pestañas
        const tabs = document.querySelectorAll('.tab');

        // Tablas
        const tables = {
            negative: document.getElementById('negative-inventory-table'),
            pallet: document.getElementById('pallet-analysis-table'),
            all: document.getElementById('all-inventory-table')
        };
        const bodies = {
            negative: tables.negative.querySelector('tbody'),
            pallet: tables.pallet.querySelector('tbody'),
            all: tables.all.querySelector('tbody')
        };
        const paginations = {
            negative: document.getElementById('negative-pagination'),
            pallet: document.getElementById('pallet-pagination'),
            all: document.getElementById('all-pagination')
        };
        const counts = {
            negative: document.getElementById('negative-count'),
            pallet: document.getElementById('pallet-count'),
            all: document.getElementById('all-count')
        };

        // Elementos de búsqueda y filtro
        const negativeSearch = document.getElementById('negative-search');
        const palletSearch = document.getElementById('pallet-search');
        const allSearch = document.getElementById('all-search');
        const negativeWarehouseFilter = document.getElementById('negative-warehouse-filter');
        const allWarehouseFilter = document.getElementById('all-warehouse-filter');
        const allStatusFilter = document.getElementById('all-status-filter');

        // Instancias de multi-select
        let negativeWarehouseMultiSelect = null;
        let allWarehouseMultiSelect = null;

        /**
         * Inicializar el módulo de UI
         */
        function init() {
            try {
                const saved = parseInt(localStorage.getItem('pageSize'), 10);
                if (PAGE_SIZES.indexOf(saved) !== -1) pageSize = saved;
            } catch (e) { /* sin acceso a localStorage */ }

            setupTabEventListeners();
            setupSearchFilterEventListeners();
            setupPageSizeSelectors();
            Object.keys(COLUMNS).forEach(renderTableHead);

            // Cerrar el detalle abierto con Escape
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') closeModals();
            });
        }

        /**
         * Configurar event listeners para las pestañas
         */
        function setupTabEventListeners() {
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    switchTab(tab.getAttribute('data-tab'));
                });
            });
        }

        /**
         * Configurar event listeners para búsqueda y filtros
         */
        function setupSearchFilterEventListeners() {
            const debounce = InventorySystem.Utils.debounce;
            // Cada filtro limpia la vista completa, así que solo se aplica si su pestaña sigue abierta
            const whenActive = (tabId, fn) => debounce(() => {
                const content = document.getElementById(tabId + '-content');
                if (content && content.classList.contains('active')) fn();
            }, 180);
            negativeSearch.addEventListener('input', whenActive('negative-inventory', filterNegativeInventory));
            palletSearch.addEventListener('input', whenActive('pallet-analysis', filterPalletAnalysis));
            allSearch.addEventListener('input', whenActive('all-inventory', filterAllInventory));

            // El filtro de almacén lo maneja el multi-select (ver updateWarehouseFilters)
            allStatusFilter.addEventListener('change', filterAllInventory);
        }

        /**
         * Selectores de filas por página (uno por tabla, sincronizados)
         */
        function setupPageSizeSelectors() {
            const selects = document.querySelectorAll('.page-size-select');
            selects.forEach(select => {
                select.innerHTML = '';
                PAGE_SIZES.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = t('filter.pageSize', { n: size });
                    select.appendChild(option);
                });
                select.value = pageSize;
                select.addEventListener('change', () => {
                    pageSize = parseInt(select.value, 10);
                    try { localStorage.setItem('pageSize', pageSize); } catch (e) { /* sin acceso */ }
                    selects.forEach(other => { other.value = pageSize; });
                    Object.keys(currentPage).forEach(type => { currentPage[type] = 1; });
                    const type = select.getAttribute('data-table');
                    refreshPageContent(type);
                });
            });
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
                const active = tab.getAttribute('data-tab') === tabId;
                tab.classList.toggle('active', active);
                tab.setAttribute('aria-selected', active ? 'true' : 'false');
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

        /* ---------- Orden ---------- */

        function compareValues(a, b) {
            const aNum = typeof a === 'number';
            const bNum = typeof b === 'number';
            if (aNum && bNum) return a - b;
            return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
        }

        /**
         * Ordenar una lista según el estado de orden de su tabla
         */
        function applySort(type, list) {
            const state = sortState[type];
            if (!state.key) return list;
            const column = COLUMNS[type].find(c => c.key === state.key);
            if (!column) return list;
            const factor = state.dir === 'asc' ? 1 : -1;
            return list
                .map((item, index) => ({ item, index, value: column.value(item) }))
                .sort((a, b) => factor * compareValues(a.value, b.value) || a.index - b.index)
                .map(entry => entry.item);
        }

        function toggleSort(type, key) {
            const state = sortState[type];
            const column = COLUMNS[type].find(c => c.key === key);
            if (state.key === key) {
                state.dir = state.dir === 'asc' ? 'desc' : 'asc';
            } else {
                state.key = key;
                // Los números empiezan de mayor a menor; los textos, de la A a la Z
                state.dir = column && column.numeric ? 'desc' : 'asc';
            }
            if (type === 'negative') filterNegativeInventory();
            else if (type === 'pallet') filterPalletAnalysis();
            else filterAllInventory();

            // Los encabezados se redibujan: devolver el foco al botón pulsado
            const button = tables[type].querySelector('th[data-key="' + key + '"] .sort-btn');
            if (button) button.focus();
        }

        /**
         * Dibujar los encabezados de una tabla con sus botones de orden
         */
        function renderTableHead(type) {
            const headRow = tables[type].querySelector('thead tr');
            const state = sortState[type];
            headRow.innerHTML = '';

            COLUMNS[type].forEach(column => {
                const th = document.createElement('th');
                th.scope = 'col';
                if (column.numeric) th.classList.add('num');

                if (!column.key) {
                    const hidden = document.createElement('span');
                    hidden.className = 'sr-only';
                    hidden.textContent = t(column.label);
                    th.appendChild(hidden);
                } else {
                    const active = state.key === column.key;
                    th.setAttribute('data-key', column.key);
                    th.setAttribute('aria-sort', active ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none');

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'sort-btn' + (active ? ' is-active' : '');
                    button.title = t('col.sortBy', { column: t(column.label).toLowerCase() });

                    const text = document.createElement('span');
                    text.textContent = t(column.label);
                    const arrow = document.createElement('i');
                    arrow.setAttribute('aria-hidden', 'true');
                    arrow.className = 'fas ' + (active ? (state.dir === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down') : 'fa-sort');

                    button.appendChild(text);
                    button.appendChild(arrow);
                    button.addEventListener('click', () => toggleSort(type, column.key));
                    th.appendChild(button);
                }
                headRow.appendChild(th);
            });
        }

        /* ---------- Tablas ---------- */

        /**
         * Dibujar las filas de la página actual de una tabla
         * @param {string} type - negative, pallet o all
         * @param {Array} data - Datos ya filtrados y ordenados
         * @param {boolean} hasFilters - Si hay búsqueda o filtros activos
         */
        function renderTable(type, data) {
            const body = bodies[type];
            const columns = COLUMNS[type];
            body.innerHTML = '';
            renderTableHead(type);

            if (data.length === 0) {
                const row = document.createElement('tr');
                row.className = 'empty-row';
                const cell = document.createElement('td');
                cell.colSpan = columns.length;
                cell.textContent = t('empty.' + type + (hasActiveFilters(type) ? '.filtered' : ''));
                row.appendChild(cell);
                body.appendChild(row);
                return;
            }

            const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
            if (currentPage[type] > totalPages) currentPage[type] = totalPages;
            const startIndex = (currentPage[type] - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, data.length);
            const fragment = document.createDocumentFragment();

            for (let i = startIndex; i < endIndex; i++) {
                const item = data[i];
                const row = document.createElement('tr');

                if (type === 'negative') {
                    row.classList.add('negative-row');
                    row.setAttribute('data-product-code', item.code);
                } else if (type === 'all' && item.physicalInventory < 0) {
                    row.classList.add('negative-row');
                }

                columns.forEach(column => {
                    const cell = document.createElement('td');
                    cell.setAttribute('data-label', t(column.label));

                    if (column.action) {
                        const action = column.action(item);
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'btn btn-quiet';
                        button.textContent = action.text;
                        button.setAttribute('aria-label', action.label);
                        button.addEventListener('click', action.run);
                        cell.classList.add('cell-action');
                        cell.appendChild(button);
                    } else {
                        const value = column.value(item);
                        if (column.numeric) {
                            cell.classList.add('num');
                            if (column.badge && value > 0) {
                                const badge = document.createElement('span');
                                badge.className = 'badge badge-danger';
                                badge.textContent = fmt(value);
                                cell.appendChild(badge);
                            } else {
                                cell.textContent = fmt(value);
                                if (column.signed && value < 0) cell.classList.add('is-negative');
                            }
                        } else if (value === '' && column.empty) {
                            cell.textContent = t(column.empty);
                            cell.classList.add('is-muted');
                        } else {
                            cell.textContent = value;
                        }
                    }
                    row.appendChild(cell);
                });

                fragment.appendChild(row);
            }
            body.appendChild(fragment);
        }

        function hasActiveFilters(type) {
            if (type === 'negative') {
                return negativeSearch.value.trim() !== '' || getSelectedNegativeWarehouses().length > 0;
            }
            if (type === 'pallet') return palletSearch.value.trim() !== '';
            return allSearch.value.trim() !== '' || allStatusFilter.value !== '' || getSelectedAllWarehouses().length > 0;
        }

        /**
         * Guardar, dibujar y paginar el resultado de un filtro
         */
        function showResults(type, list) {
            const sorted = applySort(type, list);
            InventorySystem.Inventory.setFilteredData(type, sorted);
            currentPage[type] = 1;
            renderTable(type, sorted);
            renderPagination(paginations[type], sorted.length, currentPage[type], type);
            return sorted;
        }

        /**
         * Filtrar inventario negativo
         */
        function filterNegativeInventory() {
            try {
                resetInventoryView(); // Limpiar la vista antes de filtrar

                const searchTerm = negativeSearch.value.trim().toLowerCase();

                if (!window.productBalances) {
                    showResults('negative', []);
                    return;
                }

                // Paso 1: balances negativos por código + almacén
                let initialNegativeProducts = Object.values(window.productBalances)
                    .filter(pb => InventorySystem.Utils.isValidNumber(pb.totalInventory) && parseFloat(pb.totalInventory) < 0);

                // Paso 2: filtros de la UI (almacenes y búsqueda)
                const selectedWarehouses = getSelectedNegativeWarehouses();
                if (selectedWarehouses.length > 0) {
                    initialNegativeProducts = initialNegativeProducts.filter(pb =>
                        selectedWarehouses.includes(pb.warehouse)
                    );
                }

                initialNegativeProducts = initialNegativeProducts.filter(pb =>
                    searchTerm === '' ||
                    String(pb.code).toLowerCase().includes(searchTerm) ||
                    String(pb.name || '').toLowerCase().includes(searchTerm)
                );

                // Paso 3: consolidar por código de producto
                const consolidatedProductsMap = new Map();

                initialNegativeProducts.forEach(pbProduct => {
                    const code = pbProduct.code;
                    let consolidated = consolidatedProductsMap.get(code);

                    if (!consolidated) {
                        consolidated = {
                            code: code,
                            name: pbProduct.name,
                            totalNegative: 0,
                            totalAvailable: 0,
                            warehouses: new Set(),
                            palletIds: new Set(),
                            palletCount: 0,
                            records: []
                        };
                        consolidatedProductsMap.set(code, consolidated);
                    }

                    consolidated.totalNegative += pbProduct.totalInventory;
                    consolidated.warehouses.add(pbProduct.warehouse);

                    if (pbProduct.records && Array.isArray(pbProduct.records)) {
                        pbProduct.records.forEach(record => {
                            consolidated.records.push(record);
                            if (InventorySystem.Utils.isValidNumber(record.available)) {
                                consolidated.totalAvailable += parseFloat(record.available);
                            }
                            if (record.palletId) {
                                consolidated.palletIds.add(record.palletId);
                            }
                        });
                    }
                });

                const consolidatedList = Array.from(consolidatedProductsMap.values())
                    .map(prod => {
                        prod.palletCount = prod.palletIds.size;
                        delete prod.palletIds;
                        return prod;
                    })
                    .filter(product => InventorySystem.Utils.isValidNumber(product.totalNegative) && parseFloat(product.totalNegative) < 0);

                // Fuente de datos para la tabla y para la exportación consolidada
                window.currentNegativeProducts = showResults('negative', consolidatedList);

            } catch (error) {
                console.error('Error en filterNegativeInventory:', error);
            }
        }

        /* ---------- Detalle de producto ---------- */

        let lastFocused = null;

        function closeModals() {
            const open = document.querySelectorAll('.modal');
            if (open.length === 0) return;
            open.forEach(modal => {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            });
            document.body.classList.remove('modal-open');
            if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
            lastFocused = null;
        }

        /**
         * Mostrar vista detallada de un producto
         * @param {string} productCode - Código del producto
         */
        function showProductDetailedView(productCode) {
            try {
                const filteredData = InventorySystem.Inventory.getFilteredData().negative;
                const product = filteredData.find(p => p.code === productCode);

                if (!product) {
                    console.error('Producto no encontrado:', productCode);
                    return;
                }

                lastFocused = document.activeElement;

                const template = document.getElementById('product-detail-modal-template');
                const modal = document.importNode(template.content, true).querySelector('.modal');

                InventorySystem.I18n.applyStatic(modal);
                modal.querySelector('.product-title').textContent = product.name || t('value.noName');
                modal.querySelector('.product-code').textContent = t('detail.code', { code: product.code });

                // Resumen
                const summary = modal.querySelector('.product-summary');
                const summaryItems = [
                    { label: t('detail.balance'), value: fmt(product.totalNegative), isNegative: true },
                    { label: t('detail.available'), value: fmt(product.totalAvailable) },
                    { label: t('col.warehouses'), value: product.warehouses.size },
                    { label: t('col.pallets'), value: product.palletCount }
                ];

                summaryItems.forEach(item => {
                    const summaryItem = document.createElement('div');
                    summaryItem.className = 'summary-item';

                    const label = document.createElement('div');
                    label.className = 'summary-label';
                    label.textContent = item.label;

                    const value = document.createElement('div');
                    value.className = 'summary-value' + (item.isNegative ? ' is-negative' : '');
                    value.textContent = item.value;

                    summaryItem.appendChild(label);
                    summaryItem.appendChild(value);
                    summary.appendChild(summaryItem);
                });

                // Tabla de registros: por almacén y luego por pallet
                const tableBody = modal.querySelector('.detail-table tbody');
                const sortedRecords = [...product.records].sort((a, b) =>
                    compareValues(a.warehouse || '', b.warehouse || '') ||
                    compareValues(a.palletId ? String(a.palletId) : '', b.palletId ? String(b.palletId) : '')
                );

                // Balance por almacén + pallet
                const groupedRecords = {};
                const groupKey = record => (record.warehouse || 'N/A') + '-' + (record.palletId ? record.palletId.toString() : 'N/A');
                product.records.forEach(record => {
                    const key = groupKey(record);
                    groupedRecords[key] = (groupedRecords[key] || 0) + record.physicalInventory;
                });

                sortedRecords.forEach(record => {
                    const row = document.createElement('tr');
                    const addCell = (label, text, options) => {
                        const cell = document.createElement('td');
                        cell.setAttribute('data-label', label);
                        cell.textContent = text;
                        if (options && options.numeric) cell.classList.add('num');
                        if (options && options.negative) cell.classList.add('is-negative');
                        if (options && options.muted) cell.classList.add('is-muted');
                        row.appendChild(cell);
                    };
                    const balance = groupedRecords[groupKey(record)];

                    addCell(t('col.warehouse'), record.warehouse || t('value.noWarehouse'), { muted: !record.warehouse });
                    addCell(t('col.palletId'), record.palletId || t('value.noPallet'), { muted: !record.palletId });
                    addCell(t('col.physical'), fmt(record.physicalInventory), { numeric: true, negative: record.physicalInventory < 0 });
                    addCell(t('col.available'), fmt(record.available), { numeric: true, negative: record.available < 0 });
                    addCell(t('col.palletBalance'), fmt(balance), { numeric: true, negative: balance < 0 });

                    tableBody.appendChild(row);
                });

                // Cierre
                modal.querySelector('.close-btn').addEventListener('click', closeModals);
                modal.querySelector('.close-button').addEventListener('click', closeModals);
                modal.addEventListener('click', e => {
                    if (e.target === modal) closeModals();
                });

                document.body.appendChild(modal);
                document.body.classList.add('modal-open');
                modal.querySelector('.close-btn').focus();
            } catch (error) {
                console.error('Error al mostrar detalle del producto:', error);
                InventorySystem.Utils.showError(t('detail.error'));
            }
        }

        /**
         * Filtrar análisis por pallet
         */
        function filterPalletAnalysis() {
            resetInventoryView();

            const searchTerm = palletSearch.value.trim().toLowerCase();
            const palletDetails = InventorySystem.Inventory.getPalletDetails();

            const filteredPallets = Object.values(palletDetails).filter(pallet =>
                searchTerm === '' ||
                pallet.palletId.toString().toLowerCase().includes(searchTerm)
            );

            showResults('pallet', filteredPallets);
        }

        /**
         * Mostrar los productos de un pallet en la pestaña de inventario completo
         * @param {string} palletId - ID del pallet
         */
        function showPalletDetails(palletId) {
            allStatusFilter.value = '';
            if (allWarehouseMultiSelect && typeof allWarehouseMultiSelect.clearSelection === 'function') {
                allWarehouseMultiSelect.clearSelection();
            }
            allSearch.value = palletId;

            // switchTab ya aplica el filtro
            switchTab('all-inventory');
            allSearch.focus();
        }

        /**
         * Filtrar inventario completo
         */
        function filterAllInventory() {
            resetInventoryView();

            const searchTerm = allSearch.value.trim().toLowerCase();
            const statusFilter = allStatusFilter.value;
            const inventoryData = InventorySystem.Inventory.getInventoryData();
            const selectedWarehouses = getSelectedAllWarehouses();

            const filteredInventory = inventoryData.filter(item => {
                const matchesSearch =
                    searchTerm === '' ||
                    String(item.code).toLowerCase().includes(searchTerm) ||
                    String(item.name || '').toLowerCase().includes(searchTerm) ||
                    (item.palletId && item.palletId.toString().toLowerCase().includes(searchTerm));

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

            showResults('all', filteredInventory);
        }

        /**
         * Renderizar paginación y el contador de resultados
         * @param {HTMLElement} paginationElement - Elemento de paginación
         * @param {number} totalItems - Total de elementos
         * @param {number} currentPageNum - Página actual
         * @param {string} pageType - Tipo de página (negative, pallet, all)
         */
        function renderPagination(paginationElement, totalItems, currentPageNum, pageType) {
            paginationElement.innerHTML = '';

            const countEl = counts[pageType];
            if (countEl) {
                if (totalItems === 0) {
                    countEl.textContent = '';
                } else {
                    const first = (currentPageNum - 1) * pageSize + 1;
                    const last = Math.min(currentPageNum * pageSize, totalItems);
                    countEl.textContent = totalItems <= pageSize
                        ? tn('count.' + pageType, totalItems, { n: fmt(totalItems) })
                        : t('count.range', {
                            first: fmt(first),
                            last: fmt(last),
                            total: tn('count.' + pageType, totalItems, { n: fmt(totalItems) })
                        });
                }
            }

            const totalPages = Math.ceil(totalItems / pageSize);
            if (totalPages <= 1) return;

            const goTo = page => {
                currentPage[pageType] = page;
                refreshPageContent(pageType);
            };
            const addButton = (content, page, options) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = content;
                if (options && options.label) button.setAttribute('aria-label', options.label);
                if (options && options.disabled) button.disabled = true;
                if (page === currentPageNum && !(options && options.nav)) {
                    button.classList.add('active');
                    button.setAttribute('aria-current', 'page');
                }
                button.addEventListener('click', () => goTo(page));
                paginationElement.appendChild(button);
            };
            const addGap = () => {
                const gap = document.createElement('span');
                gap.className = 'pagination-gap';
                gap.textContent = '…';
                paginationElement.appendChild(gap);
            };

            addButton('‹', currentPageNum - 1, { nav: true, label: t('page.prev'), disabled: currentPageNum === 1 });

            // Primera, última y una ventana alrededor de la página actual
            const windowSize = 1;
            let startPage = Math.max(2, currentPageNum - windowSize);
            let endPage = Math.min(totalPages - 1, currentPageNum + windowSize);
            if (currentPageNum <= 3) endPage = Math.min(totalPages - 1, 4);
            if (currentPageNum >= totalPages - 2) startPage = Math.max(2, totalPages - 3);

            addButton('1', 1);
            if (startPage > 2) addGap();
            for (let i = startPage; i <= endPage; i++) addButton(String(i), i);
            if (endPage < totalPages - 1) addGap();
            addButton(String(totalPages), totalPages);

            addButton('›', currentPageNum + 1, { nav: true, label: t('page.next'), disabled: currentPageNum === totalPages });
        }

        /**
         * Actualizar contenido de página según el tipo
         * @param {string} pageType - Tipo de página (negative, pallet, all)
         */
        function refreshPageContent(pageType) {
            if (!COLUMNS[pageType]) return;
            const data = InventorySystem.Inventory.getFilteredData()[pageType] || [];
            renderTable(pageType, data);
            renderPagination(paginations[pageType], data.length, currentPage[pageType], pageType);
        }

        /**
         * Actualizar filtros de almacén
         */
        function updateWarehouseFilters() {
            // Obtener almacenes únicos
            const warehouses = new Set();
            const inventoryData = InventorySystem.Inventory.getInventoryData();
            
            inventoryData.forEach(item => {
                if (InventorySystem.Utils.isValidWarehouse(item.warehouse)) {
                    warehouses.add(item.warehouse);
                }
            });
            
            // Actualizar selectores de filtro
            const warehouseOptions = Array.from(warehouses).sort();
            
            // Llenar el select original (necesario para el multi-select)
            // Filtro de almacén para inventario negativo
            negativeWarehouseFilter.innerHTML = '<option value="">' + t('ms.all') + '</option>';
            warehouseOptions.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse;
                option.textContent = warehouse;
                negativeWarehouseFilter.appendChild(option);
            });
            
            // Filtro de almacén para todo el inventario
            allWarehouseFilter.innerHTML = '<option value="">' + t('ms.all') + '</option>';
            warehouseOptions.forEach(warehouse => {
                const option = document.createElement('option');
                option.value = warehouse;
                option.textContent = warehouse;
                allWarehouseFilter.appendChild(option);
            });
            
            // Inicializar multi-selects si existen los elementos y la clase MultiSelect está disponible
            if (typeof window.MultiSelect !== 'undefined') {
                // Destruir instancias previas si existen
                if (negativeWarehouseMultiSelect) {
                    negativeWarehouseMultiSelect.destroy();
                }
                if (allWarehouseMultiSelect) {
                    allWarehouseMultiSelect.destroy();
                }
                
                // Crear nuevas instancias
                negativeWarehouseMultiSelect = new window.MultiSelect(negativeWarehouseFilter, {
                    placeholder: t('ms.all'),
                    searchPlaceholder: t('ms.search'),
                    selectAllText: t('ms.selectAll'),
                    clearText: t('ms.clear'),
                    applyText: t('ms.apply'),
                    noResultsText: t('ms.none'),
                    allSelectedText: t('ms.all'),
                    countText: count => t('ms.count', { n: count }),
                    maxDisplay: 2,
                    onApply: function(selected) {
                                                filterNegativeInventory();
                    }
                });
                
                allWarehouseMultiSelect = new window.MultiSelect(allWarehouseFilter, {
                    placeholder: t('ms.all'),
                    searchPlaceholder: t('ms.search'),
                    selectAllText: t('ms.selectAll'),
                    clearText: t('ms.clear'),
                    applyText: t('ms.apply'),
                    noResultsText: t('ms.none'),
                    allSelectedText: t('ms.all'),
                    countText: count => t('ms.count', { n: count }),
                    maxDisplay: 2,
                    onApply: function(selected) {
                                                filterAllInventory();
                    }
                });
                
                console.log('✅ Multi-selects de almacén inicializados');
            } else {
                console.warn('⚠️ MultiSelect no está disponible, usando selects normales');
            }
        }
        
        /**
         * Limpiar datos y contenedores antes de mostrar nueva información
         */
        function resetInventoryView() {
            // Limpiar tablas, paginación y contadores
            Object.keys(bodies).forEach(type => {
                bodies[type].innerHTML = '';
                paginations[type].innerHTML = '';
                if (counts[type]) counts[type].textContent = '';
            });
            
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
            closeModals();
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
         * Volver a escribir la interfaz en el idioma elegido, sin perder filtros
         */
        function refreshLanguage() {
            setupPageSizeLabels();
            Object.keys(COLUMNS).forEach(renderTableHead);
            if (!document.body.classList.contains('has-data')) return;

            const selectedNegative = getSelectedNegativeWarehouses();
            const selectedAll = getSelectedAllWarehouses();
            updateWarehouseFilters();
            if (negativeWarehouseMultiSelect) negativeWarehouseMultiSelect.setSelectedValues(selectedNegative);
            if (allWarehouseMultiSelect) allWarehouseMultiSelect.setSelectedValues(selectedAll);

            const activeTab = document.querySelector('.tab.active');
            if (activeTab) switchTab(activeTab.getAttribute('data-tab'));
        }

        function setupPageSizeLabels() {
            document.querySelectorAll('.page-size-select option').forEach(option => {
                option.textContent = t('filter.pageSize', { n: option.value });
            });
        }

        /**
         * Abrir el inventario completo con una búsqueda o filtros ya puestos
         * @param {Object} filters - { search, status, warehouses }
         */
        function showAllInventory(filters) {
            const options = filters || {};
            allSearch.value = options.search !== undefined ? String(options.search) : '';
            allStatusFilter.value = options.status || '';
            if (allWarehouseMultiSelect) {
                allWarehouseMultiSelect.setSelectedValues(options.warehouses || []);
            }
            switchTab('all-inventory');
            scrollToTabs();
        }

        /**
         * Abrir el inventario negativo buscando un producto
         */
        function showNegativeInventory(search) {
            negativeSearch.value = search !== undefined ? String(search) : '';
            if (negativeWarehouseMultiSelect) negativeWarehouseMultiSelect.setSelectedValues([]);
            switchTab('negative-inventory');
            scrollToTabs();
        }

        function scrollToTabs() {
            const tabList = document.querySelector('.tabs');
            if (tabList && tabList.scrollIntoView) tabList.scrollIntoView({ block: 'start' });
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
        
        /**
         * Obtener almacenes seleccionados en el multi-select de inventario negativo
         */
        function getSelectedNegativeWarehouses() {
            if (negativeWarehouseMultiSelect) {
                return negativeWarehouseMultiSelect.getSelectedValues();
            }
            return [];
        }
        
        /**
         * Obtener almacenes seleccionados en el multi-select de inventario completo
         */
        function getSelectedAllWarehouses() {
            if (allWarehouseMultiSelect) {
                return allWarehouseMultiSelect.getSelectedValues();
            }
            return [];
        }
        
        /**
         * Resetear multi-selects (limpiar selección)
         * Se usa en el hard refresh al cargar nuevo archivo
         */
        function resetMultiSelects() {
            try {
                if (negativeWarehouseMultiSelect && typeof negativeWarehouseMultiSelect.clearSelection === 'function') {
                    negativeWarehouseMultiSelect.clearSelection();
                    console.log('  ✓ Multi-select de Inventario Negativo reseteado');
                }
                
                if (allWarehouseMultiSelect && typeof allWarehouseMultiSelect.clearSelection === 'function') {
                    allWarehouseMultiSelect.clearSelection();
                    console.log('  ✓ Multi-select de Inventario Completo reseteado');
                }
            } catch (error) {
                console.warn('⚠️ Error al resetear multi-selects:', error);
                // No es crítico, continuar
            }
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
            refreshPageContent,
            getSelectedNegativeWarehouses,
            getSelectedAllWarehouses,
            resetMultiSelects,
            refreshLanguage,
            showAllInventory,
            showNegativeInventory
        };
    })();
})(window.InventorySystem || {});