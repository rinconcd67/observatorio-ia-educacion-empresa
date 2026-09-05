import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const countries='ARG BHS BRB BLZ BOL BRA CHL COL CRI DOM ECU SLV GTM GUY HTI HND JAM MEX NIC PAN PRY PER SUR TTO URY VEN'.split(' ');
export const metrics=[{id:'SE.XPD.TOTL.GD.ZS',es:'Gasto público en educación (% del PIB)',en:'Government education expenditure (% of GDP)'},{id:'SE.XPD.TOTL.GB.ZS',es:'Educación como % del gasto público total',en:'Education as % of total government expenditure'}];
export function normalizeFinance(rows){
 const seen=new Set();return rows.map(r=>{
  if(!countries.includes(r.countryiso3code)||!metrics.some(m=>m.id===r.indicator.id)||!/^20\d\d$/.test(r.date)||Number(r.date)>2025)throw Error('Unexpected finance series');
  if(r.value!==null&&(typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<0||r.value>100))throw Error('Invalid expenditure percentage');
  const key=[r.countryiso3code,r.date,r.indicator.id].join('|');if(seen.has(key))throw Error('Duplicate finance observation');seen.add(key);
  return {iso3:r.countryiso3code,country:r.country.value,year:Number(r.date),metric_id:r.indicator.id,value:r.value,unit:'percent',source_url:'https://data.worldbank.org/indicator/'+r.indicator.id+'?locations='+r.country.id};
 });
}
async function main(){
 const rows=[],runs=[];
 for(const metric of metrics){
  let expectedTotal=null,collected=0;
  for(let page=1;page<=20;page++){
   const url='https://api.worldbank.org/v2/country/'+countries.join(';')+'/indicator/'+metric.id+'?format=json&date=2000:2025&per_page=1000&page='+page;
   const res=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!res.ok)throw Error('World Bank HTTP '+res.status);
   const raw=await res.text(),body=JSON.parse(raw);if(!Array.isArray(body)||!Array.isArray(body[1])||!body[1].length)throw Error('Invalid finance response');
   const meta=body[0];if(Number(meta.page)!==page||Number(meta.pages)>20||Number(meta.total)<=0)throw Error('Invalid finance pagination');
   if(expectedTotal!==null&&expectedTotal!==Number(meta.total))throw Error('Finance total changed');expectedTotal=Number(meta.total);
   rows.push(...body[1]);collected+=body[1].length;runs.push({url,retrieved_at:new Date().toISOString(),sha256:createHash('sha256').update(raw).digest('hex'),bytes:Buffer.byteLength(raw),raw});
   if(page===Number(meta.pages)){if(collected!==expectedTotal)throw Error('Incomplete finance pagination');break;}
  }
 }
 const observations=normalizeFinance(rows);if(!observations.some(r=>r.value!==null))throw Error('No finance data');
 const path=resolve(root,'data/processed/education-finance.json');let old;try{old=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(old){const keys=new Set(observations.filter(r=>r.value!==null).map(r=>[r.iso3,r.year,r.metric_id].join('|')));if(old.observations.some(r=>r.value!==null&&!keys.has([r.iso3,r.year,r.metric_id].join('|'))))throw Error('Finance coverage regression; previous snapshot preserved');}
 const data={schema_version:1,retrieved_at:new Date().toISOString(),source:'UNESCO Institute for Statistics (UIS), distributed by World Bank WDI API',license:'CC BY 4.0',countries_requested:countries,metrics,observations,source_runs:runs};
 await writeFile(path+'.tmp',JSON.stringify(data,null,2)+'\n');await rename(path+'.tmp',path);
 console.log(JSON.stringify({observations:observations.length,non_null:observations.filter(r=>r.value!==null).length,countries:new Set(observations.filter(r=>r.value!==null).map(r=>r.iso3)).size}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
