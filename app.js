
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="siape_profesional_v2_auditoria";
const LIBKEY="siape_profesional_v2_guardadas";
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 meta:{reportNumber:"",reportYear:String(new Date().getFullYear()),prestador:"",cuit:"",province:"CABA",level:"III",type:"Privado",date:new Date().toISOString().slice(0,10),auditor:"",address:""},
 answers:{}, enabled:Object.fromEntries(["Enfermería","Esterilización","Hemodinamia","Limpieza","Lavadero"].map(x=>[x,true])),
 interview:{date:"",time:"",place:"",area:"",interviewees:"",auditors:"",summary:"",documents:"",commitments:"",additional:"",auditorNotes:"",includeInReport:true},
 rh:{service:"Internación general",shift:"Mañana",beds:0,occupied:0,normRef:"",method:"mixto",licensed:0,nurses:0,assistants:0,supervisors:0,absence:0,evidence:"",requiredNorm:0,pMin:0,mMin:0,pMod:0,mMod:0,pEsp:0,mEsp:0,pInt:0,mInt:0,productiveMinutes:360,upeTotal:0,upePerWorker:1,result:null}
};
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function defaultInterview(){return {date:state?.meta?.date||new Date().toISOString().slice(0,10),time:"",place:"",area:"",interviewees:"",auditors:"",summary:"",documents:"",commitments:"",additional:"",auditorNotes:"",includeInReport:true}}
function ensureState(){
 state.meta=state.meta||{};state.answers=state.answers||{};state.enabled=state.enabled||Object.fromEntries(["Enfermería","Esterilización","Hemodinamia","Limpieza","Lavadero"].map(x=>[x,true]));
 state.interview={...defaultInterview(),...(state.interview||{})};
 state.rh={...defaultRH(),...(state.rh||{})};
}
ensureState();
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function plain(s){return String(s||"").replace(/\s+/g," ").trim().replace(/[?.]+$/,"");}
function lowerFirst(s){s=plain(s);return s? s[0].toLowerCase()+s.slice(1):s}
function negative(item){
 let s=plain(item).replace(/^[a-z]-\s*/i,"");
 const l=s.toLowerCase();
 if(l.startsWith("cuenta con ")||l.startsWith("cuentan con ")) return "No cuenta con "+s.replace(/^cuentan? con /i,"");
 if(l.startsWith("posee ")||l.startsWith("poseen ")) return "No posee "+s.replace(/^posee[n]? /i,"");
 if(l.startsWith("dispone ")||l.startsWith("disponen ")) return "No dispone de "+s.replace(/^dispone[n]? (de )?/i,"");
 if(l.startsWith("existe ")||l.startsWith("existen ")||l.startsWith("exite ")) return "No "+s.replace(/^exite /i,"existe ").replace(/^existen /i,"existen ").replace(/^existe /i,"existe ");
 if(l.startsWith("se realiza")||l.startsWith("se aplica")||l.startsWith("se cumple")||l.startsWith("se encuentran")) return "No "+lowerFirst(s);
 if(l.startsWith("el personal utiliza")||l.startsWith("utilizan ")||l.startsWith("cumple ")||l.startsWith("cumplen ")) return "No se verifica que "+lowerFirst(s);
 if(l.includes("título")||l.includes("matrícula")||l.includes("habilitante")||l.includes("documentación")) return "No se acredita que "+lowerFirst(s);
 return "No se evidencia el cumplimiento de que "+lowerFirst(s);
}

const TECHNICAL_OVERRIDES={
 "SIA-268":{
  deviation:"No cuenta con un libro foliado o registro institucional reconocido que documente el programa anual de mantenimiento preventivo de los equipos de Esterilización.",
  why:"El mantenimiento preventivo, correctivo, la calibración, validación y recalificación de los equipos forman parte del aseguramiento de la calidad del proceso de esterilización. La ausencia de registros impide demostrar que autoclaves, esterilizadores por óxido de etileno, termoselladoras y demás equipos operan dentro de parámetros seguros y reproducibles; dificulta identificar fallas y compromete la liberación segura de productos médicos.",
  rec:"Implementar un programa anual documentado para cada equipo. Registrar identificación, fecha, intervención preventiva o correctiva, mediciones, repuestos, resultados, técnico actuante, responsable de Esterilización y autorización de retorno al servicio. Incorporar calibraciones, validaciones y recalificaciones según el método y las indicaciones del fabricante.",
  ev:"Libro foliado o sistema institucional equivalente; plan anual; órdenes de trabajo; certificados de calibración; informes de validación y recalificación; registro de fallas, reparaciones y liberación del equipo.",
  resp:"Responsable técnico o Jefatura de Esterilización / Farmacéutico responsable / Técnico en Esterilización / Ingeniería Clínica o Mantenimiento Biomédico",
  plazo:"Inmediato para equipos sin mantenimiento o validación vigente; regularización documental en 15 días"
 },
 "SIA-269":{
  deviation:"No cuenta con registros que identifiquen y clasifiquen el material procesado en la Central de Esterilización.",
  why:"El registro de material por clase permite determinar la compatibilidad del producto médico con la limpieza, el acondicionamiento y el método de esterilización seleccionado. Además, vincula cada material con el lote, ciclo, equipo, operador, controles físicos, químicos y biológicos, liberación y destino. Sin este registro no puede reconstruirse el reprocesamiento ni realizarse un retiro selectivo ante una falla, lo que compromete la trazabilidad y la seguridad del material esterilizado.",
  rec:"Implementar un registro por clase de material que incluya identificación del producto, cantidad, procedencia, método compatible, lote o ciclo, equipo, fecha, operador, controles del proceso, resultado de liberación y destino.",
  ev:"Planillas o sistema de trazabilidad; registros de recepción, clasificación, carga, ciclo, controles, liberación, almacenamiento y entrega del material.",
  resp:"Responsable técnico o Jefatura de Esterilización / Farmacéutico responsable / Técnico en Esterilización / Auxiliar en Esterilización bajo supervisión",
  plazo:"Implementación inmediata y consolidación documental en 30 días"
 }
};
function technicalFor(item){
 if(item.code==="ENF-RH-001")return {deviation:"Se verifica dotación insuficiente de personal de enfermería.",why:"La dotación disponible no alcanza la cobertura requerida según el método de cálculo seleccionado. La insuficiencia de personal limita la vigilancia continua, la ejecución oportuna de cuidados, la administración segura de medicamentos y la respuesta ante cambios clínicos o eventos críticos.",rec:"Adecuar la dotación de enfermería al requerimiento calculado, revisar la distribución por turnos y competencias, cubrir vacantes y ausentismo, y documentar la planificación de personal con reevaluación periódica de la carga de cuidados.",ev:"Plantel nominal, cronograma y parte diario por turno, matrículas y categorías profesionales, cálculo de dotación, registro de ausentismo y evidencia de incorporaciones o redistribución.",resp:"Dirección Médica / Departamento o Jefatura de Enfermería / Recursos Humanos",plazo:(state.rh?.result?.riskScore||0)>=5?"Inmediato":"30 días"};
 const exact=TECHNICAL_OVERRIDES[item.code];
 return exact?{...exact}:technical(item.item,item.domain,item.service);
}

