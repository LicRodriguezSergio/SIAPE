// SIAPE GAP V3.4.25 · Módulo Área Imágenes · Navegación estable entre guías
const IMG_SUBGUIDES=[...new Set((typeof IMAGENES_ITEMS!=='undefined'?IMAGENES_ITEMS:[]).map(i=>i.subguide).filter(Boolean))];
window.currentImgSubguide=IMG_SUBGUIDES[0]||'';
function defaultImagesInterview(){return {date:new Date().toISOString().slice(0,10),time:'',place:'',area:'Imágenes',interviewees:'',auditors:'',summary:'',documents:'',commitments:'',additional:'',auditorNotes:'',includeInReport:true}}
function imgItems(){return ITEMS.filter(i=>i.service==='Imágenes'&&state.enabled['Imágenes']!==false&&applicable(i))}
function imgGuideItems(guide=window.currentImgSubguide){return imgItems().filter(i=>!guide||i.subguide===guide)}
function imgDeviations(){return imgItems().filter(i=>answerFor(i.code).response==='NO')}
function imgStats(items=imgItems()){
 const evaluated=items.filter(i=>['SI','NO'].includes(answerFor(i.code).response)),yes=evaluated.filter(i=>answerFor(i.code).response==='SI').length,dev=evaluated.filter(i=>answerFor(i.code).response==='NO');
 return {active:items.length,evaluated:evaluated.length,dev:dev.length,high:dev.filter(i=>Number(i.score)>=4).length,compliance:evaluated.length?yes/evaluated.length:0,index:iirsForItems(items,answerFor)};
}
function selectImgSubguide(g){
 if(!IMG_SUBGUIDES.includes(g))return;
 window.currentImgSubguide=g;
 const d=document.getElementById('imgDomainFilter'),m=document.getElementById('imgModalityFilter');
 if(d)d.value='';
 if(m)m.value='';
 renderImgAudit();
}
window.selectImgSubguide=selectImgSubguide;
function renderImgGuideTabs(){
 const tabs=document.getElementById('imgGuideTabs');
 if(!tabs)return;
 tabs.replaceChildren();
 IMG_SUBGUIDES.forEach(g=>{
  const b=document.createElement('button');
  b.type='button';
  b.className='service-tab'+(g===window.currentImgSubguide?' active':'');
  b.textContent=`${g} (${imgItems().filter(i=>i.subguide===g).length})`;
  b.addEventListener('click',()=>selectImgSubguide(g));
  tabs.appendChild(b);
 });
}
function renderImgAudit(){
 if(!IMG_SUBGUIDES.includes(window.currentImgSubguide))window.currentImgSubguide=IMG_SUBGUIDES[0]||'';
 renderImgGuideTabs();
 const q=(document.getElementById('imgSearch')?.value||'').toLowerCase(),dsel=document.getElementById('imgDomainFilter'),msel=document.getElementById('imgModalityFilter');
 const domain=dsel?.value||'',modality=msel?.value||'',base=imgGuideItems();
 const domains=[...new Set(base.map(i=>i.domain).filter(Boolean))],modalities=[...new Set(base.map(i=>i.modality).filter(Boolean))];
 if(dsel)dsel.innerHTML='<option value="">Todos los dominios</option>'+domains.map(x=>`<option ${x===domain?'selected':''}>${esc(x)}</option>`).join('');
 if(msel)msel.innerHTML='<option value="">Todas las modalidades</option>'+modalities.map(x=>`<option ${x===modality?'selected':''}>${esc(x)}</option>`).join('');
 const arr=base.filter(i=>(!q||(`${i.code} ${i.item} ${i.domain} ${i.modality||''} ${i.subguide||''}`).toLowerCase().includes(q))&&(!domain||i.domain===domain)&&(!modality||i.modality===modality));
 const all=imgStats(),sel=imgStats(base),k=document.getElementById('imgKpis');
 if(k)k.innerHTML=[['Guías',IMG_SUBGUIDES.length],['Evaluados área',all.evaluated],['Desvíos área',all.dev],['Evaluados guía',sel.evaluated],['Cumplimiento guía',(sel.compliance*100).toFixed(1)+'%'],['IIRS área',all.index.value==null?'—':all.index.value.toFixed(2)]].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 const host=document.getElementById('imgAuditList');if(!host)return;
 host.innerHTML=arr.map(i=>{const a=answerFor(i.code),tech=technicalFor(i);return `<div class="card audit-card ${String(a.response||'').toLowerCase().replace(/ /g,'-')}">
  <div class="audit-head"><div><div class="itemtitle">${esc(i.code)} · ${esc(i.item)}</div><div class="meta">${esc(i.modality||i.subguide)} · ${esc(i.domain)} · ${esc(i.sourceRef||'Guía de Imágenes')} · <span class="badge b${i.score}">${esc(i.criticality||riskLabel(i.score))} · ${i.score}</span></div></div></div>
  ${i.contextNote?`<div class="notice"><b>Condición de aplicación:</b> ${esc(i.contextNote)}</div>`:''}
  <div class="responses">${['SI','NO','NA','NO EVALUADO'].map(r=>`<button class="resp ${a.response===r?'sel':''}" onclick="setResp('${i.code}','${r}')">${r==='NA'?'NO APLICA':r}</button>`).join('')}</div>
  <label>Observación y evidencia</label><textarea oninput="setObs('${i.code}',this.value)" placeholder="Describa lo observado, documentación revisada, registros y evidencia directa...">${esc(a.obs)}</textarea>
  <div class="photo-tools no-print"><label class="secondary photo-button">📷 Tomar foto<input class="hide" type="file" accept="image/*" capture="environment" onchange="addEvidencePhotos('${i.code}',this.files)"></label><label class="secondary photo-button">🖼 Elegir fotos<input class="hide" type="file" accept="image/*" multiple onchange="addEvidencePhotos('${i.code}',this.files)"></label><button class="secondary" onclick="openEvidenceGallery('${i.code}')">Ver fotos <span id="photo-count-${i.code}">0</span></button></div><div id="photo-preview-${i.code}" class="photo-preview"></div>
  ${a.response==='NO'?technicalEditorBlock(i,tech,false):''}
 </div>`}).join('')||'<div class="notice">No hay requisitos de Imágenes con los filtros seleccionados.</div>';
 refreshVisiblePhotoCounts();
}
function bindImagesInterview(){ensureState();document.querySelectorAll('[data-img-interview]').forEach(el=>{const k=el.dataset.imgInterview;if(el.type==='checkbox')el.checked=!!state.imagesInterview[k];else el.value=state.imagesInterview[k]||'';if(!el.dataset.bound){const fn=()=>{state.imagesInterview[k]=el.type==='checkbox'?el.checked:el.value;markDirty();const n=document.getElementById('imgInterviewSaved');if(n)n.textContent='Cambios pendientes · se autoguardarán cada 10 minutos'};el.addEventListener('input',fn);el.addEventListener('change',fn);el.dataset.bound='1'}})}
function imagesInterviewHasContent(){const x=state.imagesInterview||{};return ['place','interviewees','auditors','summary','documents','commitments','additional','auditorNotes'].some(k=>String(x[k]||'').trim())}
function imagesInterviewText(){const x=state.imagesInterview||{},parts=[];if(x.date||x.time)parts.push(`Fecha y hora: ${x.date||'Sin informar'}${x.time?' · '+x.time:''}`);if(x.place)parts.push(`Lugar / modalidad: ${x.place}`);if(x.interviewees)parts.push(`Personas entrevistadas: ${x.interviewees}`);if(x.auditors)parts.push(`Equipo auditor: ${x.auditors}`);if(x.summary)parts.push(`Síntesis: ${x.summary}`);if(x.documents)parts.push(`Documentación/evidencia: ${x.documents}`);if(x.commitments)parts.push(`Compromisos: ${x.commitments}`);if(x.additional)parts.push(`Datos adicionales: ${x.additional}`);if(x.auditorNotes)parts.push(`Observaciones del auditor: ${x.auditorNotes}`);return parts.join('\n\n')}
function copyImagesInterview(){const t=imagesInterviewText();if(!t)return alert('No hay datos de entrevista para copiar.');navigator.clipboard?.writeText(t).then(()=>alert('Registro de Imágenes copiado.')).catch(()=>prompt('Copie el registro:',t))}
function clearImagesInterview(){if(!confirm('¿Limpiar la entrevista del Área Imágenes?'))return;state.imagesInterview=defaultImagesInterview();save();bindImagesInterview()}
function renderImgDevs(){const body=document.getElementById('imgDevRows');if(!body)return;const ds=imgDeviations().sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code));body.innerHTML=ds.length?ds.map(i=>{const a=answerFor(i.code),t=finalTechnicalFor(i);return `<tr><td>${esc(i.code)}</td><td>${esc(i.subguide||'')}</td><td>${esc(i.modality||'')}</td><td>${esc(i.domain)}</td><td>${esc(t.deviation)}</td><td>${esc(a.obs||'')}</td><td>${esc(i.criticality||riskLabel(i.score))}</td><td>${esc(t.rec)}</td><td>${esc(t.resp)}</td><td>${esc(t.plazo)}</td></tr>`}).join(''):'<tr><td colspan="10">No hay desvíos de Imágenes cargados.</td></tr>'}
function renderImgPlan(){const body=document.getElementById('imgPlanRows');if(!body)return;const ds=imgDeviations().sort((a,b)=>b.score-a.score||a.code.localeCompare(b.code));body.innerHTML=ds.length?ds.map(i=>{const a=answerFor(i.code),t=finalTechnicalFor(i);return `<tr><td>${esc(i.code)}</td><td>${esc(i.subguide||'')}</td><td>${esc(t.deviation)}</td><td>${esc(t.rec)}</td><td>${esc(t.ev)}</td><td>${esc(t.resp)}</td><td>${esc(t.plazo)}</td><td><select onchange="setStatus('${i.code}',this.value)">${['PENDIENTE','EN PROCESO','CUMPLIDO','VERIFICADO'].map(x=>`<option ${a.status===x?'selected':''}>${x}</option>`).join('')}</select></td></tr>`}).join(''):'<tr><td colspan="8">No hay desvíos. El plan se genera automáticamente a partir de las respuestas NO.</td></tr>'}
function imgExecutiveText(){const s=imgStats();if(!s.evaluated)return 'El Área Imágenes todavía no cuenta con requisitos efectivamente evaluados.';const affected=IMG_SUBGUIDES.map(g=>({g,s:imgStats(imgItems().filter(i=>i.subguide===g))})).filter(x=>x.s.dev).sort((a,b)=>b.s.dev-a.s.dev).map(x=>x.g);return `La auditoría del Área Imágenes evaluó ${s.evaluated} requisitos, con un cumplimiento del ${(s.compliance*100).toFixed(1).replace('.',',')} %. Se identificaron ${s.dev} desvíos, de los cuales ${s.high} presentan criticidad alta o crítica. El IIRS del área es ${s.index.value==null?'sin datos':s.index.value.toFixed(2)}${s.index.band?` (${s.index.band.label})`:''}.${affected.length?` Los hallazgos se distribuyen principalmente en ${affected.join(', ')}.`:''}`}
function imgActSummary(){const ds=imgDeviations().sort((a,b)=>b.score-a.score);if(!ds.length)return 'No se registran desvíos de Imágenes conforme a las respuestas cargadas.';return ds.map(i=>`${i.code} (${i.subguide}): ${finalTechnicalFor(i).deviation}${answerFor(i.code).obs?' Observación: '+answerFor(i.code).obs:''}`).join(' ')}
function renderImgSummary(){const s=imgStats(),k=document.getElementById('imgSummaryKpis');if(k)k.innerHTML=[['Evaluados',s.evaluated],['Desvíos',s.dev],['Altos/críticos',s.high],['Cumplimiento',(s.compliance*100).toFixed(1)+'%'],['IIRS',s.index.value==null?'—':s.index.value.toFixed(2)]].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');const e=document.getElementById('imgExecText');if(e)e.textContent=imgExecutiveText();const a=document.getElementById('imgActText');if(a)a.textContent=imgActSummary();const body=document.getElementById('imgGuideSummaryRows');if(body)body.innerHTML=IMG_SUBGUIDES.map(g=>{const x=imgStats(imgItems().filter(i=>i.subguide===g));return x.evaluated?`<tr><td>${esc(g)}</td><td>${x.evaluated}</td><td>${x.dev}</td><td>${x.high}</td><td>${(x.compliance*100).toFixed(1)}%</td><td>${iirsBadge(x.index)}</td></tr>`:''}).join('')||'<tr><td colspan="6">Sin datos suficientes.</td></tr>'}
function renderImgNorms(){const body=document.getElementById('imgNormRows');if(!body)return;body.innerHTML=NORMS.filter(n=>n.service==='Imágenes').map(n=>`<tr><td>${esc(n.scope)}</td><td>${esc(n.number)}</td><td>${esc(n.regulation)}</td><td>${esc(n.authority)}</td><td>${esc(n.status)}</td></tr>`).join('')}
