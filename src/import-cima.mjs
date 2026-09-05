import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const endpoint='https://data.iadb.org/es/api/action/datastore_search';
export const resource='c8237c93-b1cd-4a23-85b7-c4b9b6d9f9f1';
export const metrics=[
 {id:'puntaje_prom_mat',es:'Matemáticas',en:'Mathematics'},
 {id:'puntaje_prom_lec',es:'Lectura',en:'Reading'},
 {id:'puntaje_prom_cie',es:'Ciencias',en:'Science'}
];
const dimensions=['area','quintile','sex','education_level','age','ethnicity','language','disability','migration','management','funding'];
export function normalize(rows, countries) {
 const ids=new Set(),out=[];
 for(const r of rows){
  if(r.source!=='PISA'||!metrics.some(m=>m.id===r.indicator)||r.idgeo!=='country'||r.iddate!=='year'||r.totals_dummy!==1||dimensions.some(k=>r[k]!=='Total'))throw Error('Unexpected CIMA population or indicator');
  if(!Number.isInteger(r.year)||r.year<2000||r.year>new Date().getUTCFullYear()||typeof r.value!=='number'||!Number.isFinite(r.value)||r.value<0||r.value>1000)throw Error('Invalid CIMA value/year');
  if(['LAC','OECD'].includes(r.isoalpha3))continue;
  if(!countries.has(r.isoalpha3))throw Error('Unknown country '+r.isoalpha3);
  const key=[r.isoalpha3,r.year,r.indicator].join('|');
  if(ids.has(key))throw Error('Duplicate CIMA observation '+key);ids.add(key);
  if(r.se!==null && (typeof r.se!=='number'||!Number.isFinite(r.se)||r.se<0))throw Error('Invalid standard error');
  out.push({iso3:r.isoalpha3,country:countries.get(r.isoalpha3),year:r.year,metric_id:r.indicator,value:r.value,unit:'PISA points',standard_error:r.se,sample:r.sample,source:'PISA',source_record_id:r._id,profile_url:'https://cima.iadb.org/es/country-profile/'+r.isoalpha3.toLowerCase()});
 }
 if(!out.length)throw Error('Empty CIMA selection');
 return out.sort((a,b)=>a.iso3.localeCompare(b.iso3)||a.year-b.year||a.metric_id.localeCompare(b.metric_id));
}
export async function retrieve(fetchImpl=fetch){
 const records=[],runs=[];
 for(const metric of metrics){
  let offset=0,total=null;
  const filters={indicator:metric.id,source:'PISA',totals_dummy:1,idgeo:'country',iddate:'year',...Object.fromEntries(dimensions.map(k=>[k,'Total']))};
  for(let page=0;page<100;page++){
   const url=new URL(endpoint);url.search=new URLSearchParams({resource_id:resource,filters:JSON.stringify(filters),sort:'_id asc',limit:'50',offset:String(offset)});
   const response=await fetchImpl(url,{signal:AbortSignal.timeout(30000),redirect:'error'});
   if(!response.ok)throw Error('CIMA HTTP '+response.status);
   const raw=await response.text(),body=JSON.parse(raw),r=body.result;
   if(!body.success||r?.resource_id!==resource||!Array.isArray(r.records)||!Number.isInteger(r.total)||r.total<=0||r.total_was_estimated)throw Error('Invalid CIMA response');
   if(total!==null&&total!==r.total)throw Error('CIMA total changed during pagination');total=r.total;
   if(!r.records.length||offset+r.records.length>total)throw Error('Incomplete CIMA pagination');
   records.push(...r.records);runs.push({url:url.href,retrieved_at:new Date().toISOString(),sha256:createHash('sha256').update(raw).digest('hex'),bytes:Buffer.byteLength(raw),raw});
   offset+=r.records.length;
   if(offset===total)break;
   if(page===99)throw Error('CIMA page limit');
  }
 }
 return {records,runs};
}
async function main(){
 const snapshot=JSON.parse(await readFile(resolve(root,'data/processed/snapshot.json'),'utf8'));
 const countries=new Map(snapshot.countries.map(c=>[c.iso3,c.country]));
 const {records,runs}=await retrieve();
 const observations=normalize(records,countries);
 const path=resolve(root,'data/processed/cima-context.json');
 let previous;try{previous=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(previous){const current=new Set(observations.map(r=>[r.iso3,r.year,r.metric_id].join('|')));if(previous.observations.some(r=>!current.has([r.iso3,r.year,r.metric_id].join('|'))))throw Error('CIMA coverage regression: previous snapshot preserved');}
 const data={schema_version:1,retrieved_at:new Date().toISOString(),publisher:'BID / IDB',dataset_url:'https://data.iadb.org/es/dataset/cima-indicators',portal_url:'https://cima.iadb.org/es',doi:'https://doi.org/10.60966/x0se6zl1',license:'CC BY 4.0',api_endpoint:endpoint,resource_id:resource,population:'PISA participating 15-year-old students; national totals',scope:'Educational context; not AI adoption or causal impact. No regional averages calculated.',metrics,observations,source_runs:runs};
 await writeFile(path+'.tmp',JSON.stringify(data,null,2)+'\n');await rename(path+'.tmp',path);
 console.log(JSON.stringify({observations:observations.length,countries:new Set(observations.map(r=>r.iso3)).size,years:[...new Set(observations.map(r=>r.year))],pages:runs.length}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
