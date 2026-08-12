// SIAPE GAP V3.4.20 · Matriz de Riesgo de Laboratorio
// Adaptación funcional del dashboard Sunburst aportado por el usuario.
// Se alimenta de los hallazgos NO de la auditoría de Laboratorio.
// Impacto = criticidad base de la guía (1–5). Probabilidad = estimación editable por el auditor (1–5).
// La matriz es complementaria y no modifica automáticamente el IIRS.

function defaultLabRisk(){return {probabilities:{},includeInReport:true}}
let labRiskHighlight='';

const LAB_RISK_CATEGORY_COLORS={
  'RECURSOS HUMANOS':'#123d5a',
  'CAPACIDAD OPERATIVA':'#1b8f91',
  'BIOSEGURIDAD':'#d09a21',
  'BACTERIOLOGÍA':'#527aa3',
  'TRANSVERSAL':'#7b8790'
};
const LAB_RISK_BAND_COLORS={bajo:'#1b8f91',medio:'#d09a21',alto:'#d66a24',critico:'#b42318'};

function labRiskBand(score){
  score=Number(score)||0;
  if(score>=16)return {key:'critico',label:'CRÍTICO',min:16,max:25};
  if(score>=10)return {key:'alto',label:'ALTO',min:10,max:15};
  if(score>=5)return {key:'medio',label:'MEDIO',min:5,max:9};
  return {key:'bajo',label:'BAJO',min:1,max:4};
}
function labRiskSuggestedProbability(item){
  const f=Number(item?.historicalFrequency);
  if(!Number.isFinite(f))return 1;
  if(f>=40)return 5;
  if(f>=30)return 4;
  if(f>=15)return 3;
  if(f>=5)return 2;
  return 1;
}
function labRiskProbability(item,st=state){
  const raw=Number(st?.labRisk?.probabilities?.[item.code]);
  return raw>=1&&raw<=5?raw:labRiskSuggestedProbability(item);
}
function labRiskCategory(item){
  const d=String(item?.domain||'').toUpperCase();
  const p=String(item?.process||'').toUpperCase();
  if(d.includes('RECURSOS HUMANOS'))return 'RECURSOS HUMANOS';
  if(d.includes('BACTERIOLOG'))return 'BACTERIOLOGÍA';
  if(d.includes('BIOSEGURIDAD'))return 'BIOSEGURIDAD';
  if(['PREANALÍTICO','ANALÍTICO','POSTANALÍTICO'].includes(p))return 'CAPACIDAD OPERATIVA';
  return 'TRANSVERSAL';
}
function labRiskIsApplicableForState(item,st){
  if(st?.enabled?.Laboratorio===false)return false;
  const level=String(st?.meta?.level||'III');
  return String(item?.levels||'I, II, III, IV').includes(level);
}
function labRiskEntriesForState(st=state){
  const probabilities=st?.labRisk?.probabilities||{};
  return LAB_ITEMS.filter(i=>labRiskIsApplicableForState(i,st)&&st?.answers?.[i.code]?.response==='NO').map(i=>{
    const impact=Math.max(1,Math.min(5,Number(i.score)||1));
    const stored=Number(probabilities[i.code]);
    const probability=stored>=1&&stored<=5?stored:labRiskSuggestedProbability(i);
    const score=impact*probability;
    return {item:i,code:i.code,title:i.item,domain:i.domain,process:i.process||'APOYO',subprocess:i.subprocess||i.domain,category:labRiskCategory(i),impact,probability,score,band:labRiskBand(score),historicalFrequency:i.historicalFrequency,historicalCount:i.historicalCount};
  });
}
function labRiskEntries(){return labRiskEntriesForState(state)}
function labRiskSummaryForState(st=state){
  const entries=labRiskEntriesForState(st);
  if(!entries.length)return {count:0,average:null,max:null,high:0,critical:0,band:null};
  const average=entries.reduce((s,x)=>s+x.score,0)/entries.length;
  const max=Math.max(...entries.map(x=>x.score));
  return {count:entries.length,average,max,high:entries.filter(x=>x.score>=10).length,critical:entries.filter(x=>x.score>=16).length,band:labRiskBand(max)};
}
function updateLabRiskProbability(code,value){
  state.labRisk=state.labRisk||defaultLabRisk();state.labRisk.probabilities=state.labRisk.probabilities||{};
  const v=Math.max(1,Math.min(5,Number(value)||1));state.labRisk.probabilities[code]=v;markDirty();
  const item=LAB_ITEMS.find(i=>i.code===code),impact=Math.max(1,Math.min(5,Number(item?.score)||1)),score=v*impact,band=labRiskBand(score);
  const p=document.getElementById(`lab-risk-p-${code}`),s=document.getElementById(`lab-risk-score-${code}`),card=document.getElementById(`lab-risk-card-${code}`);
  if(p)p.textContent=`P:${v}`;if(s){s.textContent=score;s.className=`lab-risk-score risk-${band.key}`;}if(card)card.dataset.band=band.key;
  renderLabRiskVisuals();
}
function resetLabRiskProbability(code){
  state.labRisk=state.labRisk||defaultLabRisk();state.labRisk.probabilities=state.labRisk.probabilities||{};delete state.labRisk.probabilities[code];markDirty();renderLabRisk();
}
function updateLabRiskInclude(v){state.labRisk=state.labRisk||defaultLabRisk();state.labRisk.includeInReport=!!v;markDirty()}
function toggleLabRiskHighlight(key){labRiskHighlight=labRiskHighlight===key?'':key;renderLabRisk()}

