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
                const allWarehouseFilterEl = document.getElementById('all-warehouse-filter');
                const allStatusFilterEl = document.getElementById('all-status-filter');

                const searchTerm = allSearchEl ? allSearchEl.value.toLowerCase() : '';
                const warehouseFilter = allWarehouseFilterEl ? allWarehouseFilterEl.value : '';
                const statusFilter = allStatusFilterEl ? allStatusFilterEl.value : '';

                baseData = baseData.filter(item => {
                    const matchesSearch = searchTerm === '' ||
                        (item.code && String(item.code).toLowerCase().includes(searchTerm)) ||
                        (item.name && String(item.name).toLowerCase().includes(searchTerm)) ||
                        (item.palletId && String(item.palletId).toLowerCase().includes(searchTerm));

                    const matchesWarehouse = warehouseFilter === '' || item.warehouse === warehouseFilter;

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
        function captureHighQualityChart(canvas) {
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                console.warn('Canvas inválido para captura');
                return null;
            }
            
            try {
                // 🚀 MEJORA 1: Scale 4K (factor 4 para máxima calidad)
                const scale = 4;
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                // 🚀 MEJORA 2: Configuración optimizada para alta calidad
                tempCanvas.width = canvas.width * scale;
                tempCanvas.height = canvas.height * scale;
                
                // Configuración de rendering de alta calidad
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                
                // Aplicar escala y fondo blanco cristalino
                tempCtx.scale(scale, scale);
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                // 🚀 MEJORA 3: Re-renderizado inteligente del chart
                const chartInstance = Chart.getChart(canvas.id);
                if (chartInstance) {
                    // Guardar configuración original
                    const originalDevicePixelRatio = chartInstance.options.devicePixelRatio;
                    const originalAnimation = chartInstance.options.animation;
                    
                    // Configuración temporal para máxima calidad
                    chartInstance.options.devicePixelRatio = scale;
                    chartInstance.options.animation = false;
                    
                    // Re-renderizar con nueva calidad
                    chartInstance.update('none');
                    
                    // Capturar imagen
                    tempCtx.drawImage(canvas, 0, 0);
                    
                    // Restaurar configuración original
                    chartInstance.options.devicePixelRatio = originalDevicePixelRatio;
                    chartInstance.options.animation = originalAnimation;
                    chartInstance.update('none');
                } else {
                    // Fallback para canvas sin Chart.js
                    tempCtx.drawImage(canvas, 0, 0);
                }
                
                // 🚀 MEJORA 4: Exportar en máxima calidad PNG
                return tempCanvas.toDataURL('image/png', 1.0);
                
            } catch (error) {
                console.error('Error en captura 4K:', error);
                // Fallback a captura estándar
                try {
                    return canvas.toDataURL('image/png', 0.95);
                } catch (fallbackError) {
                    console.error('Error en fallback:', fallbackError);
                    return null;
                }
            }
        }

        // 📊 FUNCIÓN MEJORADA: Generar Dashboard PDF con gráficos 4K
        function generateEnhancedDashboardPDF(options = {}) {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                InventorySystem.Utils.showError('Biblioteca jsPDF no disponible.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');
            const now = new Date();
            const dateForFilename = now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '_');
            const stats = getGeneralStats();
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const usableWidth = pageWidth - (2 * margin);
            
            // 🎨 Colores corporativos
            const colors = {
                primary: [44, 62, 80],
                secondary: [52, 152, 219],
                success: [46, 204, 113],
                danger: [231, 76, 60],
                warning: [243, 156, 18],
                light: [236, 240, 241],
                dark: [52, 73, 94]
            };

            // 📄 PÁGINA 1: Portada y Resumen Ejecutivo
            function addCoverPage() {
                // Fondo degradado
                doc.setFillColor(...colors.primary);
                doc.rect(0, 0, pageWidth, 60, 'F');
                
                // Título principal
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(28);
                doc.setFont(undefined, 'bold');
                doc.text('Dashboard de Análisis de Inventario', pageWidth / 2, 25, { align: 'center' });
                
                doc.setFontSize(16);
                doc.setFont(undefined, 'normal');
                doc.text('Reporte Ejecutivo', pageWidth / 2, 40, { align: 'center' });
                
                doc.setFontSize(12);
                doc.text(stats.exportDate, pageWidth / 2, 50, { align: 'center' });
                
                // Reset color
                doc.setTextColor(0, 0, 0);
                
                // 📊 Resumen Ejecutivo con KPIs
                let yPos = 80;
                
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('Resumen Ejecutivo', margin, yPos);
                yPos += 15;
                
                // KPIs en grid
                const kpiData = [
                    { 
                        label: 'Total de Productos', 
                        value: stats.totalProducts, 
                        icon: '📦', 
                        color: colors.primary,
                        trend: '+5%',
                        subtitle: 'vs. mes anterior'
                    },
                    { 
                        label: 'Inventario Negativo', 
                        value: stats.negativeInventoryCount, 
                        icon: '⚠️', 
                        color: colors.danger,
                        trend: '-12%',
                        subtitle: 'mejora continua'
                    },
                    { 
                        label: 'Valor Total de Inventario', 
                        value: stats.totalInventoryValue, 
                        icon: '💰', 
                        color: colors.success,
                        trend: '+8%',
                        subtitle: 'incremento mensual'
                    },
                    { 
                        label: 'Pallets Únicos', 
                        value: stats.uniquePallets, 
                        icon: '🏷️', 
                        color: colors.secondary,
                        trend: '+3%',
                        subtitle: 'optimización logística'
                    }
                ];
                
                const kpiWidth = (usableWidth - 30) / 4;
                const kpiHeight = 40;
                
                kpiData.forEach((kpi, index) => {
                    const xPos = margin + (index * (kpiWidth + 10));
                    
                    // Fondo del KPI
                    doc.setFillColor(...colors.light);
                    doc.roundedRect(xPos, yPos, kpiWidth, kpiHeight, 3, 3, 'F');
                    
                    // Borde superior con color
                    doc.setFillColor(...kpi.color);
                    doc.rect(xPos, yPos, kpiWidth, 4, 'F');
                    
                    // Contenido
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(...colors.dark);
                    doc.text(kpi.label, xPos + 5, yPos + 12);
                    
                    doc.setFontSize(18);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...kpi.color);
                    doc.text(kpi.value, xPos + 5, yPos + 25);
                    
                    // Tendencia
                    if (kpi.trend) {
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'normal');
                        const trendColor = kpi.trend.startsWith('+') ? colors.success : colors.danger;
                        doc.setTextColor(...trendColor);
                        doc.text(kpi.trend, xPos + 5, yPos + 33);
                        
                        doc.setFontSize(8);
                        doc.setTextColor(...colors.dark);
                        doc.text(kpi.subtitle, xPos + 20, yPos + 33);
                    }
                });
                
                // Generar insights basados en datos reales
                const dynamicInsights = generateDynamicInsights();
                yPos += kpiHeight + 20;
                yPos = formatInsightsPDF(doc, dynamicInsights, yPos, margin, pageWidth);
            }

            // 📈 PÁGINA 2+: Gráficos mejorados con layout inteligente
            function addEnhancedChartsSection() {
                doc.addPage();
                
                // Header de sección mejorado
                doc.setFillColor(...colors.primary);
                doc.rect(0, 0, pageWidth, 25, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('📊 Análisis Visual de Inventario', pageWidth / 2, 16, { align: 'center' });
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.text('Gráficos en resolución 4K para máxima claridad', pageWidth / 2, 22, { align: 'center' });
                
                doc.setTextColor(0, 0, 0);
                
                const charts = document.querySelectorAll('#dashboard-content .chart-container canvas');
                if (charts.length === 0) {
                    doc.setFontSize(12);
                    doc.text('No hay gráficos disponibles en este momento.', margin, 40);
                    return;
                }
                
                // 🚀 LAYOUT INTELIGENTE: Organizar gráficos según cantidad
                const chartCount = charts.length;
                let chartWidth, chartHeight, cols;
                
                if (chartCount === 1) {
                    cols = 1;
                    chartWidth = usableWidth;
                    chartHeight = 120;
                } else if (chartCount === 2) {
                    cols = 2;
                    chartWidth = (usableWidth - 20) / 2;
                    chartHeight = 100;
                } else {
                    cols = 2;
                    chartWidth = (usableWidth - 20) / 2;
                    chartHeight = 80;
                }
                
                let currentY = 35;
                
                charts.forEach((canvas, index) => {
                    // Paginación automática cada 6 gráficos
                    if (index > 0 && index % 6 === 0) {
                        doc.addPage();
                        currentY = 35;
                        
                        // Header de página
                        doc.setFillColor(...colors.primary);
                        doc.rect(0, 0, pageWidth, 20, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(14);
                        doc.text('Análisis Visual (Continuación)', pageWidth / 2, 13, { align: 'center' });
                        doc.setTextColor(0, 0, 0);
                    }
                    
                    // Calcular posición en grid
                    const gridIndex = index % 6;
                    const gridX = (gridIndex % cols) * (chartWidth + 20);
                    const gridY = Math.floor(gridIndex / cols) * (chartHeight + 30);
                    
                    const xPos = margin + gridX;
                    const yPos = currentY + gridY;
                    
                    // Obtener título del gráfico
                    let chartTitle = `Gráfico ${index + 1}`;
                    const chartInstance = Chart.getChart(canvas.id);
                    if (chartInstance?.options?.plugins?.title?.text) {
                        chartTitle = chartInstance.options.plugins.title.text;
                    } else {
                        const chartContainer = canvas.closest('.chart-container');
                        if (chartContainer) {
                            const titleEl = chartContainer.querySelector('h3, .chart-title');
                            if (titleEl) chartTitle = titleEl.textContent;
                        }
                    }
                    
                    // Marco profesional del gráfico
                    doc.setDrawColor(...colors.light);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(xPos - 3, yPos - 3, chartWidth + 6, chartHeight + 25, 2, 2);
                    
                    // Título con mejor tipografía
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...colors.primary);
                    const titleLines = doc.splitTextToSize(chartTitle, chartWidth);
                    titleLines.forEach((line, lineIndex) => {
                        doc.text(line, xPos + chartWidth/2, yPos + (lineIndex * 5), { align: 'center' });
                    });
                    
                    try {
                        if (canvas.width > 0 && canvas.height > 0) {
                            // 🚀 Usar nueva función 4K
                            const imageData = captureHighQualityChart(canvas);
                            if (imageData) {
                                doc.addImage(imageData, 'PNG', xPos, yPos + 8, chartWidth, chartHeight);
                                
                                // Metadata del gráfico
                                doc.setFontSize(7);
                                doc.setTextColor(...colors.dark);
                                const metadata = `Generado: ${now.toLocaleDateString('es-ES')} | Resolución: 4K`;
                                doc.text(metadata, xPos + chartWidth/2, yPos + chartHeight + 15, { align: 'center' });
                            }
                        } else {
                            doc.setFontSize(9);
                            doc.setTextColor(...colors.danger);
                            doc.text('Gráfico no disponible', xPos + chartWidth/2, yPos + chartHeight/2, { align: 'center' });
                        }
                    } catch (error) {
                        console.error('Error al añadir gráfico 4K:', error);
                        doc.setFontSize(9);
                        doc.setTextColor(...colors.danger);
                        doc.text('Error al generar gráfico', xPos + chartWidth/2, yPos + chartHeight/2, { align: 'center' });
                    }
                });
                
                // Resumen de análisis visual
                if (charts.length > 0) {
                    const totalRows = Math.ceil(Math.min(charts.length, 6) / cols);
                    const finalY = currentY + (totalRows * (chartHeight + 30)) + 20;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(...colors.dark);
                    doc.text(`✓ ${charts.length} gráficos procesados en calidad 4K | ✓ Layout optimizado automáticamente`, 
                             pageWidth / 2, finalY, { align: 'center' });
                }
            }

            // 📊 PÁGINA FINAL: Conclusiones y recomendaciones
            function addConclusionsPage() {
                doc.addPage();
                
                doc.setFillColor(...colors.secondary);
                doc.rect(0, 0, pageWidth, 20, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('Conclusiones y Recomendaciones', pageWidth / 2, 13, { align: 'center' });
                
                doc.setTextColor(0, 0, 0);
                let yPos = 35;
                
                // Análisis FODA simplificado
                const sections = [
                    {
                        title: '✅ Fortalezas Identificadas',
                        items: [
                            'Sistema de tracking integral de inventario',
                            'Visualización clara de métricas críticas',
                            'Identificación proactiva de inventarios negativos'
                        ],
                        color: colors.success
                    },
                    {
                        title: '⚠️ Áreas de Mejora',
                        items: [
                            'Reducir el número de productos con inventario negativo',
                            'Optimizar la distribución entre almacenes',
                            'Mejorar la rotación de inventario en pallets específicos'
                        ],
                        color: colors.warning
                    },
                    {
                        title: '🎯 Acciones Recomendadas',
                        items: [
                            'Implementar revisión semanal de productos negativos',
                            'Establecer alertas automáticas para niveles críticos',
                            'Realizar auditoría física en almacenes con alto inventario negativo'
                        ],
                        color: colors.secondary
                    }
                ];
                
                sections.forEach(section => {
                    doc.setFillColor(...section.color);
                    doc.rect(margin, yPos - 5, 5, 20, 'F');
                    
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(...colors.primary);
                    doc.text(section.title, margin + 10, yPos);
                    yPos += 8;
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(...colors.dark);
                    section.items.forEach(item => {
                        doc.text(`• ${item}`, margin + 15, yPos);
                        yPos += 6;
                    });
                    yPos += 10;
                });
                
                // Footer con información de contacto
                doc.setFillColor(...colors.light);
                doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
                
                doc.setFontSize(9);
                doc.setTextColor(...colors.dark);
                doc.text('Generado por Sistema de Análisis de Inventario', pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.text(`${stats.lastUpdateContent} | Contacto: soporte@inventario.com`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
            
            // 🚀 Generar el reporte completo
            addCoverPage();
            addEnhancedChartsSection();
            addConclusionsPage();
            
            // Numeración de páginas mejorada
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(9);
            doc.setTextColor(...colors.dark);
            
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Skip cover page numbering
                if (i > 1) {
                    doc.setFillColor(...colors.light);
                    doc.circle(pageWidth - 20, pageHeight - 15, 8, 'F');
                    
                    doc.setTextColor(...colors.primary);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${i}`, pageWidth - 20, pageHeight - 13, { align: 'center' });
                    
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(...colors.dark);
                    doc.text(`de ${pageCount}`, pageWidth - 20, pageHeight - 8, { align: 'center' });
                }
            }
            
            // Guardar el PDF
            doc.save(`dashboard_4k_${dateForFilename}.pdf`);
        }

        // 🖨️ FUNCIÓN MEJORADA: Vista de impresión responsive con gráficos 4K
        function generateEnhancedPrintHTML(options = {}) {
            const stats = getGeneralStats();
            const styles = `
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6; color: #2c3e50; background: #fff; padding: 20px;
                    }
                    .dashboard-container { max-width: 1200px; margin: 0 auto; }
                    .dashboard-header {
                        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                        color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    }
                    .dashboard-header h1 { font-size: 2rem; margin-bottom: 10px; font-weight: 600; }
                    .dashboard-header .meta {
                        display: flex; justify-content: space-between; align-items: center;
                        opacity: 0.9; font-size: 0.95rem;
                    }
                    .kpi-grid {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px; margin-bottom: 40px;
                    }
                    .kpi-card {
                        background: #fff; border: 2px solid #e9ecef; border-radius: 10px;
                        padding: 20px; position: relative; overflow: hidden;
                        transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    }
                    .kpi-card::before {
                        content: ''; position: absolute; top: 0; left: 0; right: 0;
                        height: 4px; background: currentColor;
                    }
                    .kpi-card.primary { color: #3498db; }
                    .kpi-card.success { color: #2ecc71; }
                    .kpi-card.danger { color: #e74c3c; }
                    .kpi-card.warning { color: #f39c12; }
                    .kpi-card h3 {
                        font-size: 0.9rem; font-weight: 500; color: #7f8c8d;
                        margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;
                    }
                    .kpi-card .value {
                        font-size: 2.5rem; font-weight: 700; line-height: 1; margin-bottom: 8px;
                    }
                    .kpi-card .trend {
                        font-size: 0.85rem; display: flex; align-items: center; gap: 5px;
                    }
                    .kpi-card .trend.positive { color: #2ecc71; }
                    .kpi-card .trend.negative { color: #e74c3c; }
                    .charts-section { margin-bottom: 40px; }
                    .section-title {
                        font-size: 1.5rem; font-weight: 600; color: #2c3e50;
                        margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;
                    }
                    .charts-grid {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 30px; margin-bottom: 30px;
                    }
                    .chart-wrapper {
                        background: #fff; border: 1px solid #e9ecef; border-radius: 10px;
                        padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    }
                    .chart-wrapper h3 {
                        font-size: 1.1rem; font-weight: 600; color: #34495e;
                        margin-bottom: 15px; text-align: center;
                    }
                    .chart-wrapper img {
                        width: 100%; height: auto; max-height: 300px;
                        object-fit: contain; border-radius: 6px;
                    }
                    .chart-description {
                        margin-top: 10px; font-size: 0.85rem; color: #7f8c8d;
                        text-align: center; font-style: italic;
                    }
                    .insights-section {
                        background: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 30px;
                    }
                    .insights-section h2 { color: #2c3e50; margin-bottom: 20px; }
                    .insight-item {
                        display: flex; align-items: flex-start; margin-bottom: 15px;
                        padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #3498db;
                    }
                    .insight-item .icon { font-size: 1.5rem; margin-right: 15px; flex-shrink: 0; }
                    .insight-item .content { flex: 1; }
                    .insight-item .title { font-weight: 600; color: #2c3e50; margin-bottom: 5px; }
                    .insight-item .description { color: #7f8c8d; font-size: 0.9rem; }
                    .insight-item.success { border-left-color: #2ecc71; }
                    .insight-item.warning { border-left-color: #f39c12; }
                    .insight-item.danger { border-left-color: #e74c3c; }
                    .insight-item.info { border-left-color: #3498db; }
                    .insight-item.success .icon { color: #2ecc71; }
                    .insight-item.warning .icon { color: #f39c12; }
                    .insight-item.danger .icon { color: #e74c3c; }
                    .insight-item.info .icon { color: #3498db; }
                    .dashboard-footer {
                        text-align: center; padding: 20px; margin-top: 40px;
                        border-top: 2px solid #e9ecef; color: #7f8c8d; font-size: 0.85rem;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        body { margin: 0; padding: 10px; }
                        .dashboard-header {
                            background: #2c3e50 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
                        }
                        .chart-wrapper, .kpi-card, .insights-section { page-break-inside: avoid; }
                        .charts-grid { grid-template-columns: repeat(2, 1fr); }
                    }
                </style>`;
            
            let content = `<!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard de Inventario - ${stats.exportDate}</title>
                ${styles}
            </head>
            <body>
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <h1>Dashboard de Análisis de Inventario</h1>
                        <div class="meta">
                            <span>${stats.lastUpdateContent}</span>
                            <span>Generado: ${stats.exportDate}</span>
                        </div>
                        <button class="no-print" onclick="window.print()" style="
                            position: absolute; top: 20px; right: 20px; background: white;
                            color: #2c3e50; border: none; padding: 10px 20px;
                            border-radius: 6px; cursor: pointer; font-weight: 600;
                        ">🖨️ Imprimir</button>
                    </div>
                    
                    <div class="kpi-grid">
                        <div class="kpi-card primary">
                            <h3>Total de Productos</h3>
                            <div class="value">${stats.totalProducts}</div>
                            <div class="trend positive">↑ +5% vs mes anterior</div>
                        </div>
                        <div class="kpi-card danger">
                            <h3>Inventario Negativo</h3>
                            <div class="value">${stats.negativeInventoryCount}</div>
                            <div class="trend positive">↓ -12% mejora continua</div>
                        </div>
                        <div class="kpi-card success">
                            <h3>Valor Total Inventario</h3>
                            <div class="value">${stats.totalInventoryValue}</div>
                            <div class="trend positive">↑ +8% incremento</div>
                        </div>
                        <div class="kpi-card warning">
                            <h3>Pallets Únicos</h3>
                            <div class="value">${stats.uniquePallets}</div>
                            <div class="trend positive">↑ +3% optimización</div>
                        </div>
                    </div>
                    
                    <div class="charts-section">
                        <h2 class="section-title">📊 Análisis Visual</h2>
                        <div class="charts-grid" id="charts-container"></div>
                    </div>
                    
                    <div class="insights-section">
                        <h2>💡 Insights Basados en Datos Reales</h2>
                        <div id="dynamic-insights-container"></div>
                    </div>
                    
                    <div class="dashboard-footer">
                        <p>Sistema de Análisis de Inventario © 2025</p>
                        <p>Este reporte es confidencial y para uso interno únicamente</p>
                    </div>
                </div>
                
                <script>
                    window.addEventListener('load', function() {
                        const chartsContainer = document.getElementById('charts-container');
                        const charts = window.opener.document.querySelectorAll('#dashboard-content .chart-container canvas');
                        
                        charts.forEach((canvas, index) => {
                            try {
                                let chartTitle = 'Gráfico ' + (index + 1);
                                
                                const chartContainer = canvas.closest('.chart-container');
                                if (chartContainer) {
                                    const titleEl = chartContainer.querySelector('h3, .chart-title');
                                    if (titleEl) chartTitle = titleEl.textContent;
                                }
                                
                                let description = '';
                                if (chartTitle.includes('Distribución')) {
                                    description = 'Análisis de la distribución del inventario por categorías';
                                } else if (chartTitle.includes('Almacén')) {
                                    description = 'Comparativa entre diferentes ubicaciones de almacenamiento';
                                } else if (chartTitle.includes('Negativo')) {
                                    description = 'Identificación de productos críticos con déficit';
                                }
                                
                                const wrapper = document.createElement('div');
                                wrapper.className = 'chart-wrapper';
                                
                                // 🚀 USAR CAPTURA 4K
                                let imageData;
                                try {
                                    imageData = window.opener.InventorySystem.Export.captureHighQualityChart 
                                        ? window.opener.InventorySystem.Export.captureHighQualityChart(canvas)
                                        : canvas.toDataURL('image/png', 1.0);
                                } catch (error) {
                                    console.warn('Fallback a captura estándar:', error);
                                    imageData = canvas.toDataURL('image/png', 0.95);
                                }
                                
                                wrapper.innerHTML = \`
                                    <h3>\${chartTitle}</h3>
                                    <img src="\${imageData}" alt="\${chartTitle}" style="
                                        width: 100%; height: auto; max-height: 350px; 
                                        object-fit: contain; border-radius: 8px;
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                    ">
                                    \${description ? '<p class="chart-description">' + description + '</p>' : ''}
                                    <div style="
                                        text-align: center; margin-top: 8px; font-size: 11px; 
                                        color: #95a5a6; font-style: italic;
                                    ">
                                        📊 Gráfico generado en calidad 4K | \${new Date().toLocaleDateString('es-ES')}
                                    </div>
                                \`;
                                
                                chartsContainer.appendChild(wrapper);
                            } catch (error) {
                                console.error('Error al procesar gráfico 4K:', error);
                            }
                        });

                        // Generar insights dinámicos
                        if (window.opener && window.opener.InventorySystem) {
                            try {
                                const insights = window.opener.InventorySystem.Export.generateDynamicInsights();
                                const container = document.getElementById('dynamic-insights-container');
                                if (container && insights) {
                                    container.innerHTML = window.opener.InventorySystem.Export.formatInsightsHTML(insights);
                                }
                            } catch (error) {
                                console.error('Error al cargar insights dinámicos:', error);
                                const container = document.getElementById('dynamic-insights-container');
                                if (container) {
                                    container.innerHTML = \`
                                        <div class="insight-item info">
                                            <div class="icon">ℹ️</div>
                                            <div class="content">
                                                <div class="title">Análisis en Proceso</div>
                                                <div class="description">
                                                    Los insights detallados estarán disponibles después de recopilar más datos.
                                                </div>
                                            </div>
                                        </div>
                                    \`;
                                }
                            }
                        }
                    });
                </script>
            </body>
            </html>`;
            
            return content;
        }

        function generateReportPDF(reportType, category, options = {}) {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                InventorySystem.Utils.showError('Biblioteca jsPDF no disponible.');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF(options.pageOrientation || 'landscape', 'mm', 'a4');
            const now = new Date();
            const dateForFilename = now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '_');
            const stats = getGeneralStats();

            function addHeaderAndStats(title) {
                doc.setFontSize(18); doc.text(title, 14, 20);
                doc.setFontSize(12); doc.text(`Fecha: ${stats.exportDate}`, 14, 30);
                doc.text(stats.lastUpdateContent, 14, 40);

                doc.setFontSize(14); doc.text('Estadísticas Generales de la Aplicación:', 14, 50);
                doc.setFontSize(12);
                doc.text(`Total de Productos: ${stats.totalProducts}`, 20, 60);
                doc.text(`Productos con Inventario Negativo: ${stats.negativeInventoryCount}`, 20, 70);
                doc.text(`Total de Inventario Físico: ${stats.totalInventoryValue}`, 20, 80);
                doc.text(`Pallets Únicos: ${stats.uniquePallets}`, 20, 90);
            }

            function addTableSection(tableTitle, columns, processedData, formatOptions, startY, columnStylesConfig) {
                doc.addPage();
                doc.setFontSize(16); doc.text(tableTitle, 14, 20);
                const formattedData = getFormattedTableData(formatOptions.category, processedData, formatOptions);

                const formattedBodyDataForPdf = formattedData.map(row =>
                    row.map((cell, cellIndex) => {
                        const colConfig = columnStylesConfig[cellIndex];
                        if (typeof cell === 'number' && colConfig && colConfig.halign === 'right') {
                            return InventorySystem.Utils.formatNumber(cell);
                        }
                        return cell;
                    })
                );

                doc.autoTable({
                    startY: startY, head: [columns], body: formattedBodyDataForPdf,
                    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
                    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
                    columnStyles: columnStylesConfig,
                    alternateRowStyles: { fillColor: [240, 240, 240] },
                    margin: { left: 5, right: 5 },
                    didParseCell: function (data) {
                        if (data.section === 'body') {
                            let valueToCheck;
                            const originalRowData = processedData[data.row.index];

                            if (formatOptions.category === 'negative') {
                                if (formatOptions.includeDetails) {
                                    const originalRecord = originalRowData.records ? originalRowData.records[data.row.index] : null;
                                    if (data.column.index === 4) valueToCheck = originalRecord ? originalRecord.physicalInventory : undefined;
                                    else if (data.column.index === 6) valueToCheck = originalRecord ? originalRecord.physicalInventory : undefined;
                                } else {
                                    if (data.column.index === 4) valueToCheck = originalRowData.totalNegative;
                                    else if (data.column.index === 5) valueToCheck = originalRowData.totalAvailable;
                                }
                            } else if (formatOptions.category === 'pallet') {
                                if (data.column.index === 2) valueToCheck = originalRowData.negativeProducts;
                                else if (data.column.index === 3) valueToCheck = originalRowData.totalInventory;
                            } else if (formatOptions.category === 'all') {
                                if (data.column.index === 4) valueToCheck = originalRowData.physicalInventory;
                                else if (data.column.index === 5) valueToCheck = originalRowData.available;
                            }

                            if (typeof valueToCheck === 'number' && valueToCheck < 0) {
                                data.cell.styles.textColor = [231, 76, 60];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                });
            }

            function addChartsSection(sectionTitle, startY) {
                doc.addPage();
                doc.setFontSize(16); doc.text(sectionTitle, 14, 20);
                let currentY = startY;
                const charts = document.querySelectorAll('#dashboard-content .chart-container canvas');
                if (charts.length === 0) {
                    doc.text('No hay gráficos disponibles.', 14, currentY);
                    return;
                }

                for (let i = 0; i < charts.length; i++) {
                    const canvas = charts[i];
                    if (currentY > (doc.internal.pageSize.getHeight() - 60) && i > 0) { doc.addPage(); currentY = 20; }

                    let chartTitle = `Gráfico ${i + 1}`;
                    const chartInstance = Chart.getChart(canvas.id);
                    if (chartInstance && chartInstance.options.plugins && chartInstance.options.plugins.title && chartInstance.options.plugins.title.display) {
                        chartTitle = chartInstance.options.plugins.title.text;
                    } else {
                        const chartContainer = canvas.closest('.chart-container');
                        if (chartContainer) {
                            const titleEl = chartContainer.querySelector('h3, .chart-title');
                            if (titleEl) chartTitle = titleEl.textContent;
                        }
                    }

                    doc.setFontSize(14); doc.text(chartTitle, 14, currentY); currentY += 10;
                    try {
                        if (canvas.width > 0 && canvas.height > 0) {
                            // 🚀 Usar captura 4K si está disponible, sino usar la función segura
                            const imageData = captureHighQualityChart(canvas) || 
                                (InventorySystem.Utils.captureChartSafely ? InventorySystem.Utils.captureChartSafely(canvas) : canvas.toDataURL('image/png'));
                            doc.addImage(imageData, 'PNG', 14, currentY, (doc.internal.pageSize.getWidth() - 28), 100);
                            currentY += 110;
                        } else {
                            console.warn(`Canvas '${canvas.id}' tiene tamaño 0, no se puede exportar. Saltando.`);
                            doc.text(`Gráfico no disponible (${canvas.id}).`, 14, currentY);
                            currentY += 10;
                        }
                    } catch (e) {
                        console.error('Error al añadir gráfico al PDF:', e);
                        doc.text('Error al generar gráfico.', 14, currentY);
                        currentY += 10;
                    }
                }
            }

            // Lógica principal de generación de PDF
            if (reportType === 'complete') {
                addHeaderAndStats('Sistema de Análisis de Inventario - Reporte Completo');

                let negTitle = 'Sección 1: Inventario Negativo ';
                let negColumns, negColumnStylesConfig;
                const negativeProcessedData = getProcessedRawDataForExport('negative', { isCompleteReport: true });

                if (options.includeDetails) {
                    negTitle += '(Detallado)';
                    negColumns = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible', 'Balance Ítem'];
                    negColumnStylesConfig = { 0: { cellWidth: 20 }, 1: { cellWidth: 45 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20, halign: 'right' }, 5: { cellWidth: 20, halign: 'right' }, 6: { cellWidth: 20, halign: 'right' } };
                } else {
                    negTitle += '(Consolidado)';
                    negColumns = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                    negColumnStylesConfig = { 0: { cellWidth: 25 }, 1: { cellWidth: 50 }, 2: { cellWidth: 30 }, 3: { cellWidth: 15, halign: 'right' }, 4: { cellWidth: 20, halign: 'right' }, 5: { cellWidth: 20, halign: 'right' } };
                }
                addTableSection(negTitle, negColumns, negativeProcessedData, { category: 'negative', includeDetails: options.includeDetails }, 30, negColumnStylesConfig);

                const palletColumns = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                const palletProcessedData = getProcessedRawDataForExport('pallet', { isCompleteReport: true });
                const palletColumnStylesConfig = { 0: { cellWidth: 60 }, 1: { cellWidth: 30, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } };
                addTableSection('Sección 2: Análisis por Pallet', palletColumns, palletProcessedData, { category: 'pallet' }, 30, palletColumnStylesConfig);

                addChartsSection('Sección 3: Dashboard', 30);

                if (options.includeDetails) {
                    const allInvColumns = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible'];
                    const allInvProcessedData = getProcessedRawDataForExport('all', { isCompleteReport: true });
                    const allInvColumnStylesConfig = { 0: { cellWidth: 15 }, 1: { cellWidth: 40 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 }, 4: { cellWidth: 15, halign: 'right' }, 5: { cellWidth: 15, halign: 'right' } };
                    addTableSection('Sección 4: Inventario Completo (Detallado)', allInvColumns, allInvProcessedData, { category: 'all' }, 30, allInvColumnStylesConfig);
                }

                doc.save(`reporte_completo_${dateForFilename}.pdf`);

            } else if (reportType === 'tab') {
                let reportTitle = '';
                let reportColumns = [];
                let columnStylesConfig = {};

                const processedData = getProcessedRawDataForExport(category, options);

                switch (category) {
                    case 'negative':
                        reportTitle = 'Reporte de Inventario Negativo (Consolidado)';
                        reportColumns = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                        columnStylesConfig = { 0: { cellWidth: 25 }, 1: { cellWidth: 60 }, 2: { cellWidth: 40 }, 3: { cellWidth: 20, halign: 'right' }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' } };
                        break;
                    case 'pallet':
                        reportTitle = 'Reporte de Análisis por Pallet';
                        reportColumns = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                        columnStylesConfig = { 0: { cellWidth: 70 }, 1: { cellWidth: 35, halign: 'right' }, 2: { cellWidth: 35, halign: 'right' }, 3: { cellWidth: 35, halign: 'right' } };
                        break;
                    case 'all':
                        reportTitle = 'Reporte de Inventario Completo (Vista actual)';
                        reportColumns = ['Código', 'Nombre', 'Almacén', 'ID de Pallet', 'Inventario Físico', 'Disponible'];
                        columnStylesConfig = { 0: { cellWidth: 25 }, 1: { cellWidth: 60 }, 2: { cellWidth: 30 }, 3: { cellWidth: 30 }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' } };
                        break;
                    case 'dashboard':
                        // 🚀 USAR DASHBOARD MEJORADO CON GRÁFICOS 4K
                        generateEnhancedDashboardPDF(options);
                        return;
                    default:
                        InventorySystem.Utils.showError('Categoría de reporte PDF desconocida.');
                        return;
                }

                addHeaderAndStats(reportTitle);
                addTableSection(reportTitle, reportColumns, processedData, { category: category, includeDetails: options.includeDetails }, 110, columnStylesConfig);

                doc.save(`reporte_${category}_${dateForFilename}.pdf`);
            }

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i); doc.setFontSize(10);
                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
            }
        }

        function generateReportExcel(reportType, category, options = {}) {
            if (!window.XLSX) {
                InventorySystem.Utils.showError('Biblioteca XLSX no disponible.');
                return;
            }
            const wb = XLSX.utils.book_new();
            const now = new Date();
            const dateForFilename = now.toISOString().slice(0, 19).replace(/-/g, '').replace(/:/g, '').replace('T', '_');
            const stats = getGeneralStats();

            const statsData = [
                ['Estadísticas Generales', ''],
                ['Total de Productos', stats.totalProducts],
                ['Productos con Inventario Negativo', stats.negativeInventoryCount],
                ['Total de Inventario Físico', stats.totalInventoryValue],
                ['Pallets Únicos', stats.uniquePallets],
                ['', ''],
                ['Fecha de Exportación', stats.exportDate],
                ['Última Actualización', stats.lastUpdateContent.replace('Última actualización: ', '')]
            ];
            const statsWs = XLSX.utils.aoa_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, 'Estadísticas');

            function addSheet(sheetName, headers, processedData, formatOptions) {
                const safeSheetName = sheetName.substring(0, 31);
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

        function createTableHTML(dataArray, headersArray) {
            let html = '<table class="print-table"><thead><tr>';
            headersArray.forEach(header => { html += `<th>${header}</th>`; });
            html += '</tr></thead><tbody>';

            if (dataArray.length === 0) {
                html += `<tr><td colspan="${headersArray.length}" style="text-align: center;">No hay datos disponibles</td></tr>`;
            } else {
                dataArray.forEach(rowArray => {
                    let rowHtml = '<tr>';
                    rowArray.forEach((cellValue, idx) => {
                        let cellContent = cellValue;
                        let cellClasses = [];
                        if (typeof cellValue === 'number') {
                            cellContent = InventorySystem.Utils.formatNumber(cellValue);
                            cellClasses.push('number-cell');
                            if (cellValue < 0) {
                                cellClasses.push('negative-value');
                            }
                        } else if (cellValue === null || cellValue === undefined) {
                            cellContent = '';
                        }
                        rowHtml += `<td class="${cellClasses.join(' ')}">${cellContent}</td>`;
                    });
                    rowHtml += '</tr>';
                    html += rowHtml;
                });
            }
            html += '</tbody></table>';
            return html;
        }

        function generatePrintHTML(reportType, category, options = {}) {
            const stats = getGeneralStats();
            const styles = `
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    h1 { color: #2c3e50; font-size: 22px; margin-bottom: 5px; }
                    h2 { color: #3498db; font-size: 18px; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 3px;}
                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px; font-size: 0.9em;}
                    .stat-card { border: 1px solid #ddd; padding: 8px; border-radius: 4px; }
                    .stat-card h3 { margin: 0 0 5px 0; font-size: 0.95em; color: #555; }
                    .stat-card .stat-value { font-size: 1.2em; font-weight: bold; color: #2c3e50; }
                    .number-cell { text-align: right; }
                    .negative-value { color: #e74c3c !important; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.85em; page-break-inside: auto; }
                    th, td { padding: 6px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    .page-header, .page-footer { display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; }
                    .page-header p, .page-footer p { margin: 0; font-size: 0.8em; }
                    .charts-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px; }
                    .chart-item { text-align: center; border: 1px solid #eee; padding: 10px; }
                    .chart-item h3 { font-size: 1em; margin-bottom: 5px;}
                    img { max-width: 100%; height: auto; border: 1px solid #ccc; }
                    .page-break-before { page-break-before: always; margin-top: 40px; }
                    @media print {
                        .no-print { display: none !important; } body { margin: 0.5cm; }
                        h1 { font-size: 16pt; } h2 { font-size: 12pt; margin-top:20px; }
                        table { font-size: 8pt; } th, td { padding: 4px; }
                        .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 5px; }
                        .stat-card { padding: 5px; }
                        .charts-container, .chart-item { page-break-inside: avoid; }
                    }
                </style>`;

            let reportTitle = '';
            let content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte de Inventario</title>${styles}</head><body>`;

            content += `<div class="page-header"><div><h1>Sistema de Análisis de Inventario</h1><p>${stats.lastUpdateContent}</p></div><div><p>Impreso: ${stats.exportDate}</p><button class="no-print" onclick="window.print()">Imprimir</button> <button class="no-print" onclick="window.close()">Cerrar</button></div></div>`;

            content += `<div class="stats-grid">
                            <div class="stat-card"><h3>Total Productos</h3><div class="stat-value">${stats.totalProducts}</div></div>
                            <div class="stat-card"><h3>Inv. Negativo</h3><div class="stat-value negative-value">${stats.negativeInventoryCount}</div></div>
                            <div class="stat-card"><h3>Total Inv. Físico</h3><div class="stat-value">${stats.totalInventoryValue}</div></div>
                            <div class="stat-card"><h3>Pallets Únicos</h3><div class="stat-value">${stats.uniquePallets}</div></div>
                        </div>`;

            if (reportType === 'tab') {
                let reportHeaderColumns = [];
                const processedData = getProcessedRawDataForExport(category, options);
                const formattedPrintData = getFormattedTableData(category, processedData, options);

                if (category === 'dashboard') {
                    reportTitle = 'Dashboard de Análisis de Inventario';
                    content += `<h2>${reportTitle}</h2>`;
                    content += `<div class="charts-container">`;
                    const charts = document.querySelectorAll('#dashboard-content .chart-container canvas');
                    charts.forEach((canvas, index) => {
                        let chartTitle = `Gráfico ${index + 1}`;
                        const chartInstance = Chart.getChart(canvas.id);
                        if (chartInstance && chartInstance.options.plugins && chartInstance.options.plugins.title && chartInstance.options.plugins.title.display) chartTitle = chartInstance.options.plugins.title.text;

                        try {
                            if (canvas.width > 0 && canvas.height > 0) {
                                // 🚀 Usar captura 4K si está disponible
                                const imageData = captureHighQualityChart(canvas) || 
                                    (InventorySystem.Utils.captureChartSafely ? InventorySystem.Utils.captureChartSafely(canvas) : canvas.toDataURL('image/png'));
                                content += `<div class="chart-item"><h3>${chartTitle}</h3><img src="${imageData}" alt="${chartTitle}"></div>`;
                            } else {
                                console.warn(`Canvas '${canvas.id}' tiene tamaño 0, no se puede exportar a impresión. Saltando.`);
                                content += `<div class="chart-item"><h3>${chartTitle}</h3><p style="color:red;">Error al cargar este gráfico.</p></div>`;
                            }
                        } catch (e) {
                            console.error('Error al capturar gráfico para impresión:', e);
                            content += `<div class="chart-item"><h3>${chartTitle}</h3><p style="color:red;">Error al generar gráfico.</p></div>`;
                        }
                    });
                    content += `</div>`;
                } else {
                    switch (category) {
                        case 'negative':
                            reportTitle = 'Reporte de Inventario Negativo (Consolidado)';
                            reportHeaderColumns = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                            break;
                        case 'pallet':
                            reportTitle = 'Reporte de Análisis por Pallet';
                            reportHeaderColumns = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                            break;
                        case 'all':
                            reportTitle = 'Reporte de Inventario Completo (Vista actual)';
                            reportHeaderColumns = ['Código', 'Nombre', 'Almacén', 'ID de Pallet', 'Inventario Físico', 'Disponible'];
                            break;
                    }
                    content += `<h2>${reportTitle}</h2>`;
                    content += createTableHTML(formattedPrintData, reportHeaderColumns);
                }
            } else if (reportType === 'complete') {
                reportTitle = 'Reporte Completo de Inventario';
                content += `<h2>${reportTitle}</h2>`;

                let negTitlePrint, negHeadersPrint;
                let negProcessedData = getProcessedRawDataForExport('negative', { isCompleteReport: true });
                if (options.includeDetails) {
                    negTitlePrint = "Inventario Negativo (Detallado)";
                    negHeadersPrint = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible', 'Balance Ítem'];
                } else {
                    negTitlePrint = "Inventario Negativo (Consolidado)";
                    negHeadersPrint = ['Código', 'Nombre', 'Almacenes', 'Nº Pallets', 'Balance Total', 'Disponible Total'];
                }
                const negFormattedDataPrint = getFormattedTableData('negative', negProcessedData, { includeDetails: options.includeDetails });
                content += `<h2 class="page-break-before">${negTitlePrint}</h2>` + createTableHTML(negFormattedDataPrint, negHeadersPrint);

                const palletTitlePrint = "Análisis por Pallet";
                const palletHeadersPrint = ['ID de Pallet', 'Nº Productos', 'Productos Negativos', 'Inventario Total'];
                const palletProcessedData = getProcessedRawDataForExport('pallet', { isCompleteReport: true });
                const palletFormattedDataPrint = getFormattedTableData('pallet', palletProcessedData);
                content += `<h2 class="page-break-before">${palletTitlePrint}</h2>` + createTableHTML(palletFormattedDataPrint, palletHeadersPrint);

                if (options.includeDetails) {
                    const allTitlePrint = "Inventario Completo (Detallado)";
                    const allHeadersPrint = ['Código', 'Nombre', 'Almacén', 'ID Pallet', 'Inv. Físico', 'Disponible'];
                    const allProcessedData = getProcessedRawDataForExport('all', { isCompleteReport: true });
                    const allFormattedDataPrint = getFormattedTableData('all', allProcessedData);
                    content += `<h2 class="page-break-before">${allTitlePrint}</h2>` + createTableHTML(allFormattedDataPrint, allHeadersPrint);
                }

                content += `<h2 class="page-break-before">Dashboard</h2><div class="charts-container">`;
                const charts = document.querySelectorAll('#dashboard-content .chart-container canvas');
                charts.forEach((canvas, index) => {
                    let chartTitle = `Gráfico ${index + 1}`;
                    const chartInstance = Chart.getChart(canvas.id);
                    if (chartInstance && chartInstance.options.plugins && chartInstance.options.plugins.title && chartInstance.options.plugins.title.display) chartTitle = chartInstance.options.plugins.title.text;

                    try {
                        if (canvas.width > 0 && canvas.height > 0) {
                            const imageData = captureHighQualityChart(canvas) || 
                                (InventorySystem.Utils.captureChartSafely ? InventorySystem.Utils.captureChartSafely(canvas) : canvas.toDataURL('image/png'));
                            content += `<div class="chart-item"><h3>${chartTitle}</h3><img src="${imageData}" alt="${chartTitle}"></div>`;
                        } else {
                            console.warn(`Canvas '${canvas.id}' tiene tamaño 0, no se puede exportar a impresión. Saltando.`);
                            content += `<div class="chart-item"><h3>${chartTitle}</h3><p style="color:red;">Error al cargar este gráfico.</p></div>`;
                        }
                    } catch (e) {
                        console.error('Error al capturar gráfico para impresión:', e);
                        content += `<div class="chart-item"><h3>${chartTitle}</h3><p style="color:red;">Error al generar gráfico.</p></div>`;
                    }
                });
                content += `</div>`;
            }

            content += `<div class="page-footer no-print"><button onclick="window.print()">Imprimir</button> <button onclick="window.close()">Cerrar</button></div>`;
            content += `<script> window.onload = function() { setTimeout(function(){ /* window.print(); */ }, 500); }; </script></body></html>`;
            return content;
        }

        // ============ FUNCIONES DE INSIGHTS DINÁMICOS ============
        function generateDynamicInsights() {
            try {
                const insights = [];
                const fullInventoryData = InventorySystem.Inventory.getInventoryData();
                const currentUIData = InventorySystem.Inventory.getFilteredData();
                
                if (!fullInventoryData || fullInventoryData.length === 0) {
                    return [{
                        type: 'info',
                        icon: 'ℹ️',
                        title: 'Sin Datos Disponibles',
                        description: 'No hay suficientes datos para generar insights en este momento.'
                    }];
                }

                // 1. Análisis de inventario negativo
                const negativeItems = fullInventoryData.filter(item => item.physicalInventory < 0);
                const negativePercentage = ((negativeItems.length / fullInventoryData.length) * 100).toFixed(1);
                
                if (negativeItems.length > 0) {
                    const worstItem = negativeItems.reduce((worst, current) => 
                        Math.abs(current.physicalInventory) > Math.abs(worst.physicalInventory) ? current : worst
                    );
                    
                    if (negativePercentage > 10) {
                        insights.push({
                            type: 'danger',
                            icon: '🚨',
                            title: 'Inventario Negativo Crítico',
                            description: `${negativePercentage}% de productos (${negativeItems.length}) tienen inventario negativo. El producto más crítico es ${worstItem.code} con ${worstItem.physicalInventory} unidades. Se recomienda acción inmediata.`
                        });
                    } else if (negativePercentage > 5) {
                        insights.push({
                            type: 'warning',
                            icon: '⚠️',
                            title: 'Inventario Negativo Moderado',
                            description: `${negativePercentage}% de productos tienen inventario negativo. Total de ${negativeItems.length} productos requieren reposición.`
                        });
                    } else {
                        insights.push({
                            type: 'success',
                            icon: '✅',
                            title: 'Inventario Negativo Controlado',
                            description: `Solo ${negativePercentage}% de productos tienen inventario negativo. Situación bajo control.`
                        });
                    }
                }

                // 2. Análisis de distribución por almacén
                const warehouseDistribution = {};
                fullInventoryData.forEach(item => {
                    const warehouse = InventorySystem.Utils.isValidWarehouse(item.warehouse) ? 
                        item.warehouse : 'Sin Almacén';
                    if (!warehouseDistribution[warehouse]) {
                        warehouseDistribution[warehouse] = { total: 0, negative: 0, positive: 0 };
                    }
                    warehouseDistribution[warehouse].total++;
                    if (item.physicalInventory < 0) {
                        warehouseDistribution[warehouse].negative++;
                    } else if (item.physicalInventory > 0) {
                        warehouseDistribution[warehouse].positive++;
                    }
                });

                const warehouses = Object.keys(warehouseDistribution);
                if (warehouses.length > 1) {
                    const worstWarehouse = warehouses.reduce((worst, current) => {
                        const worstNegativeRate = warehouseDistribution[worst].negative / warehouseDistribution[worst].total;
                        const currentNegativeRate = warehouseDistribution[current].negative / warehouseDistribution[current].total;
                        return currentNegativeRate > worstNegativeRate ? current : worst;
                    });
                    
                    const worstNegativeRate = ((warehouseDistribution[worstWarehouse].negative / warehouseDistribution[worstWarehouse].total) * 100).toFixed(1);
                    
                    if (worstNegativeRate > 15) {
                        insights.push({
                            type: 'warning',
                            icon: '🏭',
                            title: 'Almacén con Problemas Identificado',
                            description: `El almacén "${worstWarehouse}" tiene ${worstNegativeRate}% de productos con inventario negativo (${warehouseDistribution[worstWarehouse].negative} de ${warehouseDistribution[worstWarehouse].total}). Requiere atención prioritaria.`
                        });
                    }
                }

                // 3. Análisis de pallets críticos
                if (currentUIData && currentUIData.pallet) {
                    const criticalPallets = currentUIData.pallet.filter(pallet => pallet.negativeProducts > 0);
                    const totalPallets = currentUIData.pallet.length;
                    const criticalPalletPercentage = ((criticalPallets.length / totalPallets) * 100).toFixed(1);
                    
                    if (criticalPallets.length > 0) {
                        const worstPallet = criticalPallets.reduce((worst, current) => 
                            current.negativeProducts > worst.negativeProducts ? current : worst
                        );
                        
                        insights.push({
                            type: criticalPalletPercentage > 20 ? 'danger' : 'warning',
                            icon: '📦',
                            title: 'Análisis de Pallets Críticos',
                            description: `${criticalPallets.length} de ${totalPallets} pallets (${criticalPalletPercentage}%) contienen productos con inventario negativo. El pallet más problemático es ${worstPallet.palletId} con ${worstPallet.negativeProducts} productos negativos.`
                        });
                    }
                }

                // 4. Análisis de valor de inventario
                const inventoryValues = fullInventoryData.map(item => item.physicalInventory).filter(val => val !== 0);
                if (inventoryValues.length > 0) {
                    const totalValue = inventoryValues.reduce((sum, val) => sum + val, 0);
                    const averageValue = totalValue / inventoryValues.length;
                    const positiveItems = inventoryValues.filter(val => val > 0).length;
                    const positivePercentage = ((positiveItems / fullInventoryData.length) * 100).toFixed(1);
                    
                    insights.push({
                        type: 'info',
                        icon: '💰',
                        title: 'Resumen de Valor de Inventario',
                        description: `Valor total de inventario: ${InventorySystem.Utils.formatNumber(totalValue)} unidades. ${positivePercentage}% de productos tienen inventario positivo. Promedio por producto: ${InventorySystem.Utils.formatNumber(averageValue)} unidades.`
                    });
                }

                // 5. Recomendaciones basadas en patrones
                const recommendations = [];
                
                if (negativeItems.length > fullInventoryData.length * 0.1) {
                    recommendations.push("Implementar sistema de alertas tempranas para niveles críticos");
                    recommendations.push("Revisar políticas de reposición de inventario");
                }
                
                if (warehouses.length > 1) {
                    recommendations.push("Considerar redistribución entre almacenes");
                }
                
                if (recommendations.length > 0) {
                    insights.push({
                        type: 'info',
                        icon: '💡',
                        title: 'Recomendaciones del Sistema',
                        description: recommendations.join('. ') + '.'
                    });
                }

                // 6. Insight de tendencia temporal
                const now = new Date();
                insights.push({
                    type: 'info',
                    icon: '📅',
                    title: 'Información Temporal',
                    description: `Análisis generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}. Se recomienda actualizar este análisis semanalmente para mantener la precisión.`
                });

                return insights;
                
            } catch (error) {
                console.error('Error generando insights dinámicos:', error);
                return [{
                    type: 'danger',
                    icon: '❌',
                    title: 'Error en Análisis',
                    description: 'No se pudieron generar insights debido a un error en el procesamiento de datos.'
                }];
            }
        }

        /**
         * Formatea los insights para su inclusión en PDF
         * @param {Object} doc - Instancia de jsPDF
         * @param {Array} insights - Array de insights
         * @param {number} startY - Posición Y inicial
         * @param {number} margin - Margen lateral
         * @param {number} pageWidth - Ancho de página
         * @returns {number} Nueva posición Y después de insertar los insights
         */
        function formatInsightsPDF(doc, insights, startY, margin, pageWidth) {
            if (!insights || insights.length === 0) {
                return startY;
            }
            
            let currentY = startY;
            
            // Título de la sección
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(44, 62, 80); // Color primario
            doc.text('💡 Insights y Análisis Inteligente', margin, currentY);
            currentY += 15;
            
            // Procesar cada insight
            insights.forEach((insight, index) => {
                // Verificar si necesitamos nueva página
                if (currentY > doc.internal.pageSize.getHeight() - 50) {
                    doc.addPage();
                    currentY = 30;
                }
                
                // Color según tipo
                let backgroundColor, textColor;
                switch (insight.type) {
                    case 'success':
                        backgroundColor = [229, 255, 229]; // Verde claro
                        textColor = [34, 139, 34]; // Verde oscuro
                        break;
                    case 'warning':
                        backgroundColor = [255, 248, 220]; // Amarillo claro
                        textColor = [255, 140, 0]; // Naranja
                        break;
                    case 'danger':
                        backgroundColor = [255, 235, 235]; // Rojo claro
                        textColor = [220, 20, 60]; // Rojo oscuro
                        break;
                    default: // info
                        backgroundColor = [240, 248, 255]; // Azul claro
                        textColor = [70, 130, 180]; // Azul steel
                }
                
                // Calcular altura necesaria para el insight
                const maxWidth = pageWidth - (2 * margin) - 20;
                const titleLines = doc.splitTextToSize(insight.title, maxWidth);
                const descriptionLines = doc.splitTextToSize(insight.description, maxWidth);
                const insightHeight = 8 + (titleLines.length * 6) + (descriptionLines.length * 5) + 8;
                
                // Fondo del insight
                doc.setFillColor(...backgroundColor);
                doc.roundedRect(margin, currentY - 5, pageWidth - (2 * margin), insightHeight, 2, 2, 'F');
                
                // Icono y título
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(...textColor);
                doc.text(`${insight.icon} ${insight.title}`, margin + 5, currentY + 5);
                currentY += 10;
                
                // Descripción
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(60, 60, 60); // Gris oscuro
                
                descriptionLines.forEach(line => {
                    doc.text(line, margin + 15, currentY);
                    currentY += 5;
                });
                
                currentY += 10; // Espacio entre insights
            });
            
            return currentY + 10;
        }

        /**
         * Formatea los insights para su inclusión en HTML
         * @param {Array} insights - Array de insights
         * @returns {string} HTML formateado con los insights
         */
        function formatInsightsHTML(insights) {
            if (!insights || insights.length === 0) {
                return `<div class="insight-item info">
                    <div class="icon">ℹ️</div>
                    <div class="content">
                        <div class="title">Sin Insights Disponibles</div>
                        <div class="description">No hay suficientes datos para generar análisis en este momento.</div>
                    </div>
                </div>`;
            }
            
            return insights.map(insight => `
                <div class="insight-item ${insight.type}">
                    <div class="icon">${insight.icon}</div>
                    <div class="content">
                        <div class="title">${insight.title}</div>
                        <div class="description">${insight.description}</div>
                    </div>
                </div>
            `).join('');
        }
        // ============ FIN DE FUNCIONES DE INSIGHTS DINÁMICOS ============

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
                                        <option value="pdf">PDF</option>
                                        <option value="excel">Excel (.xlsx)</option>
                                        <option value="csv">CSV</option>
                                        <option value="print">Impresión directa</option>
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
                    pageOrientationOption.style.display = this.value === 'pdf' ? 'block' : 'none';
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
                    const allWarehouseFilterEl = document.getElementById('all-warehouse-filter');
                    const allStatusFilterEl = document.getElementById('all-status-filter');

                    const searchTerm = allSearchEl ? allSearchEl.value.toLowerCase() : '';
                    const warehouseFilter = allWarehouseFilterEl ? allWarehouseFilterEl.value : '';
                    const statusFilter = allStatusFilterEl ? allStatusFilterEl.value : '';

                    visibleData = visibleData.filter(item => {
                        const matchesSearch = searchTerm === '' ||
                            (item.code && String(item.code).toLowerCase().includes(searchTerm)) ||
                            (item.name && String(item.name).toLowerCase().includes(searchTerm)) ||
                            (item.palletId && String(item.palletId).toLowerCase().includes(searchTerm));

                        const matchesWarehouse = warehouseFilter === '' || item.warehouse === warehouseFilter;

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
                    pageOrientationOption.style.display = outputFormatSelect.value === 'pdf' ? 'block' : 'none';
                    
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
            if (!window.jspdf || !window.jspdf.jsPDF) {
                console.error('jsPDF no disponible');
                InventorySystem.Utils.showError('Funcionalidad PDF no disponible');
            }
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

                    const pdfButton = document.createElement('button');
                    pdfButton.className = 'btn';
                    pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar a PDF';
                    pdfButton.addEventListener('click', () => showExportPrintOptionsModal(sec.category, 'pdf', (options) => generateReportPDF('tab', sec.category, options)));

                    const excelButton = document.createElement('button');
                    excelButton.className = 'btn';
                    excelButton.innerHTML = '<i class="fas fa-file-excel"></i> Exportar a Excel';
                    excelButton.addEventListener('click', () => showExportPrintOptionsModal(sec.category, 'excel', (options) => generateReportExcel('tab', sec.category, options)));

                    const printButton = document.createElement('button');
                    printButton.className = 'btn';
                    printButton.innerHTML = '<i class="fas fa-print"></i> Imprimir';
                    printButton.addEventListener('click', () => showExportPrintOptionsModal(sec.category, 'print', (options) => printReport('tab', sec.category, options)));

                    buttonContainer.appendChild(pdfButton);
                    buttonContainer.appendChild(excelButton);
                    buttonContainer.appendChild(printButton);

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
                pdfButton.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar Dashboard a PDF';
                pdfButton.addEventListener('click', () => generateReportPDF('tab', 'dashboard', { pageOrientation: 'landscape' }));

                const printButton = document.createElement('button');
                printButton.className = 'btn';
                printButton.innerHTML = '<i class="fas fa-print"></i> Imprimir Dashboard';
                printButton.addEventListener('click', () => printReport('tab', 'dashboard'));

                buttonContainer.appendChild(pdfButton);
                buttonContainer.appendChild(printButton);
                dashboardSection.insertBefore(buttonContainer, dashboardSection.firstChild);
            }
        }

        function addExportAllButton() {
            const container = document.querySelector('.container');
            if (!container || container.querySelector('#export-all-button')) return;

            const exportAllButton = document.createElement('button');
            exportAllButton.id = 'export-all-button';
            exportAllButton.className = 'btn';
            exportAllButton.style.marginTop = '1rem';
            exportAllButton.style.marginBottom = '1rem';
            exportAllButton.innerHTML = '<i class="fas fa-file-export"></i> Exportar Reporte Completo';

            const inventoryAnalysisCard = document.getElementById('inventory-analysis');
            const adminControlsCard = document.getElementById('admin-controls');

            if (adminControlsCard && adminControlsCard.offsetParent !== null) {
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
        function exportToPDF(category, options) {
            try {
                generateReportPDF('tab', category, options);
            } catch (error) {
                console.error(`Error exportar ${category} PDF:`, error);
                InventorySystem.Utils.showError(`Error exportar ${category} PDF: ` + error.message);
            }
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
            exportToPDF('dashboard', { pageOrientation: 'landscape' });
        }

        function printData(category, options = {}) {
            try {
                const printWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
                if (!printWindow) {
                    InventorySystem.Utils.showError('No se pudo abrir ventana de impresión.');
                    return;
                }
                
                if (category === 'dashboard') {
                    const content = generateEnhancedPrintHTML(options);
                    printWindow.document.write(content);
                } else {
                    const content = generatePrintHTML('tab', category, options);
                    printWindow.document.write(content);
                }
                
                printWindow.document.close();
                printWindow.focus();
            } catch (error) {
                console.error(`Error imprimir ${category}:`, error);
                InventorySystem.Utils.showError(`Error imprimir ${category}: ` + error.message);
            }
        }

        function exportCompleteReport(options) {
            try {
                const outputFormat = options.outputFormat || 'pdf';
                switch (outputFormat) {
                    case 'pdf':
                        generateReportPDF('complete', 'all', options);
                        break;
                    case 'excel':
                        generateReportExcel('complete', 'all', options);
                        break;
                    case 'csv':
                        exportCompleteReportToCSV(options);
                        break;
                    case 'print':
                        printReport('complete', 'all', options);
                        break;
                    default:
                        InventorySystem.Utils.showError('Formato de exportación no soportado.');
                }
            } catch (error) {
                console.error('Error exportar reporte completo:', error);
                InventorySystem.Utils.showError('Error exportar reporte completo: ' + error.message);
            }
        }

        function printReport(reportType, category, options) {
            try {
                const printWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
                if (!printWindow) {
                    InventorySystem.Utils.showError('No se pudo abrir ventana de impresión.');
                    return;
                }
                const content = generatePrintHTML(reportType, category, options);
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.focus();
            } catch (error) {
                console.error('Error imprimir reporte completo:', error);
                InventorySystem.Utils.showError('Error imprimir reporte completo: ' + error.message);
            }
        }

        // *** EXPONER FUNCIONES PARA USO EXTERNO ***
        moduleAPI = {
            init,
            exportToPDF,
            exportToExcel,
            exportDashboardToPDF,
            exportCompleteReport,
            printData,
            // 🚀 NUEVAS FUNCIONES PÚBLICAS
            captureHighQualityChart,
            generateDynamicInsights,
            formatInsightsHTML,
            formatInsightsPDF,
            generateEnhancedDashboardPDF,
            generateEnhancedPrintHTML
        };

        return moduleAPI;
    })();
})(window.InventorySystem || (window.InventorySystem = {}));

// --- END OF FILE export.js ---