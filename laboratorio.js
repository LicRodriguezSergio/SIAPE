
// ===== SIAPE V3.4.3 · MÓDULO LABORATORIO (PRUEBA) =====
const LAB_KEY='siape_laboratorio_v1';
const LAB_LIBRARY_KEY='siape_laboratorio_guardadas_v1';
let labState=loadLabState();

function labDefaultState(){
  return {
    meta:{reportNumber:'',reportYear:String(new Date().getFullYear()),prestador:'',cuit:'',province:'',ugl:'',address:'',level:'II',date:new Date().toISOString().slice(0,10),auditor:''},
    answers:{},
    view:'guide'
  };
}
function loadLabState(){
  try{return {...labDefaultState(),...(JSON.parse(localStorage.getItem(LAB_KEY)||'null')||{})}}catch{return labDefaultState()}
}
function ensureLabState(){
  labState.meta={...labDefaultState().meta,...(labState.meta||{})};
  labState.answers=labState.answers||{};
}
function saveLabState(){ensureLabState();localStorage.setItem(LAB_KEY,JSON.stringify(labState))}
function labAnswer(code){
  return labState.answers[code]||{response:'',observation:'',suggestedIndex:0,customDeviation:'',deviationChoice:'suggested'};
}
function labSpecialty(){
  return String(currentSessionUser?.profile?.especialidad||currentSessionUser?.profile?.especialidadOperativa||'').trim().toLowerCase();
}
function isLaboratoryProfile(){
  return isManagementRole(currentSessionUser?.role)||['laboratorio','bioquimica','bioquímica','bioquimico','bioquímico'].includes(labSpecialty());
}
function isLaboratoryOnlyAuditor(){
  return currentSessionUser?.role==='auditor'&&['laboratorio','bioquimica','bioquímica','bioquimico','bioquímico'].includes(labSpecialty());
}
function labSpecialtyLabel(v){
  const x=String(v||'').toLowerCase();
  return ({laboratorio:'Laboratorio / Bioquímica',enfermeria:'Enfermería',medica:'Área Médica',imagenes:'Diagnóstico por Imágenes',hemoterapia:'Hemoterapia',nutricion:'Nutrición',administracion:'Administración / Legal',sociales:'Área Social'})[x]||'Sin asignar';
}
function applySpecialtyVisibility(){
  const labNav=document.getElementById('laboratoryNav');
  if(labNav)labNav.classList.toggle('hide',!isLaboratoryProfile());
  const only=isLaboratoryOnlyAuditor();
  const hideForLabOnly=['auditNav','interviewNav','rrhhNav','aiNav','dashNav','summaryNav','devNav','planNav','normNav','reportNav'];
  hideForLabOnly.forEach(id=>document.getElementById(id)?.classList.toggle('hide',only));
  const startBtn=document.getElementById('startAuditButton');
  if(startBtn){
    startBtn.textContent=only?'Comenzar auditoría de Laboratorio':'Comenzar auditoría';
    startBtn.onclick=only?()=>{showPage('laboratoryPage',document.getElementById('laboratoryNav'));renderLaboratoryModule()}:()=>showPage('auditPage',document.getElementById('auditNav'));
  }
  if(only){
    document.getElementById('executiveNav')?.classList.add('hide');
    document.getElementById('providerMapNav')?.classList.add('hide');
    document.getElementById('followupNav')?.classList.add('hide');
    document.getElementById('adminNav')?.classList.add('hide');
  }
}
function renderLaboratoryModule(){
  ensureLabState();
  if(!isLaboratoryProfile()){
    const root=document.getElementById('laboratoryContent');
    if(root)root.innerHTML='<div class="notice">Esta guía no está asignada a su especialidad.</div>';
    return;
  }
  if(!labState.meta.auditor)labState.meta.auditor=currentSessionUser?.displayName||'';
  document.querySelectorAll('[data-lab-meta]').forEach(el=>{
    const k=el.dataset.labMeta;
    if(document.activeElement!==el)el.value=labState.meta[k]||'';
  });
  labShowView(labState.view||'guide',false);
  renderLabStats();
}
function labShowView(view,saveView=true){
  labState.view=view;if(saveView)saveLabState();
  document.querySelectorAll('.lab-subview').forEach(el=>el.classList.add('hide'));
  document.getElementById(view==='risk'?'labRiskView':view==='report'?'labReportView':'labGuideView')?.classList.remove('hide');
  document.querySelectorAll('.lab-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  if(view==='guide')renderLabGuide();
  if(view==='risk')renderLabRiskMatrix();
  if(view==='report')renderLabReportPreview();
}
function updateLabMeta(el){
  labState.meta[el.dataset.labMeta]=el.value;
  saveLabState();renderLabStats();
}
function labResponseLabel(v){return ({SI:'Cumple',NO:'Desvío',NA:'No aplica',NE:'No evaluado'})[v]||'Pendiente'}
function labCriterionDefaultDeviation(item){return `No se acredita el cumplimiento del criterio: ${item.item}.`}
function labSelectedDeviation(item,a){
  if(a.response!=='NO')return '';
  const suggestions=item.suggestions||[];
  if(!suggestions.length)return String(a.customDeviation||'').trim();
  const s=suggestions[Number(a.suggestedIndex)||0];
  if(a.deviationChoice==='custom')return String(a.customDeviation||'').trim();
  return s?.text||labCriterionDefaultDeviation(item);
}
function labCriticalityRank(v){return ({'Baja':2,'Media':3,'Alta':4,'Crítica':5,'Critica':5})[v]||0}
function labSuggestedCriticality(item,a){
  const s=item.suggestions?.[Number(a.suggestedIndex)||0];
  return s?.criticality||'—';
}
function renderLabStats(){
  const items=window.LAB_GUIDE_ITEMS||[], ans=labState.answers||{};
  const evaluated=items.filter(i=>['SI','NO','NA'].includes((ans[i.code]||{}).response));
  const no=items.filter(i=>(ans[i.code]||{}).response==='NO');
  const yes=items.filter(i=>(ans[i.code]||{}).response==='SI');
  const denom=yes.length+no.length;
  const compliance=denom?Math.round(yes.length/denom*100):0;
  const high=no.filter(i=>labCriticalityRank(labSuggestedCriticality(i,ans[i.code]||{}))>=4).length;
  const el=document.getElementById('labKpis');
  if(el)el.innerHTML=`<div class="kpi"><span>Requisitos</span><b>${items.length}</b></div><div class="kpi"><span>Evaluados</span><b>${evaluated.length}</b></div><div class="kpi"><span>Desvíos</span><b>${no.length}</b></div><div class="kpi"><span>Cumplimiento</span><b>${compliance}%</b></div><div class="kpi"><span>Alta/Crítica*</span><b>${high}</b></div>`;
}
function renderLabGuide(){
  const root=document.getElementById('labGuideItems');if(!root)return;
  const items=window.LAB_GUIDE_ITEMS||[];
  const sections=[...new Set(items.map(i=>i.section))];
  root.innerHTML=sections.map(section=>{
    const rows=items.filter(i=>i.section===section);
    const completed=rows.filter(i=>['SI','NO','NA','NE'].includes(labAnswer(i.code).response)).length;
    return `<details class="lab-section" open><summary>${esc(section)} <span>${completed}/${rows.length}</span></summary><div class="lab-items">${rows.map(labItemHtml).join('')}</div></details>`;
  }).join('');
}
function labItemHtml(item){
  const a=labAnswer(item.code), no=a.response==='NO';
  const suggestions=item.suggestions||[];
  const selected=Number(a.suggestedIndex)||0;
  const choice=a.deviationChoice||'suggested';
  return `<article class="lab-item ${no?'lab-item-deviation':''}" data-lab-code="${esc(item.code)}">
    <div class="lab-item-head"><div><b>${esc(item.code)}</b><div class="lab-item-title">${esc(item.item)}</div></div><span class="lab-response lab-response-${esc(a.response||'P')}">${esc(labResponseLabel(a.response))}</span></div>
    <div class="lab-response-buttons" role="group" aria-label="Respuesta">
      ${['SI','NO','NA','NE'].map(v=>`<button type="button" class="${a.response===v?'selected':''}" data-lab-action="response" data-value="${v}">${v==='NE'?'NO EVALUADO':v}</button>`).join('')}
    </div>
    <label>Observación de auditoría</label>
    <textarea rows="2" data-lab-field="observation" placeholder="Describa lo observado...">${esc(a.observation||'')}</textarea>
    ${no?`<div class="lab-deviation-box">
      <h4>Desvío para el informe</h4>
      ${suggestions.length?`<label class="lab-choice"><input type="radio" name="dev-${safeDomId(item.code)}" data-lab-field="deviationChoice" value="suggested" ${choice!=='custom'?'checked':''}> Usar desvío sugerido por la matriz de Laboratorio</label>
      <select data-lab-field="suggestedIndex">${suggestions.map((s,idx)=>`<option value="${idx}" ${idx===selected?'selected':''}>${esc(s.code)} · ${esc(s.text)}${s.criticality?' · '+esc(s.criticality):''}</option>`).join('')}</select>`:
      `<div class="notice">Este criterio no tiene todavía un desvío estandarizado vinculado en el archivo recibido. Puede redactarse un desvío propio sin alterar el criterio original.</div>`}
      <label class="lab-choice"><input type="radio" name="dev-${safeDomId(item.code)}" data-lab-field="deviationChoice" value="custom" ${choice==='custom'||!suggestions.length?'checked':''}> Redactar desvío propio</label>
      <textarea rows="3" data-lab-field="customDeviation" placeholder="Escriba el desvío tal como desea que figure en el informe...">${esc(a.customDeviation||'')}</textarea>
      <div class="lab-final-deviation"><b>Desvío seleccionado:</b> ${esc(labSelectedDeviation(item,{...a,deviationChoice:(!suggestions.length?'custom':choice)}))||'<em>Pendiente de redacción</em>'}</div>
      ${item.examples?.length?`<details class="lab-history"><summary>Ver antecedentes de observaciones vinculadas (${item.examples.length})</summary><ul>${item.examples.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}
    </div>`:''}
  </article>`;
}
function labHandleInput(e){
  const itemEl=e.target.closest('[data-lab-code]');if(!itemEl)return;
  const code=itemEl.dataset.labCode,item=(window.LAB_GUIDE_ITEMS||[]).find(x=>x.code===code);if(!item)return;
  const a={...labAnswer(code)};
  if(e.target.dataset.labAction==='response'){
    a.response=e.target.dataset.value;
    if(a.response==='NO'&&!(item.suggestions||[]).length)a.deviationChoice='custom';
    labState.answers[code]=a;saveLabState();renderLabGuide();renderLabStats();return;
  }
  const f=e.target.dataset.labField;if(!f)return;
  if(f==='suggestedIndex')a.suggestedIndex=Number(e.target.value)||0;
  else if(f==='deviationChoice')a.deviationChoice=e.target.value;
  else a[f]=e.target.value;
  labState.answers[code]=a;saveLabState();
  if(['suggestedIndex','deviationChoice'].includes(f))renderLabGuide();
  renderLabStats();
}
function renderLabRiskMatrix(){
  const body=document.getElementById('labRiskRows');if(!body)return;
  const rows=window.LAB_RISK_MATRIX||[];
  body.innerHTML=rows.map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(r.proceso)}</td><td>${esc(r.subproceso)}</td><td>${esc(r.area)}</td><td>${esc(r.item)}</td><td>${esc(r.normativa)}</td><td>${esc(r.incumplimiento)}</td><td>${esc(r.impacto)}</td><td>${esc(r.peso)}</td><td>${esc(r.riesgo)}</td><td>${esc(r.nivel)}</td><td>${esc(r.criticidad)}</td><td>${esc(r.prioridad)}</td></tr>`).join('');
}
function labReportData(){
  const items=window.LAB_GUIDE_ITEMS||[];
  return items.filter(i=>labAnswer(i.code).response==='NO').map(i=>{
    const a=labAnswer(i.code);
    return {code:i.code,section:i.section,item:i.item,observation:a.observation||'',deviation:labSelectedDeviation(i,a),criticality:labSuggestedCriticality(i,a)}
  });
}
function renderLabReportPreview(){
  const root=document.getElementById('labReportPreview');if(!root)return;
  const ds=labReportData();
  root.innerHTML=`<div class="lab-report-sheet"><h2>LABORATORIO · INFORME DE AUDITORÍA</h2>
    <p><b>Prestador:</b> ${esc(labState.meta.prestador||'—')} &nbsp; <b>CUIT:</b> ${esc(labState.meta.cuit||'—')}</p>
    <p><b>Provincia:</b> ${esc(labState.meta.province||'—')} &nbsp; <b>UGL:</b> ${esc(labState.meta.ugl||'—')} &nbsp; <b>Fecha:</b> ${esc(labState.meta.date||'—')}</p>
    <p><b>Auditor/a:</b> ${esc(labState.meta.auditor||currentSessionUser?.displayName||'—')}</p>
    <h3>Desvíos seleccionados (${ds.length})</h3>
    ${ds.length?ds.map(d=>`<div class="lab-report-dev"><b>${esc(d.code)} · ${esc(d.section)}</b><p>${esc(d.item)}</p><p><b>Observación:</b> ${esc(d.observation||'—')}</p><p><b>Desvío:</b> ${esc(d.deviation||'Pendiente de redacción')}</p>${d.criticality!=='—'?`<p><b>Criticidad de referencia:</b> ${esc(d.criticality)}</p>`:''}</div>`).join(''):'<p>No se registraron respuestas NO.</p>'}
    <p class="small"><b>Nota metodológica:</b> la matriz de riesgo de Laboratorio se incorpora como versión preliminar y queda sujeta a validación técnica del área.</p>
  </div>`;
}
function labSaveSnapshot(){
  ensureLabState();
  const lib=JSON.parse(localStorage.getItem(LAB_LIBRARY_KEY)||'{}');
  const id=`LAB_${labState.meta.reportNumber||'SN'}_${labState.meta.reportYear||new Date().getFullYear()}_${Date.now()}`;
  lib[id]={savedAt:new Date().toISOString(),state:structuredClone(labState),auditor:currentSessionUser?.email||''};
  localStorage.setItem(LAB_LIBRARY_KEY,JSON.stringify(lib));
  alert('Auditoría de Laboratorio guardada en este dispositivo.');
}
function labReset(){
  if(!confirm('¿Iniciar una nueva auditoría de Laboratorio? Se limpiarán las respuestas actuales.'))return;
  const meta={...labDefaultState().meta,auditor:currentSessionUser?.displayName||''};
  labState={...labDefaultState(),meta};saveLabState();renderLaboratoryModule();
}
function labPrintReport(){
  renderLabReportPreview();
  const html=document.getElementById('labReportPreview')?.innerHTML||'';
  const w=window.open('','_blank');
  if(!w)return alert('El navegador bloqueó la ventana del informe.');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laboratorio · ${esc(labState.meta.prestador||'Informe')}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h2{border-bottom:2px solid #123d5a;padding-bottom:8px}.lab-report-dev{border:1px solid #bbb;border-radius:8px;padding:12px;margin:12px 0}.small{font-size:12px;color:#555}@media print{body{margin:14mm}}</style></head><body>${html}</body></html>`);
  w.document.close();setTimeout(()=>w.print(),300);
}
function setUserSpecialty(email){
  if(!isManagementRole(currentSessionUser?.role))return;
  const el=document.getElementById('specialty-'+safeDomId(email));if(!el)return;
  const especialidad=el.value;
  siapeDb.collection('usuarios').doc(email).update({especialidad}).then(loadAdminUsers).catch(e=>alert(friendlyAuthError(e)));
}

document.addEventListener('input',e=>{
  if(e.target.matches('[data-lab-meta]'))updateLabMeta(e.target);
  if(e.target.closest('#labGuideItems'))labHandleInput(e);
});
document.addEventListener('change',e=>{if(e.target.closest('#labGuideItems'))labHandleInput(e)});
document.addEventListener('click',e=>{if(e.target.closest('#labGuideItems')&&e.target.dataset.labAction==='response')labHandleInput(e)});
document.addEventListener('DOMContentLoaded',()=>{ensureLabState()});
