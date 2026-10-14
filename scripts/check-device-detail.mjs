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
  vm.runInNewContext(code, { exports: module.exports, module, require, Date, Intl, Math, URL, setInterval, clearInterval, setTimeout, clearTimeout }, { filename });
  return module.exports;
}
function mount(component, props) { const instance = { values: [], cursor: 0, render() { active = instance; instance.cursor = 0; return component(props); } }; return instance; }
function nodes(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...nodes(node.props?.children)]; }
function find(tree, predicate) { const result = nodes(tree).find(predicate); assert(result, 'Expected control missing'); return result; }
const selector = (tree, label) => find(tree, node => node.type === 'Selector' && node.props.label === label);
const d = load('src/data/devices.ts');
household = { devices: structuredClone(d.initialDevices), referenceDate: '2026-10-08' };
const screen = load('src/components/energy/device-usage-screen.tsx').default;
for (const id of ['air-conditioner', 'water-heater', 'washing-machine', 'smart-meter']) {
  selectedId = id;
  const root = mount(screen, {}).render();
  const detailsNode = find(root, node => typeof node.type === 'function');
  const details = mount(detailsNode.type, detailsNode.props);
  let tree = details.render();
  const loadMetric = nodes(tree).filter(node => node.type === 'Text').find(node => node.props.children === 'Current load');
  assert(loadMetric);
  for (const period of ['week', 'month', 'today']) {
    selector(tree, 'Device history period').props.onChange(period); tree = details.render();
    assert.equal(selector(tree, 'Device graph').props.options[0].label, period === 'today' ? 'Power' : 'Energy');
    selector(tree, 'Device graph').props.onChange('cost'); tree = details.render();
    assert.equal(find(tree, node => node.type === 'Graph').props.cost, true);
    find(tree, node => node.props?.accessibilityRole === 'button' && nodes(node).some(child => child.type === 'Text' && child.props.children === 'Edit device / schedule')).props.onPress();
    assert.equal(navigation.at(-1).params.id, id);
  }
  const toggles = nodes(tree).filter(node => node.type === 'Toggle');
  assert.equal(toggles.length, id === 'smart-meter' ? 0 : 1);
  if (id === 'washing-machine') assert.equal(toggles[0].props.disabled, true);
  if (id === 'air-conditioner') { const before = household.devices.find(device => device.id === id).powerOn; toggles[0].props.onChange(); assert.equal(household.devices.find(device => device.id === id).powerOn, !before); }
}
const calendarComponent = load('src/components/energy/device-activity-calendar.tsx').DeviceActivityCalendar;
const calendar = mount(calendarComponent, { device: household.devices[1], initialDate: household.referenceDate, anchor: household.referenceDate, period: 'today' });
let tree = calendar.render();
assert(nodes(tree).some(node => node.type === 'Text' && String(node.props.children).includes(household.devices[1].name)));
let swipeCards = find(tree, node => node.props?.onPanResponderRelease);
assert.equal(swipeCards.props.onMoveShouldSetPanResponderCapture({}, { dx: 4, dy: 50 }), false, 'Vertical scrolling stays available');
assert.equal(swipeCards.props.onMoveShouldSetPanResponderCapture({}, { dx: -50, dy: 4 }), true);
swipeCards.props.onPanResponderRelease({}, { dx: -60, dy: 2 }); tree = calendar.render();
assert(find(tree, node => node.props?.accessibilityState?.selected && node.props?.accessibilityLabel?.startsWith('Calendar Fri')));
find(tree, node => node.props?.onPanResponderRelease).props.onPanResponderRelease({}, { dx: 60, dy: 2 }); tree = calendar.render();
assert(find(tree, node => node.props?.accessibilityState?.selected && node.props?.accessibilityLabel?.startsWith('Calendar Thu')));
find(tree, node => node.type === 'ScrollView').props.onScroll({ nativeEvent: { contentOffset: { x: 100 } } });
await new Promise(resolve => setTimeout(resolve, 180)); tree = calendar.render();
assert(find(tree, node => node.props?.accessibilityState?.selected && node.props?.accessibilityLabel?.startsWith('Calendar Tue')));
find(tree, node => node.props?.accessibilityLabel?.startsWith('Calendar Wed')).props.onPress(); tree = calendar.render();
selector(tree, 'Calendar unit').props.onChange('cost'); tree = calendar.render();
find(tree, node => node.props?.accessibilityLabel?.startsWith('View sessions')).props.onPress(); tree = calendar.render();
let sheetNode = find(tree, node => typeof node.type === 'function' && node.props?.selection);
assert.equal(sheetNode.props.selection.day, '2026-10-07');
assert.equal(sheetNode.props.unit, 'cost');
let sheet = mount(sheetNode.type, sheetNode.props).render();
assert.equal(find(sheet, node => node.type === 'Modal').props.visible, true);
find(sheet, node => node.type === 'Modal').props.onRequestClose(); tree = calendar.render();
sheetNode = find(tree, node => typeof node.type === 'function' && 'selection' in node.props);
assert.equal(sheetNode.props.selection, null);
const month = mount(calendarComponent, { device: household.devices[1], initialDate: household.referenceDate, anchor: household.referenceDate, period: 'month' });
tree = month.render(); find(tree, node => node.props?.accessibilityLabel?.startsWith('View days')).props.onPress(); tree = month.render();
sheetNode = find(tree, node => typeof node.type === 'function' && node.props?.selection);
assert.equal(sheetNode.props.selection.days.length, 7);
sheetNode.props.onDay('2026-10-08'); tree = month.render();
sheetNode = find(tree, node => typeof node.type === 'function' && node.props?.selection);
assert.equal(sheetNode.props.selection.day, '2026-10-08');
const charts = load('src/components/energy/device-history-charts.tsx');
const graph = mount(charts.DeviceGraph, { device: household.devices[1], dates: ['2026-10-08'], anchor: household.referenceDate, period: 'today', cost: false });
tree = graph.render();
let touch = find(tree, node => node.type === 'Pressable');
touch.props.onLayout({ nativeEvent: { layout: { width: 280 } } }); tree = graph.render();
touch = find(tree, node => node.type === 'Pressable');
touch.props.onPress({ nativeEvent: { locationX: 200 } }); tree = graph.render();
assert(nodes(tree).some(node => node.props?.accessibilityLiveRegion === 'polite'));
const timeline = mount(charts.StateTimeline, { intervals: load('src/data/history.ts').dayIntervals(household.devices[1], household.referenceDate, household.referenceDate) }).render();
assert(nodes(timeline).filter(node => node.type === 'SvgRect' && node.props.x !== undefined).every(node => node.props.x >= 0 && node.props.x + node.props.width <= 1440));
console.log('Passed device detail component handlers: four devices, periods, units, edit routes, toggles, calendar selection, session sheet, Android dismissal and month drill-down. Native rendering is not covered.');
const { RoomCard } = load('src/components/energy/usage-screen.tsx');
const usage = load('src/data/usage.ts');
for (const phoneWidth of [320, 375, 393, 430]) for (const scale of [1, 1.3, 2]) for (const period of ['today', 'week', 'month']) for (const unit of ['energy', 'cost']) {
  textScale = scale;
  const data = usage.getUsage(period, household.devices, household.referenceDate);
  const rooms = [...data.rooms, { name: 'Long living room and dining area name', color: '#9387ea', share: 0, energy: 0, cost: 0, noData: true }];
  let chosenPeriod, chosenUnit;
  const card = mount(RoomCard, { rooms, total: unit === 'cost' ? 12345.67 : data.total, unit, period, onPeriod: value => { chosenPeriod = value; }, onUnit: value => { chosenUnit = value; } });
  let tree = card.render();
  find(tree, node => node.props?.onLayout).props.onLayout({ nativeEvent: { layout: { width: phoneWidth - 62 } } });
  tree = card.render();
  const donut = find(tree, node => node.type === 'RoomDonut');
  const container = find(tree, node => node.props?.onLayout);
  const legend = container.props.children[1];
  const innerWidth = phoneWidth - 62;
  assert(donut.props.size > 0 && donut.props.size <= innerWidth);
  if (container.props.style.flexDirection === 'row') assert(donut.props.size + container.props.style.gap + legend.props.style.width <= innerWidth + .001);
  else assert.equal(legend.props.style.width, innerWidth);
  if (phoneWidth <= 393 || scale > 1) assert.equal(container.props.style.flexDirection, 'column');
  assert(nodes(legend).some(node => node.type === 'Text' && node.props.children === 'No data'));
  for (const row of legend.props.children) {
    const value = row.props.children[2];
    assert.equal(value.props.style.textAlign, 'right');
    assert.equal(value.props.style.flexShrink, 0);
    assert.equal(row.props.children[1].props.style.minWidth, 0);
  }
  selector(tree, 'Room usage period').props.onChange('month'); assert.equal(chosenPeriod, 'month');
  selector(tree, 'Room usage unit').props.onChange('cost'); assert.equal(chosenUnit, 'cost');
}
textScale = 1;
const roomCharts = load('src/components/energy/usage-charts.tsx');
const donutTree = mount(roomCharts.SoftRoomDonut, { segments: [], total: 12345.67, unit: 'cost', size: 160 }).render();
assert.equal(donutTree.props.style.width, 160);
assert(nodes(donutTree).some(node => node.type === 'SvgText' && node.props.children === 'R12345.67'));
console.log('Passed room layout checks: 320/375/393/430 widths, 100/130/200% text scales, all periods/units, long names, No data, long currency totals and selectors. Physical iPhone rendering is not covered.');
household.budget = 1400;
const usageScreen = mount(load('src/components/energy/usage-screen.tsx').default, {});
const expected = { graph: { period: 'today', unit: 'energy' }, device: { period: 'today', unit: 'energy' }, room: { period: 'today', unit: 'energy' } };
function verifySelections(tree) {
  const graph = find(tree, node => node.type === 'UsageGraph').props;
  const room = find(tree, node => node.type === RoomCard).props;
  const other = find(tree, node => node.type === 'OtherSheet').props;
  assert.equal(graph.period, expected.graph.period); assert.equal(graph.unit, expected.graph.unit);
  assert.equal(room.period, expected.room.period); assert.equal(room.unit, expected.room.unit);
  assert.equal(other.period, expected.device.period); assert.equal(other.unit, expected.device.unit);
  const graphData = usage.getUsage(expected.graph.period, household.devices, household.referenceDate);
  const roomData = usage.getUsage(expected.room.period, household.devices, household.referenceDate);
  assert.equal(graph.data.total, graphData.total);
  assert.equal(room.total, expected.room.unit === 'energy' ? roomData.total : roomData.cost);
  assert.equal(selector(tree, 'Device usage period').props.value, expected.device.period);
  assert.equal(selector(tree, 'Device usage unit').props.value, expected.device.unit);
}
for (const card of ['graph', 'device', 'room']) for (const period of ['week', 'month', 'today']) for (const unit of ['cost', 'energy']) {
  let tree = usageScreen.render();
  if (card === 'room') { const props = find(tree, node => node.type === RoomCard).props; props.onPeriod(period); props.onUnit(unit); }
  else { const prefix = card === 'graph' ? 'Usage graph' : 'Device usage'; selector(tree, `${prefix} period`).props.onChange(period); if (card === 'device') selector(tree, `${prefix} unit`).props.onChange(unit); }
  expected[card] = { period, unit: card === 'graph' ? 'energy' : unit };
  verifySelections(usageScreen.render());
}
console.log('Passed independent Usage card selections: each period/unit changes only its own graph, device breakdown/sheet or room donut data.');
assert(!nodes(usageScreen.render()).some(node => node.type === 'Selector' && node.props.label === 'Usage graph unit'));
const homeTree = mount(load('src/components/energy/home-screen.tsx').default, {}).render();
const energyChart = find(homeTree, node => node.type === load('src/components/energy/energy-chart.tsx').EnergyChart);
assert.equal(energyChart.props.unit, 'kWh');
assert(!nodes(homeTree).some(node => node.props?.accessibilityLabel?.startsWith('Show ')));
const theme = load('src/design/energy-theme.ts');
assert.equal(theme.palette.blue, '#3978df');
assert(theme.controlGradient.every(color => parseInt(color.slice(5, 7), 16) > parseInt(color.slice(1, 3), 16)));
console.log('Passed blue theme and removed Home/graph unit selector checks.');

