import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchResource} from './lib/http.mjs';
import {writeJson,writeBytes,sha256Bytes} from './lib/io.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const evidence=JSON.parse(await readFile(join(root,'data/processed/education-evidence.json'),'utf8'));
const runs=[];
for(const source of evidence.sources){
 try{
  const r=await fetchResource(source.url,{attempts:2,headers:{accept:'text/html'}});
  const path=`data/raw/education_${source.id}.html`;
  await writeBytes(join(root,path),r.bytes);
  runs.push({id:source.id,url:source.url,resolved_url:r.url,checked_at:new Date().toISOString(),status:'ok',http_status:r.status,raw_sha256:sha256Bytes(r.bytes),raw_path:path,bytes:r.bytes.length,scope:'stored_file_bytes',note:'Retrieval verification; numerical claims require editorial review against source.'});
 }catch(e){runs.push({id:source.id,url:source.url,checked_at:new Date().toISOString(),status:'error',error:e.message});}
}
await writeJson(join(root,'data/processed/education-source-runs.json'),runs);
console.log(JSON.stringify(runs.map(r=>({id:r.id,status:r.status,bytes:r.bytes})),null,2));
if(runs.some(r=>r.status!=='ok'))process.exitCode=1;
