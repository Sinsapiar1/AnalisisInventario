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
        let palletDetails = {};
        let filteredData = {
            negative: [],
            pallet: [],
            all: []
        };
        
        // Elementos DOM
        const fileInput = document.getElementById('file-input');
        const fileName = document.getElementById('file-name');
        const uploadBtn = document.getElementById('upload-btn');
        const lastUpdateEl = document.getElementById('last-update');
        
        // Elementos estadísticos
        const totalProducts = document.getElementById('total-products');
        const negativeInventory = document.getElementById('negative-inventory');
        const totalInventoryValue = document.getElementById('total-inventory-value');
        const uniquePallets = document.getElementById('unique-pallets');
        
        /**
         * Inicializar el módulo de inventario
         */
        function init() {
            // Configurar event listeners
            setupEventListeners();
        }
        
        /**
         * Configurar event listeners para inventario
         */
        function setupEventListeners() {
            // Eventos de carga de archivos
            fileInput.addEventListener('change', handleFileSelect);
            uploadBtn.addEventListener('click', uploadFile);
        }
        
        /**
         * Manejar selección de archivo
         * @param {Event} e - Evento de cambio
         */
        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
            } else {
                fileName.textContent = 'Ningún archivo seleccionado';
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
         * Cargar archivo de inventario
         */
        function uploadFile() {
            const file = fileInput.files[0];
            if (!file) {
                InventorySystem.Utils.showError('Por favor, seleccione un archivo');
                return;
            }
            
            InventorySystem.Utils.showLoading(true);
            
            // HARD REFRESH: Limpiar completamente antes de cargar nuevos datos
            performHardRefresh();
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {
                        type: 'array',
                        cellDates: true
                    });
                    
                    // Obtener la primera hoja
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // Convertir a JSON
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                        header: 1,
                        defval: null
                    });
                    
                    // Procesar los datos
                    processInventoryData(jsonData);
                    
                    // Guardar datos en localStorage
                    saveData();
                    
                    // Mostrar éxito
                    InventorySystem.Utils.showSuccess('Archivo cargado exitosamente');
                } catch (error) {
                    console.error('Error al procesar el archivo:', error);
                    InventorySystem.Utils.showError('Error al procesar el archivo');
                } finally {
                    InventorySystem.Utils.showLoading(false);
                }
            };
            
            reader.onerror = function() {
                InventorySystem.Utils.showError('Error al leer el archivo');
                InventorySystem.Utils.showLoading(false);
            };
            
            reader.readAsArrayBuffer(file);
        }
        
        /**
         * Procesar datos de inventario
         * @param {Array} data - Datos del archivo
         */
        function processInventoryData(data) {
    if (!data || data.length < 2) {
        InventorySystem.Utils.showError('El archivo está vacío o no tiene datos suficientes');
        return;
    }
    
    // Obtener encabezados
    const headers = data[0];
    
    // Encontrar índices de columnas importantes
    const columnIndices = {
        code: headers.findIndex(h => h && h.toString().toLowerCase().includes('código')),
        name: headers.findIndex(h => h && h.toString().toLowerCase().includes('nombre del producto')),
        searchName: headers.findIndex(h => h && h.toString().toLowerCase().includes('nombre de búsqueda')),
        warehouse: headers.findIndex(h => h && h.toString().toLowerCase().includes('almacén')),
        palletId: headers.findIndex(h => h && h.toString().toLowerCase().includes('id de pallet')),
        serialNumber: headers.findIndex(h => h && h.toString().toLowerCase().includes('número de serie')),
        physicalInventory: headers.findIndex(h => h && h.toString().toLowerCase().includes('inventario físico')),
        reserved: headers.findIndex(h => h && h.toString().toLowerCase().includes('física reservada')),
        available: headers.findIndex(h => h && h.toString().toLowerCase().includes('física disponible')),
        totalOrder: headers.findIndex(h => h && h.toString().toLowerCase().includes('pedido en total')),
        inOrder: headers.findIndex(h => h && h.toString().toLowerCase().includes('en pedido')),
        reservedOrder: headers.findIndex(h => h && h.toString().toLowerCase().includes('ordenada reservada')),
        totalAvailable: headers.findIndex(h => h && h.toString().toLowerCase().includes('total disponible'))
    };
    
    // Verificar columnas necesarias
    if (columnIndices.code === -1 || columnIndices.physicalInventory === -1) {
        InventorySystem.Utils.showError('El archivo no contiene las columnas necesarias');
        return;
    }
    
    // Procesar filas (saltando la primera que son los encabezados)
    inventoryData = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0 || row[columnIndices.code] === null) {
            continue; // Saltar filas vacías
        }
        
        // Obtener valores de columnas numéricas
        const physicalInventoryVal = columnIndices.physicalInventory !== -1 ? row[columnIndices.physicalInventory] : null;
        const reservedVal = columnIndices.reserved !== -1 ? row[columnIndices.reserved] : null;
        const availableVal = columnIndices.available !== -1 ? row[columnIndices.available] : null;
        const totalOrderVal = columnIndices.totalOrder !== -1 ? row[columnIndices.totalOrder] : null;
        const inOrderVal = columnIndices.inOrder !== -1 ? row[columnIndices.inOrder] : null;
        const reservedOrderVal = columnIndices.reservedOrder !== -1 ? row[columnIndices.reservedOrder] : null;
        const totalAvailableVal = columnIndices.totalAvailable !== -1 ? row[columnIndices.totalAvailable] : null;
        
        const item = {
            id: i,
            code: row[columnIndices.code],
            name: columnIndices.name !== -1 ? row[columnIndices.name] : '',
            searchName: columnIndices.searchName !== -1 ? row[columnIndices.searchName] : '',
            warehouse: columnIndices.warehouse !== -1 ? 
                InventorySystem.Utils.sanitizeWarehouse(row[columnIndices.warehouse]) : '',
            palletId: columnIndices.palletId !== -1 ? row[columnIndices.palletId] : '',
            serialNumber: columnIndices.serialNumber !== -1 ? row[columnIndices.serialNumber] : '',
            physicalInventory: InventorySystem.Utils.isValidNumber(physicalInventoryVal) ? 
                              parseFloat(physicalInventoryVal) : 0,
            reserved: InventorySystem.Utils.isValidNumber(reservedVal) ? 
                     parseFloat(reservedVal) : 0,
            available: InventorySystem.Utils.isValidNumber(availableVal) ? 
                      parseFloat(availableVal) : 0,
            totalOrder: InventorySystem.Utils.isValidNumber(totalOrderVal) ? 
                       parseFloat(totalOrderVal) : 0,
            inOrder: InventorySystem.Utils.isValidNumber(inOrderVal) ? 
                    parseFloat(inOrderVal) : 0,
            reservedOrder: InventorySystem.Utils.isValidNumber(reservedOrderVal) ? 
                          parseFloat(reservedOrderVal) : 0,
            totalAvailable: InventorySystem.Utils.isValidNumber(totalAvailableVal) ? 
                           parseFloat(totalAvailableVal) : 0
        };
        
        inventoryData.push(item);
    }
    
    // Actualizar fecha de última actualización
    lastUpdate = new Date();
    lastUpdateEl.textContent = `Última actualización: ${InventorySystem.Utils.formatDate(lastUpdate)}`;
    
    // Analizar datos
    analyzeData();
    
    // Actualizar filtros de almacén
    if (typeof InventorySystem.UI !== 'undefined') {
        InventorySystem.UI.updateWarehouseFilters();
    }
    
    // Renderizar datos
    if (typeof InventorySystem.UI !== 'undefined') {
        InventorySystem.UI.switchTab('negative-inventory');
    }
    
    // Inicializar la funcionalidad de exportación
    if (typeof InventorySystem.Export !== 'undefined') {
        InventorySystem.Export.init();
    }
}
        
        /**
         * Analizar datos para estadísticas y resúmenes
         */
        function analyzeData() {
    // Estadísticas generales
    totalProducts.textContent = inventoryData.length;
    
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
    
    // Actualizar contador de productos negativos
    negativeInventory.textContent = negativeProducts.length;
    
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
    uniquePallets.textContent = uniquePalletIds.size;
    
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
        
        /**
         * Guardar datos en localStorage
         */
        function saveData() {
            try {
                // Guardar solo una parte de los datos para no exceder el límite de localStorage
                const dataToSave = {
                    inventoryData: inventoryData.slice(0, 1000), // Limitar a 1000 productos
                    lastUpdate: lastUpdate ? lastUpdate.toISOString() : null
                };
                
                localStorage.setItem('inventoryData', JSON.stringify(dataToSave));
            } catch (error) {
                console.error('Error al guardar datos:', error);
            }
        }
        
        /**
         * Cargar datos guardados
         */
        function loadSavedData() {
            try {
                const savedData = localStorage.getItem('inventoryData');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    inventoryData = parsedData.inventoryData || [];
                    lastUpdate = parsedData.lastUpdate ? new Date(parsedData.lastUpdate) : null;
                    
                    if (lastUpdate) {
                        lastUpdateEl.textContent = `Última actualización: ${InventorySystem.Utils.formatDate(lastUpdate)}`;
                    }
                    
                    if (inventoryData.length > 0) {
                        // Analizar datos
                        analyzeData();
                        
                        // Actualizar filtros de almacén
                        if (typeof InventorySystem.UI !== 'undefined') {
                            InventorySystem.UI.updateWarehouseFilters();
                        }
                        
                        // Mostrar análisis si hay un usuario
                        if (InventorySystem.Auth && InventorySystem.Auth.getCurrentUser()) {
                            document.getElementById('inventory-analysis').classList.remove('hidden');
                        }
                        
                        // Renderizar datos
                        if (typeof InventorySystem.UI !== 'undefined') {
                            InventorySystem.UI.switchTab('negative-inventory');
                        }
                        
                        // Inicializar la funcionalidad de exportación
                        if (typeof InventorySystem.Export !== 'undefined') {
                            InventorySystem.Export.init();
                        }
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos guardados:', error);
            }
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