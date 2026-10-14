# Meter photo review and portable iPhone demo

Home and Usage now open `/scan-meter`. Take a photo or choose an existing one,
choose total kWh / remaining units / rand credit, review the image and enter or
select the reading, then explicitly confirm. Values are not silently accepted.
The record stores `scannedAt` (photo added to this flow), `confirmedAt`, reading
type/unit and a private document-directory photo copy on mobile. Both times use
UTC ISO strings in storage and are shown in SAST, including seconds. Choosing an
older photo does not pretend its original capture time was the scan time.

Records use the existing household AsyncStorage persistence. They do not replace
illustrative charts, budgets or prepaid balances, and cumulative meter readings
are not treated as interval consumption. Web stores reading/time but cannot keep
temporary browser image URLs across sessions. There is no server photo upload.

Expo Go supports camera/photo review and manual confirmation. Where the native
ML Kit module is installed, the same local recognizer offers kWh/rand candidates.
Multiple numbers require a choice; recognised text can be inspected. Serial IDs,
dates, tariff/rate lines and account numbers are not used as reading candidates.
Physical camera/OCR accuracy and on-device persistence still require phone tests.

Run `npm run check:meter`, lint, TypeScript, prototype and appliance OCR checks.
The meter check covers negative/invalid/zero/decimal values, serial/rate filtering,
camera cancellation/denial, confirmation, duplicate prevention, timestamps and
serialisation. It uses component mocks, not physical camera hardware.

## Laptop-free Expo Go preview

Published to EAS Update's separate `expo-go-demo` branch (iOS), 14 October 2026.
No production channel was changed. The UI uses optional native OCR detection, so
the custom module being absent in Expo Go keeps manual entry working.

- Open: `exp://u.expo.dev/update/01a13a0a-1e7b-7c87-81f4-98bd038d96dc`
- QR: `expo-go-hosted-demo-qr.png` in the project root
- Dashboard: https://expo.dev/accounts/osca/projects/household-energy-mobile/updates/f197a075-30e4-47f5-ad0b-d35e67747821
- Runtime: 1.0.0, SDK 57; matching Expo Go required.

Scan the QR with the iPhone camera and open Expo Go. The bundle/assets come from
Expo hosting, not Metro, localhost or a Cloudflare tunnel. Use internet to load
the preview before presenting it. Completely offline re-opening is not verified
or guaranteed; a standalone signed preview build is the reliable offline route.
Apple membership is not required for the Expo Go UI preview. ML Kit itself still
needs the signed native development/preview app on iPhone.

This URL pins this update. Future UI changes need a new EAS Update publish and
updated link/QR. To publish another UI preview:

```powershell
npx eas-cli@latest update --branch expo-go-demo --platform ios --message "UI preview" --environment preview --non-interactive --input-dir .expo/hosted-demo
```
