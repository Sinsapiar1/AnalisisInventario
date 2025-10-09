(function(InventorySystem) {
    // Módulo de Charts
    InventorySystem.Charts = (function() {
        // Elementos de gráficos (no se necesitan referencias aquí si se crean dinámicamente)
        // const inventoryChart = document.getElementById('inventory-chart');
        // const warehouseChart = document.getElementById('warehouse-chart');
        // const negativeChart = document.getElementById('negative-chart');
        
        /**
         * Inicializar el módulo de Charts
         */
        function init() {
            // No es necesario inicializar nada específico aquí,
            // los gráficos se crean cuando se muestra el dashboard
        }
        
        /**
         * Renderizar dashboard
         */
        function renderDashboard() {
            if (!InventorySystem.Inventory.getInventoryData().length) {
                return;
            }
            
            console.log('📊 Renderizando dashboard completo...');
            
            // Limpiar cualquier gráfico existente
            destroyCharts();
            
            // Limpiar completamente el contenido del dashboard antes de recrearlo
            clearDashboardContent();
            
            // Inicializar el contenido del dashboard (esto creará los elementos canvas)
            initDashboardContent();
            
            // Crear gráficos básicos (evitar duplicaciones si ya existen)
            createInventoryDistributionChart();
            createWarehouseDistributionChart();
            createNegativeInventoryChart();
            
            // Crear el dashboard avanzado
            createAdvancedDashboard();
            
            console.log('✅ Dashboard renderizado correctamente');
        }
        
        /**
         * Inicializar contenido del dashboard. Asegura que los contenedores existan.
         */
        function initDashboardContent() {
            const dashboardContent = document.getElementById('dashboard-content');
            
            // Crear sección para gráficos básicos si no existe
            if (!dashboardContent.querySelector('.basic-charts-section')) {
                const basicChartsSection = document.createElement('div');
                basicChartsSection.className = 'basic-charts-section';
                basicChartsSection.style.display = 'grid';
                basicChartsSection.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
                basicChartsSection.style.gap = '1.5rem';
                basicChartsSection.style.marginBottom = '1.5rem';
                
                const chartIds = ['inventory-chart', 'warehouse-chart', 'negative-chart'];
                chartIds.forEach(id => {
                    const chartContainer = document.createElement('div');
                    chartContainer.className = 'chart-container'; 
                    // No es necesario un ID para el contenedor si el canvas dentro tiene el ID para Chart.getChart
                    
                    const canvas = document.createElement('canvas');
                    canvas.id = id; 
                    
                    chartContainer.appendChild(canvas);
                    basicChartsSection.appendChild(chartContainer);
                });
                dashboardContent.appendChild(basicChartsSection);
            }

            // Crear sección para el drill-down si no existe
            if (!dashboardContent.querySelector('.drill-down-section')) {
                const drillDownSection = document.createElement('div');
                drillDownSection.className = 'drill-down-section';
                drillDownSection.innerHTML = `
                    <div class="section-header"><h3>Análisis Detallado de Inventario</h3></div>
                    <div class="filter-controls">
                        <div class="filter-group">
                            <label>Tipo de visualización:</label>
                            <select id="visualization-type">
                                <option value="warehouse">Por Almacén</option>
                                <option value="product">Por Tipo de Producto</option>
                                <option value="pallet">Por Pallet</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Métrica:</label>
                            <select id="metric-type">
                                <option value="inventory">Inventario Físico</option>
                                <option value="negative">Inventario Negativo</option>
                                <option value="inOrder">Material en Pedido</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <button id="apply-filters" class="btn">Aplicar Filtros</button>
                        </div>
                    </div>
                    <div class="chart-container" id="main-chart-container"><canvas id="main-chart"></canvas></div>
                    <div class="chart-container" id="detail-chart-container" style="display:none;"><canvas id="detail-chart"></canvas></div>
                    <div class="detail-table-container" id="detail-table-container" style="display:none;"></div>
                `;
                dashboardContent.appendChild(drillDownSection);
            }
            
            // Añadir sección específica para material en pedido si no existe
            if (!dashboardContent.querySelector('.in-order-section')) {
                const inOrderSection = document.createElement('div');
                inOrderSection.className = 'in-order-section';
                inOrderSection.innerHTML = `
                    <div class="section-header"><h3>Material en Pedido (Fuera de Bodega)</h3></div>
                    <div class="chart-container" id="in-order-chart-container"><canvas id="in-order-chart"></canvas></div>
                    <div class="detail-table-container" id="in-order-table-container"></div>
                `;
                dashboardContent.appendChild(inOrderSection);
            }
        }
        
        /**
         * Limpiar contenido del dashboard (EXCEPTO las cards mejoradas)
         * Las cards mejoradas solo se limpian en el hard refresh al cargar nuevo archivo
         */
        function clearDashboardContent() {
            const dashboardContent = document.getElementById('dashboard-content');
            if (!dashboardContent) return;
            
            console.log('🧹 Limpiando contenido del dashboard (preservando cards)...');
            
            // Remover secciones de gráficos (PERO NO las cards mejoradas)
            const sectionsToRemove = [
                '.basic-charts-section',
                '.drill-down-section',
                '.in-order-section',
                '.data-source-info'
                // NOTA: .enhanced-metrics-cards-v2 NO se elimina aquí
                // Solo se limpia en performHardRefresh() al cargar nuevo archivo Excel
            ];
            
            sectionsToRemove.forEach(selector => {
                const section = dashboardContent.querySelector(selector);
                if (section) {
                    section.remove();
                }
            });
            
            console.log('✅ Contenido del dashboard limpiado (cards preservadas)');
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
                    console.log(`  ✓ Destruyendo gráfico: ${chartId}`);
                    chartInstance.destroy();
                }
            });
        }
        
        /**
         * Crear gráfico de distribución de inventario
         */
        function createInventoryDistributionChart() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                // Contar productos por estado de inventario
                const positiveCount = inventoryData.filter(item => item.physicalInventory > 0).length;
                const negativeCount = inventoryData.filter(item => item.physicalInventory < 0).length;
                const zeroCount = inventoryData.filter(item => item.physicalInventory === 0).length;
                
                // Configurar gráfico
                const chartElement = document.getElementById('inventory-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico inventory-chart no encontrado');
                    return;
                }
                
                const ctx = chartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Inventario Positivo', 'Inventario Negativo', 'Inventario Cero'],
                        datasets: [{
                            data: [positiveCount, negativeCount, zeroCount],
                            backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Distribución de Inventario',
                                font: {
                                    size: 16
                                }
                            },
                            legend: {
                                position: 'bottom'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((total, num) => total + num);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico de distribución de inventario:', error);
            }
        }
        
        /**
         * Crear gráfico de distribución por almacén
         */
        function createWarehouseDistributionChart() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                // Agrupar por almacén
                const warehouseCounts = {};
                inventoryData.forEach(item => {
                    if (InventorySystem.Utils.isValidWarehouse(item.warehouse)) {
                        if (!warehouseCounts[item.warehouse]) {
                            warehouseCounts[item.warehouse] = {
                                total: 0,
                                negative: 0
                            };
                        }
                        warehouseCounts[item.warehouse].total++;
                        if (item.physicalInventory < 0) {
                            warehouseCounts[item.warehouse].negative++;
                        }
                    }
                });
                
                // Preparar datos para el gráfico
                const warehouses = Object.keys(warehouseCounts).sort();
                const totalCounts = warehouses.map(w => warehouseCounts[w].total);
                const negativeCounts = warehouses.map(w => warehouseCounts[w].negative);
                
                // Configurar gráfico
                const chartElement = document.getElementById('warehouse-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico warehouse-chart no encontrado');
                    return;
                }
                
                const ctx = chartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: warehouses,
                        datasets: [
                            {
                                label: 'Total de Productos',
                                data: totalCounts,
                                backgroundColor: '#3498db',
                                borderWidth: 1
                            },
                            {
                                label: 'Productos Negativos',
                                data: negativeCounts,
                                backgroundColor: '#e74c3c',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Cantidad de Productos'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Almacén'
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: 'Distribución por Almacén',
                                font: {
                                    size: 16
                                }
                            },
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico de distribución por almacén:', error);
            }
        }
        
        /**
         * Crear gráfico de productos con inventario negativo
         */
        function createNegativeInventoryChart() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                // Filtrar productos con inventario negativo
                const negativeItems = inventoryData.filter(item => item.physicalInventory < 0);
                
                // Configurar gráfico
                const chartElement = document.getElementById('negative-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico negative-chart no encontrado');
                    return;
                }
                
                const ctx = chartElement.getContext('2d');
                
                // Si no hay productos negativos, mostrar un mensaje
                if (negativeItems.length === 0) {
                    ctx.font = '16px Arial';
                    ctx.fillStyle = '#666';
                    ctx.textAlign = 'center';
                    ctx.fillText('No hay productos con inventario negativo', chartElement.width / 2, chartElement.height / 2);
                    return;
                }
                
                // Ordenar por valor absoluto de inventario negativo (de mayor a menor)
                negativeItems.sort((a, b) => Math.abs(a.physicalInventory) > Math.abs(b.physicalInventory) ? -1 : 1);
                
                // Tomar los 10 productos con mayor inventario negativo
                const topNegativeItems = negativeItems.slice(0, 10);
                
                // Preparar datos para el gráfico
                const labels = topNegativeItems.map(item => item.name || `Producto ${item.code}`);
                const data = topNegativeItems.map(item => Math.abs(item.physicalInventory));
                
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Valor Absoluto de Inventario Negativo',
                            data: data,
                            backgroundColor: '#e74c3c',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Valor Absoluto'
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Top 10 Productos con Mayor Inventario Negativo',
                                    font: {
                                        size: 16
                                    }
                                },
                                legend: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico de productos con inventario negativo:', error);
            }
        }
        
        /**
         * Crear dashboard avanzado
         */
        function createAdvancedDashboard() {
            try {
                // Obtener el contenedor principal del dashboard (ya creado en initDashboardContent)
                const dashboardContent = document.getElementById('dashboard-content');
                
                // Inicializar los gráficos del dashboard avanzado
                initDrillDownCharts();
                initInOrderAnalysis(); 
                
                // Añadir event listeners para los filtros
                const applyFiltersBtn = document.getElementById('apply-filters');
                if (applyFiltersBtn) {
                    // Remover para evitar duplicados si la función es llamada varias veces
                    applyFiltersBtn.removeEventListener('click', updateDrillDownCharts); 
                    applyFiltersBtn.addEventListener('click', updateDrillDownCharts);
                }
            } catch (error) {
                console.error('Error al crear dashboard avanzado:', error);
            }
        }
        
        /**
         * Inicializar los gráficos de drill-down
         */
        function initDrillDownCharts() {
            // Crear el gráfico principal basado en los filtros actuales
            updateDrillDownCharts();
        }
        
        /**
         * Actualizar los gráficos basados en los filtros
         */
        function updateDrillDownCharts() {
            const visualizationTypeEl = document.getElementById('visualization-type');
            const metricTypeEl = document.getElementById('metric-type');

            if (!visualizationTypeEl || !metricTypeEl) {
                console.error('Elementos de filtro de dashboard (visualization-type o metric-type) no encontrados.');
                return;
            }

            const visualizationType = visualizationTypeEl.value;
            const metricType = metricTypeEl.value;
            
            // Limpiar gráficos previos
            const mainChartContainer = document.getElementById('main-chart-container');
            const detailChartContainer = document.getElementById('detail-chart-container');
            const detailTableContainer = document.getElementById('detail-table-container');
            
            // Ocultar contenedores de detalle
            if (detailChartContainer) detailChartContainer.style.display = 'none';
            if (detailTableContainer) detailTableContainer.style.display = 'none';
            
            // Destruir gráficos existentes
            let mainChartInstance = Chart.getChart('main-chart');
            if (mainChartInstance) {
                mainChartInstance.destroy();
            }
            
            let detailChartInstance = Chart.getChart('detail-chart');
            if (detailChartInstance) {
                detailChartInstance.destroy();
            }
            
            // Recrear canvas (asegúrate de que los contenedores existan antes de modificar su innerHTML)
            if (mainChartContainer) mainChartContainer.innerHTML = '<canvas id="main-chart"></canvas>';
            if (detailChartContainer) detailChartContainer.innerHTML = '<canvas id="detail-chart"></canvas>';
            if (detailTableContainer) detailTableContainer.innerHTML = '';
            
            // Crear el gráfico principal según el tipo de visualización
            if (visualizationType === 'warehouse') {
                createWarehouseChart(metricType);
            } else if (visualizationType === 'product') {
                createProductChart(metricType); // Llamada a la función implementada
            } else if (visualizationType === 'pallet') {
                createPalletChart(metricType); // Llamada a la función implementada
            }
        }
        
        /**
         * Crear el gráfico por almacén
         * @param {string} metricType - Tipo de métrica
         */
        function createWarehouseChart(metricType) {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                // Agrupar datos por almacén
                const warehouseData = {};
                inventoryData.forEach(item => {
                    if (InventorySystem.Utils.isValidWarehouse(item.warehouse)) {
                        if (!warehouseData[item.warehouse]) {
                            warehouseData[item.warehouse] = {
                                totalInventory: 0,
                                negativeInventory: 0,
                                inOrder: 0,
                                productCodes: new Set(),
                                palletIds: new Set()
                            };
                        }
                        
                        
                        warehouseData[item.warehouse].totalInventory += item.physicalInventory;
                        if (item.physicalInventory < 0) {
                            warehouseData[item.warehouse].negativeInventory += item.physicalInventory;
                        }
                        warehouseData[item.warehouse].inOrder += item.inOrder || 0;
                        if (item.palletId) {
                            warehouseData[item.warehouse].palletIds.add(item.palletId); // CORREGIDO: Usar item.warehouse para el agrupamiento
                        }
                    }
                });
                
                // Preparar datos para el gráfico
                const labels = Object.keys(warehouseData).sort();
                let data = [];
                let backgroundColor = [];
                let title = '';
                
                if (metricType === 'inventory') {
                    data = labels.map(warehouse => warehouseData[warehouse].totalInventory);
                    backgroundColor = labels.map(() => '#3498db');
                    title = 'Inventario Físico por Almacén';
                } else if (metricType === 'negative') {
                    data = labels.map(warehouse => Math.abs(warehouseData[warehouse].negativeInventory));
                    backgroundColor = labels.map(() => '#e74c3c');
                    title = 'Inventario Negativo por Almacén (Valor Absoluto)';
                } else if (metricType === 'inOrder') {
                    data = labels.map(warehouse => warehouseData[warehouse].inOrder);
                    backgroundColor = labels.map(() => '#f39c12');
                    title = 'Material en Pedido por Almacén';
                }
                
                // Crear el gráfico
                const chartElement = document.getElementById('main-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico main-chart no encontrado');
                    return;
                }
                
                const ctx = chartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: title,
                            data: data,
                            backgroundColor: backgroundColor,
                            borderWidth: 1,
                            minBarLength: 5, // <--- ESTA ES LA ÚNICA LÍNEA A AÑADIR
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Cantidad'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Almacén'
                                }
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: title,
                                font: {
                                    size: 16
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        const warehouse = context.label;
                                        return [
                                            `Productos: ${warehouseData[warehouse].productCodes.size}`,
                                            `Pallets: ${warehouseData[warehouse].palletIds.size}`
                                        ];
                                    }
                                }
                            }
                        },
                        onClick: (e, elements) => {
                            if (elements.length > 0) {
                                const index = elements[0].index;
                                const warehouse = labels[index];
                                showWarehouseDetails(warehouse, metricType);
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico por almacén:', error);
            }
        }
        
        /**
         * Crear el gráfico por tipo de producto (implementación básica)
         * @param {string} metricType - Tipo de métrica
         */
        function createProductChart(metricType) {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const productData = {}; // Agrupar por código de producto
                
                inventoryData.forEach(item => {
                    if (!productData[item.code]) {
                        productData[item.code] = {
                            name: item.name || `Producto ${item.code}`,
                            totalInventory: 0,
                            negativeInventory: 0,
                            inOrder: 0
                        };
                    }
                    productData[item.code].totalInventory += item.physicalInventory;
                    if (item.physicalInventory < 0) {
                        productData[item.code].negativeInventory += item.physicalInventory;
                    }
                    productData[item.code].inOrder += item.inOrder || 0;
                });

                let sortedProducts = Object.values(productData);
                let title = '';
                let data = [];
                let backgroundColor = [];

                if (metricType === 'inventory') {
                    sortedProducts.sort((a, b) => b.totalInventory - a.totalInventory);
                    data = sortedProducts.slice(0, 10).map(p => p.totalInventory);
                    backgroundColor = data.map(() => '#3498db');
                    title = 'Top 10 Productos por Inventario Físico';
                } else if (metricType === 'negative') {
                    sortedProducts = sortedProducts.filter(p => p.negativeInventory < 0);
                    sortedProducts.sort((a, b) => a.negativeInventory - b.negativeInventory);
                    data = sortedProducts.slice(0, 10).map(p => Math.abs(p.negativeInventory));
                    backgroundColor = data.map(() => '#e74c3c');
                    title = 'Top 10 Productos con Inventario Negativo';
                } else if (metricType === 'inOrder') {
                    sortedProducts = sortedProducts.filter(p => p.inOrder > 0);
                    sortedProducts.sort((a, b) => b.inOrder - a.inOrder);
                    data = sortedProducts.slice(0, 10).map(p => p.inOrder);
                    backgroundColor = data.map(() => '#f39c12');
                    title = 'Top 10 Productos con Material en Pedido';
                }

                const labels = sortedProducts.slice(0, 10).map(p => p.name);
                
                const chartElement = document.getElementById('main-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico main-chart no encontrado');
                    return;
                }
                const ctx = chartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: title,
                            data: data,
                            backgroundColor: backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y', // Para un gráfico de barras horizontal
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: title,
                                font: { size: 16 }
                            },
                            legend: { display: false }
                        },
                        scales: { x: { beginAtZero: true } }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico por tipo de producto:', error);
                InventorySystem.Utils.showError('Error al crear gráfico por tipo de producto: ' + error.message);
            }
        }

        /**
         * Crear el gráfico por Pallet (implementación básica)
         * @param {string} metricType - Tipo de métrica
         */
        function createPalletChart(metricType) {
            try {
                const palletDetails = InventorySystem.Inventory.getPalletDetails();
                const palletData = Object.values(palletDetails);

                let sortedPallets = palletData;
                let title = '';
                let data = [];
                let backgroundColor = [];

                if (metricType === 'inventory') {
                    sortedPallets.sort((a, b) => b.totalInventory - a.totalInventory);
                    data = sortedPallets.slice(0, 10).map(p => p.totalInventory);
                    backgroundColor = data.map(() => '#3498db');
                    title = 'Top 10 Pallets por Inventario Total';
                } else if (metricType === 'negative') {
                    sortedPallets = sortedPallets.filter(p => p.negativeProducts > 0);
                    sortedPallets.sort((a, b) => b.negativeProducts - a.negativeProducts);
                    data = sortedPallets.slice(0, 10).map(p => p.negativeProducts);
                    backgroundColor = data.map(() => '#e74c3c');
                    title = 'Top 10 Pallets con Productos Negativos';
                } else if (metricType === 'inOrder') {
                    // Para pallets, la métrica "inOrder" no está directamente calculada a nivel de pallet
                    // Podríamos sumar el inOrder de todos los productos en el pallet.
                    sortedPallets.forEach(pallet => {
                        pallet.totalInOrder = pallet.products.reduce((sum, item) => sum + (item.inOrder || 0), 0);
                    });
                    sortedPallets = sortedPallets.filter(p => p.totalInOrder > 0);
                    sortedPallets.sort((a, b) => b.totalInOrder - a.totalInOrder);
                    data = sortedPallets.slice(0, 10).map(p => p.totalInOrder);
                    backgroundColor = data.map(() => '#f39c12');
                    title = 'Top 10 Pallets por Material en Pedido';
                }

                const labels = sortedPallets.slice(0, 10).map(p => p.palletId);
                
                const chartElement = document.getElementById('main-chart');
                if (!chartElement) {
                    console.error('Elemento de gráfico main-chart no encontrado');
                    return;
                }
                const ctx = chartElement.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: title,
                            data: data,
                            backgroundColor: backgroundColor,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        indexAxis: 'y', // Para un gráfico de barras horizontal
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: title,
                                font: { size: 16 }
                            },
                            legend: { display: false }
                        },
                        scales: { x: { beginAtZero: true } }
                    }
                });
            } catch (error) {
                console.error('Error al crear gráfico por pallet:', error);
                InventorySystem.Utils.showError('Error al crear gráfico por pallet: ' + error.message);
            }
        }

        /**
         * Mostrar vista detallada de un almacén (drill-down desde el dashboard)
         * @param {string} warehouse - Nombre del almacén
         * @param {string} metricType - Tipo de métrica
         */
        function showWarehouseDetails(warehouse, metricType) {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const detailChartContainer = document.getElementById('detail-chart-container');
                const detailTableContainer = document.getElementById('detail-table-container');
                
                // Mostrar contenedores de detalle si existen
                if (detailChartContainer) detailChartContainer.style.display = 'block';
                if (detailTableContainer) detailTableContainer.style.display = 'block';
                
                // Destruir cualquier gráfico existente en el contenedor de detalle
                let detailChartInstance = Chart.getChart('detail-chart');
                if (detailChartInstance) {
                    detailChartInstance.destroy();
                }
                
                // Recrear el canvas para evitar problemas de reutilización
                if (detailChartContainer) detailChartContainer.innerHTML = '<canvas id="detail-chart"></canvas>';
                
                // Filtrar productos del almacén seleccionado y consolidarlos por código de producto
                const warehouseProducts = {};
                
                inventoryData.filter(item => item.warehouse === warehouse).forEach(item => {
                    if (!warehouseProducts[item.code]) {
                        warehouseProducts[item.code] = {
                            code: item.code,
                            name: item.name || `Producto ${item.code}`,
                            totalInventory: 0,
                            negativeInventory: 0,
                            inOrder: 0,
                            palletIds: new Set()
                        };
                    }
                    
                    warehouseProducts[item.code].totalInventory += item.physicalInventory;
                    if (item.physicalInventory < 0) {
                        warehouseProducts[item.code].negativeInventory += item.physicalInventory;
                    }
                    warehouseProducts[item.code].inOrder += item.inOrder || 0;
                    if (item.palletId) {
                        warehouseProducts[item.code].palletIds.add(item.palletId);
                    }
                });
                
                // Ordenar productos por la métrica seleccionada
                let sortedProducts = Object.values(warehouseProducts);
                if (metricType === 'inventory') {
                    sortedProducts.sort((a, b) => b.totalInventory - a.totalInventory);
                } else if (metricType === 'negative') {
                    sortedProducts = sortedProducts.filter(p => p.negativeInventory < 0);
                    sortedProducts.sort((a, b) => a.negativeInventory - b.negativeInventory);
                } else if (metricType === 'inOrder') {
                    sortedProducts = sortedProducts.filter(p => p.inOrder > 0);
                    sortedProducts.sort((a, b) => b.inOrder - a.inOrder);
                }
                
                // Tomar los top 10 productos
                const topProducts = sortedProducts.slice(0, 10);
                
                // Preparar datos para el gráfico
                const labels = topProducts.map(product => product.name);
                let data = [];
                let backgroundColor = [];
                let title = '';
                
                if (metricType === 'inventory') {
                    data = topProducts.map(product => product.totalInventory);
                    backgroundColor = topProducts.map(() => '#3498db');
                    title = `Top 10 Productos por Inventario Físico en ${warehouse}`;
                } else if (metricType === 'negative') {
                    data = topProducts.map(product => Math.abs(product.negativeInventory));
                    backgroundColor = topProducts.map(() => '#e74c3c');
                    title = `Top 10 Productos por Inventario Negativo en ${warehouse}`;
                } else if (metricType === 'inOrder') {
                    data = topProducts.map(product => product.inOrder);
                    backgroundColor = topProducts.map(() => '#f39c12');
                    title = `Top 10 Productos por Material en Pedido en ${warehouse}`;
                }
                
                // Create the detail chart
                const detailChartCanvas = document.getElementById('detail-chart');
                if (detailChartCanvas) { // Check if canvas element exists
                    const ctx = detailChartCanvas.getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: title,
                                data: data,
                                backgroundColor: backgroundColor,
                                borderWidth: 1
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Cantidad'
                                    }
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: title,
                                    font: {
                                        size: 16
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        afterLabel: function(context) {
                                            const product = topProducts[context.dataIndex];
                                            return [
                                                `Código: ${product.code}`,
                                                `Pallets: ${product.palletIds.size}`
                                            ];
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.error('Canvas element for detail-chart not found or context not available.');
                }
                
                // Create table with details
                if (detailTableContainer) {
                    detailTableContainer.innerHTML = `
                        <h3>Detalle de Productos en ${warehouse}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Inventario Físico</th>
                                    <th>Inventario Negativo</th>
                                    <th>Material en Pedido</th>
                                    <th>Pallets</th>
                                </tr>
                            </thead>
                            <tbody id="detail-table-body"></tbody>
                        </table>
                    `;
                    
                    const tableBody = document.getElementById('detail-table-body');
                    if (tableBody) {
                        sortedProducts.forEach(product => {
                            const row = document.createElement('tr');
                            
                            const codeCell = document.createElement('td');
                            codeCell.textContent = product.code;
                            row.appendChild(codeCell);
                            
                            const nameCell = document.createElement('td');
                            nameCell.textContent = product.name;
                            row.appendChild(nameCell);
                            
                            const inventoryCell = document.createElement('td');
                            inventoryCell.textContent = InventorySystem.Utils.formatNumber(product.totalInventory);
                            row.appendChild(inventoryCell);
                            
                            const negativeCell = document.createElement('td');
                            negativeCell.textContent = product.negativeInventory < 0 ? InventorySystem.Utils.formatNumber(product.negativeInventory) : '0';
                            if (product.negativeInventory < 0) {
                                negativeCell.style.color = 'red';
                                negativeCell.style.fontWeight = 'bold';
                            }
                            row.appendChild(negativeCell);
                            
                            const inOrderCell = document.createElement('td');
                            inOrderCell.textContent = InventorySystem.Utils.formatNumber(product.inOrder);
                            row.appendChild(inOrderCell);
                            
                            const palletsCell = document.createElement('td');
                            palletsCell.textContent = product.palletIds.size;
                            row.appendChild(palletsCell);
                            
                            tableBody.appendChild(row);
                        });
                    }
                }
            } catch (error) {
                console.error('Error al mostrar detalles del almacén:', error);
                InventorySystem.Utils.showError('Error al mostrar detalles del almacén: ' + error.message);
            }
        }
        
        /**
         * Inicializar el análisis de material en pedido.
         */
        function initInOrderAnalysis() {
            try {
                // Verificar si el contenedor del gráfico existe y crear el canvas si es necesario
                const container = document.getElementById('in-order-chart-container');
                if (!container) {
                    console.error('Contenedor para gráfico de material en pedido no encontrado');
                    return;
                }
                
                // Destruir el gráfico existente si hay uno
                let chartInstance = Chart.getChart('in-order-chart');
                if (chartInstance) {
                    chartInstance.destroy();
                }
                
                // Recrear el canvas
                container.innerHTML = '<canvas id="in-order-chart"></canvas>';
                
                // Asegurarse de que hay un canvas dentro del contenedor
                let canvas = container.querySelector('canvas');
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    canvas.id = 'in-order-chart';
                    container.appendChild(canvas);
                }
                
                // Obtener los datos de inventario
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                // Agrupar datos de material en pedido por almacén
                const inOrderByWarehouse = {};
                
                inventoryData.forEach(item => {
                    if (item.inOrder && item.inOrder > 0) {
                        const warehouse = InventorySystem.Utils.isValidWarehouse(item.warehouse) ? 
                            item.warehouse : 'Sin Almacén';
                        if (!inOrderByWarehouse[warehouse]) {
                            inOrderByWarehouse[warehouse] = {
                                total: 0,
                                products: {}
                            };
                        }
                        
                        inOrderByWarehouse[warehouse].total += item.inOrder;
                        
                        if (!inOrderByWarehouse[warehouse].products[item.code]) {
                            inOrderByWarehouse[warehouse].products[item.code] = {
                                code: item.code,
                                name: item.name || '',
                                total: 0
                            };
                        }
                        
                        inOrderByWarehouse[warehouse].products[item.code].total += item.inOrder;
                    }
                });
                
                // Si no hay datos, mostrar un mensaje
                if (Object.keys(inOrderByWarehouse).length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 20px;">No hay material en pedido registrado</div>';
                    
                    // También limpiar la tabla si existe
                    const tableContainer = document.getElementById('in-order-table-container');
                    if (tableContainer) {
                        tableContainer.innerHTML = '<div style="text-align: center; padding: 20px;">No hay material en pedido registrado</div>';
                    }
                    
                    return;
                }
                
                // Crear el gráfico de material en pedido por almacén
                const labels = Object.keys(inOrderByWarehouse).sort();
                const data = labels.map(warehouse => inOrderByWarehouse[warehouse].total);
                
                try {
                    const ctx = canvas.getContext('2d');
                    new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: data,
                                backgroundColor: [
                                    '#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
                                    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Material en Pedido por Almacén',
                                    font: {
                                        size: 16
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ${InventorySystem.Utils.formatNumber(value)} (${percentage}%)`;
                                        }
                                    }
                                },
                                legend: {
                                    position: 'right'
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error al crear el gráfico de material en pedido:', error);
                    container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Error al crear el gráfico</div>';
                    return;
                }
                
                // Crear tabla detallada de material en pedido
                const inOrderTableContainer = document.getElementById('in-order-table-container');
                if (!inOrderTableContainer) {
                    console.error('Contenedor para tabla de material en pedido no encontrado');
                    return;
                }
                
                inOrderTableContainer.innerHTML = `
                    <h3>Detalle de Material en Pedido</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Almacén</th>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Cantidad en Pedido</th>
                            </tr>
                        </thead>
                        <tbody id="in-order-table-body"></tbody>
                    </table>
                `;
                
                const tableBody = document.getElementById('in-order-table-body');
                if (!tableBody) {
                    console.error('Cuerpo de tabla de material en pedido no encontrado');
                    return;
                }
                
                // Aplanar los datos para la tabla
                const tableData = [];
                Object.keys(inOrderByWarehouse).forEach(warehouse => {
                    Object.values(inOrderByWarehouse[warehouse].products).forEach(product => {
                        tableData.push({
                            warehouse: warehouse,
                            code: product.code,
                            name: product.name,
                            inOrder: product.total
                        });
                    });
                });
                
                // Ordenar por cantidad en pedido (descendente)
                tableData.sort((a, b) => b.inOrder - a.inOrder);
                
                // Llenar la tabla
                if (tableData.length === 0) {
                    const row = document.createElement('tr');
                    const cell = document.createElement('td');
                    cell.colSpan = 4;
                    cell.textContent = 'No hay material en pedido registrado';
                    cell.style.textAlign = 'center';
                    row.appendChild(cell);
                    tableBody.appendChild(row);
                } else {
                    tableData.forEach(item => {
                        const row = document.createElement('tr');
                        
                        const warehouseCell = document.createElement('td');
                        warehouseCell.textContent = item.warehouse;
                        row.appendChild(warehouseCell);
                        
                        const codeCell = document.createElement('td');
                        codeCell.textContent = item.code;
                        row.appendChild(codeCell);
                        
                        const nameCell = document.createElement('td');
                        nameCell.textContent = item.name;
                        row.appendChild(nameCell);
                        
                        const inOrderCell = document.createElement('td');
                        inOrderCell.textContent = InventorySystem.Utils.formatNumber(item.inOrder);
                        row.appendChild(inOrderCell);
                        
                        tableBody.appendChild(row);
                    });
                }
            } catch (error) {
                console.error('Error al inicializar análisis de material en pedido:', error);
                InventorySystem.Utils.showError('Error al analizar material en pedido: ' + error.message);
            }
        }
        
        // Exportar funciones públicas
        return {
            init,
            renderDashboard,
            createInventoryDistributionChart,
            createWarehouseDistributionChart,
            createNegativeInventoryChart,
            createAdvancedDashboard,
            createProductChart, 
            createPalletChart,  
            showWarehouseDetails,
            initDrillDownCharts, // Sigue expuesta por si algún otro módulo la llama directamente.
            initInOrderAnalysis,
            clearDashboardContent,
            destroyCharts
        };
    })(); // <-- ¡Cierre correcto del IIFE interno!
})(window.InventorySystem || (window.InventorySystem = {})); // <-- ¡Cierre correcto del IIFE externo y asignación del namespace!