function technical(item,domain,service){
 const t=(item+" "+domain).toLowerCase();
 let why="",rec="",ev="",resp="",plazo="";

 // La primera decisión siempre es el SERVICIO. Esto evita aplicar fundamentos de Enfermería a otras áreas.
 if(service==="Esterilización"){
  if(/mantenimiento|service|calibraci[oó]n|validaci[oó]n.*equipo/.test(t)){
   why="Los registros de mantenimiento preventivo, correctivo, calibración y validación permiten demostrar que los equipos de esterilización funcionan dentro de los parámetros establecidos y que los ciclos son reproducibles. Su ausencia impide asegurar la confiabilidad del proceso, dificulta detectar fallas y puede permitir la liberación de productos médicos sin garantía de esterilidad.";
   rec="Implementar un programa documentado de mantenimiento preventivo y correctivo para cada equipo; registrar fecha, intervención, repuestos, resultados, responsable técnico y liberación para uso. Incorporar calibraciones, validaciones y recalificaciones según método y fabricante.";
   ev="Plan de mantenimiento, órdenes de trabajo, certificados de calibración, informes de validación/recalificación, registros de fallas y constancias de liberación del equipo.";
   resp="Jefatura o responsable técnico de Esterilización / Farmacéutico responsable / Técnico en Esterilización / Ingeniería Clínica o Mantenimiento"; plazo="Inmediato para equipos sin evidencia vigente y regularización documental en 15 días";
  }else if(/registro de material por clase|material por clase|clasificaci[oó]n de material/.test(t)){
   why="El registro del material por clase permite identificar el tipo de producto médico procesado, el método compatible, la preparación, el acondicionamiento, el ciclo aplicado y su trazabilidad hasta la liberación. Sin esta clasificación no puede verificarse que cada material haya recibido un reprocesamiento adecuado a sus características, lo que incrementa el riesgo de deterioro, proceso ineficaz o uso de material no seguro.";
   rec="Implementar un registro de ingreso y procesamiento por clase de material, vinculándolo con lote o ciclo, método de esterilización, fecha, operador, controles, resultado de liberación y destino.";
   ev="Planillas o sistema de trazabilidad por clase de material, registros de carga y descarga, lote/ciclo, controles físicos, químicos y biológicos y registro de entrega.";
   resp="Jefatura o responsable técnico de Esterilización / Farmacéutico responsable / Técnico o Auxiliar en Esterilización"; plazo="30 días";
  }else if(/registro|trazabilidad|lote|ciclo|liberaci[oó]n|indicador/.test(t)){
   why="Los registros de Esterilización documentan cada etapa del reprocesamiento y permiten vincular el producto médico con el equipo, ciclo, operador, controles y destino. La falta de trazabilidad impide demostrar que el material fue correctamente procesado y liberado, limita el retiro de lotes ante fallas y compromete la seguridad del paciente.";
   rec="Implementar registros completos, legibles y correlacionados de recepción, limpieza, preparación, acondicionamiento, carga, ciclo, controles, liberación, almacenamiento y entrega. Identificar fecha, hora, lote, equipo y personal interviniente.";
   ev="Registros de ciclos y lotes, indicadores físicos/químicos/biológicos, planillas de liberación, trazabilidad de entrega y archivo según política institucional.";
   resp="Jefatura o responsable técnico de Esterilización / Farmacéutico responsable / Técnico o Auxiliar en Esterilización"; plazo="Inmediato y verificación en 15 días";
  }else if(/óxido de etileno|oxido de etileno|eto/.test(t)){
   why="La esterilización por óxido de etileno requiere un local exclusivo, sectorización, ventilación y extracción adecuadas, monitoreo ambiental, seguridad ocupacional y control estricto de aireación debido a la toxicidad, inflamabilidad y capacidad residual del agente. Una instalación inadecuada expone al personal y puede comprometer la eficacia y seguridad del proceso.";
   rec="Adecuar el sector de óxido de etileno conforme a las directrices nacionales, verificar ventilación/extracción, monitoreo ambiental, almacenamiento, señalización, plan de emergencias, mantenimiento, validación y registros de aireación.";
   ev="Habilitación, planos, informes de ventilación y monitoreo, mantenimiento, validaciones, registros de ciclos y aireación, capacitación y vigilancia de salud ocupacional.";
   resp="Dirección / Responsable técnico de Esterilización / Farmacéutico / Higiene y Seguridad / Ingeniería Clínica"; plazo="Suspensión del uso si existe riesgo y adecuación inmediata";
  }else if(/lavado|limpieza|descontaminaci[oó]n|reproces/.test(t)){
   why="La limpieza es la etapa indispensable previa a la desinfección o esterilización, porque la materia orgánica y los residuos pueden proteger microorganismos e interferir con el agente esterilizante. Un proceso no estandarizado compromete la eficacia posterior y aumenta el riesgo de infecciones.";
   rec="Estandarizar recepción, clasificación, lavado, enjuague, secado e inspección; definir detergentes, concentraciones, tiempos, equipos, EPP y controles del proceso.";
   ev="Procedimientos, fichas técnicas, registros de proceso, controles de concentración/temperatura, mantenimiento y capacitación.";
   resp="Responsable técnico de Esterilización / Técnico o Auxiliar en Esterilización / Comité de Infecciones"; plazo="Inmediato";
  }else{
   why="El requisito forma parte del sistema de organización y funcionamiento de una Central de Esterilización y Reprocesamiento. Su incumplimiento puede afectar la separación de áreas, la calidad del reprocesamiento, la trazabilidad y la liberación segura de productos médicos.";
   rec="Regularizar el requisito conforme a la Resolución MS 1067/2019 y su rectificatoria 1158/2019, documentar responsables y verificar la eficacia de la medida.";
   ev="Documentación de la Central, procedimientos, registros de proceso, controles y verificación directa.";
   resp="Dirección / Jefatura o responsable técnico de Esterilización / Farmacéutico / Técnico en Esterilización"; plazo="Según criticidad, con acción inmediata para riesgos altos";
  }
 }else if(service==="Hemodinamia"){
  if(/registro|trazabilidad|libro|parte quirúrgico|procedimiento/.test(t)){
   why="Los registros de Hemodinamia permiten reconstruir el procedimiento endovascular, identificar al equipo interviniente, los insumos y dispositivos utilizados, dosis de contraste y radiación, medicación, eventos y cuidados posteriores. Su ausencia compromete la continuidad asistencial, la vigilancia de complicaciones y la trazabilidad técnico-legal.";
   rec="Implementar registros estandarizados y completos del procedimiento, dispositivos, contraste, radiación, medicación, eventos adversos, recuperación y destino del paciente.";
   ev="Historia clínica, parte de Hemodinamia, registro de implantes e insumos, dosis de radiación, controles de recuperación y trazabilidad.";
   resp="Jefatura de Hemodinamia / Médico responsable / Enfermería de Hemodinamia / Técnico radiólogo / Calidad"; plazo="Inmediato y auditoría en 15 días";
  }else if(/carro de paro|desfibril|oxígeno|aspiraci[oó]n|emergencia|medicaci[oó]n/.test(t)){
   why="Los procedimientos endovasculares pueden presentar arritmias, reacciones al contraste, sangrado, compromiso hemodinámico o paro cardiorrespiratorio. La falta de equipamiento, medicamentos o controles de emergencia retrasa una respuesta crítica y aumenta el riesgo de daño grave o muerte.";
   rec="Completar y controlar por turno el carro de paro, desfibrilador, oxígeno, aspiración, vía aérea y medicación; asegurar mantenimiento y entrenamiento del equipo.";
   ev="Listas de chequeo, stock y vencimientos, mantenimiento, capacitaciones y simulacros.";
   resp="Jefatura de Hemodinamia / Enfermería de Hemodinamia / Farmacia / Ingeniería Clínica"; plazo="Inmediato / hasta 24 horas";
  }else if(/radiaci|radiof[ií]sica|dosimetr|protecci[oó]n radiol/.test(t)){
   why="La actividad de Hemodinamia utiliza radiación ionizante y requiere protección radiológica, dosimetría, control de equipos, blindajes y vigilancia ocupacional para reducir exposiciones innecesarias del paciente y del personal.";
   rec="Acreditar autorización y controles de Radiofísica Sanitaria, dosimetría personal, mantenimiento y control de calidad del equipo, barreras y capacitación en radioprotección.";
   ev="Autorizaciones, informes de radiofísica, dosimetría, controles de calidad, mantenimiento y capacitación.";
   resp="Dirección / Jefatura de Hemodinamia / Responsable de Radiofísica / Higiene y Seguridad"; plazo="Inmediato para incumplimientos críticos";
  }else{
   why="La organización de Hemodinamia debe asegurar recursos humanos competentes, infraestructura, equipamiento, bioseguridad, radioprotección, respuesta a emergencias y continuidad del cuidado antes, durante y después de los procedimientos endovasculares. El incumplimiento puede comprometer la seguridad y oportunidad de la atención.";
   rec="Regularizar el requisito conforme a la Resolución MS 1184/2018, documentar su implementación y controlar periódicamente su cumplimiento.";
   ev="Habilitación, grilla categorizante, nómina y competencias, procedimientos, controles de equipos y registros asistenciales.";
   resp="Dirección / Jefatura médica de Hemodinamia / Enfermería de Hemodinamia / Calidad"; plazo="Según criticidad";
  }
 }else if(service==="Lavadero"){
  if(/registro|trazabilidad|control|temperatura|dosificaci[oó]n/.test(t)){
   why="Los registros del lavadero sanitario permiten demostrar las condiciones de recepción, clasificación, lavado, desinfección, secado, acondicionamiento y distribución de la ropa. Sin ellos no puede verificarse que se cumplieron los parámetros del proceso ni investigar fallas o contaminación cruzada.";
   rec="Implementar registros por carga o lote con fecha, origen, programa, temperatura, productos y dosificación, operador, incidencias, controles y destino.";
   ev="Planillas de cargas, registros de equipos, dosificación, temperaturas, mantenimiento, controles microbiológicos cuando correspondan y entrega.";
   resp="Responsable de Lavadero / Servicios Generales / Comité de Infecciones / Mantenimiento"; plazo="15 a 30 días";
  }else if(/circuito|limpio|sucio|barrera|transporte|ropa contaminada/.test(t)){
   why="La separación entre ropa sucia y limpia evita el cruce de microorganismos y materia orgánica durante la recolección, transporte, procesamiento y almacenamiento. La falta de barrera sanitaria o circuitos diferenciados favorece contaminación cruzada y exposición ocupacional.";
   rec="Establecer circuitos unidireccionales, barrera sanitaria, carros y áreas diferenciadas, recipientes cerrados, EPP y procedimientos de contingencia.";
   ev="Plano funcional, señalización, observación directa, carros diferenciados, procedimientos y capacitación.";
   resp="Responsable de Lavadero / Comité de Infecciones / Higiene y Seguridad / Infraestructura"; plazo="Inmediato y plan de adecuación";
  }else{
   why="La lavandería hospitalaria debe controlar todo el ciclo de la ropa sanitaria para reducir carga microbiana, proteger al trabajador y entregar textiles limpios, secos y preservados. Las deficiencias en el proceso pueden favorecer contaminación cruzada y afectar la disponibilidad de ropa para la atención.";
   rec="Adecuar la organización, infraestructura, procedimientos y controles a las Directrices nacionales para lavaderos sanitarios, con personal capacitado, mantenimiento y trazabilidad.";
   ev="Procedimientos, registros de proceso, mantenimiento, capacitación, circuitos y controles de calidad.";
   resp="Responsable de Lavadero / Servicios Generales / Comité de Infecciones / Dirección"; plazo="Según criticidad";
  }
 }else if(service==="Limpieza"){
  if(/registro|planilla|cronograma|frecuencia/.test(t)){
   why="Los registros de higiene hospitalaria permiten verificar que las áreas fueron limpiadas y desinfectadas con la frecuencia, técnica y producto definidos según riesgo. Su ausencia impide comprobar la ejecución del procedimiento, supervisar al personal y corregir fallas.";
   rec="Implementar cronogramas y registros por sector, turno y tarea, identificando responsable, producto, dilución, horario, supervisión e incidencias.";
   ev="Cronogramas, planillas firmadas, fichas técnicas, registros de dilución, supervisiones y acciones correctivas.";
   resp="Responsable de Limpieza / Servicios Generales / Comité de Infecciones / Calidad"; plazo="Inmediato y verificación en 15 días";
  }else{
   why="La higiene hospitalaria reduce la carga de microorganismos y materia orgánica del ambiente y forma parte de la prevención de infecciones asociadas al cuidado. Un procedimiento inadecuado, sin productos, frecuencias, técnicas ni supervisión definidos, favorece la persistencia y dispersión de contaminantes.";
   rec="Implementar procedimientos por clasificación de áreas y riesgo, definir productos, diluciones, técnica, frecuencia, elementos diferenciados, EPP, capacitación y supervisión.";
   ev="Programa de higiene, procedimientos, fichas técnicas, cronogramas, registros, capacitación y auditorías.";
   resp="Responsable de Limpieza / Servicios Generales / Comité de Infecciones / Calidad"; plazo="Inmediato para áreas críticas y 30 días para consolidación";
  }
 }else{
  // ENFERMERÍA
  if(/departamento de enfermer|estructura organ|jefe.a de enfermer|supervisión general|organigrama/.test(t)){
   why="La organización formal del servicio de Enfermería permite definir autoridad, dependencia, responsabilidades, supervisión y líneas de comunicación. Su ausencia dificulta planificar y controlar los cuidados, distribuir adecuadamente el personal y responder de manera coordinada ante eventos asistenciales, comprometiendo la continuidad y seguridad de la atención.";
   rec="Formalizar la estructura del Departamento o Servicio de Enfermería mediante organigrama, dependencia jerárquica, descripción de cargos, funciones y mecanismos de supervisión. Designar autoridades con título y matrícula habilitante y comunicar la estructura a todo el personal.";
   ev="Organigrama aprobado, acto de designación, perfiles de puesto, manual de funciones y registros de supervisión.";resp="Dirección institucional / Dirección médica / Jefatura de Enfermería";plazo="15 a 30 días";
  }else if(/dotación|personal exclusivo|cantidad de enfermer|relación enfermer|60 %|recurso humano/.test(t)){
   why="Una dotación insuficiente o inadecuadamente distribuida reduce la vigilancia y oportunidad de los cuidados, aumenta la carga laboral y favorece omisiones, demoras, eventos adversos y agotamiento del personal. La dotación debe adecuarse a camas habilitadas, ocupación, complejidad y carga de cuidados.";
   rec="Evaluar la dotación por turno y sector mediante carga de cuidados; cubrir déficits, prever reemplazos y documentar la programación y supervisión.";
   ev="Nómina, títulos y matrículas, diagramas por turno, camas/puestos, ocupación y cálculo de carga de cuidados.";resp="Dirección / Recursos Humanos / Jefatura de Enfermería";plazo="Plan inmediato y regularización en 30 días";
  }else if(/registro|historia clínica|evoluci|firma|sello/.test(t)){
   why="Los registros de Enfermería completos, oportunos e identificables permiten reconstruir los cuidados, comunicar cambios clínicos y acreditar la ejecución de indicaciones y procedimientos. Los registros incompletos o tardíos comprometen la continuidad asistencial y el respaldo técnico-legal.";
   rec="Estandarizar el registro en tiempo real con fecha, hora e identificación profesional; auditar calidad, legibilidad, integridad y trazabilidad.";
   ev="Historias clínicas, registros de Enfermería, auditorías y acciones correctivas.";resp="Jefatura de Enfermería / Calidad / Historias Clínicas";plazo="Inmediato y verificación en 15 días";
  }else if(/lavado de manos|jabón|toalla de papel|alcohol en gel|higiene de manos/.test(t)){
   why="La falta de insumos o puntos adecuados para higiene de manos impide cumplir las precauciones estándar y favorece la transmisión cruzada de microorganismos, aumentando el riesgo de infecciones asociadas al cuidado de la salud.";
   rec="Garantizar disponibilidad continua y accesible de agua, jabón líquido, toallas descartables y preparación alcohólica; controlar reposición y adherencia.";
   ev="Verificación en terreno, registros de reposición, procedimiento y observaciones de adherencia.";resp="Enfermería / Comité de Infecciones / Servicios Generales";plazo="Inmediato";
  }else if(/guante|barbijo|camisol|antiparra|protección personal|epp|elementos de barrera/.test(t)){
   why="La ausencia o uso incorrecto de elementos de protección personal expone al personal y a los pacientes a sangre, fluidos, aerosoles y otros agentes biológicos. La selección del EPP debe responder al riesgo de cada tarea y formar parte de las precauciones estándar y basadas en la transmisión.";
   rec="Garantizar stock, accesibilidad, selección y uso correcto del EPP; capacitar, supervisar adherencia y registrar incidentes.";
   ev="Stock, registros de entrega, procedimiento, capacitación y observaciones de uso.";resp="Higiene y Seguridad / Comité de Infecciones / Jefatura del servicio";plazo="Inmediato";
  }else if(/punzo|corto|descartador/.test(t)){
   why="La falta de descartadores rígidos, resistentes y ubicados en el punto de uso incrementa el riesgo de accidentes cortopunzantes y exposición a sangre. El descarte debe realizarse inmediatamente, sin reencapuchar y antes de superar el límite de llenado.";
   rec="Instalar descartadores reglamentarios en todos los puntos de generación, controlar llenado y retiro seguro y capacitar al personal.";
   ev="Verificación en terreno, procedimiento, registros de retiro y capacitación.";resp="Enfermería / Higiene y Seguridad / Comité de Infecciones";plazo="Inmediato / hasta 24 horas";
  }else if(/residuo/.test(t)){
   why="La gestión inadecuada de residuos comunes y patogénicos expone a pacientes y trabajadores a material potencialmente contaminado, incrementa accidentes y contaminación cruzada y debilita la trazabilidad del circuito hasta su disposición final.";
   rec="Regularizar segregación en origen, recipientes y bolsas diferenciadas, señalización, retiro, almacenamiento transitorio, EPP y registros del operador habilitado.";
   ev="Recipientes, bolsas, señalización, registros de retiro, contrato y manifiestos.";resp="Dirección / Higiene y Seguridad / Comité de Infecciones / Servicios Generales";plazo="Inmediato";
  }else if(/carro de paro|desfibril|laringoscop|oxígeno|aspiración|emergencia/.test(t)){
   why="La falta o indisponibilidad de equipamiento e insumos para emergencias demora la respuesta ante deterioro clínico, paro cardiorrespiratorio o vía aérea dificultosa y puede comprometer la supervivencia y seguridad del paciente.";
   rec="Completar, señalizar y controlar el equipamiento de emergencia; realizar verificación documentada por turno, mantenimiento preventivo y capacitación.";
   ev="Lista de chequeo, stock, vencimientos, mantenimiento y registros de simulación.";resp="Jefatura del servicio / Enfermería / Farmacia / Mantenimiento";plazo="Inmediato / hasta 24 horas";
  }else if(/manual|norma|procedimiento|protocolo|reglamento/.test(t)){
   why="Las normas y procedimientos escritos permiten estandarizar la práctica, definir responsabilidades, reducir variabilidad y orientar al personal ante situaciones habituales y críticas. Su ausencia favorece errores, omisiones, respuestas no uniformes y debilita la trazabilidad técnico-legal del cuidado.";
   rec="Elaborar o actualizar el documento, aprobarlo institucionalmente, identificar versión y responsables, asegurar disponibilidad, capacitar al personal y evaluar periódicamente su cumplimiento.";
   ev="Documento aprobado y vigente, control de versiones, constancias de difusión, capacitación y auditorías de adherencia.";resp="Dirección / Jefatura de Enfermería / Calidad";plazo="30 días";
  }else{
   why="El cumplimiento de este requisito es necesario para que Enfermería funcione de manera organizada, segura y verificable. Su ausencia puede generar variabilidad, demoras, errores u omisiones y comprometer la calidad, continuidad y trazabilidad de los cuidados.";
   rec="Regularizar el requisito, asignar responsables, aportar evidencia objetiva y verificar la eficacia de la acción correctiva.";
   ev="Documentación respaldatoria, registros y verificación directa en terreno.";resp="Dirección / Jefatura de Enfermería / Responsable del sector";plazo="Según criticidad";
  }
 }
 return {deviation:negative(item)+".",why,rec,ev,resp,plazo};
}
function answerFor(code){
 if(code==="ENF-RH-001"&&state.rh?.result?.calculated)return {response:state.rh.result.hasDeficit?"NO":"SI",obs:state.rh.evidence||state.rh.result.interpretation,status:state.rh.result.hasDeficit?"DESVÍO":"CUMPLE"};
 return state.answers[code]||{response:"",obs:"",status:"PENDIENTE"}
}
function applicable(it){return String(it.levels||"").includes(state.meta.level)}
function riskLabel(s){return s>=4?"ROJO - ALTO":s===3?"AMARILLO - MODERADO":"VERDE - BAJO"}
function rhSyntheticItem(){
 const r=state.rh?.result;
 if(!state.enabled["Enfermería"]||!r||!r.calculated)return null;
 return {code:"ENF-RH-001",service:"Enfermería",domain:"Recursos Humanos",theme:"Dotación de Enfermería",levels:"I,II,III,IV",score:r.riskScore,item:`La dotación de personal de enfermería resulta suficiente para ${state.rh.service} en el turno ${state.rh.shift}`,riskType:"Asistencial, organizacional y legal",impact:"La insuficiencia de personal puede comprometer la vigilancia, la continuidad de los cuidados, la administración segura de medicamentos y la respuesta ante eventos críticos.",criticality:r.riskLabel};
}
function activeItems(){let a=ITEMS.filter(i=>state.enabled[i.service]&&applicable(i));const rh=rhSyntheticItem();if(rh)a.push(rh);return a}
function deviations(){return activeItems().filter(i=>answerFor(i.code).response==="NO")}
function stats(){
 const active=activeItems(), answered=active.filter(i=>["SI","NO","NA"].includes(answerFor(i.code).response));
 const dev=deviations(), yes=answered.filter(i=>answerFor(i.code).response==="SI").length;
 return {active:active.length,answered:answered.length,dev:dev.length,high:dev.filter(i=>i.score>=4).length,mod:dev.filter(i=>i.score===3).length,low:dev.filter(i=>i.score<=2).length,compliance:(yes+(answered.filter(i=>answerFor(i.code).response==="NA").length?0:0))/(answered.filter(i=>answerFor(i.code).response!=="NA").length||1)};
}
function riskOverall(){let s=stats();return s.high>0?"ROJO - NIVEL ALTO":s.mod>0?"AMARILLO - NIVEL MODERADO":s.dev>0?"VERDE - NIVEL BAJO":"SIN DESVÍOS REGISTRADOS"}
function selectedServices(){return services.filter(s=>state.enabled[s])}
function servicesWithDeviations(){return services.filter(s=>deviations().some(i=>i.service===s))}
function reportId(){let n=String(state.meta.reportNumber||"").trim(),y=String(state.meta.reportYear||"").trim();return n&&y?`${n}/${y}`:n||y||"SIN NÚMERO"}
function severityName(score){return score>=4?"GRAVE / ALTO":score===3?"MODERADO":"LEVE / BAJO"}
function severityCounts(ds){return {grave:ds.filter(i=>i.score>=4).length,moderate:ds.filter(i=>i.score===3).length,low:ds.filter(i=>i.score<=2).length}}
function countPhrase(c){
 const parts=[];
 if(c.grave)parts.push(`${c.grave} ${c.grave===1?"grave o crítico":"graves o críticos"}`);
 if(c.moderate)parts.push(`${c.moderate} ${c.moderate===1?"moderado":"moderados"}`);
 if(c.low)parts.push(`${c.low} ${c.low===1?"leve":"leves"}`);
 return parts.length?parts.join(", "):"sin desvíos";
}
function serviceSummary(service){
 const ds=deviations().filter(i=>i.service===service), counts=severityCounts(ds);
 const themes={};ds.forEach(i=>themes[i.theme||i.domain]=(themes[i.theme||i.domain]||0)+1);
 const top=Object.entries(themes).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0].toLowerCase());
 return {count:ds.length,high:counts.grave,mod:counts.moderate,low:counts.low,top};
}
function executiveBullets(){
 return servicesWithDeviations().map(service=>{
  const x=serviceSummary(service);
  const detail=x.top.length?` Los hallazgos predominan en ${x.top.join(", ")}.`:"";
  return `${service}: ${x.count} ${x.count===1?"desvío":"desvíos"}: ${countPhrase({grave:x.high,moderate:x.mod,low:x.low})}.${detail}`;
 });
}
function executive(){
 const s=stats(), audited=selectedServices(), affected=servicesWithDeviations(), counts={grave:s.high,moderate:s.mod,low:s.low};
 const auditedText=audited.length?audited.join(", "):"las áreas seleccionadas";
 if(!s.dev){
  return `Del análisis integral de las actividades correspondientes a ${auditedText}, que conforman la traza prestacional evaluada, no se identificaron desvíos en los requisitos respondidos. El resultado deberá interpretarse considerando el grado de avance de la auditoría y la evidencia efectivamente examinada. Corresponde sostener los controles y la documentación que respaldan el cumplimiento observado.`;
 }
 const severity=`Se registraron ${s.dev} ${s.dev===1?"desvío":"desvíos"}: ${countPhrase(counts)}.`;
 const affectedText=affected.length===1?`El área afectada es ${affected[0]}.`:`Las áreas con hallazgos son ${affected.join(", ")}.`;
 const priority=s.high?"La presencia de desvíos graves o críticos determina la necesidad de acciones correctivas inmediatas.":s.mod?"Los desvíos moderados requieren un plan de mejora con plazos definidos y seguimiento.":"Los desvíos leves requieren corrección programada y verificación posterior para evitar su progresión.";
 return `Del análisis integral de las actividades correspondientes a ${auditedText}, que conforman la traza prestacional evaluada, se verifica un nivel de riesgo prestacional ${riskOverall().toLowerCase()}. ${severity} ${affectedText} Los hallazgos afectan, según el requisito incumplido, la organización, los recursos humanos, la trazabilidad, el equipamiento, la bioseguridad y el funcionamiento de los procesos. ${priority} Estas situaciones pueden comprometer la calidad de atención y la seguridad de los pacientes. El detalle se desarrolla en el Anexo Técnico Operativo, ordenado por área, proceso y criticidad.`;
}
function deviationsBySeverity(ds, min, max){return ds.filter(i=>i.score>=min&&i.score<=max).sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code))}

