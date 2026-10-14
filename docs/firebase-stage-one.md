# Firebase stage one

## Connected native configuration

The supplied Android and iOS files were verified against project **luma-71714** and identifier **com.osca.householdenergymobile** on both platforms. They are stored at the expected local paths and ignored by Git. The user-created database is `(default)` in `africa-south1`, on Spark with scheduled backups disabled.

Use `development-firebase` for the configured Android development APK: `npx eas-cli@latest build --platform android --profile development-firebase`. This profile enables native Firebase explicitly. `.easignore` includes the two native configuration files in the authorized EAS build archive while `.gitignore` continues excluding them from commits. Regular trial/Expo Go configuration remains disabled.

Android build requested: [cb16cd66-7d9c-4ffe-829e-d3c4980bf34d](https://expo.dev/accounts/osca/projects/household-energy-mobile/builds/cb16cd66-7d9c-4ffe-829e-d3c4980bf34d). Once it finishes successfully, open this page on Android and install its APK (allow installation from the browser when Android asks). Do not open the APK in Expo Go. For development, run `npx expo start --dev-client` in this repository with `ENABLE_NATIVE_FIREBASE=1` so Metro's manifest also enables Firebase. If LAN access times out, use your existing approved tunnel workflow. Production authentication has not been tested on a device yet.

Connected configuration checks: both identifiers and project IDs verified, native Android prebuild successful, generated app contains the real Android configuration and Google Services plugin. Lint, TypeScript, repository/prototype/OCR tests, Auth emulator and 21 security-rule cases passed. Expo Doctor passed 20/21 checks; its remaining warning recommends seven newer SDK 57 patch versions. No SDK downgrade or dependency update was applied to the submitted build.

The production deployment command targets only this project and only rules/indexes: `npx firebase deploy --only firestore:rules,firestore:indexes --project luma-71714`. It requires Firebase CLI login with an authorized account. No authentication success is established by config validation, emulator tests or cloud compilation; test registration, verification, sign-in/out, recovery and account isolation in the installed APK.

Deployment verified on 14 October 2026: restricted `firestore.rules` compiled and was released to `cloud.firestore`; `firestore.indexes.json` deployed successfully for `(default)`. No optional services or billing were enabled. The index file intentionally contains no composite indexes because current stage-one queries do not require any.

A subsequent unauthenticated REST request to list household documents returned HTTP 403 `PERMISSION_DENIED`. This verifies denied unauthenticated production access; it is not a test of live client authentication or native cache isolation.

Android native compilation succeeded on EAS (`BUILD SUCCESSFUL`, 20 minutes), including Firebase App/Auth/Firestore with the installed Expo 57 / React Native 0.86.3 versions. Live authentication/cache testing remains pending on a physical Android device. ADB was initially unavailable on PATH and was subsequently located in the Android Studio SDK for the emulator installation below.

### Android Studio emulator installation

The APK was subsequently installed successfully on `Medium_Phone_API_37.0` (`emulator-5554`). ADB was located under `%LOCALAPPDATA%\Android\Sdk\platform-tools` despite not being on PATH. Metro runs with native Firebase enabled on port 8090; the app's login screen was observed in the emulator. This verifies installation, launch and bundle delivery, not successful Firebase authentication.

To repeat the connection after restarting the computer, start the emulator in Android Studio, then run these commands from the project folder:

```powershell
$env:ENABLE_NATIVE_FIREBASE='1'
npx expo start --dev-client --lan --port 8090
```

In a second PowerShell terminal:

```powershell
$adbPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adbPath -s emulator-5554 reverse tcp:8090 tcp:8090
& $adbPath -s emulator-5554 shell am start -a android.intent.action.VIEW -d 'exp+household-energy-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8090' com.osca.householdenergymobile
```

Port forwarding connects directly through ADB, so this emulator connection does not require a public tunnel. `--lan` allows Metro to accept IPv4; `--localhost` resolved only to IPv6 on this Windows setup. The retained local APK is `.expo/apks/firebase-emulator.apk` (ignored by Git).

Native dependencies: React Native Firebase app/auth/firestore 26.4.0, Expo SDK 57 and React Native 0.86.3. The Firebase project/database and genuine native configuration were supplied by the user; no cloud resources, billing or fabricated configuration were created by this implementation.

## Storage and security

- Trial mode uses `LocalTrialRepository` and the existing AsyncStorage key. It does not initialize native Firebase, authenticate anonymously, subscribe to Firestore or upload anything. Web and Expo Go retain local trial/manual scanning.
- Account mode uses native Authentication and `CloudRepository`. Email verification is required for household access. Switching accounts remounts household state; old asynchronous callbacks are invalidated and listeners detached.
- `users/{uid}` contains displayName, email, activeHouseholdId and server timestamps. It is readable only by that UID.
- `households/{id}` contains name, immutable creatorUid and server timestamps. `members/{uid}` contains uid, displayName and joinedAt. Creation of household, creator membership and active-household pointer uses one atomic batch.
- `households/{id}/devices/{id}` stores confirmed, whitelisted specifications and schedule settings with authenticated ownership and server timestamps. Creator manages devices; existing members can read. No client may add membership to an existing household or change creator identity.
- Import is opt-in, initially unselected, and limited to confirmed local devices. Seed sample IDs are rejected. New cloud IDs prevent sample-history association. Photos, paths, image payloads, raw OCR text, meter readings, generated history and sessions are never included. Cloud readings remain unavailable.
- Joining, sessions, estimates, notifications and other unfinished shared flows are gated rather than populated with local sample data. Trial functionality stays local.

## Native cache handling

Firestore persistence is explicitly disabled and awaited before the first database operation. Sign-out/account transitions detach listeners, terminate the native Firestore instance, then call native clearPersistence. AsyncStorage clearing is not a substitute. Cache reset failures fail closed for further account access until restart; sign-out still clears application state and returns to trial.

These calls were checked against the installed RNFirebase native implementation (Android Firestore module and iOS RNFBFirestoreModule). Native device tests are still required: sign in as A, load a household, sign out, sign in as B, test offline/online and restart, and confirm A's data is never rendered. Emulator security tests do not prove native cache behavior.

## Firebase Console setup — user action required

1. Select or create your Firebase project when ready. Do not enable Analytics or billing for this stage. No Storage bucket, Functions or anonymous authentication is needed.
2. Project settings > Your apps > Android: register **com.osca.householdenergymobile**. Download the real `google-services.json` to `firebase-config/google-services.json`. Email/password does not require SHA fingerprints.
3. Register the iOS app with bundle identifier **com.osca.householdenergymobile** in the same project. Download the real `GoogleService-Info.plist` to `firebase-config/GoogleService-Info.plist`. Do not rename or fabricate the contents. These files are ignored by Git.
4. Authentication > Get started > Sign-in method: enable Email/Password only. Configure verification and password-reset email templates and your support email. Native verification uses the emailed link followed by the app's verification refresh control.
5. Firestore Database > Create database: choose Native mode, a region suitable for your users, and Production mode. Confirm the free Spark plan remains selected. Do not use open/test rules.
6. After local emulator tests pass, deploy the included rules/indexes to the explicitly selected project: `npx firebase deploy --only firestore:rules,firestore:indexes --project luma-71714`. This deployment completed successfully on 14 October 2026. No `.firebaserc` with an invented project is provided.

## Build and install from Windows

The default configuration deliberately keeps Firebase disabled for trial/Expo Go previews. To enable a native build, supply both real config files and set `ENABLE_NATIVE_FIREBASE=1` while evaluating/building the project. `FIREBASE_ANDROID_CONFIG` and `FIREBASE_IOS_CONFIG` may point to actual EAS file-environment variables. Configure those file variables and the enable flag in the EAS build environment; a local PowerShell variable alone is not guaranteed to reach the remote build worker. Missing files or mismatching app identifiers stop configuration.

The config uses RNFirebase's CocoaPods integration with static frameworks and forced static linking for RNFBApp/RNFBAuth/RNFBFirestore to coexist with the existing ML Kit module. Native projects remain generated by Expo; do not hand-edit ios/android.

- Android: `npx eas-cli@latest build --platform android --profile development`, then install the resulting APK using its EAS link. Start Metro with `npx expo start --dev-client`. This is not Expo Go.
- iPhone: obtain an active paid Apple Developer membership, register your iPhone with `npx eas-cli@latest device:create`, then `npx eas-cli@latest build --platform ios --profile development`. Let EAS configure your genuine signing credentials and install through the resulting link. Windows cannot perform a local Xcode build. Downloading the Apple Developer app alone does not establish paid membership/signing.
- Existing EAS project and application identifiers are preserved. No new project ID or signing identity is invented. Rebuild after adding Firebase native modules/configuration; an OTA JavaScript update is insufficient.

## Local verification

Install Java 21+, then `npm run check:firebase`. It uses only `demo-household-energy`, the local Auth emulator on 9099 and Firestore emulator on 8089. The Web Firebase SDK is a test dependency, not the app backend. Tests cover actual email registration/verification/recovery and 21 Firestore authorization/validation cases, including atomic creator creation, cross-household denial, membership escalation, immutable identity, timestamps and rejected photo/OCR payloads.

Also run `npx expo lint`, `npx tsc --noEmit`, `npm run check:prototype`, `npm run check:ocr`, `npm run check:meter` and the welcome interaction checks. Successful web export verifies the local fallback bundles; it does not verify native Firebase linking. Full Android/iOS compilation, real email delivery and physical account/cache tests require genuine configuration; iOS also requires signing and device access.
