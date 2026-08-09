
// ===== SIAPE V3.4.4 · MÓDULO LABORATORIO + MATRIZ DINÁMICA =====
const LAB_KEY='siape_laboratorio_v1';
const LAB_LIBRARY_KEY='siape_laboratorio_guardadas_v1';
let labState=loadLabState();

function labDefaultState(){
  return {
    meta:{reportNumber:'',reportYear:String(new Date().getFullYear()),prestador:'',cuit:'',province:'',ugl:'',address:'',level:'II',date:new Date().toISOString().slice(0,10),auditor:''},
    answers:{},
    riskManual:{},
    interview:{date:new Date().toISOString().slice(0,10),time:'',place:'',area:'',interviewees:'',roles:'',license:'',auditors:'',summary:'',documents:'',notes:''},
    plan:{},
    view:'panel'
  };
}
function loadLabState(){
  try{return {...labDefaultState(),...(JSON.parse(localStorage.getItem(LAB_KEY)||'null')||{})}}catch{return labDefaultState()}
}
function ensureLabState(){
  labState.meta={...labDefaultState().meta,...(labState.meta||{})};
  labState.answers=labState.answers||{};
  labState.riskManual=labState.riskManual||{};
  labState.interview={...labDefaultState().interview,...(labState.interview||{})};
  labState.plan=labState.plan||{};
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
  return ({laboratorio:'Laboratorio / Bioquímica',enfermeria:'Enfermería',medica:'Médica',farmacia:'Farmacia',imagenes:'Imágenes',psicologia:'Psicología / Salud Mental',hemoterapia:'Hemoterapia',nutricion:'Nutrición',administracion:'Administración',sociales:'Social'})[x]||'Sin asignar';
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
  labShowView(labState.view||'panel',false);
  renderLabStats();
}
function labShowView(view,saveView=true){
  labState.view=view;if(saveView)saveLabState();
  document.querySelectorAll('.lab-subview').forEach(el=>el.classList.add('hide'));
  const map={panel:'labPanelView',interview:'labInterviewView',guide:'labGuideView',risk:'labRiskView',summary:'labSummaryView',plan:'labPlanView',report:'labReportView'};
  document.getElementById(map[view]||'labPanelView')?.classList.remove('hide');
  document.querySelectorAll('.lab-tab').forEach(b=>{const on=b.dataset.view===view;b.classList.toggle('active',on);b.classList.toggle('primary',on);b.classList.toggle('secondary',!on)});
  if(view==='panel')renderLabPanel();
  if(view==='interview')renderLabInterview();
  if(view==='guide')renderLabGuide();
  if(view==='risk')renderLabRiskMatrix();
  if(view==='summary')renderLabSummary();
  if(view==='plan')renderLabPlan();
  if(view==='report')renderLabReportPreview();
}
function updateLabMeta(el){
  labState.meta[el.dataset.labMeta]=el.value;
  saveLabState();renderLabStats();
  if(labState.view==='risk')renderLabRiskMatrix();
}
function labResponseLabel(v){return ({SI:'Cumple',NO:'Desvío',NA:'No aplica',NE:'No evaluado'})[v]||'Pendiente'}
function labCriterionDefaultDeviation(item){return `No se acredita el cumplimiento del criterio: ${item.item}.`}
function labStandardDeviations(item){
  const coded=(item.suggestions||[]).map(x=>({kind:'coded',code:x.code,text:x.text,criticality:x.criticality||'',category:x.category||''}));
  const historical=(item.examples||[]).map((x,i)=>({kind:'historical',code:'ANT-'+String(i+1).padStart(2,'0'),text:x,criticality:'',category:'Antecedente'}));
  const seen=new Set();return [...coded,...historical].filter(x=>{const k=String(x.text||'').trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true});
}
function labSelectedDeviation(item,a){
  if(a.response!=='NO')return '';
  const suggestions=labStandardDeviations(item);
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
function labLevelToIIRS(level){
  const v=labNormText(level);
  if(v.includes('crit'))return 5;
  if(v.includes('alto'))return 4;
  if(v.includes('moder'))return 3;
  if(v.includes('bajo')||v.includes('menor'))return 2;
  return 2;
}
function labItemIIRS(item){
  const a=labAnswer(item.code);if(a.response!=='NO')return 0;
  const linked=(window.LAB_RISK_MATRIX||[]).filter(r=>labRiskLinkedGuideItem(r)?.code===item.code);
  if(linked.length)return Math.max(...linked.map(r=>labLevelToIIRS(r.nivel)));
  const cr=labCriticalityRank(labSuggestedCriticality(item,a));return cr||3;
}
function labAreaMetrics(){
  ensureLabState();const items=window.LAB_GUIDE_ITEMS||[],ans=labState.answers||{};
  const applicable=items.filter(i=>['SI','NO'].includes((ans[i.code]||{}).response));
  const yes=applicable.filter(i=>(ans[i.code]||{}).response==='SI');
  const dev=applicable.filter(i=>(ans[i.code]||{}).response==='NO');
  const scores=applicable.map(i=>labItemIIRS(i));
  const compliance=applicable.length?yes.length/applicable.length:0;
  const iirs=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
  return {active:applicable.length,answered:items.filter(i=>['SI','NO','NA','NE'].includes((ans[i.code]||{}).response)).length,dev:dev.length,low:dev.filter(i=>labItemIIRS(i)<=2).length,mod:dev.filter(i=>labItemIIRS(i)===3).length,high:dev.filter(i=>labItemIIRS(i)>=4).length,compliance,iirs,yes:yes.length,total:items.length};
}
window.labAreaMetrics=labAreaMetrics;
function labIirsBadge(v){const n=Number(v)||0;const band=n<=2?'Verde':n<4?'Moderado':'Alto';return `${n.toFixed(2)} · ${band}`;}
function renderLabStats(){
  const m=labAreaMetrics();
  const el=document.getElementById('labKpis');
  if(el)el.innerHTML=`<div class="kpi"><span>Requisitos</span><b>${m.total}</b></div><div class="kpi"><span>Evaluados</span><b>${m.answered}</b></div><div class="kpi"><span>Desvíos</span><b>${m.dev}</b></div><div class="kpi"><span>Cumplimiento</span><b>${(m.compliance*100).toFixed(1)}%</b></div><div class="kpi"><span>IIRS</span><b>${m.iirs.toFixed(2)}</b></div>`;
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
  const suggestions=labStandardDeviations(item);
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
      ${suggestions.length?`<label class="lab-choice"><input type="radio" name="dev-${safeDomId(item.code)}" data-lab-field="deviationChoice" value="suggested" ${choice!=='custom'?'checked':''}> Usar observación/desvío estandarizado del material de Laboratorio</label>
      <select data-lab-field="suggestedIndex">${suggestions.map((s,idx)=>`<option value="${idx}" ${idx===selected?'selected':''}>${s.kind==='historical'?'Antecedente estandarizado':esc(s.code)} · ${esc(s.text)}${s.criticality?' · '+esc(s.criticality):''}</option>`).join('')}</select>`:
      `<div class="notice">Este criterio no tiene todavía un desvío estandarizado vinculado en el archivo recibido. Puede redactarse un desvío propio sin alterar el criterio original.</div>`}
      <label class="lab-choice"><input type="radio" name="dev-${safeDomId(item.code)}" data-lab-field="deviationChoice" value="custom" ${choice==='custom'||!suggestions.length?'checked':''}> Omitir el estandarizado y redactar observación/desvío propio</label>
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
function labNormText(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
const LAB_RISK_ALIASES={
  1:['identificacion','dos datos'],2:['concordancia','paciente','muestra'],3:['instructivos','preparacion'],4:['ayuno'],5:['tubos','recoleccion'],
  6:['registro','ingreso','muestras'],7:['tiempos','recepcion'],8:['control','temperatura','heladeras'],9:['registro','temperatura'],10:['elementos','barrera'],
  11:['residuos','patogenicos'],12:['liquidos','residuales'],13:['toma','muestras'],14:['lavado','manos'],15:['equipamiento','necesario','suficiente'],
  16:['gases','sangre'],17:['microscopio'],18:['hemograma'],19:['plaquetas'],20:['coagulacion','tp','kptt'],21:['quimica','basica'],22:['calcemia'],
  23:['ast','alt','fal'],24:['amilasa'],25:['enzimas','cardiacas'],26:['orina','completa'],27:['liquidos','puncion'],28:['control','calidad','interno'],
  29:['control','calidad','interno'],30:['control','calidad','interno'],31:['control','calidad','interno'],32:['control','calidad','externo'],33:['tratamiento','estadistico'],
  34:['acciones','correctivas'],35:['bacteriologia','exclusivo'],36:['bacteriologia','flujo','aire'],37:['bacteriologia','autoclave'],38:['bacteriologia','estufa'],
  39:['maldi','bactec'],40:['informe','validado'],41:['informe','laboratorio','completo'],42:['valores','referencia'],43:['firma','profesional'],44:['derivaciones'],
  45:['respaldo','resultados'],46:['valores','criticos'],47:['resguardo','informes'],48:['direccion','tecnica'],49:['matricula','vigente'],50:['bioquimico','presente'],
  51:['personal','tecnico','matricula'],52:['guardias','activas'],53:['grupo','electrogeno'],54:['heladeras','exclusivas'],55:['sector','lavado','separado'],
  56:['superficies','lavables'],57:['matafuego'],58:['indicadores','calidad'],59:['capacitacion','personal']
};
function labRiskMatchScore(r,item){
  const a=labNormText(item.item), words=LAB_RISK_ALIASES[r.id]||labNormText(r.item).split(' ').filter(w=>w.length>3);
  let score=0; words.forEach(w=>{if(a.includes(labNormText(w)))score+=1});
  const rn=labNormText(r.item);if(a.includes(rn)||rn.includes(a))score+=4;
  return score;
}
function labRiskLinkedGuideItem(r){
  const items=window.LAB_GUIDE_ITEMS||[];let best=null,bestScore=0;
  items.forEach(i=>{const sc=labRiskMatchScore(r,i);if(sc>bestScore){best=i;bestScore=sc}});
  return bestScore>=Math.min(2,(LAB_RISK_ALIASES[r.id]||[]).length||2)?best:null;
}
function labRiskStatus(r){
  const linked=labRiskLinkedGuideItem(r);
  if(linked){const response=labAnswer(linked.code).response||'';if(response)return {response,linked};}
  const manual=labState.riskManual?.[r.id]||'';
  return {response:manual,linked};
}
function labRiskCurrent(r){
  const {response}=labRiskStatus(r);
  if(response==='SI')return 0;
  if(response==='NO')return Number(r.riesgo)||0;
  return null;
}
function labRiskCurrentLevel(r){
  const v=labRiskCurrent(r);if(v===null)return 'Pendiente';if(v===0)return 'Sin riesgo';return r.nivel||'—';
}
function labRiskResponseText(v){return ({SI:'Cumple',NO:'No cumple',NA:'No aplica',NE:'No evaluado'})[v]||'Pendiente'}
function labRiskClass(r){
  const v=labRiskCurrent(r);if(v===null||v===0)return 'risk-zero';
  const lvl=labNormText(r.nivel);if(lvl.includes('crit'))return 'risk-critical';if(lvl.includes('alto'))return 'risk-high';if(lvl.includes('moder'))return 'risk-moderate';return 'risk-low';
}
function labRiskProcessData(){
  const rows=window.LAB_RISK_MATRIX||[], names=['PREANALÍTICO','ANALÍTICO','POSTANALÍTICO','APOYO'];
  return names.map(name=>{
    const pr=rows.filter(r=>r.proceso===name), vals=pr.map(labRiskCurrent).filter(v=>v!==null), positives=vals.filter(v=>v>0);
    return {name,total:positives.reduce((a,b)=>a+b,0),avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,max:vals.length?Math.max(...vals):0,evaluated:vals.length,findings:positives.length};
  });
}
function renderLabRiskDashboard(){
  const rows=window.LAB_RISK_MATRIX||[], evaluated=rows.filter(r=>labRiskCurrent(r)!==null), findings=rows.filter(r=>(labRiskCurrent(r)||0)>0);
  const total=findings.reduce((a,r)=>a+(labRiskCurrent(r)||0),0), max=findings.length?Math.max(...findings.map(r=>labRiskCurrent(r)||0)):0;
  const critical=findings.filter(r=>labNormText(r.nivel).includes('crit')).length;
  const process=labRiskProcessData(), highest=[...process].sort((a,b)=>b.total-a.total)[0];
  const k=document.getElementById('labRiskKpis');if(k)k.innerHTML=`<div class="kpi"><span>Requisitos evaluados</span><b>${evaluated.length}/${rows.length}</b></div><div class="kpi"><span>Hallazgos con riesgo</span><b>${findings.length}</b></div><div class="kpi"><span>Riesgo acumulado*</span><b>${total.toFixed(2)}</b></div><div class="kpi"><span>Riesgo máximo</span><b>${max.toFixed(2)}</b></div><div class="kpi"><span>Críticos*</span><b>${critical}</b></div>`;
  const chart=document.getElementById('labRiskProcessChart');
  if(chart){const mx=Math.max(1,...process.map(x=>x.total));chart.innerHTML=process.map(x=>`<div class="lab-process-row"><div class="lab-process-label"><b>${esc(x.name)}</b><span>${x.findings} hallazgo(s) · ${x.evaluated} evaluado(s)</span></div><div class="lab-process-track"><div class="lab-process-bar" style="width:${Math.max(0,x.total/mx*100).toFixed(1)}%"></div></div><div class="lab-process-value">${x.total.toFixed(2)}</div></div>`).join('')+(evaluated.length?`<div class="small lab-chart-note">Mayor riesgo acumulado actual: <b>${esc(highest.name)}</b>.</div>`:'<div class="notice">Todavía no hay respuestas suficientes para construir el gráfico.</div>');}
  const heat=document.getElementById('labRiskHeatmap');
  if(heat){const top=[...findings].sort((a,b)=>(labRiskCurrent(b)||0)-(labRiskCurrent(a)||0)).slice(0,12);heat.innerHTML=top.length?top.map(r=>`<div class="lab-heat-row ${labRiskClass(r)}"><span class="lab-heat-id">${esc(r.id)}</span><span class="lab-heat-item">${esc(r.item)}</span><b>${(labRiskCurrent(r)||0).toFixed(2)}</b></div>`).join(''):'<div class="notice">Los hallazgos aparecerán aquí cuando se registren respuestas NO.</div>';}
}

function renderLabPanel(){
  ensureLabState();renderLabStats();const m=labAreaMetrics();
  const panelExec=document.getElementById('labPanelExecutiveSummary');if(panelExec)panelExec.textContent=labExecutiveText();
  const panelAct=document.getElementById('labPanelActSummary');if(panelAct)panelAct.textContent=labActText();
  const pct=m.total?Math.round(m.answered/m.total*100):0;const interview=labState.interview||{},hasInterview=Boolean(interview.interviewees||interview.summary||interview.roles);
  const k=document.getElementById('labPanelKpis');if(k)k.innerHTML=`<div class="kpi"><span>Desvíos</span><b>${m.dev}</b></div><div class="kpi"><span>Cumplimiento</span><b>${(m.compliance*100).toFixed(1)}%</b></div><div class="kpi"><span>Bajo</span><b>${m.low}</b></div><div class="kpi"><span>Moderado</span><b>${m.mod}</b></div><div class="kpi"><span>Alto/Crítico</span><b>${m.high}</b></div><div class="kpi"><span>IIRS</span><b>${m.iirs.toFixed(2)}</b></div>`;
  const p=document.getElementById('labPanelProgress');if(p)p.innerHTML=`<div class="lab-progress-track"><div class="lab-progress-fill" style="width:${pct}%"></div></div><p class="small">${m.answered} de ${m.total} requisitos con respuesta · ${m.active} requisitos aplicables al cálculo consolidado.</p>`;
  const st=document.getElementById('labPanelStatus');if(st)st.innerHTML=`<p><b>Prestador:</b> ${esc(labState.meta.prestador||'Sin completar')}</p><p><b>Auditor/a:</b> ${esc(labState.meta.auditor||currentSessionUser?.displayName||'')}</p><p><b>Entrevistado/a:</b> ${esc(interview.interviewees||'Pendiente')}</p><p><b>Estado:</b> ${pct===100?'Guía completa':'Auditoría en curso'}</p><p><b>IIRS del Área Laboratorio:</b> ${esc(labIirsBadge(m.iirs))}</p>`;
}
function labExecutiveText(){const m=labAreaMetrics();return `La auditoría del Área Laboratorio registra ${m.active} requisitos aplicables, con un cumplimiento del ${(m.compliance*100).toFixed(1)} %. Se identificaron ${m.dev} desvíos: ${m.low} de riesgo bajo, ${m.mod} moderados y ${m.high} altos o críticos. El IIRS preliminar del Área Laboratorio es ${m.iirs.toFixed(2)} en la escala institucional de 0 a 5. La metodología específica de riesgo de Laboratorio continúa sujeta a validación técnica.`;}
function labActText(){const ds=labReportData();if(!ds.length)return 'LABORATORIO: no se registraron desvíos para incorporar al acta.';return `LABORATORIO: se identificaron ${ds.length} desvíos. ${ds.slice(0,5).map(d=>d.deviation||d.item).join(' ')}`;}
function renderLabSummary(){const e=document.getElementById('labExecutiveSummary'),a=document.getElementById('labActSummary');if(e)e.textContent=labExecutiveText();if(a)a.textContent=labActText();}
function labCopyText(id){const t=document.getElementById(id)?.textContent||'';navigator.clipboard?.writeText(t).then(()=>alert('Texto copiado.')).catch(()=>prompt('Copie el texto:',t));}
function labPlanFor(code){return labState.plan[code]||{action:'',evidence:'',responsible:'',deadline:'',status:'PENDIENTE'};}
function labUpdatePlan(code,key,value){labState.plan[code]={...labPlanFor(code),[key]:value};saveLabState();}
function renderLabPlan(){const body=document.getElementById('labPlanRows');if(!body)return;const ds=labReportData();body.innerHTML=ds.length?ds.map(d=>{const p=labPlanFor(d.code),item=(window.LAB_GUIDE_ITEMS||[]).find(i=>i.code===d.code),risk=item?labItemIIRS(item):3;return `<tr><td>${esc(d.code)}</td><td>${esc(d.deviation||'Pendiente de redacción')}</td><td>${risk}</td><td><textarea rows="2" onchange="labUpdatePlan('${esc(d.code)}','action',this.value)">${esc(p.action)}</textarea></td><td><textarea rows="2" onchange="labUpdatePlan('${esc(d.code)}','evidence',this.value)">${esc(p.evidence)}</textarea></td><td><input value="${esc(p.responsible)}" onchange="labUpdatePlan('${esc(d.code)}','responsible',this.value)"></td><td><input value="${esc(p.deadline)}" onchange="labUpdatePlan('${esc(d.code)}','deadline',this.value)"></td><td><select onchange="labUpdatePlan('${esc(d.code)}','status',this.value)">${['PENDIENTE','EN PROCESO','CUMPLIDO','VERIFICADO'].map(x=>`<option ${p.status===x?'selected':''}>${x}</option>`).join('')}</select></td></tr>`}).join(''):'<tr><td colspan="8">No hay desvíos para incorporar al plan de mejora.</td></tr>';}
function renderLabInterview(){
  ensureLabState();if(!labState.interview.auditors)labState.interview.auditors=labState.meta.auditor||currentSessionUser?.displayName||'';
  document.querySelectorAll('[data-lab-interview]').forEach(el=>{const k=el.dataset.labInterview;if(document.activeElement!==el)el.value=labState.interview[k]||'';el.oninput=()=>{labState.interview[k]=el.value;saveLabState();};});
}
function labSaveInterview(){document.querySelectorAll('[data-lab-interview]').forEach(el=>labState.interview[el.dataset.labInterview]=el.value);saveLabState();renderLabPanel();alert('Entrevista de Laboratorio guardada.')}
function labClearInterview(){if(!confirm('¿Limpiar el registro de entrevista de Laboratorio?'))return;labState.interview={...labDefaultState().interview,auditors:labState.meta.auditor||currentSessionUser?.displayName||''};saveLabState();renderLabInterview();}
function labPolar(cx,cy,r,a){const x=cx+r*Math.cos((a-90)*Math.PI/180),y=cy+r*Math.sin((a-90)*Math.PI/180);return [x,y]}
function labArcPath(cx,cy,r0,r1,a0,a1){const p1=labPolar(cx,cy,r1,a0),p2=labPolar(cx,cy,r1,a1),p3=labPolar(cx,cy,r0,a1),p4=labPolar(cx,cy,r0,a0),large=(a1-a0)>180?1:0;return `M${p1[0]},${p1[1]} A${r1},${r1} 0 ${large} 1 ${p2[0]},${p2[1]} L${p3[0]},${p3[1]} A${r0},${r0} 0 ${large} 0 ${p4[0]},${p4[1]} Z`;}
function renderLabSunburst(){
  const host=document.getElementById('labRiskSunburst');if(!host)return;const rows=window.LAB_RISK_MATRIX||[];
  const procNames=[...new Set(rows.map(r=>r.proceso).filter(Boolean))];let current='';const normalized=rows.map(r=>{if(r.proceso)current=r.proceso;return {...r,_proc:current,_risk:labRiskCurrent(r)||0}});
  const colors={'PREANALÍTICO':'#8db8ee','ANALÍTICO':'#ef8d84','POSTANALÍTICO':'#a9d77b','APOYO':'#b9a0dc'};
  const totalWeight=normalized.reduce((a,r)=>a+Math.max(r._risk,0.15),0)||1;let angle=0;const cx=250,cy=250;let paths=[];
  for(const proc of procNames){const pr=normalized.filter(r=>r._proc===proc),pw=pr.reduce((a,r)=>a+Math.max(r._risk,0.15),0),pa0=angle,pa1=angle+360*pw/totalWeight;paths.push(`<path d="${labArcPath(cx,cy,55,120,pa0,pa1)}" fill="${colors[proc]||'#9fb3c8'}" fill-opacity=".75" stroke="white" stroke-width="2"><title>${esc(proc)}</title></path>`);
    let sa=pa0;const subs=[...new Set(pr.map(r=>r.subproceso))];for(const sub of subs){const sr=pr.filter(r=>r.subproceso===sub),sw=sr.reduce((a,r)=>a+Math.max(r._risk,0.15),0),s1=sa+360*sw/totalWeight;paths.push(`<path d="${labArcPath(cx,cy,122,185,sa,s1)}" fill="${colors[proc]||'#9fb3c8'}" fill-opacity=".55" stroke="white" stroke-width="1.5" class="lab-sun-segment" onclick="labSunDetail('${String(proc).replace(/'/g,"\'")}','${String(sub).replace(/'/g,"\'")}','',${sr.reduce((a,r)=>a+r._risk,0).toFixed(2)})"><title>${esc(proc)} · ${esc(sub)}</title></path>`);let ia=sa;for(const r of sr){const iw=Math.max(r._risk,0.15),i1=ia+360*iw/totalWeight;const opacity=r._risk>0?.88:.22;paths.push(`<path d="${labArcPath(cx,cy,187,238,ia,i1)}" fill="${colors[proc]||'#9fb3c8'}" fill-opacity="${opacity}" stroke="white" stroke-width="1" class="lab-sun-segment" onclick="labSunDetail('${String(proc).replace(/'/g,"\'")}','${String(sub).replace(/'/g,"\'")}','${String(r.item).replace(/'/g,"\'")}',${r._risk.toFixed(2)})"><title>${esc(r.item)} · Riesgo actual ${r._risk.toFixed(2)}</title></path>`);ia=i1;}sa=s1;}angle=pa1;}
  host.innerHTML=`<svg viewBox="0 0 500 500" role="img" aria-label="Mapa circular dinámico de riesgo de Laboratorio">${paths.join('')}<circle cx="250" cy="250" r="52" fill="white"/><text x="250" y="244" text-anchor="middle" font-size="15" font-weight="700" fill="#17394c">LABORATORIO</text><text x="250" y="266" text-anchor="middle" font-size="12" fill="#667085">Riesgo dinámico</text></svg><div class="lab-sun-legend">${procNames.map(p=>`<span><i style="background:${colors[p]||'#9fb3c8'}"></i>${esc(p)}</span>`).join('')}</div>`;
}
function labSunDetail(proc,sub,item,risk){const el=document.getElementById('labSunburstDetail');if(el)el.innerHTML=`<b>${esc(proc)}</b>${sub?' · '+esc(sub):''}${item?' · '+esc(item):''} — Riesgo actual: <b>${Number(risk).toFixed(2)}</b>`;}

function labSetRiskManual(id,value){
  ensureLabState();labState.riskManual[id]=value;saveLabState();renderLabRiskMatrix();
}
function renderLabRiskMatrix(){
  const body=document.getElementById('labRiskRows');if(!body)return;
  const rows=window.LAB_RISK_MATRIX||[];
  body.innerHTML=rows.map(r=>{
    const st=labRiskStatus(r), current=labRiskCurrent(r), linked=st.linked;
    const response=st.response||'';
    const responseUi=linked?`<div class="lab-risk-response"><b>${esc(labRiskResponseText(response))}</b><span>Guía: ${esc(linked.code)}</span></div>`:`<select class="lab-risk-manual" onchange="labSetRiskManual(${Number(r.id)},this.value)"><option value="" ${!response?'selected':''}>Pendiente</option><option value="SI" ${response==='SI'?'selected':''}>Cumple</option><option value="NO" ${response==='NO'?'selected':''}>No cumple</option><option value="NA" ${response==='NA'?'selected':''}>No aplica</option><option value="NE" ${response==='NE'?'selected':''}>No evaluado</option></select>`;
    return `<tr class="${labRiskClass(r)}"><td>${esc(r.id)}</td><td>${esc(r.proceso)}</td><td>${esc(r.subproceso)}</td><td>${esc(r.area)}</td><td>${esc(r.item)}</td><td>${esc(r.normativa)}</td><td>${responseUi}</td><td>${esc(r.incumplimiento)}</td><td>${esc(r.impacto)}</td><td>${esc(r.peso)}</td><td>${Number(r.riesgo).toFixed(2)}</td><td><b>${current===null?'—':current.toFixed(2)}</b></td><td>${esc(labRiskCurrentLevel(r))}</td><td>${esc(current&&current>0?r.criticidad:'—')}</td></tr>`;
  }).join('');
  renderLabRiskDashboard();renderLabSunburst();
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
  root.innerHTML=`<div class="lab-report-sheet"><h2>Laboratorio · Informe de Auditoría</h2>
    <p><b>Prestador:</b> ${esc(labState.meta.prestador||'—')} &nbsp; <b>CUIT:</b> ${esc(labState.meta.cuit||'—')}</p>
    <p><b>Provincia:</b> ${esc(labState.meta.province||'—')} &nbsp; <b>UGL:</b> ${esc(labState.meta.ugl||'—')} &nbsp; <b>Fecha:</b> ${esc(labState.meta.date||'—')}</p>
    <p><b>Auditor/a:</b> ${esc(labState.meta.auditor||currentSessionUser?.displayName||'—')}</p>
    <h3>Resumen ejecutivo</h3><p>${esc(labExecutiveText())}</p><h3>Síntesis para el acta</h3><p>${esc(labActText())}</p><h3>Desvíos seleccionados (${ds.length})</h3>
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
