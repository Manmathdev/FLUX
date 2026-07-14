# FLUX — Native Android build

FLUX is wrapped into a native Android app with **Capacitor**, so the entire
React + Tailwind UI ships unchanged inside a native shell. The web app stays a
first-class build target (it runs identically in a browser), and the native
integration code (`src/lib/native.ts`) is a complete no-op on the web.

## Fastest path to an APK (one command)

```bash
bash build-android.sh
```

This runs the whole pipeline (build web → icon → add android → sync → gradle
APK) and prints the path to the finished file. Then:

```bash
# install on a device with USB debugging enabled
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

> The build environment that serves this project only runs `npm run build`
> (no Android SDK/Gradle), so the APK must be compiled locally — hence this
> script. Prereqs: Node 18+ and Android Studio (provides the Android SDK + JDK).

## Manual one-time setup

```bash
npm install                 # install deps (Capacitor is already in package.json)
npm run build               # build the web app into dist/
npx cap add android         # generates the native android/ project (once only)
```

## Generate the app icon

A source icon is provided at `resources/icon.png`. Generate every Android
density from it:

```bash
npm install -D @capacitor/assets
npx @capacitor/assets generate
```

## Run / ship

```bash
npm run build               # rebuild web assets after any change
npx cap sync                # copy dist/ + plugins into the native project
npx cap open android        # open in Android Studio
```

From Android Studio: **Run** on a device/emulator, or
**Build → Build Bundle(s) / APK(s) → Build APK(s)** to produce an installable
`.apk` (or `.aab` for the Play Store).

## What the native layer adds (web unchanged)

- **Status bar** — pure black background with light icons, matching the dark UI
  (`@capacitor/status-bar`, configured in `capacitor.config.ts` + `src/lib/native.ts`).
- **Splash screen** — brief black splash, no white flash.
- **Hardware Back button** — closes any open modal first, then returns to Home,
  then exits the app (priority stack in `src/lib/native.ts`).
- **App feel** — overscroll/bounce disabled, no zoom/tap highlight.
- **Self-contained data** — Tasks / Habits / Notes still persist locally in the
  WebView's storage, exactly as on web.

> `capacitor.config.ts` sets `overlaysWebView: false`, so the layout sits below
> the status bar and is pixel-identical to the web version.
