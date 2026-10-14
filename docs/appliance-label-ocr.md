# Appliance-label OCR

The existing Add/Edit Device form captures a photo with expo-image-picker and calls
the local `ApplianceLabelOcr` Expo module. Both platforms use Google's bundled
Latin recognizer (Android `com.google.mlkit:text-recognition:16.0.1`, iOS
`GoogleMLKit/TextRecognition` 8.0.0). No photo is uploaded by this feature and no
cloud key is required. The bundled models are intended to work from first use
offline; physical-device verification is still required.

## Integration decision and checks

- Expo remains 57.0.27; React Native remains 0.86.3.
- The published Infinite Red wrapper installed as 5.0.1. Its Android Gradle script
  applies `expo-modules-core/ExpoModulesCorePlugin.gradle`, which is absent in SDK
  57. It also includes older core dependencies. It was evaluated and removed.
- A small project-owned Expo module uses the current `expo-module-gradle-plugin`
  convention, as used by this SDK's expo-camera, and the official Google native
  APIs. This avoids downgrading or patching third-party node_modules.
- Android prebuild completed. Expo autolinking resolves the local Kotlin module
  and iOS pod/Swift module. These checks are NOT native compilation tests.
- Local Android compilation is unavailable because Java/JAVA_HOME and the Android
  SDK are not configured. EAS Android development build subsequently PASSED on
  13 October 2026 (build 572727c1-42ed-44ca-8d82-215019a88771), including the local
  OCR Kotlin module and bundled Latin ML Kit dependency. The initial Gradle
  versionName configuration failure was corrected. Physical OCR remains untested.
- Expo dependency checking also reports available patch updates for expo, @expo/ui,
  expo-crypto, expo-router and expo-splash-screen. These pre-existing SDK 57
  patch versions were preserved; no Expo or React Native downgrade was made.
- iOS compilation cannot run on this Windows host; Xcode/CocoaPods or EAS is
  required. Android native compilation is verified; iOS native compilation is not.

## Review and extraction

Only explicit input/rated power or power-consumption lines populate W/kW. Bare
wattages, output ratings, capacity, annual kWh and amps do not become input power.
No voltage/current multiplication occurs in OCR. Explicit Brand/Model labels are
accepted; a logo or arbitrary company-looking text is not guessed. Voltage and
frequency support ranges, including 50/60 Hz. Ambiguous multiple candidates do
not auto-populate blank fields. Existing manual values are preserved; choosing a
candidate is an explicit replacement. All results remain editable and must be
confirmed before saving. Original text stays available during the review session.
Photos/text are not retained in the saved device record; confirmed brand/model
and specifications are persisted through the existing local device state.

Web and Expo Go have no native recognizer and show a development-build message.
They keep manual entry and photo selection. Errors, empty text, retry and manual
fallback do not fabricate specifications.

## Install on phones from Windows

1. The app now uses `com.osca.householdenergymobile` for both native identifiers,
   and is linked to the real `osca/household-energy-mobile` EAS project. Apple
   signing still needs to register/confirm this identifier with your team.
2. Sign in to your own Expo account and link/create the real EAS project:

   ```powershell
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```

   Let EAS write the project ID it actually creates. No project ID or credentials
   have been invented or committed. `eas.json` already includes development,
   internal preview and production profiles.
3. Android:

   ```powershell
   npx eas-cli@latest build --platform android --profile development
   ```

   Allow EAS to create/manage an Android signing keystore when asked, or supply
   your existing keystore. Install the resulting APK on your Android phone,
   permitting installation from the download source when requested. A Play Store
   developer account is not required just to install this development APK.
4. iPhone: use your paid Apple Developer membership, select the correct team and
   register your physical device for internal distribution:

   ```powershell
   npx eas-cli@latest device:create
   npx eas-cli@latest build --platform ios --profile development
   ```

   Complete Apple signing/provisioning prompts with your account. Open the EAS
   install link on the registered iPhone. Enable Developer Mode if requested.
   Windows cannot run Xcode locally; a Mac/Xcode is the alternative build path.
5. Start JavaScript development:

   ```powershell
   npx expo start --dev-client --tunnel
   ```

   Open the installed Household Energy development app, not Expo Go. If Expo's
   tunnel fails, reuse the approved public-tunnel approach with a refreshed
   EXPO_PACKAGER_PROXY_URL and development-client launch link. Native dependency
   changes require a new build; JavaScript/form changes normally only need reload.

## Before release

Android native compilation passed. Compile the iOS target and resolve any SDK/ML
Kit toolchain issues before calling iOS native compatibility verified. Test a fresh install in airplane mode
with camera and chosen local photos on both phones. Include blurry/rotated labels,
permission denial, no text, conflicts, edited values and saving/restoring records.
Verify first-use offline OCR in a release-style internal preview build as well:
development builds need Metro to load JavaScript, which is separate from whether
recognition itself needs a network. `preview` embeds the bundle without a dev client.

Run `node scripts/check-label-ocr.mjs`, lint, TypeScript and prototype checks.
Native builds and actual OCR accuracy require the tooling/accounts above.

## Built Android app

Install: https://expo.dev/artifacts/eas/V8NQGymJc7Jp0yk1NtF4ueLexkAN8He3GHv-aKXPPt8.apk

Build: https://expo.dev/accounts/osca/projects/household-energy-mobile/builds/572727c1-42ed-44ca-8d82-215019a88771

For native development, start a new Metro session and use its fresh development-client QR.
Old temporary tunnel QR images have been retired. For the laptop-free Expo Go UI
preview, see meter-scanning-and-demo.md and expo-go-hosted-demo-qr.png. iPhone signing is not configured;
the user has confirmed no paid Apple Developer membership yet.
