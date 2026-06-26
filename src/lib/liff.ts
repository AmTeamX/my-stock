"use client";

import liff from "@line/liff";
import { LineProfile } from "@/types";

let liffInitialized = false;

export async function initLiff(): Promise<void> {
  if (liffInitialized) return;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
  if (!liffId) {
    console.warn("NEXT_PUBLIC_LIFF_ID not set - running in dev mode");
    return;
  }

  try {
    await liff.init({ liffId });
    liffInitialized = true;
  } catch (error) {
    console.error("LIFF init failed:", error);
    throw error;
  }
}

export function getLiff() {
  return liff;
}

export function isLoggedIn(): boolean {
  if (!liffInitialized) return false;
  return liff.isLoggedIn();
}

export function isInClient(): boolean {
  if (!liffInitialized) return false;
  return liff.isInClient();
}

export async function getProfile(): Promise<LineProfile | null> {
  if (!liffInitialized || !liff.isLoggedIn()) return null;

  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };
  } catch {
    return null;
  }
}

export function closeWindow(): void {
  if (liffInitialized) {
    liff.closeWindow();
  }
}

export async function openWindow(url: string): Promise<void> {
  if (liffInitialized) {
    await liff.openWindow({ url, external: false });
  }
}

// Open LIFF in external browser if not in LINE
export function getOS(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;
  if (ua.includes("iPhone") || ua.includes("iPad")) return "ios";
  if (ua.includes("Android")) return "android";
  return "web";
}

// Simulated LIFF functions for development/testing
export function getMockProfile(): LineProfile {
  return {
    userId: "Udev_" + Math.random().toString(36).substring(2, 8),
    displayName: "Test User",
    pictureUrl: "",
    statusMessage: "DEV MODE",
  };
}
