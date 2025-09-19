// Esperar a que Utils esté disponible
(function(InventorySystem) {
    // Módulo de autenticación
    InventorySystem.Auth = (function() {
        // Variables privadas
        let currentUser = null;
        let isAdmin = false;
        
        // Elementos DOM
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userInfo = document.getElementById('user-info');
        const username = document.getElementById('username');
        const loginModal = document.getElementById('login-modal'); // Referencia directa al modal
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        const loginSubmit = document.getElementById('login-submit');
        const loginCancel = document.getElementById('login-cancel');
        const loginError = document.getElementById('login-error');
        const adminControls = document.getElementById('admin-controls');
        const operatorMessage = document.getElementById('operator-message');
        const inventoryAnalysis = document.getElementById('inventory-analysis');
        
        /**
         * Inicializar el módulo de autenticación
         */
        function init() {
            // Auto-login como administrador (sin necesidad de credenciales)
            currentUser = 'Administrador';
            isAdmin = true;
            localStorage.setItem('currentUser', currentUser);
            updateUIForUser();
            
            // Configurar event listeners
            setupEventListeners();
        }
        
        /**
         * Configurar event listeners para autenticación
         */
        function setupEventListeners() {
            // Eventos de inicio de sesión
            loginBtn.addEventListener('click', showLoginModal);
            logoutBtn.addEventListener('click', logout);
            loginSubmit.addEventListener('click', login);
            
            // LÓGICA REFORZADA PARA EL BOTÓN CANCELAR DEL MODAL DE LOGIN
            if (loginCancel) { // Asegura que el botón exista antes de añadir el listener
                loginCancel.addEventListener('click', () => {
                    console.log('Botón Cancelar de Login clickeado. Ocultando modal.');
                    hideLoginModal();
                    console.log('Modal de Login ocultado.');
                });
            } else {
                console.warn('Botón login-cancel no encontrado.');
            }
            
            // Cerrar modal al hacer clic fuera
            if (loginModal) { // Asegura que el modal exista
                loginModal.addEventListener('click', (e) => {
                    if (e.target === loginModal) {
                        console.log('Click fuera del modal de Login. Ocultando.');
                        hideLoginModal();
                        console.log('Modal de Login ocultado.');
                    }
                });
            } else {
                console.warn('Modal login-modal no encontrado.');
            }
        }
        
        /**
         * Mostrar modal de inicio de sesión
         */
        function showLoginModal() {
            if (loginModal) loginModal.classList.remove('hidden');
            if (loginUsername) loginUsername.focus();
            if (loginError) loginError.classList.add('hidden');
        }
        
        /**
         * Ocultar modal de inicio de sesión
         */
        function hideLoginModal() {
            if (loginModal) loginModal.classList.add('hidden');
            if (loginUsername) loginUsername.value = '';
            if (loginPassword) loginPassword.value = '';
            if (loginError) loginError.classList.add('hidden');
        }
        
        /**
         * Iniciar sesión
         */
        function login() {
            const usernameVal = loginUsername ? loginUsername.value.trim() : '';
            const passwordVal = loginPassword ? loginPassword.value.trim() : '';
            
            // Validar credenciales
            if (usernameVal === 'admin' && passwordVal === 'pivet21') {
                // Administrador
                currentUser = 'Administrador';
                isAdmin = true;
                localStorage.setItem('currentUser', currentUser);
                updateUIForUser();
                hideLoginModal();
            } else if (usernameVal === 'operador' && passwordVal === 'operador123') {
                // Operador
                currentUser = 'Operador';
                isAdmin = false;
                localStorage.setItem('currentUser', currentUser);
                updateUIForUser();
                hideLoginModal();
            } else {
                // Credenciales inválidas
                if (loginError) loginError.classList.remove('hidden');
            }
        }
        
        /**
         * Cerrar sesión
         */
        function logout() {
            currentUser = null;
            isAdmin = false;
            localStorage.removeItem('currentUser');
            updateUIForUser();
        }
        
        /**
         * Actualizar interfaz de usuario según el usuario
         */
        function updateUIForUser() {
            if (currentUser) {
                // Usuario autenticado (siempre como administrador)
                if (loginBtn) loginBtn.classList.add('hidden');
                if (userInfo) userInfo.classList.remove('hidden');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
                if (operatorMessage) operatorMessage.classList.add('hidden');
                if (inventoryAnalysis) inventoryAnalysis.classList.remove('hidden');
                if (username) username.textContent = currentUser;
                
                // Mostrar controles de administrador (siempre visible)
                if (adminControls) adminControls.classList.remove('hidden');
                
                // Cargar datos guardados
                if (typeof InventorySystem.Inventory !== 'undefined') {
                    InventorySystem.Inventory.loadSavedData();
                }
            } else {
                // Este caso ya no debería ocurrir, pero lo mantenemos por seguridad
                if (loginBtn) loginBtn.classList.add('hidden');
                if (userInfo) userInfo.classList.remove('hidden');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
                if (adminControls) adminControls.classList.remove('hidden');
                if (inventoryAnalysis) inventoryAnalysis.classList.remove('hidden');
                if (operatorMessage) operatorMessage.classList.add('hidden');
            }
        }
        
        /**
         * Obtener el usuario actual
         */
        function getCurrentUser() {
            return currentUser;
        }
        
        /**
         * Verificar si el usuario es administrador
         */
        function isAdminUser() {
            return isAdmin;
        }
        
        // Exportar funciones públicas
        return {
            init,
            getCurrentUser,
            isAdminUser,
            updateUIForUser
        };
    })();
})(window.InventorySystem || {});