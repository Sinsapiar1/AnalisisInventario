/**
 * Archivo principal para la inicialización del sistema
 */

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando Sistema de Análisis de Inventario...');
    
    // Asegurarse de que window.InventorySystem existe
    window.InventorySystem = window.InventorySystem || {};
    
    // Inicializar módulos en el orden adecuado
    if (InventorySystem.Utils) {
        console.log('Módulo Utils inicializado correctamente');
    } else {
        console.error('Error: Módulo Utils no está disponible');
    }
    
    // Inicializar autenticación
    if (InventorySystem.Auth) {
        InventorySystem.Auth.init();
        console.log('Módulo Auth inicializado correctamente');
    } else {
        console.error('Error: Módulo Auth no está disponible');
    }
    
    // Inicializar inventario
    if (InventorySystem.Inventory) {
        InventorySystem.Inventory.init();
        console.log('Módulo Inventory inicializado correctamente');
    } else {
        console.error('Error: Módulo Inventory no está disponible');
    }
    
    // Inicializar UI
    if (InventorySystem.UI) {
        InventorySystem.UI.init();
        console.log('Módulo UI inicializado correctamente');
    } else {
        console.error('Error: Módulo UI no está disponible');
    }
    
    // Inicializar Charts
    if (InventorySystem.Charts) {
        InventorySystem.Charts.init();
        console.log('Módulo Charts inicializado correctamente');
    } else {
        console.error('Error: Módulo Charts no está disponible');
    }
    
    // Inicializar Export si el usuario está autenticado
    if (InventorySystem.Auth && InventorySystem.Auth.getCurrentUser() && InventorySystem.Export) {
        InventorySystem.Export.init();
        console.log('Módulo Export inicializado correctamente');
    } else if (InventorySystem.Export) {
        // Registrar las funciones de exportación para que estén disponibles cuando se necesiten
        console.log('Módulo Export registrado, se inicializará cuando el usuario inicie sesión');
    }
    
    console.log('Sistema inicializado correctamente');
});

/**
 * Manejo de eventos de carga global
 */
window.addEventListener('load', function() {
    // Ocultar pantalla de carga si existe
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
});

/**
 * Manejo de errores global
 */
window.addEventListener('error', function(e) {
    console.error('Error global:', e.message);
    
    // Mostrar error al usuario si es crítico
    if (InventorySystem && InventorySystem.Utils) {
        InventorySystem.Utils.showError('Ha ocurrido un error en la aplicación. Por favor, recargue la página.');
    }
});