import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app=express();
app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use(express.static("."));
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

app.get('/api/health',(req,res)=>res.json({ok:true}));
app.post('/api/siape-ai',async(req,res)=>{
 try{
  if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'Falta configurar OPENAI_API_KEY en la PC servidor.'});
  const {task='full',audit}=req.body||{};
  if(!audit?.deviations?.length)return res.status(400).json({error:'No se recibieron desvíos para analizar.'});
  const instructions=`Sos un asistente técnico para auditoría prestacional sanitaria argentina. Trabajá exclusivamente con los datos recibidos. No inventes hallazgos ni normativa. Redactá en español institucional. El resumen ejecutivo debe reflejar áreas, criticidad y dominios reales. La síntesis para el acta debe estar separada por área, unificar desvíos semejantes y tener máximo 50 palabras por área. La conclusión debe explicar riesgo, impacto y prioridad sin repetir el resumen. Devolvé SOLO JSON válido con estas claves: executive, act, conclusion, inconsistencies, priorities.`;
  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||'gpt-5',
   instructions,
   input:JSON.stringify({task,audit})
  });
  let parsed;
  try{parsed=JSON.parse(response.output_text);}catch{parsed={display:response.output_text};}
  res.json(parsed);
 }catch(e){res.status(500).json({error:e?.message||'Error del servidor IA'});}
});
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`SIAPE IA disponible en http://0.0.0.0:${port}`));
