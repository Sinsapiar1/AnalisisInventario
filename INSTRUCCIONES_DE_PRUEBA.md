# 🧪 Instrucciones de Prueba - Hard Refresh

## 📋 Preparación

Antes de empezar, asegúrate de tener:
- ✅ Dos archivos Excel diferentes con datos de inventario
- ✅ El navegador con la Consola del Desarrollador abierta (presiona F12)
- ✅ La aplicación abierta en el navegador

---

## 🎯 Prueba 1: Verificar el Hard Refresh Básico

### Pasos:

1. **Carga el primer archivo Excel**:
   - Haz clic en "Seleccionar archivo"
   - Elige el primer archivo Excel
   - Haz clic en "Cargar y analizar"
   - ⏱️ Espera a que se carguen los datos

2. **Observa los valores iniciales**:
   - Anota los valores de los cards:
     - Total de Productos: `_______`
     - Inventario Negativo: `_______`
     - Total de Inventario Físico: `_______`
     - Pallets Únicos: `_______`

3. **Ve al tab "Dashboard"**:
   - Haz clic en la pestaña "Dashboard"
   - Observa los gráficos que se muestran
   - Toma una captura de pantalla (opcional)

4. **Carga el segundo archivo Excel** (SIN RECARGAR LA PÁGINA):
   - Haz clic en "Seleccionar archivo"
   - Elige un archivo Excel DIFERENTE
   - Haz clic en "Cargar y analizar"
   - ⏱️ Espera a que se carguen los datos

5. **Verifica que los valores cambien**:
   - Los cards deben mostrar los nuevos valores
   - Total de Productos: `_______` (debe ser diferente)
   - Inventario Negativo: `_______` (debe ser diferente)
   - Total de Inventario Físico: `_______` (debe ser diferente)
   - Pallets Únicos: `_______` (debe ser diferente)

6. **Ve al tab "Dashboard" nuevamente**:
   - Los gráficos deben reflejar los NUEVOS datos
   - NO deben tener valores del archivo anterior

### ✅ Criterios de éxito:

- [ ] Los cards se actualizaron con los nuevos valores
- [ ] Los gráficos del dashboard muestran solo datos nuevos
- [ ] Las tablas muestran solo datos nuevos
- [ ] No hay mezcla de datos antiguos y nuevos

---

## 🎯 Prueba 2: Verificar el Logging en Consola

### Pasos:

1. **Abre la Consola del Desarrollador** (F12 → pestaña "Console")

2. **Limpia la consola** (haz clic en el icono 🚫 o presiona Ctrl+L)

3. **Carga un archivo Excel** y observa los mensajes

### 🔍 Mensajes esperados:

Deberías ver una secuencia similar a esta:

```
🔄 Iniciando hard refresh del sistema...
  ✓ Destruyendo gráfico: inventory-chart
  ✓ Destruyendo gráfico: warehouse-chart
  ✓ Destruyendo gráfico: negative-chart
  ✓ Destruyendo gráfico: main-chart
  ✓ Destruyendo gráfico: detail-chart
  ✓ Destruyendo gráfico: in-order-chart
  ✓ Removiendo cards mejoradas del dashboard
🔄 Reseteando estado del dashboard mejorado...
✅ Estado del dashboard mejorado reseteado
✅ Hard refresh completado
Archivo cargado exitosamente
📊 Renderizando dashboard completo...
🧹 Limpiando contenido del dashboard...
✅ Contenido del dashboard limpiado
  ✓ Destruyendo gráfico: [nombre del gráfico]
  ...
✅ Dashboard renderizado correctamente
```

### ✅ Criterios de éxito:

- [ ] Aparece el mensaje "🔄 Iniciando hard refresh del sistema..."
- [ ] Se muestran los mensajes de destrucción de gráficos
- [ ] Aparece el mensaje "✅ Hard refresh completado"
- [ ] No hay errores en rojo en la consola

---

## 🎯 Prueba 3: Verificar Limpieza de Gráficos

### Pasos:

1. **Carga el primer archivo** y ve a la pestaña "Dashboard"

2. **Observa los gráficos**:
   - Gráfico de Distribución de Inventario (pie chart)
   - Gráfico de Distribución por Almacén (bar chart)
   - Gráfico de Inventario Negativo (bar chart horizontal)
   - Gráficos avanzados del dashboard

3. **Carga un segundo archivo diferente** (sin recargar la página)

4. **Regresa a la pestaña "Dashboard"**

5. **Verifica que**:
   - Los gráficos muestran SOLO los nuevos datos
   - No hay superposición de datos antiguos
   - Los colores y etiquetas son correctos
   - Los tooltips muestran valores correctos

### ✅ Criterios de éxito:

- [ ] Todos los gráficos se actualizaron
- [ ] No hay gráficos vacíos o con errores
- [ ] Los valores son consistentes con el nuevo archivo
- [ ] No hay "fantasmas" de datos antiguos

---

## 🎯 Prueba 4: Verificar Limpieza de Tablas

### Pasos:

1. **Carga el primer archivo**

2. **Ve a cada pestaña y cuenta los registros**:
   - **Inventario Negativo**: _______ productos
   - **Análisis por Pallet**: _______ pallets
   - **Inventario Completo**: _______ productos

