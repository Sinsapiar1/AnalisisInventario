// ========================================
// MEJORAS VISUALES PARA GRÁFICOS EXISTENTES
// Aplica el estilo premium a todos los gráficos de Chart.js
// ========================================

(function(InventorySystem) {
    // Extender el módulo Charts existente
    const OriginalCharts = InventorySystem.Charts;
    
    InventorySystem.Charts = (function() {
        // Mantener funciones originales
        const originalFunctions = { ...OriginalCharts };
        
        // Configuraciones visuales mejoradas
        const enhancedConfig = {
            colors: {
                primary: '#667eea',
                secondary: '#764ba2', 
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6',
                light: '#f8fafc',
                dark: '#1e293b'
            },
            gradients: {
                blue: ['#667eea', '#764ba2'],
                green: ['#10b981', '#059669'],
                red: ['#ef4444', '#dc2626'],
                orange: ['#f59e0b', '#d97706'],
                purple: ['#8b5cf6', '#7c3aed'],
                teal: ['#14b8a6', '#0d9488']
            }
        };
        
        /**
         * 🎨 MEJORA 1: Crear gradientes para Canvas
         */
        function createGradient(ctx, colorArray, direction = 'vertical') {
            const chartArea = ctx.canvas.getBoundingClientRect();
            const height = chartArea.height;
            const width = chartArea.width;

            const gradient = direction === 'vertical' 
                ? ctx.createLinearGradient(0, 0, 0, height)
                : ctx.createLinearGradient(0, 0, width, 0);
                
            gradient.addColorStop(0, colorArray[0]);
            gradient.addColorStop(1, colorArray[1]);
            return gradient;
        }
        
        /**
         * 🎭 MEJORA 2: Configuraciones de animación premium
         */
        function getPremiumAnimations() {
            return {
                tension: { duration: 1500, easing: 'easeInOutElastic', from: 1, to: 0, loop: false },
                scale: { duration: 1200, easing: 'easeInOutCubic' },
                numbers: { duration: 2000, easing: 'easeOutExpo' },
                colors: { duration: 800, easing: 'easeInOutQuart' }
            };
        }
        
        /**
         * 🔧 MEJORA 3: Opciones base mejoradas para todos los gráficos
         */
        function getEnhancedBaseOptions(title, type = 'chart') {
            return {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 18, weight: 'bold', family: "'Segoe UI', system-ui, sans-serif" },
                        color: enhancedConfig.colors.dark,
                        padding: { top: 20, bottom: 30 }
                    },
                    legend: {
                        position: type === 'pie' ? 'right' : 'bottom',
                        labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: '500' }, color: enhancedConfig.colors.dark }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: enhancedConfig.colors.primary,
                        borderWidth: 2,
                        cornerRadius: 12,
                        displayColors: true,
                        padding: 15,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        animation: { duration: 200 }
                    }
                },
                elements: {
                    point: { radius: 6, hoverRadius: 8, borderWidth: 2, hoverBorderWidth: 3 },
                    line: { borderWidth: 3, tension: 0.4 },
                    bar: { borderRadius: 8, borderSkipped: false }
                }
            };
        }
        
        /**
         * 🎨 MEJORA 4: Gráfico de distribución de inventario mejorado
         */
        function createInventoryDistributionChartEnhanced() {
            try {
                const chartElement = document.getElementById('inventory-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================
                
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const positiveCount = inventoryData.filter(item => item.physicalInventory > 0).length;
                const negativeCount = inventoryData.filter(item => item.physicalInventory < 0).length;
                const zeroCount = inventoryData.filter(item => item.physicalInventory === 0).length;
                
                const ctx = chartElement.getContext('2d');
                const positiveGradient = createGradient(ctx, enhancedConfig.gradients.green);
                const negativeGradient = createGradient(ctx, enhancedConfig.gradients.red);
                const zeroGradient = createGradient(ctx, enhancedConfig.gradients.orange);
                
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['📈 Inventario Positivo', '⚠️ Inventario Negativo', '⭕ Inventario Cero'],
                        datasets: [{
                            data: [positiveCount, negativeCount, zeroCount],
                            backgroundColor: [positiveGradient, negativeGradient, zeroGradient],
                            borderColor: ['#fff', '#fff', '#fff'],
                            borderWidth: 4,
                            hoverBorderWidth: 6,
                            hoverOffset: 15,
                            cutout: '60%'
                        }]
                    },
                    options: { /* ... (tus opciones existentes) ... */ }
                });
            } catch (error) {
                console.error('❌ Error al crear gráfico de distribución mejorado:', error);
            }
        }
        
        /**
         * 🏭 MEJORA 5: Gráfico de distribución por almacén mejorado
         */
        function createWarehouseDistributionChartEnhanced() {
            try {
                const chartElement = document.getElementById('warehouse-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================

                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const warehouseCounts = {};
                inventoryData.forEach(item => {
                    if (item.warehouse) {
                        if (!warehouseCounts[item.warehouse]) warehouseCounts[item.warehouse] = { total: 0, negative: 0 };
                        warehouseCounts[item.warehouse].total++;
                        if (item.physicalInventory < 0) warehouseCounts[item.warehouse].negative++;
                    }
                });

                const warehouses = Object.keys(warehouseCounts).sort();
                const totalCounts = warehouses.map(w => warehouseCounts[w].total);
                const negativeCounts = warehouses.map(w => warehouseCounts[w].negative);
                
                const ctx = chartElement.getContext('2d');
                const totalGradient = createGradient(ctx, enhancedConfig.gradients.blue);
                const negativeGradient = createGradient(ctx, enhancedConfig.gradients.red);
                
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: warehouses,
                        datasets: [
                            { label: '📦 Total de Productos', data: totalCounts, backgroundColor: totalGradient, /* ... */ },
                            { label: '⚠️ Productos Negativos', data: negativeCounts, backgroundColor: negativeGradient, /* ... */ }
                        ]
                    },
                    options: { /* ... (tus opciones existentes) ... */ }
                });
            } catch (error) {
                console.error('❌ Error al crear gráfico de almacén mejorado:', error);
            }
        }
        
        /**
         * ⚠️ MEJORA 6: Gráfico de inventario negativo mejorado
         */
        function createNegativeInventoryChartEnhanced() {
            try {
                const chartElement = document.getElementById('negative-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================

                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const negativeItems = inventoryData.filter(item => item.physicalInventory < 0);
                
                const ctx = chartElement.getContext('2d');
                
                if (negativeItems.length === 0) {
                    // ... (tu código para mensaje de "no hay negativos") ...
                    return;
                }
                
                // ... (tu código para preparar datos y crear el gráfico) ...
            } catch (error) {
                console.error('❌ Error al crear gráfico de inventario negativo mejorado:', error);
            }
        }
        
        /**
         * 🚀 MEJORA 8: Función de render mejorada
         */
        let hasRendered = false;
        function renderDashboardEnhanced() {
            try {
                if (hasRendered) {
                    return originalFunctions.renderDashboard ? originalFunctions.renderDashboard() : undefined;
                }
                console.log('🎨 Aplicando mejoras visuales a gráficos...');
                
                if (originalFunctions.renderDashboard) {
                    originalFunctions.renderDashboard();
                }
                
                setTimeout(() => {
                    // Recrear gráficos con estilos y corrección de destrucción
                    createInventoryDistributionChartEnhanced();
                    createWarehouseDistributionChartEnhanced();
                    createNegativeInventoryChartEnhanced();
                    
                    if (originalFunctions.createEnhancedMetricsCardsV2) {
                        originalFunctions.createEnhancedMetricsCardsV2();
                    }
                    hasRendered = true;
                }, 300);
                
            } catch (error) {
                console.error('❌ Error aplicando mejoras visuales:', error);
                if (originalFunctions.renderDashboard) {
                    originalFunctions.renderDashboard();
                }
            }
        }
        
        // Exportar funciones mejoradas
        return {
            ...originalFunctions,
            renderDashboard: renderDashboardEnhanced,
            createInventoryDistributionChart: createInventoryDistributionChartEnhanced,
            createWarehouseDistributionChart: createWarehouseDistributionChartEnhanced,
            createNegativeInventoryChart: createNegativeInventoryChartEnhanced,
            //...
        };
    })();
    
})(window.InventorySystem || (window.InventorySystem = {}));