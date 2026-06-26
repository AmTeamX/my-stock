"use client";

import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

interface SettingsState {
  enabled: boolean;
  threshold: number;
  recipientUserIds: string[];
  notifyAllGroupMembers: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    enabled: true,
    threshold: 10,
    recipientUserIds: [],
    notifyAllGroupMembers: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setMessage("✅ บันทึกการตั้งค่าสำเร็จ");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pb-24">
        <div className="header-app">
          <h1 className="text-3xl font-extrabold tracking-tight">ตั้งค่า</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-4xl mb-4 opacity-40">⚙️</span>
          <p className="text-muted font-medium">กำลังโหลด...</p>
        </div>
        <BottomNav current="settings" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="header-app">
        <h1 className="text-3xl font-extrabold tracking-tight">ตั้งค่า</h1>
        <p className="text-sm text-white/75 mt-1">
          จัดการการแจ้งเตือนสต็อกใกล้หมด
        </p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* แจ้งเตือนฉัน */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">
              🔔 แจ้งเตือนฉันถ้าของใกล้หมด
            </p>
            <p className="text-xs text-muted mt-0.5">
              {settings.enabled
                ? "คุณจะได้รับข้อความเมื่อสต็อกเหลือน้อยกว่าเกณฑ์ที่กำหนด"
                : "เปิดเพื่อรับการแจ้งเตือนเมื่อของใกล้หมด"}
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, enabled: !settings.enabled })
            }
            role="switch"
            aria-checked={settings.enabled}
            aria-label="แจ้งเตือนฉันถ้าของใกล้หมด"
            className={`relative w-[3.25rem] h-8 rounded-full transition-colors duration-short ease-out
              focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 ${
                settings.enabled ? "bg-accent" : "bg-rule"
              }`}
          >
            <span
              className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-card transition-transform duration-short ease-out ${
                settings.enabled ? "translate-x-6" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Default Threshold */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-1">🔻 จำนวนขั้นต่ำเริ่มต้น</p>
          <p className="text-xs text-muted mb-4">
            ระบบจะแจ้งเตือนเมื่อของเหลือน้อยกว่าจำนวนนี้
            (แต่ละรายการปรับแยกได้ที่หน้าเพิ่ม Stock)
          </p>
          <input
            type="number"
            className="input-field"
            min={1}
            value={settings.threshold}
            onChange={(e) =>
              setSettings({
                ...settings,
                threshold: Math.max(1, parseInt(e.target.value) || 1),
              })
            }
          />
          <div className="mt-3 p-3 bg-accent-bg rounded-lg border border-accent/10">
            <p className="text-xs text-ink-2 leading-relaxed">
              💡 แต่ละรายการตั้งค่าแยกกันได้ ไปที่หน้า เพิ่ม Stock
              เพื่อกำหนดจำนวนขั้นต่ำของแต่ละรายการ เช่น ถุงมือ 10 กล่อง,
              เข็มฉีดยา 50 ชิ้น
            </p>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full text-base"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm font-medium text-center ${
              message.startsWith("✅")
                ? "bg-success-bg text-success border border-success/20"
                : message.startsWith("⚠️")
                  ? "bg-warning-bg text-warning border border-warning/20"
                  : "bg-danger-bg text-danger border border-danger/20"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <BottomNav current="settings" />
    </div>
  );
}
