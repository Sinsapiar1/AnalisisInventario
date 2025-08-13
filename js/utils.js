/**
 * Archivo de utilidades generales para el sistema
 */

// Namespace global para la aplicación
const InventorySystem = window.InventorySystem || {};

// Módulo de utilidades
InventorySystem.Utils = (function() {
    
    /**
     * Formatea un número para mostrar
     * @param {number} num - Número a formatear
     * @returns {string} - Número formateado
     */
    function formatNumber(num) {
        return new Intl.NumberFormat('es-ES', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 2 
        }).format(num);
    }
    /**
     * Verifica si un valor es un número válido
     * @param {any} value - Valor a verificar
     * @returns {boolean} - true si es un número válido
     */
    function isValidNumber(value) {
        if (value === null || value === undefined || value === '') {
            return false;
        }
        
        const num = parseFloat(value);
        return !isNaN(num);
    }
    /**
     * Formatea una fecha para mostrar
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada
     */
    function formatDate(date) {
        if (!date) return '';
        
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    
    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje a mostrar
     */
    function showError(message) {
        const errorAlert = document.getElementById('error-alert');
        errorAlert.textContent = message;
        errorAlert.classList.remove('hidden');
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorAlert.classList.add('hidden');
        }, 5000);
    }
    
    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje a mostrar
     */
    function showSuccess(message) {
        const successAlert = document.getElementById('success-alert');
        successAlert.textContent = message;
        successAlert.classList.remove('hidden');
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            successAlert.classList.add('hidden');
        }, 5000);
    }
    
    /**
     * Muestra/oculta el indicador de carga
     * @param {boolean} show - Si se debe mostrar o no
     */
    function showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    /**
     * Captura un gráfico de forma segura
     * @param {HTMLCanvasElement} canvas - Canvas a capturar
     * @returns {string} - URL de datos del canvas
     */
    function captureChartSafely(canvas) {
        try {
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error al capturar gráfico:', error);
            // Crear un canvas de reemplazo con un mensaje de error
            const errorCanvas = document.createElement('canvas');
            errorCanvas.width = 400;
            errorCanvas.height = 200;
            const ctx = errorCanvas.getContext('2d');
            ctx.fillStyle = '#f8d7da';
            ctx.fillRect(0, 0, 400, 200);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#721c24';
            ctx.textAlign = 'center';
            ctx.fillText('Error al capturar el gráfico', 200, 100);
            return errorCanvas.toDataURL('image/png');
        }
    }
     function createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }
    
    // Exportar funciones públicas
    return {
        formatNumber,
        formatDate,
        showError,
        showSuccess,
        showLoading,
        captureChartSafely,
        isValidNumber,
        createElementFromHTML // Añadir la nueva función aquí
    };
})();


// Asignar a la ventana global
window.InventorySystem = InventorySystem;