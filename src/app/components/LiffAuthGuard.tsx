"use client";

import { useEffect, useState, useCallback } from "react";
import { initLiff, isLoggedIn, getLiff } from "@/lib/liff";

type AuthState = "loading" | "checking" | "authenticated" | "login-required" | "dev-mode";

export default function LiffAuthGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");

  const checkAuth = useCallback(async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    // Dev mode — no LIFF ID configured
    if (!liffId) {
      setAuthState("dev-mode");
      return;
    }

    try {
      setAuthState("checking");
      await initLiff();

      if (isLoggedIn()) {
        setAuthState("authenticated");
      } else {
        setAuthState("login-required");
      }
    } catch {
      setAuthState("login-required");
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = useCallback(() => {
    const liff = getLiff();
    if (liff) {
      liff.login();
    }
  }, []);

  // — Loading —
  if (authState === "loading" || authState === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-8">
        <span className="text-5xl mb-6">📦</span>
        <p className="text-ink font-semibold text-lg">MyStock</p>
        <p className="text-muted text-sm mt-1">กำลังตรวจสอบ...</p>
      </div>
    );
  }

  // — Dev mode —
  if (authState === "dev-mode") {
    return <>{children}</>;
  }

  // — Not logged in —
  if (authState === "login-required") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-8">
        <span className="text-6xl mb-6">🔐</span>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight text-center">
          กรุณาเข้าสู่ระบบด้วย LINE
        </h1>
        <p className="text-muted text-sm mt-2 text-center leading-relaxed max-w-xs">
          ระบบนี้ใช้ได้เฉพาะใน LINE เท่านั้น
          กดปุ่มด้านล่างเพื่อยืนยันตัวตน
        </p>
        <button onClick={handleLogin} className="btn-primary mt-8 text-base px-10">
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    );
  }

  // — Authenticated —
  return <>{children}</>;
}
