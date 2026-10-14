let savedDevice; let ocrFails=false;
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
    if (name === 'expo-router') return { useLocalSearchParams: () => ({ id: selectedId, page: settingsPage, token: invitationParam }), useFocusEffect: () => {}, router: { push: route => navigation.push(route), navigate: route => navigation.push(route), replace: route => navigation.push(route) } };
    if (name === '@/design/appearance') return { useAppearance: () => ({ dark: false, glass: false, reduced: false, style: value => value, color: value => value }) };
    if (name === 'expo-camera') return { CameraView: 'Camera', useCameraPermissions: () => [{ granted: false, canAskAgain: true }, async () => ({ granted: cameraAllowed, canAskAgain: false })] };
    if (name === 'expo-clipboard') return { setStringAsync: async text => { copiedInvitation = text; } };
    if (name === 'expo-crypto') return { getRandomBytesAsync: async length => Uint8Array.from({ length }, (_, i) => i + 1) };
    if (name === 'react-native-qrcode-svg') return { __esModule: true, default: 'QR' };
    if (name === 'expo-constants') return { __esModule: true, default: { expoConfig: { version: '1.0.0' } } };
    if (name === 'expo-image-picker') return { launchImageLibraryAsync: async()=>({ canceled:false, assets:[{uri:'file:///label.jpg'}] }), requestCameraPermissionsAsync:async()=>({granted:true}),launchCameraAsync:async()=>({canceled:false,assets:[{uri:'file:///label.jpg'}]}) };
    if (name === '@/services/label-recognition') return { scanningAvailable:true, recognizeLabel:async()=>{if(ocrFails)throw Error('OCR failure');return 'Rated input 150 W\nVoltage 220-240 V\nFrequency 50/60 Hz';} };
    if (name === 'expo-image') return { Image: 'Image' };
    if ((name === 'expo-linear-gradient' || name === '@/design/themed-gradient')) return { LinearGradient: 'Gradient' };
    if (name === '@/state/household') return { useHousehold: () => ({ state: household, ready: true, saveDevice:device=>{savedDevice=device;}, joinHousehold: token => { const settings = household.settings; if (load('src/data/invitations.ts').invitationStatus(settings, token) === 'valid') settings.household.members.push({ id: 'self', name: settings.profile.name }); }, update: fn => { household = fn(household); }, toggle: id => { const device = household.devices.find(item => item.id === id); device.powerOn = !device.powerOn; } }), householdLoad: devices => devices.reduce((total, device) => total + (load('src/data/devices.ts').currentPower(device) ?? 0), 0) };
    if (name.startsWith('@/assets/')) return name;
    const stub = { './invitation-screen': { InvitationScreen: 'Invitation' }, './primitives': { Card: 'Card', Page: 'Page', OutlineIcon: 'Icon' }, './device-controls': { ScreenHeader: 'Header', SoftToggle: 'Toggle', SwipeRow:'SwipeRow' }, './segmented-control': { SegmentedControl: 'Selector' }, './device-history-charts': { DeviceGraph: 'Graph', StateTimeline: 'Timeline' }, './usage-charts': { SoftRoomDonut: 'RoomDonut', SoftUsageBar: 'UsageBar', UsageGraph: 'UsageGraph' }, './usage-overview': { UsageOverview: 'Overview', UsageChartMetrics: 'Metrics' }, './other-devices-sheet': { OtherDevicesSheet: 'OtherSheet' } }[name];
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

const d=load('src/data/devices.ts');household={devices:structuredClone(d.initialDevices),settings:load('src/data/settings.ts').defaultSettings()};
const wrapper=mount(load('src/components/energy/device-form-screen.tsx').default,{}).render();const form=mount(wrapper.type,wrapper.props);let tree=form.render();find(tree,n=>n.props?.accessibilityLabel==='Fridge').props.onPress();tree=form.render();find(tree,n=>n.props?.label==='Rated power').props.onValue('300');tree=form.render();selector(tree,'Specification entry').props.onChange('scan');tree=form.render();find(tree,n=>n.props?.label==='Choose from photos').props.onPress();await new Promise(resolve=>setImmediate(resolve));tree=form.render();assert.equal(find(tree,n=>n.props?.label==='Rated power').props.value,'300');assert.equal(find(tree,n=>n.props?.label==='Voltage').props.value,'220-240');assert.equal(find(tree,n=>n.props?.label==='Frequency').props.value,'50/60');find(tree,n=>n.props?.onPress && nodes(n).some(c=>c.props?.children==='Add device')).props.onPress();assert.equal(savedDevice,undefined);find(tree,n=>n.props?.label==='Confirm reviewed details').props.onPress();tree=form.render();find(tree,n=>n.props?.onPress && nodes(n).some(c=>c.props?.children==='Add device')).props.onPress();assert.equal(savedDevice.power,'300');assert.equal(savedDevice.frequency,'50/60');
const second=mount(wrapper.type,wrapper.props);tree=second.render();selector(tree,'Specification entry').props.onChange('scan');ocrFails=true;tree=second.render();find(tree,n=>n.props?.label==='Choose from photos').props.onPress();await new Promise(resolve=>setImmediate(resolve));tree=second.render();assert.equal(find(tree,n=>n.props?.label==='Rated power').props.value,'');assert(nodes(tree).some(n=>n.props?.text==='OCR failure'));console.log('Passed form scan review/save gating, retained manual power, ranges, confirmation/persistence handler and failure without fabricated values.');