// Profile settings screens: working local save handlers, validation and previews.
const settingsData = load('src/data/settings.ts');
household.settings = settingsData.defaultSettings(); household.messages = [];
const settingsRoute = load('src/components/energy/profile-screen.tsx').SettingsScreen;
function screenFor(page) { settingsPage = page; const root = mount(settingsRoute, {}).render(); return mount(root.type, root.props); }
function expand(node) { if (!node || typeof node !== 'object') return node; if (Array.isArray(node)) return node.map(expand); if (typeof node.type === 'function') return expand(node.type(node.props)); return { ...node, props: { ...node.props, children: expand(node.props?.children) } }; }
function press(tree, label) { find(expand(tree), node => node.type === 'Pressable' && nodes(node).some(child => child.type === 'Text' && child.props.children === label)).props.onPress(); }
let profileForm = screenFor('edit'); tree = profileForm.render();
find(expand(tree), node => node.type === 'TextInput' && node.props.accessibilityLabel === 'Email').props.onChangeText('invalid');
press(profileForm.render(), 'Save changes');
assert.equal(household.settings.profile.email, 'osca@example.com');
assert(nodes(expand(profileForm.render())).some(node => node.props?.children === 'Enter your name and a valid email address.'));
find(expand(profileForm.render()), node => node.type === 'TextInput' && node.props.accessibilityLabel === 'Email').props.onChangeText('updated@example.com');
find(expand(profileForm.render()), node => node.type === 'TextInput' && node.props.accessibilityLabel === 'Name').props.onChangeText('New Name');
press(profileForm.render(), 'Save changes');
assert.equal(household.settings.profile.email, 'updated@example.com');
assert.equal(household.settings.household.members[0].name, 'New Name');
assert.equal(household.settings.supply.city, 'Johannesburg');
let appearanceForm = screenFor('app'); tree = expand(appearanceForm.render());
for (const name of ['Dark, coming soon', 'Glass, coming soon']) assert.equal(find(tree, node => node.props?.accessibilityLabel === name).props.disabled, true);
assert.equal(household.settings.appearance, 'Light');
assert(!nodes(tree).some(node => node.props?.label === 'Default usage view'));
let privacyForm = screenFor('privacy'); tree = privacyForm.render();
const switchNode = find(expand(tree), node => node.type === 'Toggle' && node.props.label === 'Allow AI to use household data'); switchNode.props.onChange(false); press(privacyForm.render(), 'Save privacy preferences'); assert.equal(household.settings.ai, false);
for (const page of ['household','electricity','notifications','alerts','subscription','upgrade','policy','account','help','report','sessions','export','sign-out']) assert(screenFor(page).render());
let reportForm = screenFor('report'); find(expand(reportForm.render()), node => node.type === 'TextInput').props.onChangeText('Local problem draft'); press(reportForm.render(), 'Save draft'); assert.equal(household.settings.report, 'Local problem draft');
console.log('Passed Profile form handlers: email validation, shared name updates, personal/supply separation, appearance/default selection, AI permission, local report draft and all settings pages. Rendering on a native device is not covered.');

