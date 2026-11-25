/**
 * Módulo de sesión.
 *
 * La herramienta no pide usuario ni contraseña: el archivo de inventario se
 * procesa solo en el navegador de quien la abre. Este módulo se limita a
 * mostrar los paneles y recuperar el último inventario guardado.
 *
 * (El inicio de sesión anterior, que ya no se usaba, se retiró a petición
 * del propietario para no dejar credenciales escritas en un repositorio público.)
 */
(function(InventorySystem) {
    InventorySystem.Auth = (function() {
        const currentUser = 'Administrador';

        function init() {
            updateUIForUser();
        }

        function updateUIForUser() {
            const adminControls = document.getElementById('admin-controls');
            const inventoryAnalysis = document.getElementById('inventory-analysis');
            if (adminControls) adminControls.classList.remove('hidden');
            if (inventoryAnalysis) inventoryAnalysis.classList.remove('hidden');

            if (typeof InventorySystem.Inventory !== 'undefined') {
                InventorySystem.Inventory.loadSavedData();
            }
        }

        function getCurrentUser() {
            return currentUser;
        }

        function isAdminUser() {
            return true;
        }

        return {
            init,
            getCurrentUser,
            isAdminUser,
            updateUIForUser
        };
    })();
})(window.InventorySystem || {});
