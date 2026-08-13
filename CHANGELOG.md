# V3.4.22 - Actualización automática del Mapa Prestacional

- Corrige el panel de detalle del Mapa Prestacional para que no conserve datos anteriores luego de guardar una auditoría.
- Al guardar, el mapa vuelve a leer la copia más reciente del prestador.
- El prestador seleccionado se mantiene y su tabla de Resultados por área se actualiza automáticamente.
- Laboratorio aparece en el mapa en cuanto tenga requisitos SI/NO evaluados y la auditoría sea guardada.
- Corrige el título visible del navegador a V3.4.22.

## V3.4.19 · Criterio profesional del auditor
- Textos técnicos editables/reemplazables en hallazgos NO.
- PDF, plan, acta, desvíos y seguimiento toman el texto final del auditor.
- Opción para restaurar sugerencias SIAPE.

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

## V3.4.18 - Área Laboratorio integrada
- Se incorpora Laboratorio como solapa profesional independiente.
- Nueva guía de 89 requisitos construida desde la guía institucional, Supermatriz y criticidad histórica 2025.
- Datos del servicio: Dirección Técnica, RRHH, horarios, modalidad, funcionamiento y equipamiento.
- Entrevista única de Laboratorio.
- Desvíos, plan de mejora, resumen/acta, referencias e informe PDF propios de Laboratorio.
- Panel general, ranking y tablero ejecutivo consolidan Enfermería, Esterilización, Lavadero, Limpieza, Hemodinamia y Laboratorio cuando existen respuestas evaluadas.
- Mapa prestacional usa la auditoría local guardada más reciente de cada prestador, muestra IIRS/desvíos por área y utiliza ubicación aproximada por provincia cuando no existen coordenadas.
- Seguimiento incorpora también los desvíos de Laboratorio de la auditoría actual.
- Caché PWA actualizada a V3.4.18.

## V3.4.20 - Matriz de Riesgo de Laboratorio
- Integración de matriz de riesgo radial inspirada en el dashboard aportado.
- Alimentación automática desde los hallazgos NO de la guía de Laboratorio.
- Probabilidad editable 1-5, impacto desde criticidad, score 1-25.
- Filtros Bajo/Medio/Alto/Crítico y resumen por categoría.
- Inclusión opcional en PDF de Laboratorio.
- Resumen de riesgo visible en Mapa Prestacional.
- Gráfico SVG local sin nueva dependencia externa.
- Corrección del modo impresión del informe PDF de Laboratorio.


## V3.4.21 - Informe Integral Ejecutivo
- Unifica Enfermería, Esterilización, Hemodinamia, Limpieza, Lavadero y Laboratorio en un solo informe.
- El informe muestra únicamente identificación, desvíos, entrevistas/notas y conclusión breve por área.
- Conclusiones editables por el auditor, con sugerencia SIAPE y límite de 700 caracteres (aprox. hasta 10 renglones).
- Se elimina el acceso operativo al PDF separado de Laboratorio; ambas áreas abren el Informe Integral.
- Fotografías del informe integral incorporan también desvíos de Laboratorio.

## V3.4.23 · Área Imágenes integrada
- Incorpora la solapa profesional **Imágenes**.
- Integra cuatro guías: Diagnóstico por Imágenes Ambulatorio, Diagnóstico por Imágenes de II Nivel, Medicina Nuclear y Terapia Radiante.
- Evita duplicar Hemodinamia, que permanece dentro del Área Enfermería.
- Agrega entrevista/notas, desvíos, plan de mejora, resumen/acta y fuentes del Área Imágenes.
- Conserva la edición profesional de las sugerencias automáticas de SIAPE.
- Integra Imágenes al Informe Integral ejecutivo.
- Integra Imágenes al Panel general, Tablero ejecutivo, Seguimiento y Mapa prestacional.
- Actualiza caché/PWA para evitar carga de versiones anteriores.
