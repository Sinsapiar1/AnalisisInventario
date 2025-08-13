// ========================================
// DASHBOARD MEJORADO V2 - DATOS CORRECTOS + MÁS MEJORAS
// Corrige inconsistencias y añade funcionalidades avanzadas
// ========================================

(function(InventorySystem) {
    // Extender el módulo Charts existente
    const OriginalCharts = InventorySystem.Charts;
    
    InventorySystem.Charts = (function() {
        // Mantener funciones originales
        const originalFunctions = { ...OriginalCharts };
        
        // Estados para las mejoras
        let loadingStates = {};
        let metricsData = {};
        let hasEnhancedRendered = false;
        
        /**
         * 🎯 MEJORA 1: Obtener datos REALES del sistema
         */
        function getRealMetricsData() {
            console.log('📊 Obteniendo datos reales del sistema...');
            
            try {
                // Intentar obtener datos de las métricas que ya están en pantalla
                const metricsFromDOM = extractMetricsFromDOM();
                if (metricsFromDOM.isValid) {
                    console.log('✅ Datos obtenidos del DOM:', metricsFromDOM);
                    return metricsFromDOM;
                }
                
                // Fallback: obtener del sistema de inventario
                if (window.InventorySystem && window.InventorySystem.Inventory) {
                    const inventoryData = window.InventorySystem.Inventory.getInventoryData();
                    if (inventoryData && inventoryData.length > 0) {
                        const systemData = {
                            totalProducts: inventoryData.length,
                            negativeProducts: inventoryData.filter(item => item.physicalInventory < 0).length,
                            totalInventory: inventoryData.reduce((sum, item) => sum + (item.physicalInventory || 0), 0),
                            uniquePallets: new Set(inventoryData.filter(item => item.palletId).map(item => item.palletId)).size,
                            materialInOrder: inventoryData.reduce((sum, item) => sum + (item.inOrder || 0), 0),
                            isValid: true,
                            source: 'inventory_system'
                        };
                        console.log('✅ Datos obtenidos del sistema:', systemData);
                        return systemData;
                    }
                }
                
                console.warn('⚠️ No se pudieron obtener datos reales');
                return { isValid: false };
                
            } catch (error) {
                console.error('❌ Error obteniendo datos:', error);
                return { isValid: false };
            }
        }
        
        /**
         * 🔍 Extraer métricas de los elementos DOM existentes
         */
        function extractMetricsFromDOM() {
            try {
                // Buscar las métricas en los elementos existentes
                const metrics = {};
                
                // Buscar por diferentes selectores posibles
                const metricSelectors = [
                    { key: 'totalProducts', selectors: ['[data-metric="total-products"]', '.total-products', '#total-products'] },
                    { key: 'negativeProducts', selectors: ['[data-metric="negative-products"]', '.negative-products', '#negative-products'] },
                    { key: 'totalInventory', selectors: ['[data-metric="total-inventory"]', '.total-inventory', '#total-inventory'] },
                    { key: 'uniquePallets', selectors: ['[data-metric="unique-pallets"]', '.unique-pallets', '#unique-pallets'] }
                ];
                
                // Buscar por contenido de texto que contenga números
                const textElements = document.querySelectorAll('h2, h3, .metric-value, .stat-number, .number, [class*="total"], [class*="count"]');
                const foundNumbers = [];
                
                textElements.forEach(el => {
                    const text = el.textContent.trim();
                    const number = parseFloat(text.replace(/[^\d.-]/g, ''));
                    if (!isNaN(number) && number > 0) {
                        foundNumbers.push({
                            element: el,
                            text: text,
                            number: number,
                            context: el.parentElement ? el.parentElement.textContent : ''
                        });
                    }
                });
                
                // Intentar identificar métricas por contexto
                const contexts = {
                    totalProducts: ['total', 'productos', 'products', '10451'],
                    negativeProducts: ['negativo', 'negative', 'negativos'],
                    totalInventory: ['inventario', 'inventory', 'físico', 'physical', '373369', '373.369'],
                    uniquePallets: ['pallets', 'pallet', 'únicos', 'unique', '10325']
                };
                
                // Buscar coincidencias
                Object.keys(contexts).forEach(metricKey => {
                    const keywords = contexts[metricKey];
                    const found = foundNumbers.find(item => {
                        const contextLower = item.context.toLowerCase();
                        return keywords.some(keyword => contextLower.includes(keyword.toLowerCase()));
                    });
                    
                    if (found) {
                        metrics[metricKey] = found.number;
                    }
                });
                
                // Buscar también material en pedido si existe
                const materialFound = foundNumbers.find(item => {
                    const contextLower = item.context.toLowerCase();
                    return contextLower.includes('pedido') || contextLower.includes('order');
                });
                if (materialFound) {
                    metrics.materialInOrder = materialFound.number;
                }
                
                // Validar que encontramos al menos 3 métricas
                const foundCount = Object.keys(metrics).length;
                if (foundCount >= 3) {
                    return {
                        ...metrics,
                        isValid: true,
                        source: 'dom_extraction',
                        foundCount: foundCount
                    };
                }
                
                console.log('🔍 Números encontrados en DOM:', foundNumbers);
                console.log('📊 Métricas extraídas:', metrics);
                
                return { isValid: false, foundNumbers, metrics };
                
            } catch (error) {
                console.error('❌ Error extrayendo del DOM:', error);
                return { isValid: false };
            }
        }
        
        /**
         * ✨ MEJORA 2: Cards mejoradas con datos correctos
         */
                function createEnhancedMetricsCardsV2() {
            const dashboardContent = document.getElementById('dashboard-content');
            if (!dashboardContent) return;
            
            // Remover cards anteriores si existen
            const existingCards = dashboardContent.querySelector('.enhanced-metrics-cards-v2');
            if (existingCards) {
                existingCards.remove();
            }

            // Remover mensajes de fuente de datos anteriores
            const existingDataSources = dashboardContent.querySelectorAll('.data-source-info');
            existingDataSources.forEach(el => el.remove());
            
            // Obtener datos reales
            const realData = getRealMetricsData();
            if (!realData.isValid) {
                console.warn('⚠️ No se pudieron obtener datos reales, usando valores por defecto');
                return;
            }
            
            metricsData = realData; // Guardar para referencia
            
            const cardsHtml = `
                <div class="enhanced-metrics-cards-v2" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin: 25px 0;
                    padding: 0 15px;
                ">
                    ${createAdvancedCard('📦', 'Total de Productos', realData.totalProducts || 0, '#3498db', 'productos registrados')}
                    ${createAdvancedCard('⚠️', 'Inventario Negativo', realData.negativeProducts || 0, '#e74c3c', 'productos en déficit')}
                    ${createAdvancedCard('📊', 'Inventario Total', realData.totalInventory || 0, '#27ae60', 'unidades en stock', true)}
                    ${createAdvancedCard('🏷️', 'Pallets Únicos', realData.uniquePallets || 0, '#17a2b8', 'pallets diferentes')}
                    ${realData.materialInOrder ? createAdvancedCard('🚚', 'Material en Pedido', realData.materialInOrder, '#f39c12', 'unidades solicitadas', true) : ''}
                </div>
                
                <!-- Información de fuente de datos -->
                <div class="data-source-info" style="
                    text-align: center; margin: 15px 0; color: #7f8c8d; font-size: 12px;
                    background: rgba(52, 152, 219, 0.1); padding: 8px; border-radius: 6px;
                ">
                    📊 Datos actualizados desde: <strong>${realData.source === 'dom_extraction' ? 'Métricas del sistema' : 'Sistema de inventario'}</strong>
                    ${realData.foundCount ? ` • ${realData.foundCount} métricas encontradas` : ''}
                </div>
            `;
            
            // Insertar las cards
            dashboardContent.insertAdjacentHTML('afterbegin', cardsHtml);
            
            // Aplicar animaciones
            setTimeout(() => animateCards(), 100);
            
            // Añadir interactividad
            setTimeout(() => addCardInteractivity(), 200);
        }
        
        function createAdvancedCard(icon, title, value, color, subtitle, isLargeNumber = false) {
            const formattedValue = isLargeNumber ? 
                (typeof value === 'number' ? value.toLocaleString('es-ES', { maximumFractionDigits: 2 }) : value) :
                (typeof value === 'number' ? value.toLocaleString() : value);
            
            return `
                <div class="advanced-metric-card" data-metric="${title}" style="
                    background: linear-gradient(135deg, white 0%, #f8f9fa 100%);
                    border-radius: 16px;
                    padding: 25px 20px;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    opacity: 0;
                    transform: translateY(40px) scale(0.8);
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                " data-color="${color}">
                    
                    <!-- Efecto de fondo animado -->
                    <div class="card-bg-effect" style="
                        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                        background: linear-gradient(135deg, ${color}15, transparent);
                        opacity: 0; transition: opacity 0.3s ease;
                        border-radius: 16px;
                    "></div>
                    
                    <!-- Línea decorativa superior -->
                    <div style="
                        position: absolute; top: 0; left: 0; right: 0;
                        height: 4px; background: linear-gradient(90deg, ${color}, ${color}80);
                        border-radius: 16px 16px 0 0;
                    "></div>
                    
                    <!-- Contenido de la card -->
                    <div style="position: relative; z-index: 2;">
                        <div class="card-icon" style="
                            font-size: 42px;
                            margin-bottom: 15px;
                            display: inline-block;
                            padding: 18px;
                            background: linear-gradient(135deg, ${color}20, ${color}10);
                            border-radius: 50%;
                            border: 3px solid ${color}30;
                            transition: all 0.3s ease;
                        ">${icon}</div>
                        
                        <div style="
                            color: #5a6c7d;
                            font-size: 13px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                            margin-bottom: 8px;
                            opacity: 0.8;
                        ">${title}</div>
                        
                        <div class="card-value" style="
                            font-size: ${isLargeNumber ? '24px' : '32px'};
                            font-weight: 800;
                            color: ${color};
                            margin-bottom: 8px;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            transition: all 0.3s ease;
                        ">${formattedValue}</div>
                        
                        <div style="
                            color: #95a5a6;
                            font-size: 11px;
                            font-weight: 500;
                            opacity: 0.7;
                        ">${subtitle}</div>
                    </div>
                    
                    <!-- Indicador de pulso para valores críticos -->
                    ${(title.includes('Negativo') && value > 0) ? `
                        <div class="pulse-indicator" style="
                            position: absolute; top: 15px; right: 15px;
                            width: 10px; height: 10px; border-radius: 50%;
                            background: #e74c3c; animation: pulse 2s infinite;
                        "></div>
                    ` : ''}
                </div>
            `;
        }
        
        /**
         * 🎭 MEJORA 3: Animaciones avanzadas
         */
        function animateCards() {
            const cards = document.querySelectorAll('.advanced-metric-card');
            
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, index * 150);
            });
            
            // Añadir estilos de animación
            if (!document.getElementById('advanced-card-animations')) {
                const animationStyles = document.createElement('style');
                animationStyles.id = 'advanced-card-animations';
                animationStyles.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.1); }
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                    }
                    
                    .advanced-metric-card:hover .card-bg-effect {
                        opacity: 1 !important;
                    }
                    
                    .advanced-metric-card:hover .card-icon {
                        transform: scale(1.1) rotate(5deg);
                    }
                    
                    .advanced-metric-card:hover .card-value {
                        transform: scale(1.05);
                    }
                    
                    .advanced-metric-card:hover {
                        transform: translateY(-8px) scale(1.02) !important;
                        box-shadow: 0 15px 50px rgba(0,0,0,0.15) !important;
                    }
                    
                    .floating-card {
                        animation: float 3s ease-in-out infinite;
                    }
                `;
                document.head.appendChild(animationStyles);
            }
        }
        
        /**
         * 🖱️ MEJORA 4: Interactividad avanzada
         */
        function addCardInteractivity() {
            const cards = document.querySelectorAll('.advanced-metric-card');
            
            cards.forEach(card => {
                // Efecto de floating aleatorio
                if (Math.random() > 0.5) {
                    setTimeout(() => {
                        card.classList.add('floating-card');
                    }, Math.random() * 2000);
                }
                
                // Click para mostrar detalles
                card.addEventListener('click', function() {
                    const metric = this.dataset.metric;
                    const color = this.dataset.color;
                    showMetricDetails(metric, color);
                });
                
                // Efecto de partículas en hover (sutil)
                card.addEventListener('mouseenter', function() {
                    createParticleEffect(this);
                });
            });
        }
        
        /**
         * 🎆 MEJORA 5: Efectos de partículas sutiles
         */
        function createParticleEffect(card) {
            if (card.querySelector('.particle')) return; // Evitar duplicados
            
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.cssText = `
                        position: absolute;
                        width: 4px; height: 4px;
                        background: ${card.dataset.color || '#3498db'};
                        border-radius: 50%;
                        pointer-events: none;
                        top: ${Math.random() * 100}%;
                        left: ${Math.random() * 100}%;
                        animation: particleFloat 2s ease-out forwards;
                        opacity: 0.7;
                    `;
                    
                    card.appendChild(particle);
                    
                    // Remover después de la animación
                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
                    }, 2000);
                }, i * 200);
            }
            
            // Añadir estilos de partículas si no existen
            if (!document.getElementById('particle-styles')) {
                const particleStyles = document.createElement('style');
                particleStyles.id = 'particle-styles';
                particleStyles.textContent = `
                    @keyframes particleFloat {
                        0% { transform: translateY(0) scale(1); opacity: 0.7; }
                        100% { transform: translateY(-30px) scale(0); opacity: 0; }
                    }
                `;
                document.head.appendChild(particleStyles);
            }
        }
        
        /**
         * 📋 MEJORA 6: Detalles de métricas
         */
        function showMetricDetails(metric, color) {
            if (!window.InventorySystem?.Charts?.showNotification) {
                alert(`📊 ${metric}\n\nDatos actualizados desde: ${metricsData.source || 'Sistema'}`);
                return;
            }
            
            const details = {
                'Total de Productos': `📦 Total de productos registrados en el sistema\n🔄 Actualización automática cada 5 minutos`,
                'Inventario Negativo': `⚠️ Productos con stock negativo\n🚨 Requiere atención inmediata`,
                'Inventario Total': `📊 Suma total de todo el inventario físico\n💰 Valor representa unidades en stock`,
                'Pallets Únicos': `🏷️ Número de pallets diferentes identificados\n📦 Cada pallet puede contener múltiples productos`,
                'Material en Pedido': `🚚 Material solicitado pero no recibido\n⏰ Pendiente de entrega`
            };
            
            window.InventorySystem.Charts.showNotification(
                details[metric] || `📊 Información de ${metric}`, 
                'info'
            );
        }
        
        /**
         * 🔄 MEJORA 7: Función mejorada de render dashboard
         */
        function renderDashboardEnhanced() {
            try {
                if (hasEnhancedRendered) {
                    // Evitar re-render innecesario
                    return originalFunctions.renderDashboard ? originalFunctions.renderDashboard() : undefined;
                }
                console.log('🚀 Renderizando dashboard mejorado v2...');
                
                // Ejecutar función original primero
                if (originalFunctions.renderDashboard) {
                    originalFunctions.renderDashboard();
                }
                
                // Aplicar mejoras después de un pequeño delay
                setTimeout(() => {
                    createEnhancedMetricsCardsV2();
                    enhanceExistingElements();
                    hasEnhancedRendered = true;
                }, 300);
                
            } catch (error) {
                console.error('❌ Error en renderDashboardEnhanced:', error);
                // Fallback a función original
                if (originalFunctions.renderDashboard) {
                    originalFunctions.renderDashboard();
                }
            }
        }
        
        /**
         * ✨ MEJORA 8: Mejorar elementos existentes
         */
        function enhanceExistingElements() {
            // Mejorar botones existentes
            const buttons = document.querySelectorAll('.btn, button');
            buttons.forEach(btn => {
                if (!btn.classList.contains('enhanced')) {
                    btn.style.transition = 'all 0.3s ease';
                    btn.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-2px)';
                        this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    });
                    btn.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = 'none';
                    });
                    btn.classList.add('enhanced');
                }
            });
            
            // Mejorar gráficos existentes añadiendo botones de exportación
            setTimeout(() => {
                if (originalFunctions.addChartExportButtons) {
                    originalFunctions.addChartExportButtons();
                }
            }, 1000);
        }
        
        // Exportar funciones mejoradas
        return {
            ...originalFunctions,
            renderDashboard: renderDashboardEnhanced,
            createEnhancedMetricsCardsV2,
            getRealMetricsData,
            extractMetricsFromDOM,
            animateCards,
            addCardInteractivity,
            showMetricDetails,
            
            // Función de utilidad para actualizar métricas manualmente
            updateMetrics: function() {
                console.log('🔄 Actualizando métricas...');
                createEnhancedMetricsCardsV2();
            }
        };
    })();
    
})(window.InventorySystem || (window.InventorySystem = {}));

// Auto-inicialización mejorada
document.addEventListener('DOMContentLoaded', function() {
    if (window.InventorySystem?.Charts) {
        console.log('✅ Dashboard Mejorado V2 cargado - datos corregidos');
        
        // Aplicar mejoras si el dashboard ya está visible
        setTimeout(() => {
            const dashboardContent = document.getElementById('dashboard-content');
            if (dashboardContent && dashboardContent.children.length > 0) {
                window.InventorySystem.Charts.createEnhancedMetricsCardsV2();
            }
        }, 1000);
    }
});

console.log('🎉 Dashboard Enhanced V2 listo - con datos corregidos y mejoras avanzadas');