function labRiskKpiHtml(entries){
  const s=labRiskSummaryForState(state);
  return [
    ['Hallazgos NO',s.count],['Riesgo promedio',s.average==null?'—':s.average.toFixed(1)+'/25'],['Riesgo máximo',s.max==null?'—':s.max+'/25'],['Alto/Crítico',s.high],['Críticos',s.critical]
  ].map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
}
function labRiskCardHtml(x){
  const suggested=labRiskSuggestedProbability(x.item),selected=!labRiskHighlight||x.band.key===labRiskHighlight;
  const hist=x.historicalFrequency==null?'Sin antecedente de frecuencia asociado':`Antecedente 2025: ${Number(x.historicalFrequency).toFixed(1).replace('.',',')} % (${x.historicalCount}/46)`;
  return `<article id="lab-risk-card-${x.code}" data-band="${x.band.key}" class="lab-risk-card ${selected?'':'dimmed'}">
    <div class="lab-risk-card-head"><div><div class="lab-risk-meta">${esc(x.category)} · ${esc(x.process)} · Impacto ${x.impact}/5</div><div class="lab-risk-title">${esc(x.code)} · ${esc(x.title)}</div></div><span id="lab-risk-score-${x.code}" class="lab-risk-score risk-${x.band.key}">${x.score}</span></div>
    <div class="lab-risk-slider-row"><input type="range" min="1" max="5" step="1" value="${x.probability}" oninput="updateLabRiskProbability('${x.code}',this.value)"><span id="lab-risk-p-${x.code}" class="lab-risk-prob">P:${x.probability}</span></div>
    <div class="small">${esc(hist)} · Probabilidad sugerida inicial: ${suggested}/5.</div>
    <button class="secondary lab-risk-reset" type="button" onclick="resetLabRiskProbability('${x.code}')">Restaurar probabilidad sugerida</button>
  </article>`;
}
function labRiskCategoryRows(entries){
  const groups=[...new Set(entries.map(x=>x.category))].map(category=>{
    const arr=entries.filter(x=>x.category===category),avg=arr.reduce((s,x)=>s+x.score,0)/arr.length,max=Math.max(...arr.map(x=>x.score));
    return {category,count:arr.length,avg,max,high:arr.filter(x=>x.score>=10).length};
  }).sort((a,b)=>b.max-a.max||b.avg-a.avg);
  return groups.map(x=>`<tr><td>${esc(x.category)}</td><td>${x.count}</td><td>${x.avg.toFixed(1)}</td><td>${x.max}</td><td>${x.high}</td><td><span class="lab-risk-pill risk-${labRiskBand(x.max).key}">${labRiskBand(x.max).label}</span></td></tr>`).join('')||'<tr><td colspan="6">Sin hallazgos NO para calcular riesgo.</td></tr>';
}