// Biblioteca ejecutiva para la síntesis del acta.
// Cada desvío marcado NO se interpreta dentro de su servicio y se agrupa
// con otros requisitos equivalentes para evitar enumeraciones repetitivas.
const ACTA_DOMAINS={
 "Enfermería":[
  {id:"seguridad",label:"protocolos para la seguridad del paciente y prevención de eventos adversos",rx:/neumon|respirador|ventilaci[oó]n|nav\b|ca[ií]da|[uú]lcera|lesi[oó]n por presi[oó]n|upp\b|identificaci[oó]n del paciente|evento adverso|cat[eé]ter|infecci[oó]n|iaas|medicaci[oó]n segura/i,weight:10},
  {id:"organizacion",label:"organización y gestión del servicio",rx:/departamento|organigrama|estructura organiz|diagn[oó]stico situacional|planificaci[oó]n|programaci[oó]n|supervisi[oó]n|jefatura|responsable|gesti[oó]n|comit[eé]/i,weight:9},
  {id:"rrhh",label:"planificación, dotación y capacitación del recurso humano",rx:/personal|dotaci[oó]n|turno|distribuci[oó]n|recurso humano|capacitaci[oó]n|competencia|matr[ií]cula|t[ií]tulo|inducci[oó]n|educaci[oó]n permanente/i,weight:9},
  {id:"registros",label:"documentación asistencial y trazabilidad de los cuidados",rx:/registro|historia cl[ií]nica|evoluci[oó]n|firma|sello|documentaci[oó]n|trazabilidad|plan de cuidado|proceso de atenci[oó]n/i,weight:8},
  {id:"bioseguridad",label:"bioseguridad y prevención de infecciones",rx:/bioseg|higiene de manos|lavado de manos|epp|guante|barbijo|camisol|residuo|cortopunz|aislamiento/i,weight:8},
  {id:"equipamiento",label:"disponibilidad y control del equipamiento e insumos asistenciales",rx:/equip|carro de paro|desfibril|laringoscop|ox[ií]geno|aspiraci[oó]n|bomba|insumo|medicaci[oó]n vencida/i,weight:7},
  {id:"procedimientos",label:"normas y procedimientos asistenciales",rx:/norma|manual|procedimiento|protocolo|instructivo/i,weight:7},
  {id:"infraestructura",label:"condiciones funcionales e infraestructura del servicio",rx:/infraestructura|habitaci[oó]n|office|sector|espacio|circulaci[oó]n|lavabo|sanitario/i,weight:6}
 ],
 "Esterilización":[
  {id:"proceso",label:"aseguramiento y control del proceso de esterilización",rx:/esteriliz|reproces|ciclo|liberaci[oó]n|indicador|biol[oó]gic|qu[ií]mic|bowie|control f[ií]sico|validaci[oó]n|calidad/i,weight:10},
  {id:"trazabilidad",label:"trazabilidad y documentación del material procesado",rx:/registro|trazabilidad|lote|clase de material|identificaci[oó]n|rotulado|documentaci[oó]n|archivo/i,weight:9},
  {id:"circuitos",label:"organización de los circuitos y separación de áreas",rx:/limpio|sucio|cr[ií]tic|semicr[ií]tic|no cr[ií]tic|sector|barrera|circulaci[oó]n|recepci[oó]n|almacenamiento/i,weight:9},
  {id:"mantenimiento",label:"mantenimiento, calibración y validación del equipamiento",rx:/mantenimiento|calibraci[oó]n|service|recalificaci[oó]n|equipo|autoclave|termosell/i,weight:8},
  {id:"limpieza",label:"limpieza, preparación y acondicionamiento del instrumental",rx:/lavado|limpieza|descontamin|preparaci[oó]n|acondicion|secado|inspecci[oó]n/i,weight:8},
  {id:"bioseguridad",label:"bioseguridad y protección del personal",rx:/bioseg|epp|guante|barbijo|residuo|ventilaci[oó]n|[oó]xido de etileno|eto\b/i,weight:8},
  {id:"rrhh",label:"supervisión técnica y capacitación del personal",rx:/personal|t[eé]cnico|farmac[eé]ut|responsable|supervisi[oó]n|capacitaci[oó]n|dotaci[oó]n/i,weight:8}
 ],
 "Hemodinamia":[
  {id:"seguridad",label:"seguridad del paciente y respuesta ante emergencias",rx:/emergencia|carro de paro|reanimaci[oó]n|recuperaci[oó]n|evento adverso|medicaci[oó]n|vencid|monitorizaci[oó]n/i,weight:10},
  {id:"radiologica",label:"seguridad radiológica y control de las instalaciones",rx:/radiof[ií]sic|radioprotecci[oó]n|radiol[oó]g|dosimetr|blindaje|radiaci[oó]n/i,weight:10},
  {id:"equipamiento",label:"disponibilidad, mantenimiento y control del equipamiento",rx:/equip|mantenimiento|calibraci[oó]n|angi[oó]grafo|desfibril|monitor|bomba|insumo/i,weight:9},
  {id:"organizacion",label:"organización y funcionamiento del servicio",rx:/organiz|responsable|jefatura|dotaci[oó]n|personal|turno|guardia|estructura|office|sector/i,weight:8},
  {id:"registros",label:"documentación y trazabilidad de los procedimientos",rx:/registro|trazabilidad|historia cl[ií]nica|informe|consentimiento|libro|documentaci[oó]n/i,weight:8},
  {id:"bioseguridad",label:"bioseguridad y prevención de infecciones",rx:/bioseg|higiene|epp|residuo|limpio|sucio|infecci[oó]n|esteril/i,weight:8},
  {id:"procedimientos",label:"protocolos y procedimientos diagnósticos y terapéuticos",rx:/protocolo|procedimiento|norma|manual|cateterismo|endovascular/i,weight:7}
 ],
 "Limpieza":[
  {id:"procesos",label:"procedimientos de limpieza y desinfección hospitalaria",rx:/limpieza|desinfecci[oó]n|higiene hospital|procedimiento|frecuencia|t[eé]cnica|terminal|concurrente/i,weight:10},
  {id:"areas",label:"clasificación y tratamiento diferenciado de las áreas asistenciales",rx:/[aá]rea cr[ií]tica|semicr[ií]tica|no cr[ií]tica|clasificaci[oó]n de [aá]rea|sector/i,weight:9},
  {id:"bioseguridad",label:"bioseguridad y prevención de contaminación cruzada",rx:/bioseg|epp|guante|barbijo|residuo|contaminaci[oó]n cruzada|higiene de manos/i,weight:9},
  {id:"productos",label:"selección, preparación y control de productos e insumos",rx:/producto|diluci[oó]n|desinfectante|detergente|rotulado|ficha de seguridad|insumo/i,weight:8},
  {id:"equipamiento",label:"disponibilidad y diferenciación del equipamiento de limpieza",rx:/equip|carro|balde|mopa|paño|elemento diferenciado|c[oó]digo de color/i,weight:8},
  {id:"gestion",label:"organización, capacitación y supervisión del servicio",rx:/organiz|personal|capacitaci[oó]n|supervisi[oó]n|responsable|registro|control/i,weight:7}
 ],
 "Lavadero":[
  {id:"circuitos",label:"segregación de los circuitos de ropa limpia y sucia",rx:/limpio|sucio|barrera sanitaria|circuito|segregaci[oó]n|zona contaminada|zona limpia/i,weight:10},
  {id:"proceso",label:"control del proceso de lavado, desinfección y acondicionamiento",rx:/lavado|desinfecci[oó]n|secado|planchado|acondicion|temperatura|detergente|proceso/i,weight:9},
  {id:"gestion",label:"gestión y trazabilidad de la ropa hospitalaria",rx:/trazabilidad|registro|clasificaci[oó]n|identificaci[oó]n|ropa hospital|gesti[oó]n|control/i,weight:9},
  {id:"transporte",label:"recolección, transporte y almacenamiento de la ropa",rx:/recolecci[oó]n|transporte|carro|bolsa|almacenamiento|dep[oó]sito|distribuci[oó]n/i,weight:8},
  {id:"bioseguridad",label:"bioseguridad y protección del personal",rx:/bioseg|epp|guante|barbijo|riesgo biol[oó]gico|higiene de manos/i,weight:8},
  {id:"estructura",label:"organización, estructura y equipamiento del lavadero",rx:/organiz|estructura|equip|m[aá]quina|lavadora|secadora|personal|responsable|capacitaci[oó]n/i,weight:7}
 ]
};

