/**
 * Módulo para manejar el modal de redirección a Streamlit
 */

(function() {
    'use strict';
    
    // URL de la aplicación Streamlit
    const STREAMLIT_URL = 'https://inventory-analyzer-web.streamlit.app/';
    
    // Elementos DOM
    let streamlitBtn;
    let streamlitModal;
    let streamlitModalClose;
    let streamlitCancel;
    let streamlitConfirm;
    let modalOverlay;
    
    /**
     * Inicializar el módulo
     */
    function init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupEventListeners);
        } else {
            setupEventListeners();
        }
    }
    
    /**
     * Configurar event listeners
     */
    function setupEventListeners() {
        // Obtener elementos
        streamlitBtn = document.getElementById('streamlit-btn');
        streamlitModal = document.getElementById('streamlit-modal');
        streamlitModalClose = document.getElementById('streamlit-modal-close');
        streamlitCancel = document.getElementById('streamlit-cancel');
        streamlitConfirm = document.getElementById('streamlit-confirm');
        
        if (!streamlitBtn || !streamlitModal) {
            console.warn('Elementos del modal de Streamlit no encontrados');
            return;
        }
        
        // Event listener para abrir el modal
        streamlitBtn.addEventListener('click', openModal);
        
        // Event listeners para cerrar el modal
        if (streamlitModalClose) {
            streamlitModalClose.addEventListener('click', closeModal);
        }
        
        if (streamlitCancel) {
            streamlitCancel.addEventListener('click', closeModal);
        }
        
        // Event listener para confirmar y abrir Streamlit
        if (streamlitConfirm) {
            streamlitConfirm.addEventListener('click', openStreamlit);
        }
        
        // Cerrar modal al hacer clic en el overlay
        const overlay = streamlitModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
        
        // Cerrar modal con la tecla Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && streamlitModal.classList.contains('show')) {
                closeModal();
            }
        });
        
        console.log('✅ Modal de Streamlit inicializado');
    }
    
    /**
     * Abrir el modal
     */
    function openModal() {
        if (!streamlitModal) return;
        
        // Remover clase hidden y agregar clase show
        streamlitModal.classList.remove('hidden');
        
        // Forzar reflow para activar la animación
        void streamlitModal.offsetWidth;
        
        // Agregar clase show para la animación
        streamlitModal.classList.add('show');
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        
        console.log('📊 Modal de Streamlit abierto');
    }
    
    /**
     * Cerrar el modal
     */
    function closeModal() {
        if (!streamlitModal) return;
        
        // Remover clase show para animación de salida
        streamlitModal.classList.remove('show');
        
        // Esperar a que termine la animación antes de ocultar
        setTimeout(function() {
            streamlitModal.classList.add('hidden');
        }, 300);
        
        // Restaurar scroll del body
        document.body.style.overflow = '';
        
        console.log('✅ Modal de Streamlit cerrado');
    }
    
    /**
     * Abrir la aplicación Streamlit en una nueva pestaña
     */
    function openStreamlit() {
        console.log('🚀 Abriendo aplicación Streamlit...');
        
        // Abrir en nueva pestaña
        // Nota: window.open con 'noopener' puede retornar null incluso cuando se abre correctamente
        // por razones de seguridad en navegadores modernos, así que asumimos que se abrió
        window.open(STREAMLIT_URL, '_blank', 'noopener,noreferrer');
        
        console.log('✅ Solicitud de apertura enviada');
        
        // Cerrar el modal después de un pequeño delay
        setTimeout(closeModal, 500);
    }
    
    /**
     * Función pública para abrir el modal programáticamente
     */
    window.openStreamlitModal = openModal;
    
    /**
     * Función pública para cerrar el modal programáticamente
     */
    window.closeStreamlitModal = closeModal;
    
    // Inicializar
    init();
    
})();
