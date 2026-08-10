
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY="siape_profesional_v2_auditoria";
const LIBKEY="siape_profesional_v2_guardadas";
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 meta:{reportNumber:"",reportYear:String(new Date().getFullYear()),prestador:"",cuit:"",province:"CABA",level:"III",type:"Privado",date:new Date().toISOString().slice(0,10),auditor:"",address:""},
 answers:{}, enabled:Object.fromEntries(["Enfermería","Esterilización","Hemodinamia","Limpieza","Lavadero"].map(x=>[x,true])),
 interview:{date:"",time:"",place:"",area:"",interviewees:"",auditors:"",summary:"",documents:"",commitments:"",additional:"",auditorNotes:"",includeInReport:true},
 rh:{service:"Internación general",shift:"Mañana",beds:0,occupied:0,normRef:"",method:"mixto",licensed:0,nurses:0,assistants:0,supervisors:0,absence:0,evidence:"",requiredNorm:0,pMin:0,mMin:0,pMod:0,mMod:0,pEsp:0,mEsp:0,pInt:0,mInt:0,productiveMinutes:360,upeTotal:0,upePerWorker:1,result:null}
};
let siapeDirty=false;
let siapeLastSavedAt=null;
function persistState(){localStorage.setItem(KEY,JSON.stringify(state));siapeDirty=false;siapeLastSavedAt=new Date();updateSaveStatus();}
function save(){persistState();}
function markDirty(){siapeDirty=true;updateSaveStatus();}
function updateSaveStatus(){
 let el=document.getElementById('siapeSaveStatus');
 if(!el){el=document.createElement('div');el.id='siapeSaveStatus';el.className='siape-save-status';document.body.appendChild(el);}
 if(siapeDirty){el.textContent='● Cambios pendientes';el.className='siape-save-status pending';}
 else if(siapeLastSavedAt){el.textContent='✓ Guardado '+siapeLastSavedAt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});el.className='siape-save-status saved';}
 else {el.textContent='';el.className='siape-save-status';}
}
function showAutoSaveToast(message,done=false){
 let el=document.getElementById('siapeAutoSaveToast');
 if(!el){el=document.createElement('div');el.id='siapeAutoSaveToast';el.className='siape-autosave-toast';document.body.appendChild(el);}
 el.innerHTML=message;el.classList.add('show');el.classList.toggle('done',done);
 if(done)setTimeout(()=>el.classList.remove('show'),2600);
}
function autoSaveSecurity(){
 const labDirty=!!window.labDirty;
 if(!siapeDirty&&!labDirty)return;
 showAutoSaveToast('<b>🔄 Autoguardado de seguridad</b><br>Aguarde un instante. SIAPE está guardando la información para proteger el trabajo realizado.');
 try{
   if(siapeDirty)persistState();
   if(typeof window.persistLabState==='function'&&labDirty)window.persistLabState();
   setTimeout(()=>showAutoSaveToast('<b>✅ Información guardada correctamente</b><br>Puede continuar trabajando.',true),350);
 }catch(e){console.error(e);showAutoSaveToast('<b>⚠️ No se pudo completar el autoguardado.</b><br>Utilice el botón Guardar.',true);}
}
setInterval(autoSaveSecurity,10*60*1000);
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

// Índice Integral de Riesgo SIAPE (IIRS).
// Cada requisito respondido SI vale 0; cada NO conserva el riesgo propio del ítem (0 a 5).
// NA y requisitos sin responder no intervienen en el cálculo.
function iirsBand(value){
 const v=Math.max(0,Math.min(5,Number(value)||0));
 const level=Math.max(0,Math.min(5,Math.round(v)));
 const labels=["EXCELENTE","MUY BUENO","BUENO","MODERADO","MUY MALO","CRÍTICO"];
 const color=level<=2?"verde":level===3?"amarillo":"rojo";
 return {level,label:labels[level],color};
}
function iirsForItems(items,getAnswer){
 const evaluated=items.filter(i=>["SI","NO"].includes((getAnswer(i.code)||{}).response));
 if(!evaluated.length)return {value:null,evaluated:0,deviations:0,band:null};
 const total=evaluated.reduce((sum,i)=>sum+((getAnswer(i.code)||{}).response==="NO"?Math.max(0,Math.min(5,Number(i.score)||0)):0),0);
 const value=total/evaluated.length;
 return {value,evaluated:evaluated.length,deviations:evaluated.filter(i=>(getAnswer(i.code)||{}).response==="NO").length,band:iirsBand(value)};
}
function currentIIRS(service){
 const items=activeItems().filter(i=>!service||i.service===service);
 return iirsForItems(items,answerFor);
}
function snapshotIIRS(snapshot,service){
 const st=snapshot?.state||snapshot;
 if(!st)return {value:null,evaluated:0,deviations:0,band:null};
 const level=st.meta?.level||"III";
 const enabled=st.enabled||{};
 const items=ITEMS.filter(i=>(enabled[i.service]!==false)&&String(i.levels||"").includes(level)&&(!service||i.service===service));
 const getAnswer=code=>st.answers?.[code]||{response:""};
 return iirsForItems(items,getAnswer);
}
function formatIIRS(x){return x?.value==null?"—":x.value.toFixed(2)}
function iirsBadge(x){
 if(!x||x.value==null)return '<span class="iirs-badge iirs-sin">SIN DATOS</span>';
 return `<span class="iirs-badge iirs-${x.band.color}">${formatIIRS(x)} · ${esc(x.band.label)}</span>`;
}
function renderProviderRanking(){
 const body=document.getElementById("providerRankingRows"),note=document.getElementById("providerRankingNote");
 if(!body)return;
 const lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");
 const latest={};
 Object.entries(lib).forEach(([id,snap])=>{
  const name=String(snap?.state?.meta?.prestador||"").trim();if(!name)return;
  const key=name.toLocaleLowerCase('es');
  if(!latest[key]||String(snap.savedAt||"")>String(latest[key].savedAt||""))latest[key]={...snap,_id:id};
 });
 const rows=Object.values(latest).map(snap=>{
  const idx=snapshotIIRS(snap),m=snap.state?.meta||{};
  const areas=services.filter(sv=>snap.state?.enabled?.[sv]!==false&&ITEMS.some(i=>i.service===sv&&String(i.levels||"").includes(m.level||"III"))).length;
  return {name:m.prestador||"Prestador",level:m.level||"—",date:m.date||"—",areas,index:idx};
 }).filter(x=>x.index.value!=null).sort((a,b)=>a.index.value-b.index.value||a.name.localeCompare(b.name,'es'));
 body.innerHTML=rows.length?rows.map((x,n)=>`<tr><td>${n+1}</td><td>${esc(x.name)}</td><td>${esc(x.level)}</td><td>${esc(x.date)}</td><td>${x.areas}</td><td>${iirsBadge(x.index)}</td></tr>`).join(""):'<tr><td colspan="6">Todavía no hay auditorías guardadas con respuestas suficientes para calcular el índice.</td></tr>';
 if(note)note.textContent="Orden local de menor a mayor riesgo. Se utiliza la auditoría guardada más reciente de cada prestador y se informa la cantidad de áreas evaluadas para evitar comparaciones descontextualizadas.";
}

