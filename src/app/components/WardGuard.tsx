"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiffUser } from "./useLiffUser";
import { Ward } from "@/lib/supabase";

const WARD_KEY = "mystock_ward";

export function getStoredWard(): { wardId: string; wardName: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WARD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storeWard(wardId: string, wardName: string) {
  localStorage.setItem(WARD_KEY, JSON.stringify({ wardId, wardName }));
}

export default function WardGuard({ children }: { children: React.ReactNode }) {
  const { userId, userName, ready } = useLiffUser();
  const [step, setStep] = useState<"loading" | "select" | "app">("loading");
  const [wards, setWards] = useState<Ward[]>([]);
  const [newWardName, setNewWardName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadWards = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/wards?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      setWards(data.wards || []);
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    // Check if already selected a ward
    const stored = getStoredWard();
    if (stored) {
      setStep("app");
      return;
    }
    loadWards().then(() => setStep("select"));
  }, [ready, userId, loadWards]);

  const handleCreate = async () => {
    const name = newWardName.trim();
    if (!name) { setError("กรุณากรอกชื่อวอร์ด"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      storeWard(data.ward.id, data.ward.name);
      setStep("app");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError("กรุณากรอกรหัสวอร์ด"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      storeWard(data.ward.id, data.ward.name);
      setStep("app");
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleSelectExisting = (ward: Ward) => {
    storeWard(ward.id, ward.name);
    setStep("app");
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-8">
        <span className="text-5xl mb-6">📦</span>
        <p className="text-ink font-semibold text-lg">MyStock</p>
        <p className="text-muted text-sm mt-1">กำลังโหลด...</p>
      </div>
    );
  }

  if (step === "app") {
    return <>{children}</>;
  }

  // Step: select/create ward
  return (
    <div className="min-h-screen bg-paper">
      <div className="header-app text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">📦 MyStock</h1>
        <p className="text-sm text-white/75 mt-1">เลือกวอร์ดของคุณ</p>
      </div>

      <div className="px-4 mt-6 space-y-4 max-w-md mx-auto">
        {/* Existing wards */}
        {wards.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink-2 mb-2">วอร์ดของคุณ</p>
            <div className="space-y-2">
              {wards.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectExisting(w)}
                  className="card w-full text-left flex items-center justify-between p-4 hover:border-accent transition-colors duration-short ease-out"
                >
                  <span className="font-semibold text-ink">{w.name}</span>
                  <span className="text-xs text-muted">เข้าใช้ →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create new ward */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-3">🏥 สร้างวอร์ดใหม่</p>
          <input
            className="input-field mb-3"
            placeholder="ชื่อวอร์ด (เช่น วอร์ด 3, ICU...)"
            value={newWardName}
            onChange={(e) => setNewWardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} disabled={busy} className="btn-primary w-full">
            {busy ? "กำลังสร้าง..." : "สร้างวอร์ด"}
          </button>
        </div>

        {/* Join existing ward */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-3">🔗 เข้าร่วมวอร์ดที่มีอยู่แล้ว</p>
          <input
            className="input-field mb-3"
            placeholder="รหัสวอร์ด (เช่น ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={6}
          />
          <button onClick={handleJoin} disabled={busy} className="btn-primary w-full">
            {busy ? "กำลังเข้าร่วม..." : "เข้าร่วมวอร์ด"}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-danger-bg text-danger rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