const defaultCostUsage = mount(load('src/components/energy/usage-screen.tsx').default, {}).render();
assert.equal(selector(defaultCostUsage, 'Device usage unit').props.value, 'energy');
assert.equal(find(defaultCostUsage, node => node.type === RoomCard).props.unit, 'energy');
console.log('Passed Energy initialization without a global preference; chart controls remain independent.');

// Inbox read status and selected destination are local working interactions.
household.settings = settingsData.defaultSettings(); household.readNotifications = [];
const inbox = mount(load('src/components/energy/notification-inbox.tsx').default, {}); tree = inbox.render();
const alertButton = find(tree, node => node.type === 'Pressable' && node.props.accessibilityLabel?.includes(', unread')); alertButton.props.onPress(); assert(household.readNotifications.length === 1); assert.equal(navigation.at(-1).pathname, '/device-usage');
selector(inbox.render(), 'Notification filter').props.onChange('unread'); press(inbox.render(), 'Mark all as read'); tree = inbox.render(); assert(nodes(tree).some(node => node.type === 'Text' && String(node.props.children).includes('all caught up')));
// QR creation, manual fallback, already joined, denied camera and join preview.
const inviteModule = load('src/components/energy/invitation-screen.tsx');
const invite = mount(inviteModule.InvitationScreen, {}); press(invite.render(), 'Generate invitation'); await new Promise(resolve => setImmediate(resolve));
assert(household.settings.household.invitation, nodes(expand(invite.render())).filter(node => node.type === 'Text').map(node => node.props.children).join(' | '));
const qr = find(invite.render(), node => node.type === 'QR'); assert(qr.props.value.startsWith('householdenergymobile://join?token=')); assert(!qr.props.value.includes(household.settings.profile.email));
press(invite.render(), 'Copy invitation link'); await Promise.resolve(); assert.equal(copiedInvitation, qr.props.value);
const joinRoot = mount(inviteModule.JoinHouseholdScreen, {}).render(); const join = mount(joinRoot.type, joinRoot.props);
find(expand(join.render()), node => node.type === 'TextInput').props.onChangeText(qr.props.value); press(join.render(), 'Check invitation'); tree = expand(join.render()); assert(nodes(tree).some(node => String(node.props?.children).includes('You already belong')));
press(join.render(), 'Scan QR code'); await new Promise(resolve => setImmediate(resolve)); assert(nodes(expand(join.render())).some(node => String(node.props?.children).startsWith('Camera permission denied.')));
cameraAllowed = true; press(join.render(), 'Scan QR code'); await new Promise(resolve => setImmediate(resolve)); find(join.render(), node => node.type === 'Camera').props.onBarcodeScanned({ data: qr.props.value }); assert(household.settings.pendingInvitation);
press(join.render(), 'Preview as a new member'); press(join.render(), 'Join household'); assert(nodes(expand(join.render())).some(node => node.props?.children === 'Join preview complete'));
press(invite.render(), 'Revoke invitation'); assert.equal(household.settings.household.invitation.revoked, true);
console.log('Passed inbox and invitation handlers: read filtering/empty state, device route, QR token-only payload, copying, manual fallback, already joined, camera-denied fallback, explicit local join preview and revocation. Physical camera scanning is not covered.');

