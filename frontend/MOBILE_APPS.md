# Turning ChatApp into Android & iOS apps

The UI is now fully responsive (phone + desktop), which is what makes this
possible. To ship real installable apps on the Play Store / App Store, wrap
this same React app with **Capacitor** — it packages your existing `dist`
build into a native shell and gives you native APIs (push notifications,
camera, etc.) if you need them later. No rewrite required.

A `capacitor.config.ts` is already included in this project. These steps run
on your own machine (they need Android Studio / Xcode, which aren't available
in this sandboxed environment).

## 1. Install Capacitor

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

## 2. Add the native platforms

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

This creates `android/` and `ios/` folders in the project root — real native
projects you can open in Android Studio / Xcode.

## 3. Build the web app and sync it into the native shells

```bash
npm run cap:sync
```

(This runs `vite build` then `npx cap sync`, copying `dist/` into both native
projects and installing any native plugins.)

## 4. Open and run

```bash
npm run cap:android   # opens Android Studio
npm run cap:ios       # opens Xcode (macOS only)
```

From there, press Run to launch on a simulator/emulator or a plugged-in
device, exactly like any native app.

## Things specific to this app to check before shipping

- **Sockets & API base URL** — `src/api/index.ts` and the socket hooks likely
  point at `localhost` or a relative path during dev. Native apps have no
  "current origin," so make sure the base URL is a fixed `https://` address
  to your backend before building.
- **Calling (VideoSDK)** — camera/mic permissions need native entries:
  - Android: add `CAMERA` and `RECORD_AUDIO` to
    `android/app/src/main/AndroidManifest.xml`.
  - iOS: add `NSCameraUsageDescription` and `NSMicrophoneUsageDescription`
    to `ios/App/App/Info.plist`.
- **Push notifications for incoming calls/messages** — the web app currently
  relies on the socket connection staying open, which native OSes suspend in
  the background. For real "incoming call while phone is locked" behavior,
  add `@capacitor/push-notifications` (or CallKit/ConnectionService on
  iOS/Android) — this is the one piece that genuinely needs native code, not
  just responsive CSS.
- **Safe areas** — already handled in the CSS/inline styles added in this
  pass (`env(safe-area-inset-*)`), so notches/home-indicators on iOS will
  look correct automatically.

## A lighter-weight alternative: installable PWA

If you don't need the App Store / Play Store listing, the app is already
installable as a **Progressive Web App** — `manifest.json` and the meta tags
in `index.html` are configured for it. On a phone, visiting the deployed site
and choosing "Add to Home Screen" gives a full-screen, app-like icon with no
native wrapping step at all. This won't get you push notifications or a
store listing, but it's zero extra setup.
