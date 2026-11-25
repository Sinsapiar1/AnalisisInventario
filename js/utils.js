/**
 * Archivo de utilidades generales para el sistema
 */

// Namespace global para la aplicación
const InventorySystem = window.InventorySystem || {};

// Módulo de utilidades
InventorySystem.Utils = (function() {

    // 'always' agrupa también los números de 4 cifras (1.269); es-ES no lo hace por defecto
    const numberFormatter = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: 'always'
    });

    /**
     * Formatea un número para mostrar
     * @param {number} num - Número a formatear
     * @returns {string} - Número formateado
     */
    function formatNumber(num) {
        const n = Number(num);
        return numberFormatter.format(isFinite(n) ? n : 0);
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
     * Convierte un valor de celda en número.
     * Acepta números reales y textos con formato español (1.269,50) o inglés (1,269.50),
     * negativos con signo al final (15-) o entre paréntesis.
     * @param {any} value - Valor de la celda
     * @param {string} locale - 'es' o 'en'; decide cómo leer un separador ambiguo
     * @returns {number} - Número, o 0 si no se puede leer
     */
    function parseNumber(value, locale) {
        if (typeof value === 'number') return isFinite(value) ? value : 0;
        if (value === null || value === undefined) return 0;

        let text = String(value).trim().replace(/[\s ]/g, '');
        if (text === '') return 0;

        let negative = false;
        if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }
        if (/-$/.test(text)) { negative = true; text = text.slice(0, -1); }
        if (/^-/.test(text)) { negative = true; text = text.slice(1); }

        const hasDot = text.indexOf('.') !== -1;
        const hasComma = text.indexOf(',') !== -1;

        if (hasDot && hasComma) {
            // El último separador que aparece es el decimal
            if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
                text = text.replace(/\./g, '').replace(',', '.');
            } else {
                text = text.replace(/,/g, '');
            }
        } else if (hasComma) {
            const looksGrouped = /^\d{1,3}(,\d{3})+$/.test(text);
            text = (looksGrouped && locale === 'en') ? text.replace(/,/g, '') : text.replace(',', '.');
        } else if (hasDot) {
            const looksGrouped = /^\d{1,3}(\.\d{3})+$/.test(text);
            if (looksGrouped && locale === 'es') text = text.replace(/\./g, '');
        }

        const num = parseFloat(text);
        if (isNaN(num)) return 0;
        return negative ? -num : num;
    }

    /**
     * Normaliza un texto para compararlo: minúsculas, sin tildes ni signos
     * @param {any} value - Texto original
     * @returns {string} - Texto normalizado
     */
    function normalizeText(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
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
     * Retrasa la ejecución de una función hasta que dejen de llegar llamadas
     */
    function debounce(fn, wait) {
        let timer = null;
        return function() {
            const args = arguments;
            const context = this;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(context, args); }, wait);
        };
    }

    /* ---------- Avisos ---------- */

    const TOAST_ICONS = {
        error: 'fa-circle-exclamation',
        success: 'fa-circle-check',
        info: 'fa-circle-info'
    };
    let lastToast = { text: '', time: 0 };

    function getToastRegion() {
        let region = document.getElementById('toast-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'toast-region';
            region.className = 'toast-region';
            region.setAttribute('aria-live', 'polite');
            document.body.appendChild(region);
        }
        return region;
    }

    /**
     * Muestra un aviso flotante
     * @param {string} type - error, success o info
     * @param {string} message - Mensaje principal
     * @param {string} [detail] - Texto secundario
     */
    function showToast(type, message, detail) {
        // Evitar el mismo aviso repetido en ráfaga
        const now = Date.now();
        const signature = type + '|' + message;
        if (signature === lastToast.text && now - lastToast.time < 1500) return;
        lastToast = { text: signature, time: now };

        const region = getToastRegion();
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const icon = document.createElement('i');
        icon.className = 'fas ' + (TOAST_ICONS[type] || TOAST_ICONS.info);
        icon.setAttribute('aria-hidden', 'true');

        const body = document.createElement('div');
        body.className = 'toast-body';
        const title = document.createElement('div');
        title.className = 'toast-title';
        title.textContent = message;
        body.appendChild(title);
        if (detail) {
            const extra = document.createElement('div');
            extra.className = 'toast-detail';
            extra.textContent = detail;
            body.appendChild(extra);
        }

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'toast-close';
        close.setAttribute('aria-label', 'Cerrar aviso');
        close.textContent = '×';

        function dismiss() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }
        close.addEventListener('click', dismiss);

        toast.appendChild(icon);
        toast.appendChild(body);
        toast.appendChild(close);
        region.appendChild(toast);

        // Los errores permanecen más tiempo para que dé tiempo a leerlos
        setTimeout(dismiss, type === 'error' ? 12000 : 5000);
    }

    /**
     * Muestra un mensaje de error
     * @param {string} message - Mensaje a mostrar
     * @param {string} [detail] - Texto secundario
     */
    function showError(message, detail) {
        showToast('error', message, detail);
    }

    /**
     * Muestra un mensaje de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {string} [detail] - Texto secundario
     */
    function showSuccess(message, detail) {
        showToast('success', message, detail);
    }

    /**
     * Muestra/oculta el indicador de carga
     * @param {boolean} show - Si se debe mostrar o no
     */
    function showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.toggle('hidden', !show);
        document.body.classList.toggle('is-loading', !!show);
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

    /**
     * Sanitiza el valor de un almacén
     * Convierte a string y limpia espacios (0, 62, 612R, RO-TX, 28e...)
     * @param {any} value - Valor del almacén desde Excel
     * @returns {string} - Valor sanitizado como string, o cadena vacía si es inválido
     */
    function sanitizeWarehouse(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).trim();
    }

    /**
     * Verifica si un almacén es válido (no vacío)
     * @param {any} warehouse - Valor del almacén a verificar
     * @returns {boolean} - true si el almacén es válido
     */
    function isValidWarehouse(warehouse) {
        return warehouse !== null &&
               warehouse !== undefined &&
               warehouse !== '';
    }

    // Exportar funciones públicas
    return {
        formatNumber,
        formatDate,
        showError,
        showSuccess,
        showToast,
        showLoading,
        captureChartSafely,
        isValidNumber,
        parseNumber,
        normalizeText,
        debounce,
        createElementFromHTML,
        sanitizeWarehouse,
        isValidWarehouse
    };
})();


// Asignar a la ventana global
window.InventorySystem = InventorySystem;
