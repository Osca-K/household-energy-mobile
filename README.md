# Household energy mobile prototype

Expo SDK 57 / React Native application with Home, Usage, Devices, Add/Edit Device, device usage, AI landing and a focused conversation route. The approved Home layout and original bundled appliance illustrations are reused.

## Run

```powershell
npm install
npx expo start --web --port 8082
```

Web preview: http://localhost:8082. Expo serves the same React Native components on web, iOS and Android.

## Checks

```powershell
npm run lint
npx tsc --noEmit
npm run check:prototype
npx expo export --platform all
```

The prototype check covers period totals, tariff conversions, device/room/chart reconciliation, state duration totals, future/offline readings, overnight schedules, overlapping On/Scheduled counts, form validation and add/edit defaults, and chat prompt deduplication/history. Bundle export checks compilation; it is not iOS/Android device testing.

## Local data and behavior

- Devices, budgets, schedules, reminders and conversation history share local state, persisted with AsyncStorage. A save failure leaves current session state intact and offers retry.
- Device enabled controls household inclusion. Power controls update the local status snapshot. Scheduled mode applies enabled repeating slots; other modes retain schedule drafts without applying them. Overnight ranges are supported.
- Historical sample readings are deterministic completed days through the stored reference date. These are separate from the local power snapshot and do not change when settings are edited. Newly added devices explicitly have no historical readings.
- The smart meter represents known appliance totals, so it is excluded from household breakdown sums. Missing readings produce unknown consumption, not zero. Household totals are labelled known subtotals when incomplete.
- Today charts show quarter-hour power in kW or interval cost; week/month power is mean kW over known hours. Energy totals and calendar entries use kWh. Cost is calculated with the illustrative tariff of R28.65 / 18.7 kWh.
- Label photo selection uses the system camera/photo picker and clearly labelled demo field population. There is no OCR. Meter scanning and top-up remain UI-only placeholders.
- The assistant uses local canned demo responses. Direct entry shows only a greeting or existing history; selected prompts submit once. Contextual schedule/device/budget actions navigate to existing screens. Reminders are saved locally and do not trigger notifications.
- No backend, authentication, purchases, real hardware controls or AI service are connected.

## Manual review

On a narrow phone viewport, check all tabs, scroll clearance above navigation, icon/category swipe and arrow controls, typed-name preservation, specifications and units, multiple schedules and overnight ranges, save/edit persistence, device details/date controls, period and Energy/Cost selectors, AI recommendation carousel, direct chat focus, prompt entry, message sending, back navigation and keyboard clearance. Camera permissions and native keyboard/safe-area behavior need physical-device or emulator review.