function localExecutiveAudits(){
 const lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");
 return Object.entries(lib).map(([id,snap])=>{
  const st=snap?.state||{},m=st.meta||{},idx=snapshotIIRS(snap);
  return {id,snap,state:st,meta:m,index:idx,savedAt:snap.savedAt||""};
 }).filter(x=>x.index.value!=null);
}
function latestExecutiveProviders(rows){
 const latest={};
 rows.forEach(x=>{
  const name=String(x.meta.prestador||"").trim();if(!name)return;
  const key=name.toLocaleLowerCase('es');
  if(!latest[key]||String(x.savedAt)>String(latest[key].savedAt))latest[key]=x;
 });
 return Object.values(latest);
}
function executiveBandKey(index){
 if(!index||index.value==null)return 'sin';
 const level=iirsBand(index.value).level;
 return level<=2?'verde':level===3?'amarillo':'rojo';
}
function renderExecBars(target,items,formatter){
 const el=document.getElementById(target);if(!el)return;
 const max=Math.max(1,...items.map(x=>Number(x.value)||0));
 el.innerHTML=items.length?items.map(x=>`<div class="exec-bar-row"><div class="exec-bar-label"><span>${esc(x.label)}</span><b>${esc(formatter?formatter(x):x.value)}</b></div><div class="exec-bar-track"><span class="exec-bar-fill ${x.color||''}" style="width:${Math.max(2,(Number(x.value)||0)/max*100)}%"></span></div></div>`).join(''):'<div class="small">Sin datos suficientes.</div>';
}
function renderExecutiveDashboard(){
 const allowed=isManagementRole(currentSessionUser?.role);
 if(!allowed){alert('Esta pantalla está reservada a los roles de gestión.');return}
 const audits=localExecutiveAudits(),providers=latestExecutiveProviders(audits);
 const avg=audits.length?audits.reduce((a,x)=>a+x.index.value,0)/audits.length:null;
 const uniqueProviders=new Set(audits.map(x=>String(x.meta.prestador||'').trim().toLowerCase()).filter(Boolean)).size;
 const redProviders=providers.filter(x=>executiveBandKey(x.index)==='rojo').length;
 const highDeviations=audits.reduce((sum,x)=>sum+ITEMS.filter(i=>{
  const a=x.state.answers?.[i.code];return a?.response==='NO'&&Number(i.score)>=4;
 }).length,0);
 const k=document.getElementById('executiveKpis');if(k)k.innerHTML=[
  ['Auditorías guardadas',audits.length],['Prestadores',uniqueProviders],['IIRS promedio',avg==null?'—':avg.toFixed(2)],['Prestadores en rojo',redProviders],['Desvíos altos/críticos',highDeviations]
 ].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');

 const areaRows=services.map(service=>{
  const vals=audits.map(x=>snapshotIIRS(x.snap,service)).filter(x=>x.value!=null);
  if(!vals.length)return null;
  const average=vals.reduce((a,x)=>a+x.value,0)/vals.length,maxv=Math.max(...vals.map(x=>x.value));
  return {service,count:vals.length,average,maxv,index:{value:average,band:iirsBand(average)}};
 }).filter(Boolean).sort((a,b)=>b.average-a.average);
 const areaBody=document.getElementById('executiveAreaRows');if(areaBody)areaBody.innerHTML=areaRows.length?areaRows.map(x=>`<tr><td>${esc(x.service)}</td><td>${x.count}</td><td>${x.average.toFixed(2)}</td><td>${x.maxv.toFixed(2)}</td><td>${iirsBadge(x.index)}</td></tr>`).join(''):'<tr><td colspan="5">Sin datos suficientes.</td></tr>';

 const bandCounts={verde:0,amarillo:0,rojo:0};providers.forEach(x=>bandCounts[executiveBandKey(x.index)]++);
 renderExecBars('executiveBandBars',[
  {label:'Verde · Excelente/Muy bueno/Bueno',value:bandCounts.verde,color:'exec-green'},
  {label:'Amarillo · Moderado',value:bandCounts.amarillo,color:'exec-yellow'},
  {label:'Rojo · Muy malo/Crítico',value:bandCounts.rojo,color:'exec-red'}
 ],x=>String(x.value));

 const ordered=[...providers].sort((a,b)=>b.index.value-a.index.value||String(a.meta.prestador).localeCompare(String(b.meta.prestador),'es'));
 const rowHtml=x=>`<tr><td>${esc(x.meta.prestador||'Prestador')}</td><td>${esc(x.meta.level||'—')}</td><td>${esc(x.meta.date||'—')}</td><td>${iirsBadge(x.index)}</td></tr>`;
 const riskBody=document.getElementById('executiveRiskRows');if(riskBody)riskBody.innerHTML=ordered.length?ordered.slice(0,10).map(rowHtml).join(''):'<tr><td colspan="4">Sin datos suficientes.</td></tr>';
 const bestBody=document.getElementById('executiveBestRows');if(bestBody)bestBody.innerHTML=ordered.length?[...ordered].reverse().slice(0,10).map(rowHtml).join(''):'<tr><td colspan="4">Sin datos suficientes.</td></tr>';

 const months={};audits.forEach(x=>{
  const raw=String(x.meta.date||x.savedAt||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(raw))return;
  (months[raw]||(months[raw]=[])).push(x.index.value);
 });
 const monthItems=Object.keys(months).sort().slice(-12).map(m=>({label:m,value:months[m].reduce((a,v)=>a+v,0)/months[m].length,color:'exec-blue'}));
 renderExecBars('executiveTrend',monthItems,x=>x.value.toFixed(2));

 const byAuditor={};audits.forEach(x=>{
  const name=String(x.meta.auditor||'Sin identificar').trim()||'Sin identificar';
  const e=byAuditor[name]||(byAuditor[name]={name,count:0,providers:new Set(),sum:0});e.count++;e.sum+=x.index.value;if(x.meta.prestador)e.providers.add(String(x.meta.prestador).trim().toLowerCase());
 });
 const auditorRows=Object.values(byAuditor).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'es'));
 const auditorBody=document.getElementById('executiveAuditorRows');if(auditorBody)auditorBody.innerHTML=auditorRows.length?auditorRows.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.count}</td><td>${x.providers.size}</td><td>${(x.sum/x.count).toFixed(2)}</td></tr>`).join(''):'<tr><td colspan="4">Sin datos suficientes.</td></tr>';
}

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
 Object.keys(state.meta).forEach(k=>{let e=document.querySelector(`[data-meta="${k}"]`);if(e){e.value=state.meta[k]||"";e.oninput=()=>{state.meta[k]=e.value;markDirty();}}});
 services.forEach(s=>{let e=document.querySelector(`[data-area="${s}"]`);if(e){e.checked=!!state.enabled[s];e.onchange=()=>{state.enabled[s]=e.checked;markDirty();}}});
}
function bindInterview(){
 ensureState();
 $$('[data-interview]').forEach(el=>{
  const k=el.dataset.interview;
  if(el.type==='checkbox')el.checked=!!state.interview[k];else el.value=state.interview[k]||'';
  if(!el.dataset.bound){
   const update=()=>{state.interview[k]=el.type==='checkbox'?el.checked:el.value;markDirty();const n=$('#interviewSaved');if(n){n.textContent='Cambios pendientes · se autoguardarán cada 10 minutos';}};
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
   <div class="photo-tools no-print"><label class="secondary photo-button">📷 Tomar foto<input class="hide" type="file" accept="image/*" capture="environment" onchange="addEvidencePhotos('${i.code}',this.files)"></label><label class="secondary photo-button">🖼 Elegir fotos<input class="hide" type="file" accept="image/*" multiple onchange="addEvidencePhotos('${i.code}',this.files)"></label><button class="secondary" onclick="openEvidenceGallery('${i.code}')">Ver fotos <span id="photo-count-${i.code}">0</span></button></div><div id="photo-preview-${i.code}" class="photo-preview"></div>
   ${a.response==="NO"?`<div class="detail"><h4>Desvío</h4><div>${esc(tech.deviation)}</div><h4>Fundamentación técnica</h4><div>${esc(tech.why)}</div><h4>Recomendación</h4><div>${esc(tech.rec)}</div><h4>Evidencia esperada</h4><div>${esc(tech.ev)}</div><h4>Responsable</h4><div>${esc(tech.resp)}</div><h4>Plazo</h4><div>${esc(tech.plazo)}</div><h4>Marco normativo</h4><div>${esc(normText(i.service))}</div></div>`:""}
  </div>`;
 }).join("");
 $("#auditList").innerHTML=rhBlock+normalCards||'<div class="notice">No hay requisitos aplicables con los filtros seleccionados.</div>';
 refreshVisiblePhotoCounts();
}
function setResp(code,r){state.answers[code]={...answerFor(code),response:r};markDirty();renderAudit()}
function setObs(code,v){state.answers[code]={...answerFor(code),obs:v};markDirty()}
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
 let s=stats(),general=currentIIRS();
 const lm=(typeof window.labAreaMetrics==='function')?window.labAreaMetrics():null;
 const sameProvider=lm&&lm.active>0&&(!state.meta.prestador||!labState?.meta?.prestador||normalizeSearch(state.meta.prestador)===normalizeSearch(labState.meta.prestador));
 const pooledActive=s.active+(sameProvider?lm.active:0), pooledYes=Math.round(s.compliance*s.active)+(sameProvider?lm.yes:0), pooledDev=s.dev+(sameProvider?lm.dev:0);
 const pooledCompliance=pooledActive?pooledYes/pooledActive:0;
 const pooledIirs=pooledActive?((general.value||0)*s.active+(sameProvider?lm.iirs*lm.active:0))/pooledActive:(general.value||0);
 $("#kpis").innerHTML=[
 ["Ítems aplicables",pooledActive],["Respondidos",s.answered+(sameProvider?lm.answered:0)],["Desvíos",pooledDev],["Riesgo alto",s.high+(sameProvider?lm.high:0)],["Cumplimiento",(pooledCompliance*100).toFixed(1)+"%"],["IIRS general",Number(pooledIirs).toFixed(2)]
 ].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
 $("#overall").innerHTML=`Resultado consolidado del prestador<div class="iirs-overall">IIRS consolidado preliminar: <b>${Number(pooledIirs).toFixed(2)}</b> · Cumplimiento total: <b>${(pooledCompliance*100).toFixed(1)}%</b></div><div class="small">El consolidado pondera todos los requisitos efectivamente aplicables de las áreas cargadas; los NO APLICA no intervienen.</div>`;
 let rows=services.filter(x=>state.enabled[x]).map(sv=>{
  let arr=activeItems().filter(i=>i.service===sv), ds=arr.filter(i=>answerFor(i.code).response==="NO");
  let ans=arr.filter(i=>["SI","NO"].includes(answerFor(i.code).response)), yes=ans.filter(i=>answerFor(i.code).response==="SI").length,idx=currentIIRS(sv);
  return `<tr><td>${sv}</td><td>${arr.length}</td><td>${ds.length}</td><td>${ans.length?(yes/ans.length*100).toFixed(1):"0.0"}%</td><td>${ds.filter(i=>i.score<=2).length}</td><td>${ds.filter(i=>i.score===3).length}</td><td>${ds.filter(i=>i.score>=4).length}</td><td>${iirsBadge(idx)}</td></tr>`
 });
 if(sameProvider)rows.push(`<tr><td><b>Laboratorio</b></td><td>${lm.active}</td><td>${lm.dev}</td><td>${(lm.compliance*100).toFixed(1)}%</td><td>${lm.low}</td><td>${lm.mod}</td><td>${lm.high}</td><td><b>${lm.iirs.toFixed(2)}</b></td></tr>`);
 $("#serviceTable").innerHTML=rows.join("");
 renderProviderRanking();
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
 el.innerHTML=arr.map(([id,x])=>{let m=x.state?.meta||{};return `<div class="saved-item"><div><strong>Informe ${esc(m.reportNumber||"S/N")}/${esc(m.reportYear||"")} · ${esc(m.prestador||"Prestador sin identificar")}</strong><div class="small">CUIT: ${esc(m.cuit||"Sin informar")} · Auditoría: ${esc(m.date||"Sin fecha")} · Jurisdicción: ${esc(m.province||"Sin informar")}</div><div class="small">Guardado: ${esc(new Date(x.savedAt).toLocaleString())} · ${Object.keys(x.state?.answers||{}).length} respuestas registradas</div></div><div class="saved-actions"><button class="secondary" onclick="loadAuditSnapshot('${id}')">Abrir / continuar</button><button class="secondary" onclick="shareSavedAudit('${id}')">Compartir</button><button class="danger" onclick="deleteAuditSnapshot('${id}')">Eliminar</button></div></div>`}).join("");
}
function saveAuditSnapshot(){
 persistState();if(typeof window.persistLabState==='function'&&window.labDirty)window.persistLabState();refreshVisiblePage();let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");let base=`${state.meta.reportNumber||"SN"}_${state.meta.reportYear||"SA"}_${state.meta.prestador||"PRESTADOR"}`.replace(/[^a-z0-9áéíóúüñ_-]+/gi,"_");let id=base.toLowerCase();lib[id]={savedAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))};localStorage.setItem(LIBKEY,JSON.stringify(lib));renderSavedAudits();alert(`Auditoría ${reportId()} guardada en este dispositivo.`)
}
function loadAuditSnapshot(id){let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");if(!lib[id])return;state=JSON.parse(JSON.stringify(lib[id].state));ensureState();save();renderAll();alert(`Auditoría ${reportId()} abierta.`)}
function deleteAuditSnapshot(id){if(!confirm("¿Eliminar esta auditoría guardada del dispositivo?"))return;let lib=JSON.parse(localStorage.getItem(LIBKEY)||"{}");delete lib[id];localStorage.setItem(LIBKEY,JSON.stringify(lib));renderSavedAudits()}
function rhReportBlock(){
 const r=state.rh?.result;if(!r?.calculated)return "";
 return `<h2>Evaluación de Recursos Humanos de Enfermería</h2><table><tr><th>Servicio</th><th>Turno</th><th>Método</th><th>Requerido</th><th>Disponible efectivo</th><th>Déficit</th><th>Cobertura</th><th>Riesgo</th></tr><tr><td>${esc(state.rh.service)}</td><td>${esc(state.rh.shift)}</td><td>${esc(state.rh.method)}</td><td>${r.required.toFixed(1)}</td><td>${r.available.toFixed(1)}</td><td>${r.deficit.toFixed(1)}</td><td>${r.coverage.toFixed(1)}%</td><td>${esc(r.riskLabel)}</td></tr></table><p>${esc(r.interpretation)}</p><p class="small"><b>Criterio consignado:</b> ${esc(state.rh.normRef||"No informado")} · ${esc(r.usedText)}</p>`;
}
function renderReport(){
 let s=stats(), audited=selectedServices(), bullets=executiveBullets();
 const lm=(typeof window.labAreaMetrics==='function')?window.labAreaMetrics():null;
 const attachLab=!!(lm&&lm.active>0&&typeof window.labCanAttachToGeneral==='function'&&window.labCanAttachToGeneral());
 const labMeta=(typeof labState!=='undefined'&&labState?.meta)?labState.meta:{};
 const meta={
   reportNumber:state.meta.reportNumber||labMeta.reportNumber||'',
   reportYear:state.meta.reportYear||labMeta.reportYear||String(new Date().getFullYear()),
   prestador:state.meta.prestador||labMeta.prestador||'',
   cuit:state.meta.cuit||labMeta.cuit||'',
   province:state.meta.province||labMeta.province||'',
   level:state.meta.level||labMeta.level||'',
   type:state.meta.type||labMeta.type||'',
   date:state.meta.date||labMeta.date||'',
   auditor:state.meta.auditor||labMeta.auditor||currentSessionUser?.displayName||'',
   address:state.meta.address||labMeta.address||''
 };
 const localReportId=()=>`${meta.reportNumber||'S/N'}/${meta.reportYear||new Date().getFullYear()}`;
 const pooledActive=s.active+(attachLab?lm.active:0);
 const pooledAnswered=s.answered+(attachLab?lm.answered:0);
 const pooledDev=s.dev+(attachLab?lm.dev:0);
 const pooledMod=s.mod+(attachLab?lm.mod:0);
 const pooledHigh=s.high+(attachLab?lm.high:0);
 const pooledYes=Math.round(s.compliance*s.active)+(attachLab?lm.yes:0);
 const pooledCompliance=pooledActive?pooledYes/pooledActive:0;
 const baseIirs=currentIIRS().value||0;
 const pooledIirs=pooledActive?((baseIirs*s.active)+(attachLab?lm.iirs*lm.active:0))/pooledActive:baseIirs;
 const auditedAll=[...audited];if(attachLab&&!auditedAll.includes('Laboratorio'))auditedAll.push('Laboratorio');
 const labExecutive=attachLab&&typeof labExecutiveText==='function'?labExecutiveText():'';
 const combinedExecutive=[executive(),labExecutive].filter(Boolean).join(' ');
 const labSection=attachLab&&typeof window.labGeneralReportSection==='function'?window.labGeneralReportSection():'';
 const labDs=attachLab&&typeof labReportData==='function'?labReportData():[];
 const labTech=labDs.length?`<h3 class="area-heading">LABORATORIO</h3>${labDs.map(d=>`<div class="deviation-block"><h4>${esc(d.code)} · ${esc(d.deviation||d.item)}</h4>${d.observation?`<p><b>Observación y evidencia:</b> ${esc(d.observation)}</p>`:''}<p><b>Requisito:</b> ${esc(d.item)}</p><p><b>Área/proceso:</b> ${esc(d.section)}</p></div>`).join('')}`:'';
 $("#reportContent").innerHTML=`<div class="report">
 <section class="cover"><h1>INFORME EJECUTIVO N° ${esc(localReportId())}</h1><h2>AUDITORÍA INTEGRAL PRESTACIONAL</h2><div class="institution">INSSJP · GERENCIA DE AUDITORÍA PRESTACIONAL</div><div class="provider">${esc(meta.prestador||"PRESTADOR")}</div></section>
 <section><h1>ÍNDICE</h1><div class="index-list">1. Datos del prestador y de la auditoría<br>2. Resumen ejecutivo<br>3. Objeto de la auditoría<br>4. Alcance<br>5. Panel general y análisis de riesgo<br>6. Área Laboratorio (si corresponde)<br>7. Conclusiones<br>8. Anexo técnico legal<br>9. Anexo técnico operativo - Desvíos por área y proceso</div></section>
 <section class="report-section"><h1>1. DATOS DEL PRESTADOR Y DE LA AUDITORÍA</h1><table class="report-meta"><tr><th>Informe</th><td>${esc(localReportId())}</td><th>Fecha</th><td>${esc(meta.date)}</td></tr><tr><th>Institución</th><td>${esc(meta.prestador)}</td><th>CUIT</th><td>${esc(meta.cuit)}</td></tr><tr><th>Domicilio</th><td>${esc(meta.address)}</td><th>Jurisdicción</th><td>${esc(meta.province)}</td></tr><tr><th>Nivel</th><td>${esc(meta.level)}</td><th>Tipo</th><td>${esc(meta.type)}</td></tr><tr><th>Auditor</th><td colspan="3">${esc(meta.auditor)}</td></tr><tr><th>Áreas auditadas</th><td colspan="3">${esc(auditedAll.join(", "))}</td></tr></table></section>
 <section class="report-section"><h1>2. RESUMEN EJECUTIVO</h1><p>${esc(combinedExecutive)}</p>${bullets.length?`<p>En tal sentido se verificó:</p><ul class="red-list">${bullets.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<p>La evaluación consolidada comprende ${pooledActive} requisitos aplicables. Se registraron ${pooledDev} desvíos, de los cuales ${pooledHigh} son altos o críticos y ${pooledMod} moderados. El detalle se encuentra en los anexos técnicos por área.</p></section>
 <section class="report-section"><h1>3. OBJETO DE LA AUDITORÍA</h1><p>El objeto de la presente auditoría es verificar el cumplimiento del proceso prestacional en las áreas seleccionadas, conforme al vínculo prestacional con el INSSJP, evaluando aspectos legales, organizativos, técnicos y de calidad de la traza de atención y de los procesos de apoyo auditados.</p></section>
 <section class="report-section"><h1>4. ALCANCE</h1><p>Análisis del proceso prestacional mediante el relevamiento de las siguientes áreas: <b>${esc(auditedAll.join(", "))}</b>.</p><p>Para llevar adelante la tarea precitada:</p><ul>${scopeText()}</ul><p>El alcance se limita a las áreas seleccionadas y a la evidencia efectivamente disponible y observada durante el relevamiento.</p></section>
 ${interviewReportBlock()}<section class="report-section"><h1>5. PANEL GENERAL Y ANÁLISIS DE RIESGO</h1><table><tr><th>Ítems aplicables</th><th>Respondidos</th><th>Desvíos</th><th>Moderados</th><th>Altos/críticos</th><th>Cumplimiento</th><th>IIRS consolidado (0–5)</th></tr><tr><td>${pooledActive}</td><td>${pooledAnswered}</td><td>${pooledDev}</td><td>${pooledMod}</td><td>${pooledHigh}</td><td>${(pooledCompliance*100).toFixed(1)}%</td><td>${Number(pooledIirs).toFixed(2)}</td></tr></table>${rhReportBlock()}<h2>Síntesis para el acta</h2><div class="summary-text">${esc(actSummary())}${attachLab&&typeof labActText==='function'?` ${esc(labActText())}`:''}</div></section>
 ${labSection}
 <section class="report-section"><h1>7. CONCLUSIONES</h1><p>${esc(conclusionsText())}${attachLab&&typeof labExecutiveText==='function'?` ${esc(labExecutiveText())}`:''}</p></section>
 <section class="report-section"><h1>8. ANEXO TÉCNICO LEGAL</h1>${legalAnnex()}${attachLab?'<h3>Laboratorio</h3><p>Se incorpora la normativa específica consignada en la guía y matriz técnica de Laboratorio, sujeta a validación según jurisdicción, nivel y requisito.</p>':''}<p class="small">Las referencias normativas deben validarse según jurisdicción, nivel, tipo de establecimiento y requisito concreto antes de citar artículos específicos.</p></section>
 <section class="report-section"><h1>9. ANEXO TÉCNICO OPERATIVO - DESVÍOS POR ÁREA Y PROCESO</h1>${technicalAnnex()}${labTech}</section>
 <div class="signature">Firma del auditor</div></div>`;
}
function renderAll(){
 ensureState();bindMeta();renderSavedAudits();
 // V3.4.12A: las vistas pesadas se calculan solo al abrirlas.
 const active=document.querySelector('.page.active')?.id||'startPage';
 renderPageOnDemand(active);
}
function renderPageOnDemand(id){
 if(id==='auditPage')renderAudit();
 else if(id==='interviewPage')bindInterview();
 else if(id==='rrhhPage'){bindRH();renderRH();}
 else if(id==='dashPage'){renderDashboard();renderProviderRanking();}
 else if(id==='executivePage'&&isManagementRole(currentSessionUser?.role))renderExecutiveDashboard();
 else if(id==='summaryPage'||id==='aiPage')renderSummary();
 else if(id==='devPage')renderDevs();
 else if(id==='planPage')renderPlan();
 else if(id==='normPage')renderNorms();
 else if(id==='reportPage')renderReport();
 else if(id==='providerMapPage')renderProviderMap();
 else if(id==='followupPage')renderFollowupModule();
}
function refreshVisiblePage(){const id=document.querySelector('.page.active')?.id||'startPage';renderPageOnDemand(id);}
function showPage(id,btn){const page=$("#"+id);if(!page){alert("No se pudo abrir la pantalla solicitada: "+id);return} $$(".page").forEach(x=>x.classList.remove("active"));page.classList.add("active");$$(".navbtn").forEach(x=>x.classList.remove("active"));if(btn)btn.classList.add("active");renderPageOnDemand(id);if(id==="aiPage")updateAIConnection();window.scrollTo({top:0,left:0,behavior:"auto"})}
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

window.addEventListener("load",()=>{ensureState();bindMeta();renderSavedAudits();updateSaveStatus();});

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


// ===== SIAPE V3.1.4: autenticación y autorización con Firestore =====
const V3_PROFILE_KEY='siape_v3_profile';
const PHOTO_DB='siape_v3_evidence';
const LOCAL_AUTH_PREFIX='siape_authorized_';
const MANAGEMENT_ROLES=['administrador','gerente','subgerente','jefa_medicas','jefa_sociales'];
const PRIMARY_ADMIN_EMAIL='sgrodriguez@pami.org.ar';
let siapeAuth=null,siapeDb=null,currentSessionUser=null,registeringAccess=false,adminUsersCache=[];
function isLocalPreview(){return location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname)}
function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
function isManagementRole(role){return MANAGEMENT_ROLES.includes(role)}
function showLoginCard(){
 const intro=document.getElementById('loginIntro'),card=document.getElementById('authCard');
 setTimeout(()=>{intro?.classList.add('login-intro-out');card?.classList.remove('auth-card-hidden')},650);
}
function initV3Auth(){
 const cfg=window.SIAPE_FIREBASE_CONFIG||{};const enabled=!!cfg.apiKey;
 document.getElementById('authConfigured')?.classList.toggle('hide',!enabled);
 document.getElementById('authSetup')?.classList.toggle('hide',enabled);
 document.getElementById('localDemo')?.classList.toggle('hide',!isLocalPreview());
 showLoginCard();
 if(!enabled)return;
 try{
  if(!firebase.apps.length)firebase.initializeApp(cfg);
  siapeAuth=firebase.auth();
  siapeDb=firebase.firestore();
  siapeAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
  siapeAuth.onAuthStateChanged(async user=>{
   if(registeringAccess)return;
   if(user){await validateAuthorizedUser(user)}else lockApplication();
  });
 }catch(e){setLoginStatus('Error de configuración: '+friendlyAuthError(e))}
}
function setLoginStatus(message,kind='error'){
 const st=document.getElementById('loginStatus');if(!st)return;
 st.textContent=message||'';st.dataset.kind=kind;
}
function localAuthorization(email){
 try{return JSON.parse(localStorage.getItem(LOCAL_AUTH_PREFIX+normalizeEmail(email))||'null')}catch{return null}
}
function saveLocalAuthorization(profile){
 localStorage.setItem(LOCAL_AUTH_PREFIX+normalizeEmail(profile.correo),JSON.stringify({correo:normalizeEmail(profile.correo),nombre:profile.nombre||'',apellido:profile.apellido||'',rol:profile.rol||'auditor',especialidad:profile.especialidad||'',estado:'autorizado',validatedAt:new Date().toISOString()}));
}
function clearLocalAuthorization(email){localStorage.removeItem(LOCAL_AUTH_PREFIX+normalizeEmail(email))}
async function validateAuthorizedUser(user){
 const email=normalizeEmail(user.email);
 setLoginStatus('Verificando autorización…','info');
 try{
  const snap=await siapeDb.collection('usuarios').doc(email).get();
  if(!snap.exists){
   clearLocalAuthorization(email);
   setLoginStatus('Este usuario todavía no tiene una solicitud de acceso. Use “Solicitar acceso”.');
   await siapeAuth.signOut();return;
  }
  const profile=snap.data()||{},estado=String(profile.estado||'').toLowerCase(),rol=String(profile.rol||'auditor').toLowerCase();
  if(estado!=='autorizado'){
   clearLocalAuthorization(email);
   const messages={pendiente:'Su solicitud está pendiente de autorización.',suspendido:'Su acceso fue suspendido.',rechazado:'Su solicitud fue rechazada.'};
   setLoginStatus(messages[estado]||'Su cuenta no está autorizada.');
   await siapeAuth.signOut();return;
  }
  currentSessionUser={uid:user.uid,email:user.email||email,displayName:`${profile.nombre||''} ${profile.apellido||''}`.trim()||user.email,role:rol,profile};
  saveLocalAuthorization({...profile,correo:email,rol});
  setLoginStatus('');unlockApplication();
 }catch(e){
  const cached=localAuthorization(email);
  if((!navigator.onLine||e?.code==='unavailable')&&cached?.estado==='autorizado'){
   currentSessionUser={uid:user.uid,email,displayName:`${cached.nombre||''} ${cached.apellido||''}`.trim()||email,role:cached.rol||'auditor',profile:cached};
   setLoginStatus('Ingreso sin conexión con autorización guardada.','info');unlockApplication();return;
  }
  setLoginStatus('No se pudo verificar la autorización: '+friendlyAuthError(e));
  try{await siapeAuth.signOut()}catch{}
 }
}
function friendlyAuthError(e){
 const c=e?.code||'';
 if(c.includes('invalid-api-key'))return 'La clave de Firebase no es válida.';
 if(c.includes('email-already-in-use'))return 'Ese correo ya tiene una cuenta. Use Ingresar o restablezca la contraseña.';
 if(c.includes('weak-password'))return 'La contraseña debe tener al menos 6 caracteres.';
 if(c.includes('invalid-email'))return 'El correo electrónico no es válido.';
 if(c.includes('invalid-credential')||c.includes('wrong-password')||c.includes('user-not-found'))return 'Correo o contraseña incorrectos.';
 if(c.includes('permission-denied'))return 'Firestore rechazó la operación. Revise las reglas publicadas.';
 if(c.includes('too-many-requests'))return 'Demasiados intentos. Espere unos minutos.';
 if(c.includes('network-request-failed')||c.includes('unavailable'))return 'No se pudo conectar a Internet.';
 if(c.includes('unauthorized-domain'))return 'Este dominio todavía no está autorizado en Firebase.';
 return e?.message||'No se pudo completar la operación.';
}


// ===== MAPA PRESTACIONAL DEMOSTRATIVO V3.4.1 =====
const DEMO_PROVIDERS = [
 {id:'demo-caba-1',name:'Hospital Metropolitano de Prueba',province:'CABA',city:'Ciudad Autónoma de Buenos Aires',lat:-34.6037,lng:-58.3816,type:'Hospital',complexity:'Alta complejidad / III Nivel',module:'Internación y alta complejidad',capitas:18450,compliance:88,iirs:1.2,lastAudit:'28/07/2026',areas:['Área Médica','Enfermería','Laboratorio','Hemoterapia','Imágenes']},
 {id:'demo-ba-1',name:'Clínica Regional Oeste',province:'Buenos Aires',city:'Luján',lat:-34.5703,lng:-59.1050,type:'Clínica privada',complexity:'Internación / II Nivel',module:'Módulo 69 · Internación',capitas:9300,compliance:72,iirs:2.7,lastAudit:'22/07/2026',areas:['Área Médica','Enfermería','Esterilización','Limpieza','Lavadero']},
 {id:'demo-cordoba-1',name:'Sanatorio Central Córdoba',province:'Córdoba',city:'Córdoba',lat:-31.4201,lng:-64.1888,type:'Sanatorio',complexity:'Alta complejidad / III Nivel',module:'Internación y alta complejidad',capitas:12680,compliance:54,iirs:4.1,lastAudit:'15/07/2026',areas:['Área Médica','Enfermería','Hemodinamia','Imágenes','Farmacia']},
 {id:'demo-santafe-1',name:'Instituto Asistencial del Litoral',province:'Santa Fe',city:'Rosario',lat:-32.9442,lng:-60.6505,type:'Instituto médico',complexity:'Internación / II Nivel',module:'Módulo 69 · Internación',capitas:11120,compliance:81,iirs:1.9,lastAudit:'09/07/2026',areas:['Área Médica','Enfermería','Laboratorio','Nutrición']},
 {id:'demo-mendoza-1',name:'Centro Médico Andino',province:'Mendoza',city:'Mendoza',lat:-32.8895,lng:-68.8458,type:'Centro médico',complexity:'Baja complejidad',module:'Atención ambulatoria',capitas:4800,compliance:93,iirs:0.7,lastAudit:'01/07/2026',areas:['Área Médica','Enfermería','Imágenes']},
 {id:'demo-tucuman-1',name:'Clínica del Norte',province:'Tucumán',city:'San Miguel de Tucumán',lat:-26.8083,lng:-65.2176,type:'Clínica privada',complexity:'Internación / II Nivel',module:'Módulo 69 · Internación',capitas:7600,compliance:63,iirs:3.2,lastAudit:'25/06/2026',areas:['Área Médica','Enfermería','Laboratorio','Hemoterapia']},
 {id:'demo-neuquen-1',name:'Hospital Patagónico de Prueba',province:'Neuquén',city:'Neuquén',lat:-38.9516,lng:-68.0591,type:'Hospital',complexity:'Alta complejidad / III Nivel',module:'Internación y alta complejidad',capitas:6900,compliance:null,iirs:null,lastAudit:'Sin auditoría',areas:[]}
];
let providerMapInstance=null;
let providerMapLayer=null;
let malvinasLabelMarker=null;
function providerRiskKey(p){if(p.iirs===null||p.iirs===undefined)return'gris';if(p.iirs<=2)return'verde';if(p.iirs<4)return'amarillo';return'rojo'}
function providerRiskLabel(p){const k=providerRiskKey(p);return k==='verde'?'Verde · Buen cumplimiento':k==='amarillo'?'Amarillo · Riesgo moderado':k==='rojo'?'Rojo · Riesgo alto':'Gris · Sin auditoría'}
function providerMarkerStyle(p){const k=providerRiskKey(p);const colors={verde:'#15803d',amarillo:'#ca8a04',rojo:'#b91c1c',gris:'#64748b'};return{radius:9,fillColor:colors[k],color:'#ffffff',weight:2,opacity:1,fillOpacity:.92}}
function filteredDemoProviders(){
 const search=(document.getElementById('providerMapSearch')?.value||'').trim().toLowerCase();
 const province=document.getElementById('providerMapProvince')?.value||'';
 const complexity=document.getElementById('providerMapComplexity')?.value||'';
 const risk=document.getElementById('providerMapRisk')?.value||'';
 return DEMO_PROVIDERS.filter(p=>(!search||`${p.name} ${p.province} ${p.city}`.toLowerCase().includes(search))&&(!province||p.province===province)&&(!complexity||p.complexity===complexity)&&(!risk||providerRiskKey(p)===risk));
}
function renderProviderMap(){
 if(typeof L==='undefined'){document.getElementById('providerMapDetail').innerHTML='<h2>Mapa no disponible</h2><p>No se pudo cargar el componente cartográfico. Verifique la conexión a Internet.</p>';return}
 const select=document.getElementById('providerMapProvince');
 if(select&&select.options.length===1)[...new Set(DEMO_PROVIDERS.map(p=>p.province))].sort().forEach(v=>select.add(new Option(v,v)));
 if(!providerMapInstance){
  providerMapInstance=L.map('providerMap',{zoomControl:true,minZoom:3}).setView([-38.4,-63.6],4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(providerMapInstance);
  providerMapLayer=L.layerGroup().addTo(providerMapInstance);
  // Etiqueta institucional argentina para las Islas Malvinas.
  malvinasLabelMarker=L.marker([-51.72,-59.25],{
   interactive:false,
   keyboard:false,
   zIndexOffset:1000,
   icon:L.divIcon({
    className:'malvinas-label-wrap',
    html:'<div class="malvinas-label">Islas Malvinas</div><div class="malvinas-dot"></div>',
    iconSize:[128,42],
    iconAnchor:[64,20]
   })
  }).addTo(providerMapInstance);
 }
 setTimeout(()=>providerMapInstance.invalidateSize(),100);
 renderProviderMapMarkers();
}
function renderProviderMapMarkers(){
 if(!providerMapInstance||!providerMapLayer)return;
 providerMapLayer.clearLayers();
 const items=filteredDemoProviders();
 items.forEach(p=>{
  const marker=L.circleMarker([p.lat,p.lng],providerMarkerStyle(p)).addTo(providerMapLayer);
  marker.bindTooltip(`${p.name}<br>${p.city}, ${p.province}`);
  marker.on('click',()=>showProviderMapDetail(p));
 });
 const audited=items.filter(p=>p.iirs!==null);const totalCapitas=items.reduce((s,p)=>s+(p.capitas||0),0);const avg=audited.length?audited.reduce((s,p)=>s+p.iirs,0)/audited.length:null;
 const k=document.getElementById('providerMapKpis');if(k)k.innerHTML=[
  `<div class="kpi"><b>${items.length}</b><span>Prestadores visibles</span></div>`,
  `<div class="kpi"><b>${totalCapitas.toLocaleString('es-AR')}</b><span>Cápitas demostrativas</span></div>`,
  `<div class="kpi"><b>${avg===null?'—':avg.toFixed(2)}</b><span>IIRS promedio</span></div>`,
  `<div class="kpi"><b>${items.filter(p=>providerRiskKey(p)==='rojo').length}</b><span>Prestadores en rojo</span></div>`
 ].join('');
}
function showProviderMapDetail(p){
 const compliance=p.compliance===null?'Sin datos':`${p.compliance}%`;
 const iirs=p.iirs===null?'Sin auditoría':p.iirs.toFixed(1);
 document.getElementById('providerMapDetail').innerHTML=`
  <div class="map-risk-chip map-risk-${providerRiskKey(p)}">${providerRiskLabel(p)}</div>
  <h2>${esc(p.name)}</h2>
  <p><b>${esc(p.city)}, ${esc(p.province)}</b></p>
  <dl class="provider-detail-list">
   <div><dt>Tipo</dt><dd>${esc(p.type)}</dd></div><div><dt>Complejidad</dt><dd>${esc(p.complexity)}</dd></div>
   <div><dt>Modalidad</dt><dd>${esc(p.module)}</dd></div><div><dt>Cápitas</dt><dd>${p.capitas.toLocaleString('es-AR')}</dd></div>
   <div><dt>Cumplimiento</dt><dd>${compliance}</dd></div><div><dt>IIRS</dt><dd>${iirs}</dd></div>
   <div><dt>Última auditoría</dt><dd>${esc(p.lastAudit)}</dd></div>
  </dl>
  <h3>Áreas auditadas</h3><p>${p.areas.length?p.areas.map(esc).join(' · '):'Todavía no registra áreas auditadas.'}</p>
  <button class="primary" type="button" onclick="alert('En la versión definitiva este botón abrirá la ficha completa del prestador, su historial, auditorías y planes de mejora.')">Ver ficha completa</button>`;
}
function resetProviderMapFilters(){['providerMapSearch','providerMapProvince','providerMapComplexity','providerMapRisk'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});renderProviderMapMarkers();if(providerMapInstance)providerMapInstance.setView([-38.4,-63.6],4);document.getElementById('providerMapDetail').innerHTML='<h2>Información del prestador</h2><p class="small">Seleccione un punto del mapa para consultar sus datos.</p>'}


// SIGAP V3.4.2 · Demostración de Derivación y Seguimiento
const FOLLOWUP_DEMO_CASES = [
 {id:'seg-lujan-01',provider:'Clínica Regional de Prueba',province:'Buenos Aires',city:'Luján',auditDate:'04/08/2026',report:'GAP-2026-0048',level:'Internación / II Nivel',capitas:8420,ugl:'UGL XXXII · Luján',deviations:[
  {id:'ENF-014',area:'Enfermería',service:'Internación',risk:4,deviation:'Los registros de enfermería no contienen valoración integral ni firma identificable en todos los turnos.',recommendation:'Regularizar los registros, asegurar trazabilidad por turno y capacitar al personal.',evidence:'Copia de registros corregidos y acta de capacitación.',deadline:'30 días',status:'pendiente',followupNote:''},
  {id:'ENF-031',area:'Enfermería',service:'UTI',risk:5,deviation:'El carro de paro se encuentra incompleto y sin control diario documentado.',recommendation:'Completar el carro de paro e implementar control diario con responsable asignado.',evidence:'Planilla de control, fotografías y comprobantes de reposición.',deadline:'10 días',status:'parcial',followupNote:'Se acredita reposición parcial; falta control diario firmado.'},
  {id:'EST-009',area:'Esterilización',service:'Central de Esterilización',risk:4,deviation:'No se acredita trazabilidad completa de los procesos de esterilización.',recommendation:'Implementar registro integral de carga, ciclo, liberación y destino del material.',evidence:'Registros de tres ciclos completos y procedimiento aprobado.',deadline:'30 días',status:'no_subsanado',followupNote:'No se presentó documentación respaldatoria.'},
  {id:'LIM-006',area:'Limpieza',service:'Internación',risk:3,deviation:'No existe registro verificable de limpieza terminal de habitaciones.',recommendation:'Implementar planilla de limpieza terminal con fecha, hora y firma.',evidence:'Planillas de los últimos 30 días.',deadline:'45 días',status:'subsanado',followupNote:'Se verifican planillas completas y procedimiento vigente.'},
  {id:'MED-022',area:'Área Médica',service:'Guardia',risk:4,deviation:'No se acredita protocolo actualizado para la atención inicial de emergencias.',recommendation:'Aprobar, difundir y capacitar sobre protocolo de emergencias.',evidence:'Protocolo firmado, nómina de capacitación y evaluación.',deadline:'30 días',status:'pendiente',followupNote:''}
 ]},
 {id:'seg-rosario-01',provider:'Instituto Asistencial del Litoral',province:'Santa Fe',city:'Rosario',auditDate:'28/07/2026',report:'GAP-2026-0041',level:'Internación / II Nivel',capitas:11120,ugl:'UGL IX · Rosario',deviations:[
  {id:'LAB-011',area:'Laboratorio',service:'Laboratorio',risk:4,deviation:'No se evidencia control documentado de temperaturas en equipos críticos.',recommendation:'Implementar control diario, límites de aceptación y acciones ante desvíos.',evidence:'Registros de 30 días y certificados de calibración.',deadline:'20 días',status:'pendiente',followupNote:''},
  {id:'NUT-008',area:'Nutrición',service:'Nutrición',risk:3,deviation:'No se acredita evaluación nutricional oportuna en todos los pacientes internados.',recommendation:'Establecer tamizaje al ingreso y seguimiento según riesgo.',evidence:'Historias clínicas y protocolo de tamizaje.',deadline:'45 días',status:'parcial',followupNote:'Se inició implementación, resta cobertura completa.'}
 ]}
];
const FOLLOWUP_STATUS_LABELS={pendiente:'Pendiente',parcial:'Parcialmente subsanado',subsanado:'Subsanado',no_subsanado:'No subsanado'};
let followupDemoState=JSON.parse(localStorage.getItem('sigap_followup_demo')||'null')||structuredClone(FOLLOWUP_DEMO_CASES);
const FOLLOWUP_LIVE_KEY='sigap_followup_live_status_v1';
function saveFollowupDemo(){localStorage.setItem('sigap_followup_demo',JSON.stringify(followupDemoState))}
function currentAuditFollowupCase(){
 const nursing=deviations().map(i=>{const t=technicalFor(i);return {id:i.code,area:i.service||'Enfermería',service:i.service||'Enfermería',risk:i.score||3,deviation:t.deviation,recommendation:t.rec,evidence:t.ev,deadline:t.plazo||'A definir',status:'pendiente',followupNote:'',source:'general'}});
 const lab=(typeof window.labFollowupDeviations==='function')?window.labFollowupDeviations():[];
 const all=[...nursing,...lab];if(!all.length)return null;
 const saved=JSON.parse(localStorage.getItem(FOLLOWUP_LIVE_KEY)||'{}');
 all.forEach(d=>{const k=`${d.source||'x'}:${d.id}`;if(saved[k])Object.assign(d,saved[k])});
 const provider=state.meta.prestador||labState?.meta?.prestador||'Auditoría actual';
 const report=reportId?reportId():'Informe actual';
 return {id:'current-audit',provider,province:state.meta.province||labState?.meta?.province||'',city:state.meta.address||labState?.meta?.address||'',auditDate:state.meta.date||labState?.meta?.date||new Date().toISOString().slice(0,10),report,level:`Nivel ${state.meta.level||labState?.meta?.level||''}`,capitas:0,ugl:labState?.meta?.ugl||'UGL de destino',deviations:all,live:true};
}
function currentFollowupCase(){const id=document.getElementById('followupProvider')?.value;if(id==='current-audit')return currentAuditFollowupCase()||followupDemoState[0];return followupDemoState.find(x=>x.id===id)||currentAuditFollowupCase()||followupDemoState[0]}
function followupFiltered(caseData){const area=document.getElementById('followupArea')?.value||'',status=document.getElementById('followupStatus')?.value||'';return caseData.deviations.filter(d=>(!area||d.area===area)&&(!status||d.status===status))}
function renderFollowupModule(){
 const provider=document.getElementById('followupProvider');if(!provider)return;
 const prev=provider.value;provider.innerHTML='';
 const live=currentAuditFollowupCase();if(live)provider.add(new Option(`${live.provider} · Auditoría actual`,live.id));
 followupDemoState.forEach(c=>provider.add(new Option(`${c.provider} · ${c.city}`,c.id)));
 if([...provider.options].some(o=>o.value===prev))provider.value=prev;else if(live)provider.value='current-audit';
 const c=currentFollowupCase();
 const area=document.getElementById('followupArea');const previous=area.value;area.innerHTML='<option value="">Todas las áreas</option>';[...new Set(c.deviations.map(d=>d.area))].sort().forEach(v=>area.add(new Option(v,v)));if([...area.options].some(o=>o.value===previous))area.value=previous;
 const ugl=document.getElementById('followupUGL');if(ugl&&[...ugl.options].some(o=>o.value===c.ugl))ugl.value=c.ugl;
 updateFollowupHeader();renderFollowupItems(c);renderFollowupKpis(c);renderFollowupSummary(c);
}
function updateFollowupHeader(){const c=currentFollowupCase();if(!c)return;const dest=document.getElementById('followupUGL')?.value||c.ugl;const el=document.getElementById('followupHeader');if(el)el.innerHTML=`<div><span class="viz-badge">EXPEDIENTE DE SEGUIMIENTO</span><h2>${esc(c.provider)}</h2><p><b>${esc(c.city)}, ${esc(c.province)}</b> · ${esc(c.level)} · ${c.capitas?c.capitas.toLocaleString('es-AR')+' cápitas':'cápitas no informadas'}</p><p>Informe de origen: <b>${esc(c.report)}</b> · Auditoría: ${esc(c.auditDate)} · Destino: <b>${esc(dest)}</b></p></div>`}
function renderFollowupKpis(c){const ds=c.deviations;const el=document.getElementById('followupKpis');if(!el)return;el.innerHTML=[
 `<div class="kpi"><b>${ds.length}</b><span>Desvíos derivados</span></div>`,
 `<div class="kpi"><b>${ds.filter(d=>d.risk>=4).length}</b><span>Riesgo alto o crítico</span></div>`,
 `<div class="kpi"><b>${ds.filter(d=>d.status==='subsanado').length}</b><span>Subsanados</span></div>`,
 `<div class="kpi"><b>${Math.round(ds.filter(d=>d.status==='subsanado').length/Math.max(1,ds.length)*100)}%</b><span>Cumplimiento verificado</span></div>`
 ].join('')}
function renderFollowupItems(c){const items=followupFiltered(c),host=document.getElementById('followupAreaGroups');if(!host)return;const groups={};items.forEach(d=>(groups[d.area]??=[]).push(d));host.innerHTML=Object.keys(groups).length?Object.entries(groups).map(([area,ds])=>`<section class="card followup-area"><div class="followup-area-head"><div><h2>${esc(area)}</h2><p>${ds.length} desvío${ds.length===1?'':'s'} para verificar</p></div><span class="iirs-badge ${ds.some(d=>d.risk>=4)?'iirs-rojo':'iirs-amarillo'}">Riesgo máximo ${Math.max(...ds.map(d=>d.risk))}</span></div>${ds.map(d=>followupItemHtml(c,d)).join('')}</section>`).join(''):'<div class="card"><p>No hay desvíos para los filtros seleccionados.</p></div>'}
function followupItemHtml(c,d){return `<article class="followup-item followup-${d.status}"><div class="followup-item-head"><div><b>${esc(d.id)} · ${esc(d.service)}</b><div class="small">Riesgo ${d.risk} · Plazo ${esc(d.deadline)}</div></div><span class="followup-status status-${d.status}">${FOLLOWUP_STATUS_LABELS[d.status]}</span></div><p><b>Desvío:</b> ${esc(d.deviation)}</p><p><b>Recomendación:</b> ${esc(d.recommendation)}</p><p><b>Evidencia solicitada:</b> ${esc(d.evidence)}</p><div class="grid followup-controls"><div><label>Resultado del seguimiento</label><select data-case="${c.id}" data-dev="${d.id}" class="followup-state-select"><option value="pendiente" ${d.status==='pendiente'?'selected':''}>Pendiente</option><option value="parcial" ${d.status==='parcial'?'selected':''}>Parcialmente subsanado</option><option value="subsanado" ${d.status==='subsanado'?'selected':''}>Subsanado</option><option value="no_subsanado" ${d.status==='no_subsanado'?'selected':''}>No subsanado</option></select></div><div><label>Observación del auditor de seguimiento</label><textarea data-case="${c.id}" data-dev="${d.id}" class="followup-note" rows="2" placeholder="Describa la verificación realizada...">${esc(d.followupNote||'')}</textarea></div></div></article>`}
function bindFollowupControls(){document.querySelectorAll('.followup-state-select').forEach(el=>el.onchange=()=>updateFollowupDeviation(el.dataset.case,el.dataset.dev,'status',el.value));document.querySelectorAll('.followup-note').forEach(el=>el.onchange=()=>updateFollowupDeviation(el.dataset.case,el.dataset.dev,'followupNote',el.value))}
const _renderFollowupItems=renderFollowupItems;renderFollowupItems=function(c){_renderFollowupItems(c);bindFollowupControls()}
function updateFollowupDeviation(caseId,devId,key,value){
 if(caseId==='current-audit'){
  const c=currentAuditFollowupCase(),d=c?.deviations.find(x=>x.id===devId);if(!d)return;d[key]=value;
  const saved=JSON.parse(localStorage.getItem(FOLLOWUP_LIVE_KEY)||'{}'),k=`${d.source||'x'}:${d.id}`;saved[k]={status:d.status,followupNote:d.followupNote};localStorage.setItem(FOLLOWUP_LIVE_KEY,JSON.stringify(saved));renderFollowupModule();return;
 }
 const c=followupDemoState.find(x=>x.id===caseId),d=c?.deviations.find(x=>x.id===devId);if(!d)return;d[key]=value;saveFollowupDemo();renderFollowupModule()
}
function renderFollowupSummary(c){const ds=c.deviations,total=ds.length,sub=ds.filter(d=>d.status==='subsanado').length,par=ds.filter(d=>d.status==='parcial').length,pend=ds.filter(d=>d.status==='pendiente'||d.status==='no_subsanado').length;const byArea=[...new Set(ds.map(d=>d.area))].map(a=>`${a}: ${ds.filter(d=>d.area===a).length}`).join('<br>');const el=document.getElementById('followupSummary');if(el)el.innerHTML=`<dl class="provider-detail-list"><div><dt>Informe</dt><dd>${esc(c.report)}</dd></div><div><dt>Total</dt><dd>${total}</dd></div><div><dt>Subsanados</dt><dd>${sub}</dd></div><div><dt>Parciales</dt><dd>${par}</dd></div><div><dt>Pendientes</dt><dd>${pend}</dd></div><div><dt>Cumplimiento</dt><dd>${Math.round(sub/Math.max(1,total)*100)}%</dd></div></dl><h3>Distribución por área</h3><p>${byArea}</p>`}
function generateFollowupReferral(){const c=currentFollowupCase(),dest=document.getElementById('followupUGL')?.value||c.ugl;alert(`Derivación demostrativa generada para ${dest}.\n\nEn la versión definitiva se creará un expediente con los desvíos agrupados por área y el informe de origen adjunto.`)}
function copyFollowupSummary(){const c=currentFollowupCase(),ds=c.deviations,dest=document.getElementById('followupUGL')?.value||c.ugl;const text=`SIGAP · DERIVACIÓN A SEGUIMIENTO\nPrestador: ${c.provider}\nInforme: ${c.report}\nDestino: ${dest}\nDesvíos: ${ds.length}\nSubsanados: ${ds.filter(d=>d.status==='subsanado').length}\nPendientes: ${ds.filter(d=>d.status!=='subsanado').length}\n\n${ds.map(d=>`${d.area} · ${d.id} · Riesgo ${d.risk} · ${FOLLOWUP_STATUS_LABELS[d.status]}\n${d.deviation}`).join('\n\n')}`;navigator.clipboard?.writeText(text).then(()=>alert('Resumen copiado.')).catch(()=>prompt('Copie el resumen:',text))}
function printFollowupPackage(){window.print()}
function resetFollowupDemo(){if(!confirm('¿Restablecer los datos demostrativos de seguimiento?'))return;followupDemoState=structuredClone(FOLLOWUP_DEMO_CASES);saveFollowupDemo();document.getElementById('followupProvider').innerHTML='';renderFollowupModule()}

function lockApplication(){
 document.getElementById('authGate')?.classList.remove('hide','auth-success');document.body.classList.add('locked');
 document.getElementById('adminNav')?.classList.add('hide');
 document.getElementById('executiveNav')?.classList.add('hide');
 document.getElementById('providerMapNav')?.classList.add('hide');
 document.getElementById('followupNav')?.classList.add('hide');
 document.getElementById('laboratoryNav')?.classList.add('hide');
}
function unlockApplication(){
 const gate=document.getElementById('authGate');gate?.classList.add('auth-success');
 setTimeout(()=>gate?.classList.add('hide'),500);document.body.classList.remove('locked');
 const el=document.getElementById('sessionUser');if(el)el.textContent=`${currentSessionUser.displayName||currentSessionUser.email} · ${auditorAreaRoleLabel()}`;
 document.getElementById('adminNav')?.classList.toggle('hide',!isManagementRole(currentSessionUser?.role));
 document.getElementById('executiveNav')?.classList.toggle('hide',!isManagementRole(currentSessionUser?.role));
 document.getElementById('providerMapNav')?.classList.toggle('hide',!isManagementRole(currentSessionUser?.role));
 document.getElementById('followupNav')?.classList.toggle('hide',!isManagementRole(currentSessionUser?.role));
 applyProfileToAudit();applySpecialtyVisibility();renderUserDashboard();
}
async function siapeLogin(){
 const email=normalizeEmail(document.getElementById('loginEmail').value),password=document.getElementById('loginPassword').value;
 if(!email||!password){setLoginStatus('Ingrese el correo y la contraseña.');return}
 setLoginStatus('Verificando…','info');
 try{await siapeAuth.signInWithEmailAndPassword(email,password)}catch(e){setLoginStatus(friendlyAuthError(e))}
}
async function siapeResetPassword(){
 const email=normalizeEmail(document.getElementById('loginEmail').value);if(!email)return alert('Ingrese primero su correo.');
 try{await siapeAuth.sendPasswordResetEmail(email);alert('Se envió el correo para restablecer la contraseña.')}catch(e){alert('No se pudo enviar el correo: '+friendlyAuthError(e))}
}
async function siapeLogout(){if(siapeAuth)await siapeAuth.signOut();currentSessionUser=null;lockApplication()}
function enterLocalDemo(){currentSessionUser={uid:'local-demo',email:'local@device',displayName:'Auditor de prueba',role:'administrador'};unlockApplication()}
function toggleAccessRequest(force){
 const box=document.getElementById('accessRequestBox');if(!box)return;
 const show=typeof force==='boolean'?force:box.classList.contains('hide');box.classList.toggle('hide',!show);
 if(show){const loginEmail=normalizeEmail(document.getElementById('loginEmail')?.value);if(loginEmail)document.getElementById('requestEmail').value=loginEmail;document.getElementById('requestFirstName')?.focus()}
}
async function submitAccessRequest(){
 const nombre=document.getElementById('requestFirstName').value.trim(),apellido=document.getElementById('requestLastName').value.trim(),correo=normalizeEmail(document.getElementById('requestEmail').value),password=document.getElementById('requestPassword').value,password2=document.getElementById('requestPassword2').value;
 if(!nombre||!apellido||!correo||!password){setLoginStatus('Complete todos los datos de la solicitud.');return}
 if(password!==password2){setLoginStatus('Las contraseñas no coinciden.');return}
 if(password.length<6){setLoginStatus('La contraseña debe tener al menos 6 caracteres.');return}
 registeringAccess=true;setLoginStatus('Enviando solicitud…','info');
 try{
  const cred=await siapeAuth.createUserWithEmailAndPassword(correo,password);
  await siapeDb.collection('usuarios').doc(correo).set({nombre,apellido,correo,estado:'pendiente',rol:'auditor'});
  await cred.user.updateProfile({displayName:`${nombre} ${apellido}`}).catch(()=>{});
  await siapeAuth.signOut();
  document.getElementById('loginEmail').value=correo;document.getElementById('loginPassword').value='';
  toggleAccessRequest(false);setLoginStatus('Solicitud enviada. Espere la autorización de un responsable.','success');
 }catch(e){setLoginStatus(friendlyAuthError(e))}
 finally{registeringAccess=false}
}
async function loadAdminUsers(){
 if(!isManagementRole(currentSessionUser?.role))return;
 const status=document.getElementById('adminUserStatus');if(status)status.textContent='Cargando usuarios…';
 try{
  const snap=await siapeDb.collection('usuarios').get();adminUsersCache=snap.docs.map(d=>({id:d.id,...d.data()}));
  renderAdminUsers();if(status)status.textContent=`${adminUsersCache.length} usuario(s).`;
 }catch(e){if(status)status.textContent='No se pudieron cargar los usuarios: '+friendlyAuthError(e)}
}
function renderAdminUsers(){
 const el=document.getElementById('adminUsersList');if(!el)return;
 const q=normalizeEmail(document.getElementById('adminUserSearch')?.value),filter=document.getElementById('adminUserFilter')?.value||'todos';
 const list=adminUsersCache.filter(u=>{const text=`${u.nombre||''} ${u.apellido||''} ${u.correo||u.id}`.toLowerCase();return(!q||text.includes(q))&&(filter==='todos'||u.estado===filter)}).sort((a,b)=>String(a.apellido||a.correo).localeCompare(String(b.apellido||b.correo),'es'));
 if(!list.length){el.innerHTML='<div class="notice">No hay usuarios para mostrar.</div>';return}
 el.innerHTML=list.map(u=>{
  const email=normalizeEmail(u.correo||u.id),self=email===normalizeEmail(currentSessionUser?.email),primary=normalizeEmail(currentSessionUser?.email)===PRIMARY_ADMIN_EMAIL;
  const roleOptions=['auditor','gerente','subgerente','jefa_medicas','jefa_sociales','administrador'].map(r=>`<option value="${r}" ${u.rol===r?'selected':''}>${roleLabel(r)}</option>`).join('');
  const specialtyOptions=[
   ['','Sin asignar'],['enfermeria','Enfermería'],['laboratorio','Laboratorio / Bioquímica'],['medica','Médica'],['farmacia','Farmacia'],['imagenes','Imágenes'],['psicologia','Psicología / Salud Mental'],['hemoterapia','Hemoterapia'],['nutricion','Nutrición'],['administracion','Administración'],['sociales','Social']
  ].map(([v,l])=>`<option value="${v}" ${String(u.especialidad||'')===v?'selected':''}>${l}</option>`).join('');
  return `<div class="admin-user-card"><div class="admin-user-head"><div><div class="admin-user-name">${esc(`${u.nombre||''} ${u.apellido||''}`.trim()||email)}</div><div class="admin-user-meta">${esc(email)}<br>Rol: ${esc(roleLabel(u.rol||'auditor'))}<br>Especialidad: ${esc(labSpecialtyLabel(u.especialidad))}</div></div><span class="user-state user-state-${esc(u.estado||'pendiente')}">${esc(u.estado||'pendiente')}</span></div><div class="admin-user-actions">${u.estado!=='autorizado'?`<button class="primary" onclick="setUserStatus('${esc(email)}','autorizado')">Autorizar</button>`:''}${u.estado!=='rechazado'?`<button class="secondary" onclick="setUserStatus('${esc(email)}','rechazado')">Rechazar</button>`:''}${u.estado==='autorizado'&&!self?`<button class="danger" onclick="setUserStatus('${esc(email)}','suspendido')">Suspender</button>`:''}${u.estado==='suspendido'?`<button class="primary" onclick="setUserStatus('${esc(email)}','autorizado')">Reactivar</button>`:''}${!self?`<button class="danger" onclick="deleteUserRecord('${esc(email)}')">Eliminar registro</button>`:''}</div><div class="role-editor"><label>Especialidad operativa</label><select id="specialty-${safeDomId(email)}">${specialtyOptions}</select><button class="secondary" onclick="setUserSpecialty('${esc(email)}')">Guardar especialidad</button></div>${primary?`<div class="role-editor"><label>Rol</label><select id="role-${safeDomId(email)}">${roleOptions}</select><button class="secondary" onclick="setUserRole('${esc(email)}')">Guardar rol</button></div>`:''}</div>`;
 }).join('');
}

function auditorAreaRoleLabel(){
 const role=String(currentSessionUser?.role||'auditor').toLowerCase();
 if(role!=='auditor')return roleLabel(role);
 const sp=String(currentSessionUser?.profile?.especialidad||currentSessionUser?.profile?.especialidadOperativa||'').toLowerCase();
 return ({enfermeria:'Auditor del Área de Enfermería',laboratorio:'Auditor del Área Laboratorio',medica:'Auditor del Área Médica',farmacia:'Auditor del Área Farmacia',imagenes:'Auditor del Área Imágenes',psicologia:'Auditor del Área Psicología / Salud Mental',hemoterapia:'Auditor del Área Hemoterapia',nutricion:'Auditor del Área Nutrición',administracion:'Auditor del Área Administración',sociales:'Auditor del Área Social'})[sp]||'Auditor';
}
function roleLabel(role){return({administrador:'Administrador',gerente:'Gerente',subgerente:'Subgerente',jefa_medicas:'Jefa Departamento Médicas',jefa_sociales:'Jefa Departamento Sociales',auditor:'Auditor'})[role]||role}
function safeDomId(v){return String(v).replace(/[^a-z0-9_-]/gi,'_')}
async function setUserStatus(email,estado){
 if(!isManagementRole(currentSessionUser?.role))return;
 if(!confirm(`¿Confirmar estado “${estado}” para ${email}?`))return;
 try{await siapeDb.collection('usuarios').doc(email).update({estado});await loadAdminUsers()}catch(e){alert(friendlyAuthError(e))}
}
async function setUserRole(email){
 if(normalizeEmail(currentSessionUser?.email)!==PRIMARY_ADMIN_EMAIL)return alert('Solo el Administrador Principal puede cambiar roles.');
 const role=document.getElementById('role-'+safeDomId(email))?.value;if(!role)return;
 try{await siapeDb.collection('usuarios').doc(email).update({rol:role});await loadAdminUsers()}catch(e){alert(friendlyAuthError(e))}
}
async function deleteUserRecord(email){
 if(!isManagementRole(currentSessionUser?.role))return;
 if(!confirm(`¿Eliminar el registro de ${email}?\n\nLa cuenta de Authentication deberá eliminarse aparte desde Firebase.`))return;
 try{await siapeDb.collection('usuarios').doc(email).delete();clearLocalAuthorization(email);await loadAdminUsers()}catch(e){alert(friendlyAuthError(e))}
}

function renderV3Settings(){const p=JSON.parse(localStorage.getItem(V3_PROFILE_KEY)||'{}');['Name','License','Institution','Email'].forEach(k=>{const e=document.getElementById('profile'+k);if(e)e.value=p[k.toLowerCase()]||''})}
function saveV3Settings(){const p={name:profileName.value.trim(),license:profileLicense.value.trim(),institution:profileInstitution.value.trim(),email:profileEmail.value.trim()};localStorage.setItem(V3_PROFILE_KEY,JSON.stringify(p));applyProfileToAudit();alert('Configuración guardada en este dispositivo.')}
function applyProfileToAudit(){const p=JSON.parse(localStorage.getItem(V3_PROFILE_KEY)||'{}');if(p.name&&!state.meta.auditor){state.meta.auditor=p.name;save();const e=document.querySelector('[data-meta="auditor"]');if(e)e.value=p.name}}
function renderUserDashboard(){const lib=JSON.parse(localStorage.getItem(LIBKEY)||'{}'),items=Object.values(lib),p=JSON.parse(localStorage.getItem(V3_PROFILE_KEY)||'{}');const w=document.getElementById('userWelcome');if(w)w.innerHTML=`<h3>Buenos días, ${esc(p.name||currentSessionUser?.displayName||'Auditor')}</h3><div>${esc(p.institution||'Auditoría Prestacional')}</div>`;const k=document.getElementById('userDashboardKpis');if(k)k.innerHTML=`<div class="kpi"><span>Auditorías guardadas</span><b>${items.length}</b></div><div class="kpi"><span>Prestadores</span><b>${new Set(items.map(x=>x.state?.meta?.prestador).filter(Boolean)).size}</b></div><div class="kpi"><span>Auditoría actual</span><b>${esc(reportId())}</b></div><div class="kpi"><span>Rol</span><b>${esc(auditorAreaRoleLabel())}</b></div>`}

function openPhotoDB(){return new Promise((res,rej)=>{const r=indexedDB.open(PHOTO_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('photos')){const s=db.createObjectStore('photos',{keyPath:'id'});s.createIndex('auditCode','auditCode')}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function auditStorageId(){return `${state.meta.reportNumber||'SN'}_${state.meta.reportYear||'SA'}_${state.meta.prestador||'PRESTADOR'}`.replace(/[^a-z0-9_-]+/gi,'_').toLowerCase()}
async function compressImage(file){const bmp=await createImageBitmap(file);const max=1400,scale=Math.min(1,max/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.78))}
async function addEvidencePhotos(code,files){if(!files?.length)return;const db=await openPhotoDB();for(const f of files){const blob=await compressImage(f);await new Promise((res,rej)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put({id:crypto.randomUUID(),auditId:auditStorageId(),auditCode:`${auditStorageId()}|${code}`,code,blob,name:f.name,createdAt:new Date().toISOString()});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}await renderPhotoPreview(code);refreshVisiblePhotoCounts()}
async function getEvidencePhotos(code,auditId=auditStorageId()){const db=await openPhotoDB();return new Promise((res,rej)=>{const r=db.transaction('photos').objectStore('photos').index('auditCode').getAll(`${auditId}|${code}`);r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function deleteEvidencePhoto(id,code){const db=await openPhotoDB();await new Promise((res,rej)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});renderPhotoPreview(code);refreshVisiblePhotoCounts()}
async function renderPhotoPreview(code){const el=document.getElementById('photo-preview-'+code);if(!el)return;const photos=await getEvidencePhotos(code);el.innerHTML=photos.map(p=>`<div class="photo-thumb"><img src="${URL.createObjectURL(p.blob)}"><button class="danger" onclick="deleteEvidencePhoto('${p.id}','${code}')">×</button></div>`).join('')}
async function refreshVisiblePhotoCounts(){document.querySelectorAll('[id^="photo-count-"]').forEach(async el=>{const code=el.id.replace('photo-count-',''),ps=await getEvidencePhotos(code);el.textContent=ps.length;renderPhotoPreview(code)})}
async function openEvidenceGallery(code){const ps=await getEvidencePhotos(code);if(!ps.length)return alert('No hay fotografías asociadas a este desvío.');renderPhotoPreview(code);document.getElementById('photo-preview-'+code)?.scrollIntoView({behavior:'smooth',block:'center'})}
async function prepareReportWithPhotos(){renderReport();const ds=deviations();const blocks=[];for(const i of ds){const ps=await getEvidencePhotos(i.code);if(ps.length){blocks.push(`<section class="report-section photo-report"><h1>EVIDENCIA FOTOGRÁFICA · ${esc(i.code)}</h1><p><b>${esc(i.service)}:</b> ${esc(i.item)}</p><div class="report-photo-grid">${ps.map((p,n)=>`<figure><img src="${URL.createObjectURL(p.blob)}"><figcaption>Fotografía ${n+1} · ${new Date(p.createdAt).toLocaleString()}</figcaption></figure>`).join('')}</div></section>`)}}document.getElementById('reportContent').insertAdjacentHTML('beforeend',blocks.join(''));alert(blocks.length?'Informe preparado con fotografías.':'No hay fotografías cargadas en los desvíos.')}

function auditShareText(){return `SIAPE · Informe ${reportId()}\nPrestador: ${state.meta.prestador||'Sin identificar'}\nFecha: ${state.meta.date||''}\nAuditor: ${state.meta.auditor||''}\nDesvíos: ${stats().dev}\nRiesgo: ${riskOverall()}`}
function downloadCurrentHTML(){renderReport();const blob=new Blob([`<!doctype html><meta charset="utf-8"><title>SIAPE ${reportId()}</title><link rel="stylesheet" href="styles.css">${document.getElementById('reportContent').innerHTML}`],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`SIAPE_${reportId().replace('/','_')}.html`;a.click();return blob}
async function finalizeAndShare(){saveAuditSnapshot();await shareCurrentReport()}
async function shareCurrentReport(){const text=auditShareText();if(navigator.share){try{await navigator.share({title:`SIAPE · Informe ${reportId()}`,text});return}catch(e){if(e.name==='AbortError')return}}const action=prompt('Escriba una opción: CORREO, WHATSAPP, DESCARGAR o CANCELAR','CORREO');if(!action)return;const a=action.toUpperCase();if(a.startsWith('CORREO')){const to=prompt('Correo destinatario:','')||'';location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('SIAPE · Informe '+reportId())}&body=${encodeURIComponent(text+'\n\nAdjunte el informe generado desde SIAPE.')}`}else if(a.startsWith('WHATS')){window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank')}else if(a.startsWith('DESC'))downloadCurrentHTML()}
function shareSavedAudit(id){loadAuditSnapshot(id);setTimeout(shareCurrentReport,100)}
async function exportFullBackup(){const db=await openPhotoDB();const photos=await new Promise((res,rej)=>{const r=db.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const encoded=[];for(const p of photos){encoded.push({...p,blob:await blobToDataURL(p.blob)})}const backup={version:'3.0',createdAt:new Date().toISOString(),current:state,library:JSON.parse(localStorage.getItem(LIBKEY)||'{}'),profile:JSON.parse(localStorage.getItem(V3_PROFILE_KEY)||'{}'),photos:encoded};const b=new Blob([JSON.stringify(backup)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`SIAPE_RESPALDO_${new Date().toISOString().slice(0,10)}.json`;a.click()}
function blobToDataURL(blob){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob)})}
async function dataURLToBlob(s){return (await fetch(s)).blob()}
async function importFullBackup(input){const f=input.files?.[0];if(!f)return;try{const b=JSON.parse(await f.text());if(!b.version)throw new Error('Formato inválido');state=b.current;localStorage.setItem(LIBKEY,JSON.stringify(b.library||{}));localStorage.setItem(V3_PROFILE_KEY,JSON.stringify(b.profile||{}));const db=await openPhotoDB();for(const p of b.photos||[]){p.blob=await dataURLToBlob(p.blob);await new Promise((res,rej)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(p);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}ensureState();save();renderAll();alert('Respaldo importado correctamente.')}catch(e){alert('No se pudo importar: '+e.message)}finally{input.value=''}}

document.addEventListener('DOMContentLoaded',()=>{lockApplication();initV3Auth();renderV3Settings()});
