import assert from 'node:assert/strict';
import fs from 'node:fs'; import vm from 'node:vm'; import ts from 'typescript';
const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/data/label-ocr.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {extractLabel,applyUnambiguousScan}=exports;
assert.equal(extractLabel('Rated input power: 150 W').candidates.power[0].value,'150');
assert.equal(extractLabel('Input power: 2.0 kW').candidates.power[0].unit,'kW');
assert.equal(extractLabel('Voltage 220\u2013240 V').candidates.voltage[0].value,'220-240');
assert.equal(extractLabel('Frequency 50 Hz').candidates.frequency[0].value,'50');
assert.equal(extractLabel('Frequency 50/60 Hz').candidates.frequency[0].value,'50/60');
assert.equal(extractLabel('220 V 50 Hz 3 A').candidates.power.length,0);
assert.equal(extractLabel('Output: 2000 W\nCooling capacity 2.5 kW\nAnnual consumption 150 kWh').candidates.power.length,0);
assert.equal(extractLabel('Input power 150 W\nOutput power 1000 W').candidates.power.length,1);
assert.equal(extractLabel('Input 150 W Output 1000 W').candidates.power.length,0);
const conflicting=extractLabel('Input power 150 W\nRated input 200 W');assert.equal(conflicting.candidates.power.length,2);assert.equal(applyUnambiguousScan({power:''},conflicting).power,'');
assert.equal(extractLabel('Brand: Example\nModel: AB-12').candidates.model[0].value,'AB-12');
const initial={power:'300',powerUnit:'W',voltage:'',voltageUnit:'V',frequency:'',frequencyUnit:'Hz'};
const result=applyUnambiguousScan(initial,extractLabel('Input 150 W\n220-240 V\n50/60 Hz'));assert.equal(result.power,'300');assert.equal(result.voltage,'220-240');assert.equal(initial.voltage,'');
assert.equal(applyUnambiguousScan({power:''},extractLabel('Unreadable')).power,'');
console.log('Passed label extraction: W/kW, ranges, missing power, excluded output/capacity/amps/kWh, conflicting inputs, brand/model and preserved manual values.');

function recognitionModule(nativeModule,platform='android'){const moduleExports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/label-recognition.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:moduleExports,require:name=>name==='react-native'?{Platform:{OS:platform}}:{requireOptionalNativeModule:()=>nativeModule}});return moduleExports;}
assert.equal(recognitionModule(null,'web').scanningAvailable,false);
await assert.rejects(recognitionModule(null).recognizeLabel('file:///label.jpg'),/development build/);
await assert.rejects(recognitionModule({recognizeText:async()=>{throw Error('OCR failed')}}).recognizeLabel('file:///label.jpg'),/OCR failed/);
await assert.rejects(recognitionModule({recognizeText:async()=>''}).recognizeLabel('file:///label.jpg'),/No readable text/);
assert.equal(await recognitionModule({recognizeText:async()=> 'Input power 150 W'}).recognizeLabel('file:///label.jpg'),'Input power 150 W');
console.log('Passed OCR adapter success, failure, empty text, Expo Go and web fallback checks.');
