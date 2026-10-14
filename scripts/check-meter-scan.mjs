let photoCancelled=false; let photoDenied=false; let copiedPhoto=false;
let copiedInvitation = ''; let cameraAllowed = false;
// Component interaction checks without a DOM or native simulator.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const modules = new Map();
let active, selectedId, household, settingsPage, invitationParam;
const navigation = [];
const jsx = (type, props) => ({ type, props });
const hooks = {
  useState(initial) { const i = active.cursor++; if (!(i in active.values)) active.values[i] = typeof initial === 'function' ? initial() : initial; const instance = active; return [instance.values[i], value => { instance.values[i] = typeof value === 'function' ? value(instance.values[i]) : value; }]; },
  useRef(value) { const [ref] = hooks.useState({ current: value }); return ref; },
  useCallback: fn => fn, useEffect() {}, useId: () => 'test',
};
let textScale = 1;
const native = { View: 'View', Text: 'Text', TextInput: 'TextInput', Modal: 'Modal', Pressable: 'Pressable', ScrollView: 'ScrollView', StyleSheet: { create: value => value, hairlineWidth: 1, absoluteFill: {} }, useWindowDimensions: () => ({ width: 320, height: 700, fontScale: textScale }) };
native.PanResponder = { create: handlers => ({ panHandlers: handlers }) };
native.Platform = { OS: 'web' };
function load(file) {
  const filename = path.resolve(file);
  if (modules.has(filename)) return modules.get(filename);
  const module = { exports: {} }; modules.set(filename, module.exports);
  const require = name => {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if ((name === 'react-native' || name === '@/design/themed-native')) return native;
    if ((name === 'react-native-svg' || name === '@/design/themed-svg')) return { __esModule: true, default: 'Svg', ...Object.fromEntries(['Circle', 'ClipPath', 'Defs', 'G', 'Line', 'LinearGradient', 'Path', 'Rect', 'Stop', 'Text'].map(tag => [tag, `Svg${tag}`])) };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }) };
    if (name === 'expo-router') return { useLocalSearchParams: () => ({ id: selectedId, page: settingsPage, token: invitationParam }), useFocusEffect: () => {}, router: { push: route => navigation.push(route), replace: route => navigation.push(route) } };
    if (name === '@/design/appearance') return { useAppearance: () => ({ dark: false, glass: false, reduced: false, style: value => value, color: value => value }) };
    if (name === 'expo-camera') return { CameraView: 'Camera', useCameraPermissions: () => [{ granted: false, canAskAgain: true }, async () => ({ granted: cameraAllowed, canAskAgain: false })] };
    if (name === 'expo-clipboard') return { setStringAsync: async text => { copiedInvitation = text; } };
    if (name === 'expo-crypto') return { getRandomBytesAsync: async length => Uint8Array.from({ length }, (_, i) => i + 1) };
    if (name === 'react-native-qrcode-svg') return { __esModule: true, default: 'QR' };
    if (name === 'expo-constants') return { __esModule: true, default: { expoConfig: { version: '1.0.0' } } };
    if (name === 'expo-image-picker') return { requestCameraPermissionsAsync:async()=>({granted:!photoDenied}), launchCameraAsync:async()=>({canceled:photoCancelled,assets:[{uri:'file:///meter.jpg'}]}), launchImageLibraryAsync:async()=>({canceled:photoCancelled,assets:[{uri:'file:///meter.jpg'}]}) };
    if (name === '@/services/label-recognition') return { scanningAvailable:false };
    if (name === '@/services/meter-photo') return { keepMeterPhoto:async()=>{copiedPhoto=true;return 'file:///documents/meter.jpg';} };
    if (name === 'expo-image') return { Image: 'Image' };
    if ((name === 'expo-linear-gradient' || name === '@/design/themed-gradient')) return { LinearGradient: 'Gradient' };
    if (name === '@/state/household') return { useHousehold: () => ({ state: household, ready: true, joinHousehold: token => { const settings = household.settings; if (load('src/data/invitations.ts').invitationStatus(settings, token) === 'valid') settings.household.members.push({ id: 'self', name: settings.profile.name }); }, update: fn => { household = fn(household); }, toggle: id => { const device = household.devices.find(item => item.id === id); device.powerOn = !device.powerOn; } }), householdLoad: devices => devices.reduce((total, device) => total + (load('src/data/devices.ts').currentPower(device) ?? 0), 0) };
    if (name.startsWith('@/assets/')) return name;
    const stub = { './invitation-screen': { InvitationScreen: 'Invitation' }, './primitives': { Card: 'Card', Page: 'Page', OutlineIcon: 'Icon' }, './device-controls': { ScreenHeader: 'Header', SoftToggle: 'Toggle' }, './segmented-control': { SegmentedControl: 'Selector' }, './device-history-charts': { DeviceGraph: 'Graph', StateTimeline: 'Timeline' }, './usage-charts': { SoftRoomDonut: 'RoomDonut', SoftUsageBar: 'UsageBar', UsageGraph: 'UsageGraph' }, './usage-overview': { UsageOverview: 'Overview', UsageChartMetrics: 'Metrics' }, './other-devices-sheet': { OtherDevicesSheet: 'OtherSheet' } }[name];
    if (stub) return stub;
    const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load(['.ts', '.tsx'].map(ext => base + ext).find(candidate => fs.existsSync(candidate)));
  };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module, require, Error, Date, Intl, Math, URL, setInterval, clearInterval, setTimeout, clearTimeout }, { filename });
  return module.exports;
}
function mount(component, props) { const instance = { values: [], cursor: 0, render() { active = instance; instance.cursor = 0; return component(props); } }; return instance; }
function nodes(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...nodes(node.props?.children)]; }
function find(tree, predicate) { const result = nodes(tree).find(predicate); assert(result, 'Expected control missing'); return result; }
const selector = (tree, label) => find(tree, node => node.type === 'Selector' && node.props.label === label);

