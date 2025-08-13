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
            const gradient = direction === 'vertical' 
                ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
                : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
                
            gradient.addColorStop(0, colorArray[0]);
            gradient.addColorStop(1, colorArray[1]);
            return gradient;
        }
        
        /**
         * 🎭 MEJORA 2: Configuraciones de animación premium
         */
        function getPremiumAnimations() {
            return {
                tension: {
                    duration: 1500,
                    easing: 'easeInOutElastic',
                    from: 1,
                    to: 0,
                    loop: false
                },
                scale: {
                    duration: 1200,
                    easing: 'easeInOutCubic'
                },
                numbers: {
                    duration: 2000,
                    easing: 'easeOutExpo'
                },
                colors: {
                    duration: 800,
                    easing: 'easeInOutQuart'
                }
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
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 18,
                            weight: 'bold',
                            family: "'Segoe UI', system-ui, sans-serif"
                        },
                        color: enhancedConfig.colors.dark,
                        padding: {
                            top: 20,
                            bottom: 30
                        }
                    },
                    legend: {
                        position: type === 'pie' ? 'right' : 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: enhancedConfig.colors.dark
                        }
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
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        animation: {
                            duration: 200
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 6,
                        hoverRadius: 8,
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    },
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    },
                    bar: {
                        borderRadius: 8,
                        borderSkipped: false
                    }
                }
            };
        }
        
        /**
         * 🎨 MEJORA 4: Gráfico de distribución de inventario mejorado
         */
        function createInventoryDistributionChartEnhanced() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                const positiveCount = inventoryData.filter(item => item.physicalInventory > 0).length;
                const negativeCount = inventoryData.filter(item => item.physicalInventory < 0).length;
                const zeroCount = inventoryData.filter(item => item.physicalInventory === 0).length;
                
                const chartElement = document.getElementById('inventory-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================
                
                const ctx = chartElement.getContext('2d');
                
                // Crear gradientes
                const positiveGradient = createGradient(ctx, enhancedConfig.gradients.green);
                const negativeGradient = createGradient(ctx, enhancedConfig.gradients.red);
                const zeroGradient = createGradient(ctx, enhancedConfig.gradients.orange);
                
                new Chart(ctx, {
                    type: 'doughnut', // Cambiar de pie a doughnut para look más moderno
                    data: {
                        labels: ['📈 Inventario Positivo', '⚠️ Inventario Negativo', '⭕ Inventario Cero'],
                        datasets: [{
                            data: [positiveCount, negativeCount, zeroCount],
                            backgroundColor: [positiveGradient, negativeGradient, zeroGradient],
                            borderColor: ['#fff', '#fff', '#fff'],
                            borderWidth: 4,
                            hoverBorderWidth: 6,
                            hoverOffset: 15,
                            cutout: '60%' // Para el efecto doughnut
                        }]
                    },
                    options: {
                        ...getEnhancedBaseOptions('📊 Distribución de Inventario', 'pie'),
                        plugins: {
                            ...getEnhancedBaseOptions('📊 Distribución de Inventario', 'pie').plugins,
                            tooltip: {
                                ...getEnhancedBaseOptions().plugins.tooltip,
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((total, num) => total + num);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value.toLocaleString()} productos (${percentage}%)`;
                                    },
                                    afterLabel: function(context) {
                                        return `Click para ver detalles`;
                                    }
                                }
                            },
                            // Plugin para mostrar el total en el centro
                            beforeDraw: function(chart) {
                                const { width, height, ctx } = chart;
                                ctx.restore();
                                
                                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                
                                ctx.font = 'bold 24px "Segoe UI"';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = enhancedConfig.colors.dark;
                                
                                const centerX = width / 2;
                                const centerY = height / 2;
                                
                                ctx.fillText(total.toLocaleString(), centerX, centerY - 10);
                                
                                ctx.font = '12px "Segoe UI"';
                                ctx.fillStyle = enhancedConfig.colors.dark + '80';
                                ctx.fillText('Total Productos', centerX, centerY + 15);
                                
                                ctx.save();
                            }
                        },
                        animation: {
                            animateRotate: true,
                            animateScale: true,
                            duration: 2000,
                            easing: 'easeInOutQuart'
                        }
                    }
                });
                
                console.log('✅ Gráfico de distribución mejorado creado');
                
            } catch (error) {
                console.error('❌ Error al crear gráfico de distribución mejorado:', error);
            }
        }
        
        /**
         * 🏭 MEJORA 5: Gráfico de distribución por almacén mejorado
         */
        function createWarehouseDistributionChartEnhanced() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                
                const warehouseCounts = {};
                inventoryData.forEach(item => {
                    if (item.warehouse) {
                        if (!warehouseCounts[item.warehouse]) {
                            warehouseCounts[item.warehouse] = { total: 0, negative: 0 };
                        }
                        warehouseCounts[item.warehouse].total++;
                        if (item.physicalInventory < 0) {
                            warehouseCounts[item.warehouse].negative++;
                        }
                    }
                });
                
                const warehouses = Object.keys(warehouseCounts).sort();
                const totalCounts = warehouses.map(w => warehouseCounts[w].total);
                const negativeCounts = warehouses.map(w => warehouseCounts[w].negative);
                
                const chartElement = document.getElementById('warehouse-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================
                
                const ctx = chartElement.getContext('2d');
                
                // Crear gradientes para las barras
                const totalGradient = createGradient(ctx, enhancedConfig.gradients.blue);
                const negativeGradient = createGradient(ctx, enhancedConfig.gradients.red);
                
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: warehouses,
                        datasets: [
                            {
                                label: '📦 Total de Productos',
                                data: totalCounts,
                                backgroundColor: totalGradient,
                                borderColor: enhancedConfig.colors.primary,
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                                barThickness: 'flex',
                                maxBarThickness: 60
                            },
                            {
                                label: '⚠️ Productos Negativos',
                                data: negativeCounts,
                                backgroundColor: negativeGradient,
                                borderColor: enhancedConfig.colors.danger,
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                                barThickness: 'flex',
                                maxBarThickness: 60
                            }
                        ]
                    },
                    options: {
                        ...getEnhancedBaseOptions('🏭 Distribución por Almacén'),
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Cantidad de Productos',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    },
                                    color: enhancedConfig.colors.dark
                                },
                                grid: {
                                    color: enhancedConfig.colors.light,
                                    lineWidth: 1
                                },
                                ticks: {
                                    color: enhancedConfig.colors.dark,
                                    font: {
                                        size: 12
                                    },
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Almacén',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    },
                                    color: enhancedConfig.colors.dark
                                },
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: enhancedConfig.colors.dark,
                                    font: {
                                        size: 12,
                                        weight: '500'
                                    }
                                }
                            }
                        },
                        plugins: {
                            ...getEnhancedBaseOptions().plugins,
                            tooltip: {
                                ...getEnhancedBaseOptions().plugins.tooltip,
                                callbacks: {
                                    title: function(context) {
                                        return `🏭 Almacén: ${context[0].label}`;
                                    },
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.raw.toLocaleString()} productos`;
                                    },
                                    afterBody: function(context) {
                                        const warehouse = context[0].label;
                                        const data = warehouseCounts[warehouse];
                                        const percentage = ((data.negative / data.total) * 100).toFixed(1);
                                        return [``, `📊 Porcentaje negativo: ${percentage}%`];
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 1500,
                            easing: 'easeInOutQuart',
                            delay: (context) => context.dataIndex * 100
                        }
                    }
                });
                
                console.log('✅ Gráfico de almacén mejorado creado');
                
            } catch (error) {
                console.error('❌ Error al crear gráfico de almacén mejorado:', error);
            }
        }
        
        /**
         * ⚠️ MEJORA 6: Gráfico de inventario negativo mejorado
         */
        function createNegativeInventoryChartEnhanced() {
            try {
                const inventoryData = InventorySystem.Inventory.getInventoryData();
                const negativeItems = inventoryData.filter(item => item.physicalInventory < 0);
                
                const chartElement = document.getElementById('negative-chart');
                if (!chartElement) return;

                // ================== INICIO DE LA CORRECCIÓN ==================
                const existingChart = Chart.getChart(chartElement);
                if (existingChart) {
                    existingChart.destroy();
                }
                // =================== FIN DE LA CORRECCIÓN ====================
                
                const ctx = chartElement.getContext('2d');
                
                if (negativeItems.length === 0) {
                    // Crear un gráfico vacío con mensaje elegante
                    ctx.clearRect(0, 0, chartElement.width, chartElement.height);
                    
                    // Fondo con gradiente
                    const gradient = createGradient(ctx, ['#f0f9ff', '#e0f2fe']);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, chartElement.width, chartElement.height);
                    
                    // Icono y mensaje
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = enhancedConfig.colors.success;
                    ctx.fillText('✅', chartElement.width / 2, chartElement.height / 2 - 20);
                    
                    ctx.font = 'bold 18px "Segoe UI"';
                    ctx.fillStyle = enhancedConfig.colors.dark;
                    ctx.fillText('¡Excelente!', chartElement.width / 2, chartElement.height / 2 + 20);
                    
                    ctx.font = '14px "Segoe UI"';
                    ctx.fillStyle = enhancedConfig.colors.dark + '80';
                    ctx.fillText('No hay productos con inventario negativo', chartElement.width / 2, chartElement.height / 2 + 45);
                    
                    return;
                }
                
                // Ordenar y tomar top 10
                negativeItems.sort((a, b) => Math.abs(a.physicalInventory) > Math.abs(b.physicalInventory) ? -1 : 1);
                const topNegativeItems = negativeItems.slice(0, 10);
                
                const labels = topNegativeItems.map(item => {
                    const name = item.name || `Producto ${item.code}`;
                    return name.length > 20 ? name.substring(0, 17) + '...' : name;
                });
                const data = topNegativeItems.map(item => Math.abs(item.physicalInventory));
                
                // Crear gradiente rojo para las barras
                const redGradient = createGradient(ctx, enhancedConfig.gradients.red, 'horizontal');
                
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: '⚠️ Valor Absoluto de Inventario Negativo',
                            data: data,
                            backgroundColor: redGradient,
                            borderColor: enhancedConfig.colors.danger,
                            borderWidth: 2,
                            borderRadius: 6,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        ...getEnhancedBaseOptions('⚠️ Top 10 Productos con Mayor Inventario Negativo'),
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Valor Absoluto (Unidades)',
                                    font: {
                                        size: 14,
                                        weight: 'bold'
                                    },
                                    color: enhancedConfig.colors.dark
                                },
                                grid: {
                                    color: enhancedConfig.colors.light,
                                    lineWidth: 1
                                },
                                ticks: {
                                    color: enhancedConfig.colors.dark,
                                    font: {
                                        size: 12
                                    },
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: enhancedConfig.colors.dark,
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        },
                        plugins: {
                            ...getEnhancedBaseOptions().plugins,
                            legend: {
                                display: false
                            },
                            tooltip: {
                                ...getEnhancedBaseOptions().plugins.tooltip,
                                callbacks: {
                                    title: function(context) {
                                        const index = context[0].dataIndex;
                                        const item = topNegativeItems[index];
                                        return `⚠️ ${item.name || `Producto ${item.code}`}`;
                                    },
                                    label: function(context) {
                                        const index = context.dataIndex;
                                        const item = topNegativeItems[index];
                                        return [
                                            `Código: ${item.code}`,
                                            `Inventario: ${item.physicalInventory}`,
                                            `Valor absoluto: ${Math.abs(item.physicalInventory).toLocaleString()}`
                                        ];
                                    },
                                    afterBody: function() {
                                        return '💡 Requiere atención inmediata';
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 1800,
                            easing: 'easeOutBounce',
                            delay: (context) => context.dataIndex * 150
                        }
                    }
                });
                
                console.log('✅ Gráfico de inventario negativo mejorado creado');
                
            } catch (error) {
                console.error('❌ Error al crear gráfico de inventario negativo mejorado:', error);
            }
        }
        
        /**
         * 🎨 MEJORA 7: Mejorar contenedores de gráficos
         */
        function enhanceChartContainers() {
            const chartContainers = document.querySelectorAll('.chart-container');
            
            chartContainers.forEach((container, index) => {
                if (container.classList.contains('enhanced')) return;
                
                // Aplicar estilos mejorados
                container.style.cssText += `
                    background: linear-gradient(135deg, white 0%, #f8fafc 100%);
                    border-radius: 16px;
                    padding: 25px;
                    margin: 20px 0;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                `;
                
                // Añadir línea decorativa superior
                const decorativeLine = document.createElement('div');
                decorativeLine.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, ${enhancedConfig.colors.primary}, ${enhancedConfig.colors.secondary});
                    border-radius: 16px 16px 0 0;
                `;
                container.insertBefore(decorativeLine, container.firstChild);
                
                // Efectos hover
                container.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px)';
                    this.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
                });
                
                container.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)';
                });
                
                container.classList.add('enhanced');
            });
        }
        
        /**
         * 🚀 MEJORA 8: Función de render mejorada
         */
        let renderedOnce = false;
        function renderDashboardEnhanced() {
            try {
                if (renderedOnce) {
                    return originalFunctions.renderDashboard ? originalFunctions.renderDashboard() : undefined;
                }
                console.log('🎨 Aplicando mejoras visuales a gráficos...');
                
                // Ejecutar función original primero
                if (originalFunctions.renderDashboard) {
                    originalFunctions.renderDashboard();
                }
                
                // Aplicar mejoras visuales después
                setTimeout(() => {
                    enhanceChartContainers();
                    
                    // Recrear gráficos con estilos mejorados
                    setTimeout(() => {
                        createInventoryDistributionChartEnhanced();
                        createWarehouseDistributionChartEnhanced();
                        createNegativeInventoryChartEnhanced();
                        
                        // Aplicar mejoras de cards si existen
                        if (originalFunctions.createEnhancedMetricsCardsV2) {
                            originalFunctions.createEnhancedMetricsCardsV2();
                        }
                        renderedOnce = true;
                    }, 400);
                }, 300);
                
            } catch (error) {
                console.error('❌ Error aplicando mejoras visuales:', error);
                // Fallback a función original
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
            enhanceChartContainers,
            
            // Funciones de utilidad
            createGradient,
            getPremiumAnimations,
            getEnhancedBaseOptions,
            enhancedConfig
        };
    })();
    
})(window.InventorySystem || (window.InventorySystem = {}));

// Auto-inicialización
document.addEventListener('DOMContentLoaded', function() {
    if (window.InventorySystem?.Charts) {
        console.log('🎨 Mejoras visuales para gráficos cargadas');
        
        // Aplicar mejoras si hay gráficos existentes
        setTimeout(() => {
            const charts = document.querySelectorAll('canvas[id*="chart"]');
            if (charts.length > 0) {
                window.InventorySystem.Charts.enhanceChartContainers();
            }
        }, 1500);
    }
});

console.log('✨ Mejoras visuales para gráficos listas - estilo premium aplicado');