import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache = new Map(); let storage = null; let writes = 0;
function load(file) {
  const filename = path.resolve(file); if (cache.has(filename)) return cache.get(filename);
  const module = { exports: {} }; cache.set(filename, module.exports);
  const require = name => {
    if (name.endsWith('.png')) return name;
    if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: { getItem: async () => storage, setItem: async (_key,value) => { writes++; storage=value; } } };
    if (name.includes('firebase')) throw Error('Local repository must not load Firebase');
    const base = name.startsWith('@/') ? path.resolve('src',name.slice(2)) : path.resolve(path.dirname(filename),name);
    return load(['.ts','.tsx'].map(ext=>base+ext).find(candidate=>fs.existsSync(candidate)));
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require,Date,Intl,Math,Set}); return module.exports;
}
const { initialDevices }=load('src/data/devices.ts');
const { importableDevices,confirmedDeviceRecord }=load('src/repositories/cloud-records.ts');
const local={...initialDevices.find(device=>device.icon==='fridge'),id:'user-created',origin:'local',confirmed:true,photoUri:'file:///private.jpg',rawOcr:'private text',history:[100],schedules:[]};
assert.equal(importableDevices(initialDevices.map(device=>({...device,confirmed:true,origin:'local'}))).length,0);
assert.equal(importableDevices([local,{...local,id:'unconfirmed',confirmed:false}]).length,1);
const record=confirmedDeviceRecord(local);assert.equal(record.offline,true);for(const key of ['photoUri','rawOcr','history','id','origin']) assert(!(key in record));
assert.throws(()=>confirmedDeviceRecord({...local,confirmed:false}));
const {accountState}=load('src/repositories/cloud-state.ts');const a=accountState({uid:'A',email:'a@example.com',displayName:'A',verified:true});const b=accountState({uid:'B',email:'b@example.com',displayName:'B',verified:true});
assert.equal(a.settings.identityUid,'A');assert.equal(b.settings.identityUid,'B');assert.equal(b.devices.length,0);assert.equal(b.messages.length,0);assert.equal(b.budget,0);
const {LocalTrialRepository}=load('src/repositories/local-trial.ts');const trial={devices:[local],budget:1400,referenceDate:'2026-10-14',messages:[],entries:[],reminders:[],tracking:false,scope:'trial'};
const repo=new LocalTrialRepository(()=>trial);await repo.save(trial);const restored=await repo.load();assert.equal(restored.devices[0].name,local.name);const before=writes;await assert.rejects(repo.save(a),/Cloud state/);assert.equal(writes,before);storage=JSON.stringify(a);await assert.rejects(repo.load(),/Invalid local trial/);
console.log('Passed repository checks: trial requires no Firebase, cloud/trial separation, explicit confirmed import, sample exclusion, privacy allowlist and empty account state.');