const meter=load('src/data/meter-readings.ts');assert.equal(meter.parseMeterValue('00123.45'),123.45);assert.equal(meter.parseMeterValue('0'),0);assert.equal(meter.parseMeterValue('-1'),null);assert.equal(meter.parseMeterValue('12.12345'),null);assert.equal(meter.parseMeterValue('1e5'),null);assert.equal(meter.parseMeterValue('12,5'),12.5);assert.equal(meter.meterCandidates('Serial number 111111\n123.45 kWh\nRate 2.00 R/kWh','total')[0],'123.45');assert.equal(meter.meterCandidates('R 145.20','credit')[0],'145.20');
household={devices:[],meterReadings:[]};const screen=load('src/components/energy/meter-scan-screen.tsx').default;const form=mount(screen,{});let tree=form.render();const tap=(t,label)=>find(t,n=>n.props?.label===label).props.onPress();tap(tree,'Take photo');await new Promise(r=>setImmediate(r));tree=form.render();assert.equal(household.meterReadings.length,0);find(tree,n=>n.props?.accessibilityLabel==='Meter reading value').props.onChangeText('-1');tree=form.render();tap(tree,'Confirm and save reading');await new Promise(r=>setImmediate(r));assert.equal(household.meterReadings.length,0);tree=form.render();find(tree,n=>n.props?.accessibilityLabel==='Meter reading value').props.onChangeText('120.5');tree=form.render();tap(tree,'Confirm and save reading');tap(tree,'Confirm and save reading');await new Promise(r=>setImmediate(r));assert.equal(household.meterReadings.length,1);assert.equal(household.meterReadings[0].value,120.5);assert(copiedPhoto);assert(meter.isMeterReading(household.meterReadings[0]));assert(Date.parse(household.meterReadings[0].confirmedAt)>=Date.parse(household.meterReadings[0].scannedAt));assert(meter.isMeterReading(JSON.parse(JSON.stringify(household.meterReadings[0]))));assert(!meter.isMeterReading({...household.meterReadings[0],scannedAt:'bad'}));
photoDenied=true;const denied=mount(screen,{});tap(denied.render(),'Take photo');await new Promise(r=>setImmediate(r));assert(nodes(denied.render()).some(n=>n.props?.children==='Allow camera access, or choose a photo instead.'));photoDenied=false;photoCancelled=true;const cancelled=mount(screen,{});tap(cancelled.render(),'Choose from photos');await new Promise(r=>setImmediate(r));assert(!nodes(cancelled.render()).some(n=>n.props?.accessibilityLabel==='Meter reading value'));
console.log('Passed meter value parsing, candidate filtering, camera denial/cancel, explicit confirmation, duplicate prevention, photo-save handler, scan/confirmation timestamps and persistence serialization.');