const planTree = expand(screenFor('subscription').render()); const exactPlans = load('src/data/plans.ts').plans; for (const feature of [...exactPlans.free.features, ...exactPlans.plus.features]) assert(nodes(planTree).some(node => node.type === 'Text' && node.props.children === feature));
const consentTree = expand(screenFor('privacy').render()); assert.equal(find(consentTree, node => node.type === 'Toggle' && node.props.label === 'Contribute data to research').props.value, false);
household.settings.household.owner = 'member-2'; const memberPrivacy = expand(screenFor('privacy').render()); assert.equal(find(memberPrivacy, node => node.type === 'Toggle' && node.props.label === 'Contribute data to research').props.disabled, true); const memberHousehold = expand(screenFor('household').render()); assert(!nodes(memberHousehold).some(node => node.props?.label?.includes('role')));
const updatedHome = mount(load('src/components/energy/home-screen.tsx').default, {}).render(); find(updatedHome, node => node.props?.label?.startsWith('Notifications,')).props.onPress(); assert.equal(navigation.at(-1), '/notifications');
const profileLanding = mount(load('src/components/energy/profile-screen.tsx').default, {}).render(); press(profileLanding, 'Notifications'); assert.equal(navigation.at(-1).params.page, 'notifications');
console.log('Passed exact plan inclusion rows, research defaults/member restriction, removed role selectors, Home bell inbox route and separate Profile preference route.');
