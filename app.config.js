const fs = require('node:fs');
const path = require('node:path');
module.exports = ({ config }) => {
  const android = process.env.FIREBASE_ANDROID_CONFIG || './firebase-config/google-services.json';
  const ios = process.env.FIREBASE_IOS_CONFIG || './firebase-config/GoogleService-Info.plist';
  const enabled = process.env.ENABLE_NATIVE_FIREBASE === '1';
  const managed = new Set(['@react-native-firebase/app', '@react-native-firebase/auth', 'expo-build-properties']);
  const plugins = (config.plugins || []).filter(plugin => !managed.has(Array.isArray(plugin) ? plugin[0] : plugin));
  if (!enabled) return { ...config, plugins, extra: { ...config.extra, nativeFirebaseEnabled: false } };
  // Do not invent native Firebase configuration or silently build a half-configured app.
  for (const file of [android, ios]) if (!fs.existsSync(path.resolve(file))) throw new Error(`Missing Firebase configuration: ${file}. Follow docs/firebase-stage-one.md; use local trial builds until configured.`);
  const a = JSON.parse(fs.readFileSync(android, 'utf8'));
  if (!a.client?.some(client => client.client_info?.android_client_info?.package_name === config.android.package)) throw new Error('Firebase Android package does not match app.json.');
  const plist = fs.readFileSync(ios, 'utf8');
  const plistString = key => plist.match(new RegExp(`<key>\\s*${key}\\s*</key>\\s*<string>([^<]+)</string>`))?.[1];
  if (plistString('BUNDLE_ID') !== config.ios.bundleIdentifier) throw new Error('Firebase iOS bundle ID does not match app.json.');
  if (!a.project_info?.project_id || plistString('PROJECT_ID') !== a.project_info.project_id) throw new Error('Android and iOS Firebase files must belong to the same project.');
  return {
    ...config, android: { ...config.android, googleServicesFile: android }, ios: { ...config.ios, googleServicesFile: ios },
    plugins: [...plugins, ['@react-native-firebase/app', { ios: { disableSPM: true } }], '@react-native-firebase/auth',
      ['expo-build-properties', { ios: { useFrameworks: 'static', forceStaticLinking: ['RNFBApp', 'RNFBAuth', 'RNFBFirestore'] } }]],
    extra: { ...config.extra, nativeFirebaseEnabled: true },
  };
};