function classifyActaDomain(item){
 const rules=ACTA_DOMAINS[item.service]||[];
 const text=plain(`${item.item||""} ${item.domain||""} ${item.theme||""}`).toLowerCase();
 const matched=rules.filter(r=>r.rx.test(text)).sort((a,b)=>b.weight-a.weight);
 if(matched.length)return matched[0];
 return {id:"otros",label:item.service==="Enfermería"?"cumplimiento de los procesos asistenciales":item.service==="Esterilización"?"organización y control del reprocesamiento":item.service==="Hemodinamia"?"organización y seguridad de los procedimientos":item.service==="Limpieza"?"organización y control de la higiene hospitalaria":"organización y control de la gestión de ropa hospitalaria",weight:5};
}
function actaConcepts(service){
 const grouped={};
 deviations().filter(i=>i.service===service).forEach(i=>{
  const d=classifyActaDomain(i);
  if(!grouped[d.id])grouped[d.id]={...d,count:0,maxScore:0,totalScore:0};
  grouped[d.id].count++;
  grouped[d.id].maxScore=Math.max(grouped[d.id].maxScore,Number(i.score)||0);
  grouped[d.id].totalScore+=Number(i.score)||0;
 });
 return Object.values(grouped).sort((a,b)=>
  b.maxScore-a.maxScore || b.weight-a.weight || b.count-a.count || b.totalScore-a.totalScore
 );
}
function joinSpanish(parts){
 if(parts.length<=1)return parts[0]||"";
 return parts.slice(0,-1).join(", ")+" y "+parts[parts.length-1];
}
function wordCount(text){return plain(text).split(/\s+/).filter(Boolean).length}
function buildActaLine(service){
 const concepts=actaConcepts(service);
 if(!concepts.length)return "";
 // Se priorizan como máximo cuatro ejes; si el texto supera 50 palabras,
 // se eliminan progresivamente los de menor prioridad.
 let labels=concepts.slice(0,4).map(x=>x.label);
 const starters={
  "Enfermería":"Se verificaron deficiencias en ",
  "Esterilización":"Se evidenciaron desvíos en ",
  "Hemodinamia":"Se observaron incumplimientos en ",
  "Limpieza":"Se verificaron deficiencias en ",
  "Lavadero":"Se constataron desvíos en "
 };
 let text="";
 while(labels.length){
  text=`${service.toUpperCase()}: ${starters[service]||"Se verificaron deficiencias en "}${joinSpanish(labels)}.`;
  if(wordCount(text)<=50)break;
  labels.pop();
 }
 return text;
}
function actSummary(){
 const affected=services.filter(service=>deviations().some(i=>i.service===service));
 if(!affected.length)return "No se registraron desvíos relevantes para incorporar al acta.";
 return affected.map(buildActaLine).filter(Boolean).join("\n\n");
}
function bindMeta(){
 Object.keys(state.meta).forEach(k=>{let e=document.querySelector(`[data-meta="${k}"]`);if(e){e.value=state.meta[k]||"";e.oninput=()=>{state.meta[k]=e.value;save();renderAll();}}});
 services.forEach(s=>{let e=document.querySelector(`[data-area="${s}"]`);if(e){e.checked=!!state.enabled[s];e.onchange=()=>{state.enabled[s]=e.checked;save();renderAll();}}});
}
function bindInterview(){
 ensureState();
 $$('[data-interview]').forEach(el=>{
  const k=el.dataset.interview;
  if(el.type==='checkbox')el.checked=!!state.interview[k];else el.value=state.interview[k]||'';
  if(!el.dataset.bound){
   const update=()=>{state.interview[k]=el.type==='checkbox'?el.checked:el.value;save();const n=$('#interviewSaved');if(n){n.textContent='Guardado automático: '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}};
   el.addEventListener('input',update);el.addEventListener('change',update);el.dataset.bound='1';
  }
 });
}
function interviewHasContent(){const x=state.interview||{};return ['place','area','interviewees','auditors','summary','documents','commitments','additional','auditorNotes'].some(k=>String(x[k]||'').trim())}
function interviewText(){const x=state.interview||{},parts=[];
 if(x.date||x.time)parts.push(`Fecha y hora: ${x.date||'Sin informar'}${x.time?' · '+x.time:''}`);
 if(x.place)parts.push(`Lugar / modalidad: ${x.place}`);if(x.area)parts.push(`Área o servicio: ${x.area}`);
 if(x.interviewees)parts.push(`Personas entrevistadas: ${x.interviewees}`);if(x.auditors)parts.push(`Equipo auditor: ${x.auditors}`);
 if(x.summary)parts.push(`Síntesis de la entrevista: ${x.summary}`);if(x.documents)parts.push(`Documentación o evidencia: ${x.documents}`);
 if(x.commitments)parts.push(`Compromisos asumidos: ${x.commitments}`);if(x.additional)parts.push(`Datos adicionales: ${x.additional}`);
 if(x.auditorNotes)parts.push(`Observaciones del auditor: ${x.auditorNotes}`);return parts.join('\n\n')}
