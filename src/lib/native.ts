import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";

/**
 * Native (Android via Capacitor) integration.
 *
 * EVERYTHING in this module is a no-op when running in a regular browser
 * (the web build / preview), so the web app behaves exactly as before. Only
 * inside the native Android shell does it configure the status bar and wire up
 * the hardware Back button — no UI code is touched.
 */

/**
 * Priority stack of Back-button consumers. Last registered = highest priority,
 * so a freshly-opened modal takes the press before view navigation. Returns an
 * unsubscribe function for effect cleanup.
 */
const backStack: Array<() => boolean> = [];

export function registerBackHandler(fn: () => boolean): () => void {
  backStack.push(fn);
  return () => {
    const i = backStack.indexOf(fn);
    if (i >= 0) backStack.splice(i, 1);
  };
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

let initialized = false;

export async function initNative(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Web build / browser preview → nothing to do, keep behaviour identical.
  if (!Capacitor.isNativePlatform()) return;

  // Status bar: pure black background with light icons to match the dark,
  // cinematic UI. (overlaysWebView:false keeps content below the status bar,
  // so the layout is pixel-identical to the web app.)
  // Status bar floats over the full-bleed video (overlaysWebView:true). Use
  // light (white) icons so they read against the dark cinematic background.
  // The actual UI is pushed below the status bar via safe-area-inset (see CSS),
  // so nothing overlaps the notification/status bar.
  try {
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    /* plugin unavailable — ignore */
  }

  // Hardware Back button: let open modals / view navigation consume it first;
  // only fall through to exiting the app (standard Android behaviour).
  try {
    await CapApp.addListener("backButton", () => {
      for (let i = backStack.length - 1; i >= 0; i--) {
        try {
          if (backStack[i]()) return;
        } catch {
          /* ignore a faulty handler */
        }
      }
      CapApp.exitApp();
    });
  } catch {
    /* plugin unavailable — ignore */
  }
}
