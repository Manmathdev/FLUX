#!/usr/bin/env bash
# ============================================================================
#  FLUX — produce a native Android APK in one command.
#
#  Why a script, not a ready .apk? The build environment that serves this
#  project only runs the web build (npm run build); it has no Android SDK /
#  Gradle, so the binary must be compiled on your machine. This script automates
#  the entire path so you only run:
#
#      bash build-android.sh
#
#  Prereqs (one-time): Node 18+, and Android Studio (installs the Android SDK +
#  a JDK). Accept the SDK licenses in Android Studio's first-run wizard.
#
#  Result: android/app/build/outputs/apk/debug/app-debug.apk
# ============================================================================
set -euo pipefail

echo "==> 1/6  Building the web app (dist/)"
npm run build

echo "==> 2/6  Installing the icon/splash generator (dev only)"
npm install -D @capacitor/assets || true

echo "==> 3/6  Generating native icon + splash from resources/"
# Cosmetic only — never abort the build if assets are missing/incomplete.
npx @capacitor/assets generate --icon --splash || echo "    (skipped — using default icon)"

echo "==> 4/6  Adding the Android platform (first run only)"
if [ ! -d "android" ]; then
  npx cap add android
else
  echo "    (android/ already exists — skipping)"
fi

echo "==> 5/6  Syncing web assets + Capacitor plugins into the native project"
npx cap sync android

echo "==> 5b/6 Installing Kotlin stdlib duplicate-class fix (Gradle init script)"
mkdir -p ~/.gradle/init.d
cp .github/gradle/kotlin-stdlib-fix.gradle ~/.gradle/init.d/

echo "==> 6/6  Compiling the debug APK with Gradle"
cd android
chmod +x gradlew
./gradlew assembleDebug
cd ..

APK="android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "============================================================================"
echo "  ✅  BUILD COMPLETE"
if [ -f "$APK" ]; then
  echo "  Your APK is ready at:"
  echo "    $APK"
  echo ""
  echo "  Install it on a connected device (USB debugging on) with:"
  echo "    adb install -r $APK"
else
  echo "  Gradle finished but $APK was not found — check the output above."
fi
echo "============================================================================"
