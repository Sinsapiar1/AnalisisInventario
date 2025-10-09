/**
 * Componente Multi-Select Profesional y Responsivo
 * Permite seleccionar múltiples opciones de una lista
 */

(function() {
    'use strict';
    
    /**
     * Clase MultiSelect
     */
    class MultiSelect {
        constructor(element, options = {}) {
            this.element = element;
            this.options = options;
            this.selectedValues = [];
            this.allOptions = [];
            this.filteredOptions = [];
            this.isOpen = false;
            
            // Configuración
            this.config = {
                placeholder: options.placeholder || 'Seleccionar...',
                searchPlaceholder: options.searchPlaceholder || 'Buscar...',
                selectAllText: options.selectAllText || 'Todos',
                clearText: options.clearText || 'Limpiar',
                applyText: options.applyText || 'Aplicar',
                noResultsText: options.noResultsText || 'No se encontraron resultados',
                maxDisplay: options.maxDisplay || 3,
                onChange: options.onChange || null,
                onApply: options.onApply || null
            };
            
            this.init();
        }
        
        /**
         * Inicializar el componente
         */
        init() {
            // Ocultar el select original
            this.element.style.display = 'none';
            
            // Crear estructura del multi-select
            this.createStructure();
            
            // Cargar opciones del select original
            this.loadOptions();
            
            // Setup event listeners
            this.setupEventListeners();
        }
        
        /**
         * Crear estructura HTML del multi-select
         */
        createStructure() {
            const wrapper = document.createElement('div');
            wrapper.className = 'multi-select-wrapper';
            wrapper.innerHTML = `
                <button type="button" class="multi-select-trigger" tabindex="0">
                    <span class="multi-select-label placeholder">${this.config.placeholder}</span>
                    <i class="fas fa-chevron-down multi-select-arrow"></i>
                </button>
                
                <div class="multi-select-dropdown">
                    <div class="multi-select-header">
                        <input type="text" class="multi-select-search" placeholder="${this.config.searchPlaceholder}">
                        <div class="multi-select-actions">
                            <button type="button" class="multi-select-btn multi-select-btn-all">
                                <i class="fas fa-check-double"></i> ${this.config.selectAllText}
                            </button>
                            <button type="button" class="multi-select-btn multi-select-btn-clear">
                                <i class="fas fa-times"></i> ${this.config.clearText}
                            </button>
                        </div>
                    </div>
                    
                    <div class="multi-select-options"></div>
                    
                    <div class="multi-select-footer">
                        <button type="button" class="multi-select-apply">
                            <i class="fas fa-check"></i> ${this.config.applyText}
                        </button>
                    </div>
                </div>
                
                <div class="multi-select-overlay"></div>
            `;
            
            // Insertar después del select original
            this.element.parentNode.insertBefore(wrapper, this.element.nextSibling);
            
            // Guardar referencias
            this.wrapper = wrapper;
            this.trigger = wrapper.querySelector('.multi-select-trigger');
            this.label = wrapper.querySelector('.multi-select-label');
            this.arrow = wrapper.querySelector('.multi-select-arrow');
            this.dropdown = wrapper.querySelector('.multi-select-dropdown');
            this.searchInput = wrapper.querySelector('.multi-select-search');
            this.optionsContainer = wrapper.querySelector('.multi-select-options');
            this.selectAllBtn = wrapper.querySelector('.multi-select-btn-all');
            this.clearBtn = wrapper.querySelector('.multi-select-btn-clear');
            this.applyBtn = wrapper.querySelector('.multi-select-apply');
            this.overlay = wrapper.querySelector('.multi-select-overlay');
        }
        
        /**
         * Cargar opciones del select original
         */
        loadOptions() {
            const selectOptions = Array.from(this.element.options);
            
            this.allOptions = selectOptions
                .filter(opt => opt.value !== '') // Excluir opción "Todos"
                .map(opt => ({
                    value: opt.value,
                    text: opt.textContent
                }));
            
            this.filteredOptions = [...this.allOptions];
            this.renderOptions();
        }
        
        /**
         * Renderizar opciones
         */
        renderOptions() {
            this.optionsContainer.innerHTML = '';
            
            if (this.filteredOptions.length === 0) {
                this.optionsContainer.innerHTML = `
                    <div class="multi-select-no-results">
                        <i class="fas fa-search"></i>
                        <div>${this.config.noResultsText}</div>
                    </div>
                `;
                return;
            }
            
            this.filteredOptions.forEach(option => {
                const optionEl = document.createElement('div');
                optionEl.className = 'multi-select-option';
                optionEl.dataset.value = option.value;
                
                if (this.selectedValues.includes(option.value)) {
                    optionEl.classList.add('selected');
                }
                
                optionEl.innerHTML = `
                    <div class="multi-select-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="multi-select-option-text">${option.text}</div>
                `;
                
                optionEl.addEventListener('click', () => this.toggleOption(option.value));
                
                this.optionsContainer.appendChild(optionEl);
            });
        }
        
        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Toggle dropdown
            this.trigger.addEventListener('click', () => this.toggle());
            
            // Búsqueda
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            
            // Seleccionar todos
            this.selectAllBtn.addEventListener('click', () => this.selectAll());
            
            // Limpiar selección
            this.clearBtn.addEventListener('click', () => this.clearSelection());
            
            // Aplicar filtro
            this.applyBtn.addEventListener('click', () => this.apply());
            
            // Cerrar con overlay
            this.overlay.addEventListener('click', () => this.close());
            
            // Cerrar con ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
            
            // Cerrar al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.wrapper.contains(e.target)) {
                    this.close();
                }
            });
        }
        
        /**
         * Toggle dropdown
         */
        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
        
        /**
         * Abrir dropdown
         */
        open() {
            this.isOpen = true;
            this.dropdown.classList.add('open');
            this.trigger.classList.add('open');
            this.arrow.classList.add('open');
            
            // Mostrar overlay SOLO en móvil (< 768px)
            // En desktop, el overlay no es necesario y causaba problemas de clics
            if (window.innerWidth <= 768) {
                this.overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
            
            // Focus en búsqueda
            setTimeout(() => this.searchInput.focus(), 100);
        }
        
        /**
         * Cerrar dropdown
         */
        close() {
            this.isOpen = false;
            this.dropdown.classList.remove('open');
            this.trigger.classList.remove('open');
            this.arrow.classList.remove('open');
            this.overlay.classList.remove('show');
            
            // Limpiar búsqueda
            this.searchInput.value = '';
            this.filteredOptions = [...this.allOptions];
            this.renderOptions();
            
            // Restaurar scroll (siempre, independiente del tamaño de pantalla)
            document.body.style.overflow = '';
        }
        
        /**
         * Manejar búsqueda
         */
        handleSearch(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            
            if (term === '') {
                this.filteredOptions = [...this.allOptions];
            } else {
                this.filteredOptions = this.allOptions.filter(opt => 
                    opt.text.toLowerCase().includes(term) ||
                    opt.value.toLowerCase().includes(term)
                );
            }
            
            this.renderOptions();
        }
        
        /**
         * Toggle opción individual
         */
        toggleOption(value) {
            const index = this.selectedValues.indexOf(value);
            
            if (index > -1) {
                // Deseleccionar
                this.selectedValues.splice(index, 1);
            } else {
                // Seleccionar
                this.selectedValues.push(value);
            }
            
            this.updateLabel();
            this.renderOptions();
            
            // Callback onChange
            if (this.config.onChange) {
                this.config.onChange(this.selectedValues);
            }
        }
        
        /**
         * Seleccionar todos
         */
        selectAll() {
            this.selectedValues = this.allOptions.map(opt => opt.value);
            this.updateLabel();
            this.renderOptions();
            
            if (this.config.onChange) {
                this.config.onChange(this.selectedValues);
            }
        }
        
        /**
         * Limpiar selección
         */
        clearSelection() {
            this.selectedValues = [];
            this.updateLabel();
            this.renderOptions();
            
            if (this.config.onChange) {
                this.config.onChange(this.selectedValues);
            }
        }
        
        /**
         * Aplicar filtro
         */
        apply() {
            this.close();
            
            if (this.config.onApply) {
                this.config.onApply(this.selectedValues);
            }
        }
        
        /**
         * Actualizar label del trigger
         */
        updateLabel() {
            const count = this.selectedValues.length;
            const total = this.allOptions.length;
            
            // Remover badge anterior si existe
            const existingBadge = this.trigger.querySelector('.multi-select-count');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            if (count === 0) {
                this.label.textContent = this.config.placeholder;
                this.label.classList.add('placeholder');
            } else if (count === total) {
                this.label.textContent = 'Todos los almacenes';
                this.label.classList.remove('placeholder');
            } else if (count <= this.config.maxDisplay) {
                // Mostrar nombres de los seleccionados
                const selectedTexts = this.selectedValues
                    .map(val => this.allOptions.find(opt => opt.value === val)?.text)
                    .filter(Boolean)
                    .join(', ');
                this.label.textContent = selectedTexts;
                this.label.classList.remove('placeholder');
            } else {
                // Mostrar contador
                this.label.textContent = `${count} almacenes seleccionados`;
                this.label.classList.remove('placeholder');
            }
            
            // Agregar badge si hay selección
            if (count > 0 && count < total) {
                const badge = document.createElement('span');
                badge.className = 'multi-select-count';
                badge.textContent = count;
                this.trigger.insertBefore(badge, this.arrow);
            }
        }
        
        /**
         * Actualizar opciones disponibles
         */
        updateOptions(newOptions) {
            this.allOptions = newOptions.map(opt => ({
                value: typeof opt === 'string' ? opt : opt.value,
                text: typeof opt === 'string' ? opt : opt.text
            }));
            
            this.filteredOptions = [...this.allOptions];
            
            // Limpiar selecciones que ya no existen
            this.selectedValues = this.selectedValues.filter(val => 
                this.allOptions.some(opt => opt.value === val)
            );
            
            this.updateLabel();
            this.renderOptions();
        }
        
        /**
         * Obtener valores seleccionados
         */
        getSelectedValues() {
            return [...this.selectedValues];
        }
        
        /**
         * Establecer valores seleccionados
         */
        setSelectedValues(values) {
            this.selectedValues = values.filter(val => 
                this.allOptions.some(opt => opt.value === val)
            );
            this.updateLabel();
            this.renderOptions();
        }
        
        /**
         * Destruir el componente
         */
        destroy() {
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
            this.element.style.display = '';
        }
    }
    
    // Exportar a window
    window.MultiSelect = MultiSelect;
    
    /**
     * Helper: Inicializar multi-select desde un select existente
     */
    window.initMultiSelect = function(selectId, options = {}) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`Select element with id "${selectId}" not found`);
            return null;
        }
        
        return new MultiSelect(selectElement, options);
    };
    
    console.log('✅ Componente MultiSelect cargado');
    
})();
