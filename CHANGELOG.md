# SIAPE GAP V3.4.10

- Se restauran íntegramente las observaciones y desvíos estandarizados de Laboratorio.
- Se corrige la inclusión de los desvíos de Laboratorio en el Informe PDF general.
- El informe usa los datos del Área Laboratorio cuando el panel general todavía no tiene metadatos cargados.
- Se mantiene la derivación de desvíos de Laboratorio a Seguimiento.
- Se elimina el recálculo completo del panel/informe en cada pulsación para mejorar el rendimiento.
- La actualización cruzada se realiza solo cuando el panel, informe o seguimiento están visibles.

# SIAPE GAP V3.4.9

- Área Laboratorio integrada al Informe PDF general y consolidado del prestador.
- El Informe PDF se actualiza automáticamente mientras se cargan datos de Laboratorio.
- Los desvíos de Laboratorio se incorporan automáticamente al módulo Seguimiento junto con los demás desvíos del prestador.
- Se conservan estados y observaciones de seguimiento de la auditoría actual en el dispositivo.

# SIAPE GAP V3.4.8

- El Panel General del Área Laboratorio incorpora Resumen Ejecutivo automático.
- El Panel General del Área Laboratorio incorpora Síntesis de Desvíos para el Acta.
- Ambos textos se recalculan con las respuestas, desvíos seleccionados, cumplimiento e IIRS del Área Laboratorio.
- Se mantienen las vistas específicas de Resumen y acta, Plan de mejora e Informe.

## 3.4.7 - Laboratorio + consolidación
- Panel Laboratorio con desvíos, cumplimiento, bajo, moderado, alto/crítico e IIRS.
- Resumen y acta propios del Área Laboratorio.
- Plan de mejora propio del Área Laboratorio.
- Panel general consolida Enfermería/Laboratorio por requisitos aplicables cuando corresponden al mismo prestador.
- Cumplimiento global ponderado por requisitos aplicables; NO APLICA excluido.

# SIAPE GAP V3.4.4

- Renombra la navegación principal “Auditorías” como “Área Enfermería”.
- Identifica los servicios incluidos del Área Enfermería.
- Normaliza “LABORATORIO” a “Laboratorio”.
- Incorpora dashboard dinámico de riesgo por procesos y heatmap en Laboratorio.
- Conserva la Supermatriz original como referencia y calcula riesgo actual según respuestas.
- Mantiene la metodología de riesgo en estado preliminar.

# SIAPE GAP — Versión oficial 3.4.0

## Incluye
- Login con Firebase Authentication.
- Autorización y administración de usuarios mediante Firestore.
- Roles de gestión.
- Auditorías y generación de informes.
- Motor IA local.
- Índice Integral de Riesgo SIAPE (IIRS).
- Ranking local de prestadores por riesgo.
- Tablero Ejecutivo para roles de gestión.
- Caché renovada para forzar la actualización en GitHub Pages.

## Nota
El ranking y el tablero se calculan con las auditorías guardadas en el dispositivo actual. No consolidan todavía datos de otros dispositivos.

## V3.4.1 · Mapa Prestacional demostrativo
- Mapa visible de Argentina con marcadores de prestadores ficticios.
- Ficha desplegable por prestador.
- Filtros por provincia, complejidad y nivel de riesgo.
- KPIs de cápitas, IIRS y prestadores en rojo.


## V3.4.2 integrada
- Conserva el módulo Seguimiento.
- Cambia el encabezado a “Mapa Prestacional Nacional / República Argentina”.
- Incorpora la etiqueta visible “Islas Malvinas” sobre la cartografía.

## 3.4.3 - Laboratorio (prueba)
- Se incorpora solapa LABORATORIO con Guía II Nivel.
- Se agrega especialidad operativa del auditor y restricción visual por especialidad.
- Laboratorio permite elegir desvío estandarizado o redactar uno propio.
- Se conservan antecedentes de observaciones vinculadas.
- Se incorpora la matriz de riesgo del equipo de Laboratorio como metodología preliminar, sin modificarla.

## V3.4.6
- Panel general propio del Área Laboratorio.
- Entrevista y notas específicas de Laboratorio.
- Desvíos estandarizados ampliados con antecedentes vinculados del Excel y opción de redacción propia.
- Pestaña activa resaltada.
- Mapa circular multinivel de riesgo dinámico (proceso, subproceso y requisito).

## V3.4.12E
- Reemplazo de la Guía II Nivel de Laboratorio por la versión PDF recibida, respetando su estructura y códigos visibles.
- Incorporación de los formularios de Datos, Dirección Técnica, RRHH, clasificación, informes, funcionalidad, guardia y equipamiento.
- Los desvíos propios seleccionados por el auditor se incorporan a la biblioteca reutilizable de Laboratorio al guardar/autoguardar.
- Se retira Plan de mejora del Área Laboratorio.


## V3.4.12F
- Se elimina completamente la función Plan de mejora del Área Laboratorio.
- Se renueva la caché para evitar que el navegador conserve la interfaz anterior.


## V3.4.12H
- Se elimina de forma defensiva cualquier botón Plan de mejora del Área Laboratorio.
- Se fuerza actualización de caché y Service Worker para evitar que GitHub Pages muestre una interfaz anterior.


## V3.4.12H
- Se incorpora firma manuscrita táctil del profesional entrevistado en Área Laboratorio.
- La firma se guarda con nombre, cargo, matrícula, fecha/hora y se incorpora al informe de Laboratorio.