function interviewReportBlock(){if(!state.interview?.includeInReport||!interviewHasContent())return '';const x=state.interview;return `<section class="report-section"><h1>5. REGISTRO DE ENTREVISTA Y DATOS ADICIONALES</h1><table class="report-meta"><tr><th>Fecha</th><td>${esc(x.date||'')}</td><th>Hora</th><td>${esc(x.time||'')}</td></tr><tr><th>Lugar / modalidad</th><td>${esc(x.place||'')}</td><th>Área o servicio</th><td>${esc(x.area||'')}</td></tr><tr><th>Personas entrevistadas</th><td colspan="3">${esc(x.interviewees||'')}</td></tr><tr><th>Equipo auditor</th><td colspan="3">${esc(x.auditors||'')}</td></tr></table>${x.summary?`<h2>Síntesis de la entrevista</h2><div class="interview-report-text">${esc(x.summary)}</div>`:''}${x.documents?`<h2>Documentación o evidencia mencionada</h2><div class="interview-report-text">${esc(x.documents)}</div>`:''}${x.commitments?`<h2>Compromisos asumidos</h2><div class="interview-report-text">${esc(x.commitments)}</div>`:''}${x.additional?`<h2>Datos adicionales</h2><div class="interview-report-text">${esc(x.additional)}</div>`:''}${x.auditorNotes?`<h2>Observaciones del auditor</h2><div class="interview-report-text">${esc(x.auditorNotes)}</div>`:''}</section>`}
function copyInterview(){const t=interviewText();if(!t){alert('No hay datos de entrevista para copiar.');return}navigator.clipboard?.writeText(t).then(()=>alert('Registro de entrevista copiado.')).catch(()=>prompt('Copie el registro:',t))}
function clearInterview(){if(!confirm('¿Limpiar todos los datos de entrevista y comentarios adicionales?'))return;state.interview=defaultInterview();save();bindInterview();renderReport()}
const services=["Enfermería","Esterilización","Hemodinamia","Limpieza","Lavadero"];
let currentService="Enfermería";
function renderAudit(){
 $("#serviceTabs").innerHTML=services.map(s=>{const extra=s==="Enfermería"?1:0;return `<button class="service-tab ${s===currentService?"active":""}" onclick="currentService='${s}';renderAudit()">${s} (${ITEMS.filter(i=>i.service===s&&applicable(i)).length+extra})</button>`}).join("");
 let q=($("#search").value||"").toLowerCase(), dom=$("#domainFilter").value;
 let arr=ITEMS.filter(i=>i.service===currentService&&applicable(i)&&(!q||(i.code+" "+i.item+" "+i.domain).toLowerCase().includes(q))&&(!dom||i.domain===dom));
 const domains=[...new Set(ITEMS.filter(i=>i.service===currentService).map(i=>i.domain))];
 if(currentService==="Enfermería"&&!domains.includes("Recursos Humanos"))domains.unshift("Recursos Humanos");
 $("#domainFilter").innerHTML='<option value="">Todos los dominios</option>'+domains.map(x=>`<option ${x===dom?"selected":""}>${esc(x)}</option>`).join("");
 let rhBlock="";
 if(currentService==="Enfermería"&&(!dom||dom==="Recursos Humanos")&&(!q||("enf-rh-001 dotación personal recurso humano enfermería").includes(q))){
  const r=state.rh?.result;
  if(!r){
   rhBlock=`<div class="card audit-card rh-integrated-card"><div class="audit-head"><div><div class="itemtitle">ENF-RH-001 · La dotación de personal de enfermería resulta suficiente según la demanda asistencial y el método seleccionado</div><div class="meta">Enfermería · Recursos Humanos · Niveles I, II, III y IV · <span class="badge b5">CÁLCULO OBLIGATORIO</span></div></div></div><div class="notice"><b>Este requisito todavía no fue calculado.</b> Cargue camas/pacientes, dotación observada y el criterio aplicable. El SIAPE calculará personal requerido, disponible, déficit, cobertura y riesgo.</div><div class="toolbar"><button class="primary" onclick="openRHCalculator()">Abrir calculadora de personal</button></div></div>`;
  }else{
   const item=rhSyntheticItem(); const a=answerFor("ENF-RH-001"), tech=technicalFor(item);
   rhBlock=`<div class="card audit-card ${a.response.toLowerCase()} rh-integrated-card"><div class="audit-head"><div><div class="itemtitle">ENF-RH-001 · ${esc(item.item)}</div><div class="meta">Enfermería · Recursos Humanos · ${esc(state.rh.service)} · Turno ${esc(state.rh.shift)} · <span class="badge b${r.riskScore}">${esc(r.riskLabel)} · ${r.riskScore}</span></div></div></div><div class="kpis"><div><b>${r.required.toFixed(1)}</b><span>Requerido</span></div><div><b>${r.available.toFixed(1)}</b><span>Disponible efectivo</span></div><div><b>${r.deficit.toFixed(1)}</b><span>Déficit</span></div><div><b>${r.coverage.toFixed(1)}%</b><span>Cobertura</span></div></div><div class="responses"><button class="resp ${a.response==="SI"?"sel":""}" disabled>SI</button><button class="resp ${a.response==="NO"?"sel":""}" disabled>NO</button></div><p><b>Resultado automático:</b> ${esc(r.interpretation)}</p><p><b>Criterio utilizado:</b> ${esc(state.rh.normRef||"No consignado")} · ${esc(r.usedText)}</p><div class="toolbar"><button class="secondary" onclick="openRHCalculator()">Revisar o recalcular dotación</button></div>${a.response==="NO"?`<div class="detail"><h4>Desvío</h4><div>${esc(tech.deviation)}</div><h4>Fundamentación técnica</h4><div>${esc(tech.why)}</div><h4>Recomendación</h4><div>${esc(tech.rec)}</div><h4>Evidencia esperada</h4><div>${esc(tech.ev)}</div><h4>Responsable</h4><div>${esc(tech.resp)}</div><h4>Plazo</h4><div>${esc(tech.plazo)}</div><h4>Marco normativo</h4><div>${esc(normText("Enfermería"))}</div></div>`:""}</div>`;
  }
 }
 const normalCards=arr.map(i=>{
  let a=answerFor(i.code), tech=technicalFor(i);
  return `<div class="card audit-card ${a.response.toLowerCase()}">
   <div class="audit-head"><div><div class="itemtitle">${esc(i.code)} · ${esc(i.item)}</div><div class="meta">${esc(i.service)} · ${esc(i.domain)} · Niveles ${esc(i.levels)} · <span class="badge b${i.score}">${esc(i.criticality||riskLabel(i.score))} · ${i.score}</span></div></div></div>
   <div class="responses">${["SI","NO","NA","NO EVALUADO"].map(r=>`<button class="resp ${a.response===r?"sel":""}" onclick="setResp('${i.code}','${r}')">${r==="NA"?"NO APLICA":r}</button>`).join("")}</div>
   <label>Observación y evidencia</label><textarea oninput="setObs('${i.code}',this.value)" placeholder="Describa lo observado, documentos revisados, entrevistas y evidencia directa...">${esc(a.obs)}</textarea>
   ${a.response==="NO"?`<div class="detail"><h4>Desvío</h4><div>${esc(tech.deviation)}</div><h4>Fundamentación técnica</h4><div>${esc(tech.why)}</div><h4>Recomendación</h4><div>${esc(tech.rec)}</div><h4>Evidencia esperada</h4><div>${esc(tech.ev)}</div><h4>Responsable</h4><div>${esc(tech.resp)}</div><h4>Plazo</h4><div>${esc(tech.plazo)}</div><h4>Marco normativo</h4><div>${esc(normText(i.service))}</div></div>`:""}
  </div>`;
 }).join("");
 $("#auditList").innerHTML=rhBlock+normalCards||'<div class="notice">No hay requisitos aplicables con los filtros seleccionados.</div>';
}
function setResp(code,r){state.answers[code]={...answerFor(code),response:r};save();renderAll()}
function setObs(code,v){state.answers[code]={...answerFor(code),obs:v};save()}
function normText(service){
 const national=NORMS.filter(n=>n.service===service&&n.jurisdiction==="Nación");
 const specific=(service==="Enfermería")?NORMS.filter(n=>n.service==="Enfermería"&&n.jurisdiction===state.meta.province):[];
 const parts=[];
 if(service==="Enfermería"){
  parts.push("Marco nacional: Ley 24.004 y Decreto 2497/93; Resolución MS 938/2023 sobre organización y funcionamiento de la gestión de Enfermería y cuidados progresivos.");
  if(specific.length) parts.push(`Marco de ${state.meta.province}: ${specific.map(n=>n.number+(n.regulation?"; "+n.regulation:"")).join(". ")}.`);
  else parts.push(`Marco de ${state.meta.province}: no se encontró una referencia provincial cargada; verificar normativa jurisdiccional vigente.`);
 }else if(service==="Esterilización"){
  parts.push("Resolución MS 1067/2019: Directrices de Organización y Funcionamiento y grillas de habilitación categorizante de Centrales de Esterilización y Reprocesamiento de Productos Médicos; Resolución 1158/2019 rectificatoria.");
 }else if(service==="Hemodinamia"){
  parts.push("Resolución MS 1184/2018: Directrices de Organización y Funcionamiento y grillas de habilitación categorizante de Hemodinamia en diagnóstico y terapéutica endovascular por cateterismo, cirugía endovascular y radiología intervencionista.");
 }else if(service==="Limpieza"){
  parts.push("Resolución MS 4221/2023, Anexo IV: Directrices de Organización y Funcionamiento para la Higiene Hospitalaria; aplicar además los anexos correspondientes a higiene de manos y prevención de infecciones cuando el requisito lo requiera.");
 }else if(service==="Lavadero"){
  parts.push("Directrices nacionales de organización y funcionamiento para lavaderos sanitarios en establecimientos de salud y lavaderos sanitarios externos (2025): procedimientos y gestión de lavandería hospitalaria, circuitos, barrera sanitaria, procesamiento y trazabilidad.");
 }
 parts.push("Debe verificarse además la norma de habilitación de la jurisdicción, el nivel y el tipo de establecimiento antes de citar artículos específicos.");
 return parts.join(" ");
}
function renderDashboard(){
 let s=stats();
 $("#kpis").innerHTML=[
 ["Ítems aplicables",s.active],["Respondidos",s.answered],["Desvíos",s.dev],["Riesgo alto",s.high],["Cumplimiento",(s.compliance*100).toFixed(1)+"%"]
 ].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
 $("#overall").textContent=riskOverall();
 $("#serviceTable").innerHTML=services.filter(x=>state.enabled[x]).map(sv=>{
  let arr=ITEMS.filter(i=>i.service===sv&&applicable(i)), ds=arr.filter(i=>answerFor(i.code).response==="NO");
  let ans=arr.filter(i=>["SI","NO"].includes(answerFor(i.code).response)), yes=ans.filter(i=>answerFor(i.code).response==="SI").length;
  return `<tr><td>${sv}</td><td>${arr.length}</td><td>${ds.length}</td><td>${ans.length?(yes/ans.length*100).toFixed(1):"0.0"}%</td><td>${ds.filter(i=>i.score<=2).length}</td><td>${ds.filter(i=>i.score===3).length}</td><td>${ds.filter(i=>i.score>=4).length}</td><td>${ds.some(i=>i.score>=4)?"ROJO - ALTO":ds.some(i=>i.score===3)?"AMARILLO - MODERADO":ds.length?"VERDE - BAJO":"SIN DESVÍOS"}</td></tr>`
 }).join("");
}
function renderSummary(){
 $("#execText").textContent=(state.ai&&state.ai.executive)||executive();$("#actText").textContent=(state.ai&&state.ai.act)||actSummary();
}
function renderDevs(){
 let ds=deviations().sort((a,b)=>b.score-a.score);
 $("#devRows").innerHTML=ds.map(i=>{let a=answerFor(i.code),t=technicalFor(i);return `<tr><td>${i.code}</td><td>${i.service}</td><td>${i.domain}</td><td>${t.deviation}</td><td>${a.obs||""}</td><td>${t.why}</td><td>${riskLabel(i.score)}</td><td>${t.rec}</td><td>${t.resp}</td><td>${t.plazo}</td><td>${normText(i.service)}</td></tr>`}).join("");
 $("#planRows").innerHTML=ds.map(i=>{let a=answerFor(i.code),t=technicalFor(i);return `<tr><td>${i.code}</td><td>${i.service}</td><td>${t.deviation}</td><td>${t.rec}</td><td>${t.ev}</td><td>${t.resp}</td><td>${t.plazo}</td><td><select onchange="setStatus('${i.code}',this.value)">${["PENDIENTE","EN PROCESO","CUMPLIDO","VERIFICADO"].map(x=>`<option ${a.status===x?"selected":""}>${x}</option>`).join("")}</select></td></tr>`}).join("");
}
function setStatus(c,v){state.answers[c]={...answerFor(c),status:v};save()}
function renderNorms(){
 $("#normRows").innerHTML=NORMS.map(n=>`<tr><td>${n.scope}</td><td>${n.jurisdiction}</td><td>${n.number}</td><td>${n.regulation}</td><td>${n.authority}</td><td>${n.service}</td><td>${n.status}</td></tr>`).join("");
}
function scopeText(){
 const audited=selectedServices();
 const intros={
  "Enfermería":"Se evaluaron las características prestacionales relacionadas con los cuidados integrales realizados por el personal de Enfermería, el cumplimiento del proceso de atención —valoración, diagnóstico, planificación, ejecución y evaluación—, la estructura organizativa, la supervisión, la dotación, las competencias, los protocolos, la bioseguridad y la responsabilidad técnico-legal de los registros.",
  "Esterilización":"Se evaluó la estructura y funcionalidad de las etapas del proceso de esterilización y reprocesamiento de productos médicos, incluyendo recepción, limpieza, acondicionamiento, métodos utilizados, equipamiento, mantenimiento, controles, liberación, almacenamiento, trazabilidad y cumplimiento normativo.",
  "Hemodinamia":"Se evaluó la organización y funcionamiento del servicio de Hemodinamia, su recurso humano, estructura, equipamiento, procesos diagnósticos y terapéuticos endovasculares, registros, radioprotección, bioseguridad, respuesta ante emergencias, recuperación y trazabilidad de prácticas, insumos y dispositivos.",
  "Limpieza":"Se evaluó la organización del servicio de Limpieza e Higiene Hospitalaria, clasificación de áreas, procedimientos, frecuencias, productos y diluciones, equipamiento, elementos diferenciados, capacitación, supervisión, registros y medidas destinadas a prevenir contaminación cruzada e infecciones asociadas al cuidado.",
  "Lavadero":"Se evaluó la gestión de la ropa hospitalaria desde su recolección hasta la distribución, considerando circuitos limpio y sucio, barrera sanitaria, transporte, clasificación, lavado, desinfección, secado, acondicionamiento, almacenamiento, trazabilidad, bioseguridad y control de los servicios propios o tercerizados."
 };
 return audited.map(s=>`<li>${esc(intros[s])}</li>`).join("");
}
function conclusionsText(){
 const s=stats(), affected=servicesWithDeviations(), all=deviations(), counts=severityCounts(all);
 if(!s.dev){
  return `En virtud de las tareas efectuadas, dentro del objeto y alcance definidos, no se registraron desvíos en las áreas auditadas conforme a las respuestas cargadas. El resultado debe interpretarse según la totalidad de requisitos efectivamente evaluados y la evidencia disponible. Corresponde sostener los controles, la supervisión y la documentación que respaldan el cumplimiento observado.`;
 }
 const areaDetails=affected.map(service=>{
  const ds=all.filter(i=>i.service===service).sort((a,b)=>b.score-a.score);
  const c=severityCounts(ds);
  const themes={};
  ds.forEach(i=>{const k=plain(i.theme||i.domain||"proceso evaluado");themes[k]=(themes[k]||0)+1;});
  const topThemes=Object.entries(themes).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k.toLowerCase());
  const serious=ds.filter(i=>i.score>=4).slice(0,3);
  const moderate=!serious.length?ds.filter(i=>i.score===3).slice(0,2):[];
  const highlighted=[...serious,...moderate];
  let text=`En ${service} se identificaron ${ds.length} ${ds.length===1?"desvío":"desvíos"} (${countPhrase(c)})`;
  if(topThemes.length)text+=`, principalmente vinculados con ${topThemes.join(", ")}`;
  if(highlighted.length)text+=`. Entre los hallazgos prioritarios: ${highlighted.map(i=>technicalFor(i).deviation).join(" ")}`;
  return text+`.`;
 });
 const impactParts=[];
 if(all.some(i=>/registro|trazabilidad|document/i.test((i.item||"")+" "+(i.domain||""))))impactParts.push("la trazabilidad y el respaldo técnico-legal de los procesos");
 if(all.some(i=>/bioseg|higiene|limpieza|residuo|ropa|lavado|desinfe/i.test((i.item||"")+" "+(i.domain||""))))impactParts.push("la bioseguridad y la prevención de infecciones");
 if(all.some(i=>/personal|dotación|recurso humano|jefe|responsable|matrícula|título/i.test((i.item||"")+" "+(i.domain||""))))impactParts.push("la capacidad operativa y la asignación de responsabilidades profesionales");
 if(all.some(i=>/equipo|mantenimiento|carro|desfibril|autoclave|esterilizador/i.test((i.item||"")+" "+(i.domain||""))))impactParts.push("la disponibilidad y confiabilidad del equipamiento");
 if(all.some(i=>/protocolo|procedimiento|norma|manual|circuito/i.test((i.item||"")+" "+(i.domain||""))))impactParts.push("la estandarización y continuidad de los procesos");
 const impacts=impactParts.length?impactParts.join(", "):"la calidad, continuidad y seguridad de las prestaciones";
 const compliance=(s.compliance*100).toFixed(1).replace(".",",");
 const actions=[];
 if(counts.grave)actions.push("adoptar medidas correctivas inmediatas sobre los desvíos graves o críticos y acreditar su regularización prioritaria");
 if(counts.moderate)actions.push("incorporar los desvíos moderados a un plan de mejora con responsables, plazos y seguimiento documentado");
 if(counts.low)actions.push("programar la corrección de los desvíos leves y verificar que no evolucionen hacia situaciones de mayor riesgo");
 return `En virtud de las tareas de auditoría efectuadas, en el marco del objeto y alcance descriptos, se concluye que el proceso prestacional presenta un nivel de riesgo ${riskOverall().toLowerCase()}. Se detectaron ${s.dev} ${s.dev===1?"desvío":"desvíos"} sobre ${s.active} requisitos aplicables: ${countPhrase(counts)}, con un nivel de cumplimiento del ${compliance} %. ${areaDetails.join(" ")} En conjunto, los hallazgos comprometen ${impacts} y pueden afectar la seguridad del paciente y la calidad de la prestación. En consecuencia, el prestador deberá ${actions.join("; ")}; aportar evidencia objetiva de cumplimiento y permitir la posterior verificación de eficacia.`;
}
function legalAnnex(){
 return selectedServices().map(s=>`<h3>${esc(s)}</h3><p>${esc(normText(s))}</p>`).join("");
}
function technicalAnnex(){
 let affected=servicesWithDeviations();
 if(!affected.length)return '<p>No se registraron desvíos para desarrollar en este anexo.</p>';
 return affected.map((s,idx)=>{
  let ds=deviations().filter(i=>i.service===s).sort((a,b)=>b.score-a.score);
  return `<h3 class="area-heading">8.${idx+1} ${esc(s.toUpperCase())}</h3>`+ds.map(i=>{let t=technicalFor(i),a=answerFor(i.code);return `<div class="deviation-block"><h4>${esc(i.code)} · ${esc(t.deviation)}</h4>${a.obs?`<p><b>Observación y evidencia:</b> ${esc(a.obs)}</p>`:""}<p><b>Fundamentación técnica:</b> ${esc(t.why)}</p><p><b>Riesgo:</b> ${esc(riskLabel(i.score))} — ${esc(i.riskType||"")}. ${esc(i.impact||"")}</p><p><b>Recomendación:</b> ${esc(t.rec)}</p><p><b>Evidencia esperada:</b> ${esc(t.ev)}</p><p><b>Responsable:</b> ${esc(t.resp)}</p><p><b>Plazo:</b> ${esc(t.plazo)}</p><p><b>Marco normativo:</b> ${esc(normText(i.service))}</p></div>`}).join("");
 }).join("");
}
function normalizeSearch(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function clearSavedAuditSearch(){let e=$("#savedAuditSearch");if(e)e.value="";renderSavedAudits()}
function renderSavedAudits(){
 let el=$("#savedAudits");if(!el)return;
 let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");
 let all=Object.entries(lib).sort((a,b)=>(b[1].savedAt||"").localeCompare(a[1].savedAt||""));
 let query=normalizeSearch($("#savedAuditSearch")?.value||"");
 let arr=query?all.filter(([id,x])=>{
   let m=x.state?.meta||{};
   let savedDate=x.savedAt?new Date(x.savedAt).toLocaleString():"";
   let auditDate=m.date?new Date(m.date+"T00:00:00").toLocaleDateString():"";
   let haystack=[id,m.reportNumber,m.reportYear,m.prestador,m.cuit,m.date,auditDate,m.auditor,m.address,m.province,m.level,m.type,savedDate].map(normalizeSearch).join(" ");
   return query.split(/\s+/).every(term=>haystack.includes(term));
 }):all;
 let count=$("#savedAuditCount");if(count)count.textContent=query?`${arr.length} de ${all.length} auditorías encontradas`:`${all.length} auditorías guardadas`;
 if(!all.length){el.innerHTML='<div class="notice">Todavía no hay auditorías guardadas mediante el botón 💾.</div>';return}
 if(!arr.length){el.innerHTML='<div class="notice">No se encontraron auditorías que coincidan con la búsqueda.</div>';return}
 el.innerHTML=arr.map(([id,x])=>{let m=x.state?.meta||{};return `<div class="saved-item"><div><strong>Informe ${esc(m.reportNumber||"S/N")}/${esc(m.reportYear||"")} · ${esc(m.prestador||"Prestador sin identificar")}</strong><div class="small">CUIT: ${esc(m.cuit||"Sin informar")} · Auditoría: ${esc(m.date||"Sin fecha")} · Jurisdicción: ${esc(m.province||"Sin informar")}</div><div class="small">Guardado: ${esc(new Date(x.savedAt).toLocaleString())} · ${Object.keys(x.state?.answers||{}).length} respuestas registradas</div></div><div class="saved-actions"><button class="secondary" onclick="loadAuditSnapshot('${id}')">Abrir / continuar</button><button class="danger" onclick="deleteAuditSnapshot('${id}')">Eliminar</button></div></div>`}).join("");
}
function saveAuditSnapshot(){
 save();let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");let base=`${state.meta.reportNumber||"SN"}_${state.meta.reportYear||"SA"}_${state.meta.prestador||"PRESTADOR"}`.replace(/[^a-z0-9áéíóúüñ_-]+/gi,"_");let id=base.toLowerCase();lib[id]={savedAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))};localStorage.setItem(LIBKEY,JSON.stringify(lib));renderSavedAudits();alert(`Auditoría ${reportId()} guardada en este dispositivo.`)
}
function loadAuditSnapshot(id){let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");if(!lib[id])return;state=JSON.parse(JSON.stringify(lib[id].state));ensureState();save();renderAll();alert(`Auditoría ${reportId()} abierta.`)}
function deleteAuditSnapshot(id){if(!confirm("¿Eliminar esta auditoría guardada del dispositivo?"))return;let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");delete lib[id];localStorage.setItem(LIBKEY,JSON.stringify(lib));renderSavedAudits()}
function rhReportBlock(){
 const r=state.rh?.result;if(!r?.calculated)return "";
 return `<h2>Evaluación de Recursos Humanos de Enfermería</h2><table><tr><th>Servicio</th><th>Turno</th><th>Método</th><th>Requerido</th><th>Disponible efectivo</th><th>Déficit</th><th>Cobertura</th><th>Riesgo</th></tr><tr><td>${esc(state.rh.service)}</td><td>${esc(state.rh.shift)}</td><td>${esc(state.rh.method)}</td><td>${r.required.toFixed(1)}</td><td>${r.available.toFixed(1)}</td><td>${r.deficit.toFixed(1)}</td><td>${r.coverage.toFixed(1)}%</td><td>${esc(r.riskLabel)}</td></tr></table><p>${esc(r.interpretation)}</p><p class="small"><b>Criterio consignado:</b> ${esc(state.rh.normRef||"No informado")} · ${esc(r.usedText)}</p>`;
}
function renderReport(){
 let s=stats(), audited=selectedServices(), affected=servicesWithDeviations(), bullets=executiveBullets();
 $("#reportContent").innerHTML=`<div class="report">
 <section class="cover"><h1>INFORME EJECUTIVO N° ${esc(reportId())}</h1><h2>AUDITORÍA INTEGRAL PRESTACIONAL</h2><div class="institution">INSSJP · GERENCIA DE AUDITORÍA PRESTACIONAL</div><div class="provider">${esc(state.meta.prestador||"PRESTADOR")}</div></section>
 <section><h1>ÍNDICE</h1><div class="index-list">1. Datos del prestador y de la auditoría<br>2. Resumen ejecutivo<br>3. Objeto de la auditoría<br>4. Alcance<br>5. Panel general y análisis de riesgo<br>6. Conclusiones<br>7. Anexo técnico legal<br>8. Anexo técnico operativo - Desvíos por área y proceso</div></section>
 <section class="report-section"><h1>1. DATOS DEL PRESTADOR Y DE LA AUDITORÍA</h1><table class="report-meta"><tr><th>Informe</th><td>${esc(reportId())}</td><th>Fecha</th><td>${esc(state.meta.date)}</td></tr><tr><th>Institución</th><td>${esc(state.meta.prestador)}</td><th>CUIT</th><td>${esc(state.meta.cuit)}</td></tr><tr><th>Domicilio</th><td>${esc(state.meta.address)}</td><th>Jurisdicción</th><td>${esc(state.meta.province)}</td></tr><tr><th>Nivel</th><td>${esc(state.meta.level)}</td><th>Tipo</th><td>${esc(state.meta.type)}</td></tr><tr><th>Auditor</th><td colspan="3">${esc(state.meta.auditor)}</td></tr><tr><th>Áreas auditadas</th><td colspan="3">${esc(audited.join(", "))}</td></tr></table></section>
 <section class="report-section"><h1>2. RESUMEN EJECUTIVO</h1><p>${esc(executive())}</p>${bullets.length?`<p>En tal sentido se verificó:</p><ul class="red-list">${bullets.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<p>La evaluación comprendió ${s.active} requisitos aplicables. Se registraron ${s.dev} desvíos, de los cuales ${s.high} son altos o críticos y ${s.mod} moderados. El detalle se encuentra en el Anexo Técnico Operativo.</p></section>
 <section class="report-section"><h1>3. OBJETO DE LA AUDITORÍA</h1><p>El objeto de la presente auditoría es verificar el cumplimiento del proceso prestacional en las áreas seleccionadas, conforme al vínculo prestacional con el INSSJP, evaluando aspectos legales, organizativos, técnicos y de calidad de la traza de atención y de los procesos de apoyo auditados.</p></section>
 <section class="report-section"><h1>4. ALCANCE</h1><p>Análisis del proceso prestacional mediante el relevamiento de las siguientes áreas: <b>${esc(audited.join(", "))}</b>.</p><p>Para llevar adelante la tarea precitada:</p><ul>${scopeText()}</ul><p>El alcance se limita a las áreas seleccionadas en el inicio de la auditoría y a la evidencia efectivamente disponible y observada durante el relevamiento.</p></section>
 ${interviewReportBlock()}<section class="report-section"><h1>${state.interview?.includeInReport&&interviewHasContent()?"6":"5"}. PANEL GENERAL Y ANÁLISIS DE RIESGO</h1><table><tr><th>Ítems aplicables</th><th>Respondidos</th><th>Desvíos</th><th>Moderados</th><th>Altos/críticos</th><th>Cumplimiento</th><th>Resultado</th></tr><tr><td>${s.active}</td><td>${s.answered}</td><td>${s.dev}</td><td>${s.mod}</td><td>${s.high}</td><td>${(s.compliance*100).toFixed(1)}%</td><td>${esc(riskOverall())}</td></tr></table>${rhReportBlock()}<h2>Síntesis para el acta</h2><div class="summary-text">${esc(actSummary())}</div></section>
 <section class="report-section"><h1>${state.interview?.includeInReport&&interviewHasContent()?"7":"6"}. CONCLUSIONES</h1><p>${esc(conclusionsText())}</p></section>
 <section class="report-section"><h1>${state.interview?.includeInReport&&interviewHasContent()?"8":"7"}. ANEXO TÉCNICO LEGAL</h1>${legalAnnex()}<p class="small">Las referencias normativas deben validarse según jurisdicción, nivel, tipo de establecimiento y requisito concreto antes de citar artículos específicos.</p></section>
 <section class="report-section"><h1>${state.interview?.includeInReport&&interviewHasContent()?"9":"8"}. ANEXO TÉCNICO OPERATIVO - DESVÍOS POR ÁREA Y PROCESO</h1>${technicalAnnex()}</section>
 <div class="signature">Firma del auditor</div></div>`;
}
function renderAll(){ensureState();bindMeta();bindInterview();bindRH();renderRH();renderDashboard();renderAudit();renderSummary();renderDevs();renderNorms();renderReport();renderSavedAudits()}
function showPage(id,btn){const page=$("#"+id);if(!page){alert("No se pudo abrir la pantalla solicitada: "+id);return} $$(".page").forEach(x=>x.classList.remove("active"));page.classList.add("active");$$(".navbtn").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");if(id==="reportPage")renderReport();if(id==="rrhhPage"){bindRH();renderRH()}if(id==="interviewPage")bindInterview();if(id==="summaryPage"||id==="aiPage")renderSummary();if(id==="aiPage")updateAIConnection();window.scrollTo({top:0,left:0,behavior:"auto"})}
function openRHCalculator(){try{const btn=Array.from(document.querySelectorAll(".navbtn")).find(b=>/RRHH Enfermer/i.test(b.textContent||""));showPage("rrhhPage",btn||null);setTimeout(()=>{const first=document.querySelector("#rrhhPage [data-rh]");if(first)first.focus({preventScroll:true});window.scrollTo(0,0)},0)}catch(e){console.error(e);alert("No se pudo abrir la calculadora de Recursos Humanos. Detalle: "+e.message)}}
function copyText(id){navigator.clipboard.writeText($("#"+id).textContent);alert("Texto copiado")}
function exportJSON(){let b=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="SIAPE_Informe_"+(state.meta.reportNumber||"SN")+"_"+(state.meta.reportYear||"SA")+"_"+(state.meta.prestador||"prestador")+".json";a.click()}
function importJSON(e){let f=e.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);ensureState();save();renderAll();alert("Auditoría importada")}catch{alert("Archivo no válido")}};r.readAsText(f)}
function resetAudit(){if(confirm("¿Crear una nueva auditoría? La auditoría actual seguirá disponible solo si fue guardada con el botón 💾 o exportada.")){state={meta:{reportNumber:"",reportYear:String(new Date().getFullYear()),prestador:"",cuit:"",province:"CABA",level:"III",type:"Privado",date:new Date().toISOString().slice(0,10),auditor:"",address:""},answers:{},enabled:Object.fromEntries(services.map(x=>[x,true])),interview:defaultInterview(),rh:defaultRH()};save();renderAll()}}

function defaultRH(){return {service:"Internación general",shift:"Mañana",beds:0,occupied:0,normRef:"",method:"mixto",licensed:0,nurses:0,assistants:0,supervisors:0,absence:0,evidence:"",requiredNorm:0,pMin:0,mMin:0,pMod:0,mMod:0,pEsp:0,mEsp:0,pInt:0,mInt:0,productiveMinutes:360,upeTotal:0,upePerWorker:1,result:null}}
function ensureRH(){state.rh={...defaultRH(),...(state.rh||{})}}
function n(v){const x=Number(v);return Number.isFinite(x)?Math.max(0,x):0}
function bindRH(){
 ensureRH();
 $$('[data-rh]').forEach(el=>{
  const k=el.dataset.rh;
  if(document.activeElement!==el)el.value=state.rh[k]??"";
  if(!el.dataset.bound){el.addEventListener('input',()=>{state.rh[k]=el.type==='number'?n(el.value):el.value;state.rh.result=null;save();renderRH()});el.addEventListener('change',()=>{state.rh[k]=el.type==='number'?n(el.value):el.value;state.rh.result=null;save();renderRH()});el.dataset.bound='1'}
 });
}
function rhRisk(coverage){
 if(coverage>=95)return {label:"ADECUADA",score:1,css:"rh-ok"};
 if(coverage>=80)return {label:"MODERADO",score:3,css:"rh-mod"};
 if(coverage>=70)return {label:"ALTO",score:4,css:"rh-high"};
 return {label:"CRÍTICO",score:5,css:"rh-critical"};
}
function calculateRH(){
 ensureRH();const x=state.rh;
 const availableRaw=n(x.licensed)+n(x.nurses)+n(x.assistants)+n(x.supervisors);
 const available=Math.max(0,availableRaw*(1-n(x.absence)/100));
 const norm=n(x.requiredNorm)||null;
 const careMinutes=n(x.pMin)*n(x.mMin)+n(x.pMod)*n(x.mMod)+n(x.pEsp)*n(x.mEsp)+n(x.pInt)*n(x.mInt);
 const progressive=careMinutes>0&&n(x.productiveMinutes)>0?careMinutes/n(x.productiveMinutes):null;
 const upe=n(x.upeTotal)>0&&n(x.upePerWorker)>0?n(x.upeTotal)/n(x.upePerWorker):null;
 const valid={normativa:norm,progresivos:progressive,upe:upe};
 let required=null,used=[];
 if(x.method==='mixto'){
  used=Object.entries(valid).filter(([,v])=>v&&v>0);
  required=used.length?Math.max(...used.map(([,v])=>v)):null;
 }else{required=valid[x.method];if(required)used=[[x.method,required]]}
 if(!required){alert('Complete los datos del método seleccionado para poder calcular la dotación requerida.');return}
 required=Math.ceil(required*10)/10;
 const deficit=Math.max(0,required-available);
 const coverage=required?Math.min(999,available/required*100):0;
 const risk=rhRisk(coverage);
 const hasDeficit=coverage<95;
 const methodNames={normativa:'Normativa',progresivos:'Cuidados progresivos',upe:'UPE'};
 const usedText=used.map(([k,v])=>`${methodNames[k]}: ${v.toFixed(1)}`).join(' · ');
 const interpretation=hasDeficit?`Se verifica una dotación insuficiente de personal de enfermería en ${x.service}, turno ${x.shift}. La cobertura calculada es del ${coverage.toFixed(1)} %, con un déficit estimado de ${deficit.toFixed(1)} trabajador/es respecto del criterio seleccionado. Esta situación compromete la vigilancia continua, la continuidad de los cuidados y la capacidad de respuesta asistencial.`:`La dotación observada alcanza una cobertura del ${coverage.toFixed(1)} % respecto del criterio seleccionado. No se configura desvío por insuficiencia de personal en el turno evaluado, sin perjuicio de verificar la distribución de competencias, ausentismo y cobertura de los demás turnos.`;
 x.result={calculated:true,availableRaw,available,required,deficit,coverage,riskLabel:risk.label,riskScore:risk.score,riskCss:risk.css,hasDeficit,careMinutes,progressive,upe,norm,usedText,interpretation,calculatedAt:new Date().toISOString()};
 save();renderAll();
}
function renderRH(){
 ensureRH();const el=$('#rhResults');if(!el)return;const r=state.rh.result;
 if(!r){el.innerHTML='<div class="notice">Complete los datos y presione <b>Calcular dotación</b>. El resultado se incorporará automáticamente al resumen, los desvíos y el informe cuando exista déficit.</div>';return}
 const methodLabel={normativa:'Normativa',progresivos:'Cuidados progresivos',upe:'UPE',mixto:'Mixto'}[state.rh.method]||state.rh.method;
 el.innerHTML=`<div class="kpis"><div><b>${r.required.toFixed(1)}</b><span>Personal requerido</span></div><div><b>${r.available.toFixed(1)}</b><span>Personal disponible efectivo</span></div><div><b>${r.deficit.toFixed(1)}</b><span>Déficit</span></div><div><b>${r.coverage.toFixed(1)}%</b><span>Cobertura</span></div></div><div class="rh-status ${r.riskCss}">RIESGO: ${esc(r.riskLabel)}</div><p><b>Método:</b> ${esc(methodLabel)}. ${esc(r.usedText)}</p><p><b>Interpretación SIAPE:</b> ${esc(r.interpretation)}</p><p><b>Trazabilidad:</b> ${esc(state.rh.normRef||'Norma no consignada')} · Camas/pacientes: ${esc(state.rh.occupied)} · Dotación nominal: ${r.availableRaw.toFixed(1)} · Ausentismo: ${n(state.rh.absence).toFixed(1)} %.</p>`;
}
function clearRH(){if(!confirm('¿Limpiar los datos del módulo de Recursos Humanos?'))return;state.rh=defaultRH();save();bindRH();renderAll()}

window.addEventListener("load",()=>{renderAll();});

// ===== MODO IA HÍBRIDO (opcional) =====
const AI_SETTINGS_KEY="siape_ai_settings_v2";
let aiGenerated=null;
function aiSettings(){return JSON.parse(localStorage.getItem(AI_SETTINGS_KEY)||'null')||{endpoint:""}}
function saveAISettings(){
 const endpoint=(document.querySelector('#aiEndpoint')?.value||'').trim();
 localStorage.setItem(AI_SETTINGS_KEY,JSON.stringify({endpoint}));
 const status=document.querySelector('#aiStatus'); if(status)status.textContent='Configuración guardada en este dispositivo.';
}
function updateAIConnection(){
 const el=document.querySelector('#aiConnection'), badge=document.querySelector('#aiBadge'); if(!el)return;
 if(navigator.onLine){el.textContent='Conexión a Internet disponible. Falta verificar el servidor IA.';el.className='small ai-online';badge.textContent='En línea';}
 else{el.textContent='Sin conexión. SIAPE continúa funcionando en modo local.';el.className='small ai-offline';badge.textContent='Offline';}
}
function initAI(){
 const input=document.querySelector('#aiEndpoint'); if(input)input.value=aiSettings().endpoint;
 updateAIConnection();
}
function aiAuditPayload(){
 const ds=deviations().sort((a,b)=>b.score-a.score);
 return {
  meta:{...state.meta},
  services:selectedServices(),
  risk:riskOverall(),
  totals:severityCounts(ds),
  deviations:ds.map(i=>({code:i.code,area:i.service,domain:i.domain,criticality:i.criticality||riskLabel(i.score),score:i.score,requirement:i.item,observation:answerFor(i.code).obs||'',technical:technicalFor(i).deviation})),
  current:{executive:executive(),act:actSummary(),conclusion:conclusionsText()}
 };
}
function localAIAnalysis(task='full'){
 const ds=deviations().sort((a,b)=>b.score-a.score);
 const affected=services.filter(s=>ds.some(i=>i.service===s));
 const counts=severityCounts(ds);
 const compliance=(stats().compliance*100).toFixed(1);
 const areaPhrases=affected.map(service=>{
  const cs=actaConcepts(service).slice(0,3);
  return cs.length?`${service}: predominan ${joinSpanish(cs.map(c=>c.label))}`:'';
 }).filter(Boolean);
 const highAreas=affected.filter(service=>ds.some(i=>i.service===service&&(Number(i.score)||0)>=4));
 const executiveText=`La auditoría comprendió ${stats().active} requisitos aplicables en ${selectedServices().length} áreas, con un cumplimiento del ${compliance} %. Se identificaron ${ds.length} desvíos (${counts.critical||0} críticos, ${counts.high||0} altos, ${counts.moderate||0} moderados y ${counts.low||0} bajos). ${areaPhrases.join('. ')}.${highAreas.length?` Los desvíos de mayor prioridad se concentran en ${joinSpanish(highAreas)}.`:''}`;
 const actText=actSummary();
 const mainConcepts=[];
 affected.forEach(service=>actaConcepts(service).slice(0,2).forEach(c=>mainConcepts.push({service,...c})));
 mainConcepts.sort((a,b)=>b.maxScore-a.maxScore||b.weight-a.weight||b.count-a.count);
 const impacts=mainConcepts.slice(0,4).map(c=>c.label);
 const conclusionText=`En función de los hallazgos relevados, el proceso prestacional presenta un nivel de riesgo ${riskOverall().toLowerCase()}. Los desvíos comprometen principalmente ${joinSpanish(impacts)}. Corresponde priorizar la corrección de los incumplimientos críticos y altos, documentar las acciones implementadas y verificar posteriormente su eficacia mediante evidencia objetiva.`;
 const priorities=mainConcepts.slice(0,5).map((c,idx)=>`${idx+1}. ${c.service}: corregir ${c.label}, priorizando los desvíos de mayor criticidad.`).join('\n')||'No se identificaron prioridades porque no hay desvíos.';
 const missingObs=ds.filter(i=>(Number(i.score)||0)>=4 && !plain(answerFor(i.code).obs)).slice(0,8);
 const inconsistencies=missingObs.length?`Revisar ${missingObs.length} desvíos altos o críticos sin observación/evidencia cargada: ${missingObs.map(i=>i.code).join(', ')}.`:'No se detectaron desvíos altos o críticos sin observación cargada.';
 if(task==='review')return {executive:'',act:'',conclusion:'',inconsistencies,priorities:''};
 if(task==='priorities')return {executive:'',act:'',conclusion:'',inconsistencies:'',priorities};
 return {executive:executiveText,act:actText,conclusion:conclusionText,inconsistencies,priorities};
}
async function runAIAnalysis(){
 const status=document.querySelector('#aiStatus'), out=document.querySelector('#aiResult');
 const endpoint=(document.querySelector('#aiEndpoint')?.value||aiSettings().endpoint).trim();
 const task=document.querySelector('#aiTask')?.value||'full';
 if(!deviations().length){status.textContent='No hay desvíos marcados como NO para analizar.';return;}
 saveAISettings(); status.textContent='Analizando desvíos…'; out.textContent='Procesando…';
 // Si no hay servidor configurado, usa el motor inteligente local para que pueda probarse en la tablet.
 if(!endpoint){
  aiGenerated=localAIAnalysis(task);
  out.textContent=[aiGenerated.executive&&`RESUMEN EJECUTIVO\n${aiGenerated.executive}`,aiGenerated.act&&`\nSÍNTESIS PARA EL ACTA\n${aiGenerated.act}`,aiGenerated.conclusion&&`\nCONCLUSIÓN\n${aiGenerated.conclusion}`,aiGenerated.inconsistencies&&`\nREVISIÓN\n${aiGenerated.inconsistencies}`,aiGenerated.priorities&&`\nPRIORIDADES\n${aiGenerated.priorities}`].filter(Boolean).join('\n');
  status.textContent='Análisis local completado. Esta modalidad funciona sin servidor y permite probar el SIAPE en la tablet.';
  return;
 }
 if(!navigator.onLine){status.textContent='Sin Internet: se aplicó el motor inteligente local.';aiGenerated=localAIAnalysis(task);out.textContent=[aiGenerated.executive,aiGenerated.act,aiGenerated.conclusion,aiGenerated.inconsistencies,aiGenerated.priorities].filter(Boolean).join('\n\n');return;}
 try{
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,audit:aiAuditPayload()})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||`Error HTTP ${r.status}`);
  aiGenerated=data;
  out.textContent=data.display||[data.executive&&`RESUMEN EJECUTIVO\n${data.executive}`,data.act&&`\nSÍNTESIS PARA EL ACTA\n${data.act}`,data.conclusion&&`\nCONCLUSIÓN\n${data.conclusion}`,data.inconsistencies&&`\nINCONSISTENCIAS\n${data.inconsistencies}`,data.priorities&&`\nPRIORIDADES\n${data.priorities}`].filter(Boolean).join('\n');
  status.textContent='Análisis con IA online completado. Revise el texto antes de aplicarlo.';
 }catch(e){
  aiGenerated=localAIAnalysis(task);
  out.textContent=[aiGenerated.executive&&`RESUMEN EJECUTIVO\n${aiGenerated.executive}`,aiGenerated.act&&`\nSÍNTESIS PARA EL ACTA\n${aiGenerated.act}`,aiGenerated.conclusion&&`\nCONCLUSIÓN\n${aiGenerated.conclusion}`,aiGenerated.inconsistencies&&`\nREVISIÓN\n${aiGenerated.inconsistencies}`,aiGenerated.priorities&&`\nPRIORIDADES\n${aiGenerated.priorities}`].filter(Boolean).join('\n');
  status.textContent=`No se pudo acceder al servidor online (${e.message}). Se utilizó automáticamente el motor inteligente local.`;
 }
}
function applyAIResult(){
 if(!aiGenerated){const s=document.querySelector('#aiStatus');if(s)s.textContent='Primero ejecute un análisis con IA.';return;}
 state.ai={executive:aiGenerated.executive||'',act:aiGenerated.act||'',conclusion:aiGenerated.conclusion||'',updatedAt:new Date().toISOString()};save();
 if(state.ai.executive)document.querySelector('#execText').textContent=state.ai.executive;
 if(state.ai.act)document.querySelector('#actText').textContent=state.ai.act;
 const s=document.querySelector('#aiStatus');if(s)s.textContent='Textos IA aplicados. Se conservarán con esta auditoría.';
}
window.addEventListener('online',updateAIConnection);window.addEventListener('offline',updateAIConnection);
document.addEventListener('DOMContentLoaded',initAI);