function labRiskPolar(cx,cy,r,deg){const a=(deg-90)*Math.PI/180;return {x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}}
function labRiskArcPath(cx,cy,r0,r1,start,end){
  if(end-start>=359.999)end=start+359.999;
  const a=labRiskPolar(cx,cy,r1,start),b=labRiskPolar(cx,cy,r1,end),c=labRiskPolar(cx,cy,r0,end),d=labRiskPolar(cx,cy,r0,start),large=end-start>180?1:0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r1} ${r1} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} L ${c.x.toFixed(2)} ${c.y.toFixed(2)} A ${r0} ${r0} 0 ${large} 0 ${d.x.toFixed(2)} ${d.y.toFixed(2)} Z`;
}
function labRiskHexToRgba(hex,alpha){let h=String(hex).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`}
function labRiskSunburstSvg(entries){
  if(!entries.length)return '<div class="lab-risk-empty"><b>Sin desvíos de Laboratorio.</b><br>La matriz se construye automáticamente cuando la guía contiene respuestas NO.</div>';
  const cx=260,cy=260,total=entries.length;let angle=-90,paths=[];
  const categories=[...new Set(entries.map(x=>x.category))];
  categories.forEach(cat=>{
    const catEntries=entries.filter(x=>x.category===cat),catStart=angle,catSpan=360*catEntries.length/total,catEnd=catStart+catSpan,color=LAB_RISK_CATEGORY_COLORS[cat]||'#64748b';
    const catMatch=!labRiskHighlight||catEntries.some(x=>x.band.key===labRiskHighlight);
    paths.push(`<path d="${labRiskArcPath(cx,cy,74,126,catStart,catEnd)}" fill="${color}" opacity="${catMatch?'.95':'.15'}"><title>${esc(cat)} · ${catEntries.length} hallazgo(s)</title></path>`);
    const subs=[...new Set(catEntries.map(x=>x.domain))];let subAngle=catStart;
    subs.forEach(sub=>{
      const subEntries=catEntries.filter(x=>x.domain===sub),subSpan=360*subEntries.length/total,subEnd=subAngle+subSpan,subMatch=!labRiskHighlight||subEntries.some(x=>x.band.key===labRiskHighlight);
      paths.push(`<path d="${labRiskArcPath(cx,cy,130,181,subAngle,subEnd)}" fill="${labRiskHexToRgba(color,subMatch ? .62 : .10)}" stroke="#fff" stroke-width="1"><title>${esc(sub)} · ${subEntries.length} hallazgo(s)</title></path>`);
      let itemAngle=subAngle;
      subEntries.forEach(x=>{const span=360/total,end=itemAngle+span,match=!labRiskHighlight||x.band.key===labRiskHighlight,rc=LAB_RISK_BAND_COLORS[x.band.key];paths.push(`<path d="${labRiskArcPath(cx,cy,185,235,itemAngle,end)}" fill="${rc}" opacity="${match?'.95':'.10'}" stroke="#fff" stroke-width="1"><title>${esc(x.code)} · Score ${x.score}/25 · ${esc(x.band.label)} · ${esc(x.title)}</title></path>`);itemAngle=end;});
      subAngle=subEnd;
    });
    angle=catEnd;
  });
  const s=labRiskSummaryForState(state),center=s.max==null?'—':s.max;
  return `<svg class="lab-risk-sunburst" viewBox="0 0 520 520" role="img" aria-label="Matriz radial de riesgo de Laboratorio">${paths.join('')}<circle cx="260" cy="260" r="68" fill="#f7fafc" stroke="#ccd9e0"/><text x="260" y="248" text-anchor="middle" class="lab-risk-svg-small">RIESGO MÁXIMO</text><text x="260" y="282" text-anchor="middle" class="lab-risk-svg-score">${center}/25</text></svg>`;
}
function renderLabRiskVisuals(){
  const entries=labRiskEntries(),k=document.getElementById('labRiskKpis');if(k)k.innerHTML=labRiskKpiHtml(entries);
  const chart=document.getElementById('labRiskSunburst');if(chart)chart.innerHTML=labRiskSunburstSvg(entries);
  const rows=document.getElementById('labRiskCategoryRows');if(rows)rows.innerHTML=labRiskCategoryRows(entries);
  document.querySelectorAll('[data-lab-risk-filter]').forEach(b=>b.classList.toggle('active',b.dataset.labRiskFilter===labRiskHighlight));
  document.querySelectorAll('.lab-risk-card[data-band]').forEach(c=>c.classList.toggle('dimmed',!!labRiskHighlight&&c.dataset.band!==labRiskHighlight));
}
function renderLabRisk(){
  state.labRisk={...defaultLabRisk(),...(state.labRisk||{})};state.labRisk.probabilities={...(state.labRisk.probabilities||{})};
  const entries=labRiskEntries(),cards=document.getElementById('labRiskCards');if(cards)cards.innerHTML=entries.length?entries.map(labRiskCardHtml).join(''):'<div class="notice"><b>No hay desvíos de Laboratorio todavía.</b><br>Complete la guía. Cada respuesta NO se incorporará automáticamente a esta matriz.</div>';
  const inc=document.getElementById('labRiskIncludeReport');if(inc)inc.checked=state.labRisk.includeInReport!==false;
  renderLabRiskVisuals();
}

