import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeOecd} from '../src/refresh.mjs';
const source={id:'oecd_ict_businesses',metric_id:'enterprise_ai_adoption',dataset:'DSD_ICT_B@DF_BUSINESSES'};
const maps={byIso3:new Map([['COL',{iso3:'COL',iso2:'CO',country:'Colombia',region:'LAC'}]])};
const header='REF_AREA,TIME_PERIOD,OBS_VALUE,MEASURE,UNIT_MEASURE,ACTIVITY,SIZE_CLASS';
test('SDMX CSV conserva cero real y descarta ausencias sin imputación',()=>{
 const csv=header+'\nCOL,2025,,G14_B,PT_ENT,_T,S_GE10\nCOL,2024,0,G14_B,PT_ENT,_T,S_GE10\nCOL,2023, ,G14_B,PT_ENT,_T,S_GE10\n';
 const rows=normalizeOecd(csv,source,maps);assert.equal(rows.length,1);assert.equal(rows[0].value,0);assert.equal(rows[0].year,2024);
});
test('rechaza HTTP 200 con HTML o CSV incompatible',()=>{
 assert.throws(()=>normalizeOecd('<html>error</html>',source,maps),/esquema incompatible/);
 assert.throws(()=>normalizeOecd('country,value\nCOL,20',source,maps),/esquema incompatible/);
});