3. **Carga el segundo archivo**

4. **Ve a las mismas pestañas y cuenta nuevamente**:
   - **Inventario Negativo**: _______ productos (debe ser diferente)
   - **Análisis por Pallet**: _______ pallets (debe ser diferente)
   - **Inventario Completo**: _______ productos (debe ser diferente)

5. **Verifica que**:
   - Los datos en las tablas corresponden al nuevo archivo
   - No hay filas duplicadas
   - La paginación funciona correctamente

### ✅ Criterios de éxito:

- [ ] Las tablas se limpiaron completamente
- [ ] Muestran solo datos del nuevo archivo
- [ ] La paginación funciona correctamente
- [ ] Los filtros y búsqueda funcionan

---

## 🎯 Prueba 5: Verificar Cards del Dashboard Mejorado

### Pasos:

1. **Carga el primer archivo** y ve al Dashboard

2. **Observa las cards mejoradas** (las que tienen iconos y colores):
   - 📦 Total de Productos
   - ⚠️ Inventario Negativo
   - 📊 Inventario Total
   - 🏷️ Pallets Únicos
   - 🚚 Material en Pedido (si existe)

3. **Carga el segundo archivo**

4. **Ve al Dashboard nuevamente**

5. **Verifica que**:
   - Las cards muestran los NUEVOS valores
   - Los valores son diferentes a los del primer archivo
   - Las animaciones funcionan correctamente
   - El diseño se mantiene intacto

### ✅ Criterios de éxito:

- [ ] Las cards se actualizaron con nuevos valores
- [ ] Las animaciones funcionan (hover, etc.)
- [ ] El diseño visual es correcto
- [ ] No hay cards duplicadas

---

## 🎯 Prueba 6: Prueba de Estrés (Múltiples Cargas)

### Pasos:

1. **Carga consecutivamente 5 archivos diferentes**:
   - Archivo 1 → Cargar y analizar
   - Archivo 2 → Cargar y analizar
   - Archivo 3 → Cargar y analizar
   - Archivo 4 → Cargar y analizar
   - Archivo 5 → Cargar y analizar

2. **Después de cada carga, verifica**:
   - Los valores de las cards
   - El contenido de las tablas
   - Los gráficos del dashboard

3. **Observa la consola** para detectar errores

### ✅ Criterios de éxito:

- [ ] Todas las cargas se completaron sin errores
- [ ] Cada carga mostró datos correctos
- [ ] No hay degradación del rendimiento
- [ ] No hay "memory leaks" (uso de memoria estable)

---

## 🎯 Prueba 7: Verificar Exportación después del Refresh

### Pasos:

1. **Carga un archivo**

2. **Ve a "Inventario Negativo"**

3. **Haz clic en "Exportar Reporte Completo"**

4. **Verifica el PDF/Excel generado**

5. **Carga un NUEVO archivo**

6. **Exporta nuevamente**

7. **Verifica que**:
   - El segundo export contiene solo datos del nuevo archivo
   - No hay datos del archivo anterior
   - La fecha de actualización es correcta

### ✅ Criterios de éxito:

- [ ] La exportación funciona después del refresh
- [ ] Los datos exportados son correctos
- [ ] No hay datos duplicados o antiguos

---

## 🐛 Problemas Comunes y Soluciones

### ❌ Problema: Los datos no se actualizan

**Solución**:
1. Abre la consola del navegador
2. Busca mensajes de error en rojo
3. Verifica que el mensaje "✅ Hard refresh completado" aparezca
4. Si no aparece, recarga la página completamente (Ctrl+F5)

### ❌ Problema: Los gráficos están vacíos

**Solución**:
1. Ve a la pestaña "Inventario Completo" primero
2. Luego ve a "Dashboard"
3. Si sigue vacío, recarga la página y vuelve a cargar el archivo

### ❌ Problema: Errores en la consola

**Solución**:
1. Copia el mensaje de error completo
2. Verifica que el archivo Excel tenga el formato correcto
3. Intenta con otro archivo Excel
4. Si persiste, reporta el error con el mensaje completo

### ❌ Problema: La página se congela

**Solución**:
1. Recarga la página (Ctrl+F5)
2. Verifica que el archivo Excel no sea demasiado grande
3. Intenta con un archivo más pequeño primero

---

## 📊 Checklist Final

Antes de dar por completadas las pruebas, verifica:

- [ ] ✅ Probaste con al menos 2 archivos Excel diferentes
- [ ] ✅ Verificaste que los cards se actualizan
- [ ] ✅ Verificaste que los gráficos se limpian y recrean
- [ ] ✅ Verificaste que las tablas se actualizan
- [ ] ✅ Revisaste la consola y no hay errores
- [ ] ✅ La exportación funciona correctamente
- [ ] ✅ El rendimiento es bueno
- [ ] ✅ La interfaz se ve correctamente

---

## 🎉 ¡Pruebas Completadas!

Si todas las pruebas pasaron, el sistema de hard refresh está funcionando correctamente y el problema de datos "pegados" ha sido resuelto.

**Fecha de prueba**: _______________
**Probado por**: _______________
**Resultado**: ✅ EXITOSO / ❌ FALLÓ

**Notas adicionales**:
_______________________________________________________
_______________________________________________________
_______________________________________________________