function labRiskReportBlock(){
  if(state.labRisk?.includeInReport===false)return '';
  const entries=labRiskEntries();if(!entries.length)return '';
  const s=labRiskSummaryForState(state);
  const rows=entries.slice().sort((a,b)=>b.score-a.score).map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.category)}</td><td>${esc(x.process)}</td><td>${x.probability}</td><td>${x.impact}</td><td>${x.score}</td><td>${esc(x.band.label)}</td></tr>`).join('');
  return `<section class="report-section"><h1>3.1 MATRIZ COMPLEMENTARIA DE RIESGO - LABORATORIO</h1><p>La matriz se genera únicamente con los hallazgos marcados NO. El impacto corresponde a la criticidad de referencia de la guía (1–5) y la probabilidad es estimada por el auditor (1–5). Score = Probabilidad × Impacto. Esta evaluación complementa el análisis y no modifica automáticamente el IIRS.</p><table><thead><tr><th>Código</th><th>Categoría</th><th>Proceso</th><th>Prob.</th><th>Impacto</th><th>Score</th><th>Nivel</th></tr></thead><tbody>${rows}</tbody></table><p><b>Riesgo promedio:</b> ${s.average.toFixed(1)}/25 · <b>Riesgo máximo:</b> ${s.max}/25 (${esc(s.band?.label||'')}) · <b>Hallazgos altos/críticos:</b> ${s.high} · <b>Críticos:</b> ${s.critical}.</p></section>`;
}
function labRiskMapSummaryHtml(summary){
  if(!summary||!summary.count)return '';
  return `<h3>Matriz de riesgo de Laboratorio</h3><div class="map-lab-risk"><b>Máximo:</b> ${summary.max}/25 · ${esc(summary.band?.label||'')}<br><b>Promedio:</b> ${summary.average.toFixed(1)}/25 · <b>Altos/críticos:</b> ${summary.high} · <b>Críticos:</b> ${summary.critical}</div>`;
}
