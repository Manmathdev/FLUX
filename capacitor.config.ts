import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — wraps this single-page web app into a native Android app
 * WITHOUT changing any UI code.
 *
 * Build the web assets first (npm run build), then generate the native project:
 *
 *   npx cap add android      # creates the native android/ project (one-time)
 *   npx cap sync             # copies dist/ into the native app + applies plugins
 *   npx cap open android     # opens Android Studio → Run / Build APK / Build AAB
 *
 * The app icon lives at resources/icon.png — generate all densities with:
 *   npm i -D @capacitor/assets && npx @capacitor/assets generate
 */
const config: CapacitorConfig = {
  appId: "app.flux.productivity",
  appName: "FLUX",
  webDir: "dist",
  backgroundColor: "#000000",
  android: {
    backgroundColor: "#000000",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#000000",
      overlaysWebView: true,
    },
  },
};

export default config;
