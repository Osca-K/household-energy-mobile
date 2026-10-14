import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// React Native exposes lazy getters for optional native modules. Importing the
// theme facade must not evaluate them, even when its exports are enumerated.
const native = Object.fromEntries(['View', 'Text', 'TextInput', 'Pressable', 'ScrollView', 'Animated', 'Easing', 'KeyboardAvoidingView', 'Modal', 'PanResponder', 'Platform', 'StyleSheet', 'useWindowDimensions'].map(name => [name, {}]));
for (const name of ['PushNotificationIOS', 'Clipboard', 'ProgressBarAndroid']) {
  Object.defineProperty(native, name, { enumerable: true, get() { throw Error(`Unavailable Expo Go module: ${name}`); } });
}
const source = fs.readFileSync('src/design/themed-native.tsx', 'utf8');
assert(!/export\s+\*\s+from\s+['"]react-native['"]/.test(source));
assert(!/import\s+\*\s+as\s+\w+\s+from\s+['"]react-native['"]/.test(source));
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, require(name) {
  if (name === 'react-native') return native;
  if (name === 'react') return { forwardRef: render => render };
  if (name === './appearance') return { useAppearance: () => ({ style: value => value, color: value => value }) };
  if (name === 'react/jsx-runtime') return {};
  throw Error(`Unexpected import: ${name}`);
} });
assert(Object.values(module.exports).length > 0);
assert.equal(module.exports.Platform, native.Platform);
console.log('Passed Expo Go lazy-module regression: theme imports and exports do not access unsupported native getters.');
