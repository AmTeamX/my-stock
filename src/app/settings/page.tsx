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
  const [newUserId, setNewUserId] = useState("");
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

  const addRecipient = () => {
    const trimmed = newUserId.trim();
    if (!trimmed) return;
    if (settings.recipientUserIds.includes(trimmed)) {
      setMessage("⚠️ มี User ID นี้อยู่แล้ว");
      return;
    }
    setSettings({
      ...settings,
      recipientUserIds: [...settings.recipientUserIds, trimmed],
    });
    setNewUserId("");
  };

  const removeRecipient = (userId: string) => {
    setSettings({
      ...settings,
      recipientUserIds: settings.recipientUserIds.filter((id) => id !== userId),
    });
  };

  if (loading) {
    return (
      <div className="pb-24">
        <div className="header-app">
          <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
            ตั้งค่า
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-4xl mb-4 opacity-40">⚙️</span>
          <p className="text-muted font-medium font-[family-name:var(--font-body)]">
            กำลังโหลด...
          </p>
        </div>
        <BottomNav current="settings" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="header-app">
        <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
          ตั้งค่า
        </h1>
        <p className="text-sm text-white/75 mt-1 font-[family-name:var(--font-body)]">
          จัดการการแจ้งเตือนสต็อกใกล้หมด
        </p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Enable/Disable */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink font-[family-name:var(--font-body)]">
              เปิดการแจ้งเตือน
            </p>
            <p className="text-xs text-muted mt-0.5 font-[family-name:var(--font-body)]">
              ส่งข้อความเมื่อของใกล้หมด
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, enabled: !settings.enabled })
            }
            role="switch"
            aria-checked={settings.enabled}
            aria-label="เปิดการแจ้งเตือน"
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
          <p className="font-semibold text-ink mb-3 font-[family-name:var(--font-body)]">
            ค่าเริ่มต้นจำนวนขั้นต่ำสำหรับรายการใหม่
          </p>
          <p className="text-xs text-muted mb-3 font-[family-name:var(--font-body)]">
            ค่านี้จะถูกใช้เมื่อเพิ่มรายการใหม่ เปลี่ยนทีหลังได้ที่หน้าเพิ่ม
            Stock
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
            <p className="text-xs text-ink-2 leading-relaxed font-[family-name:var(--font-body)]">
              💡 แต่ละรายการตั้งค่าแยกกันได้ ไปที่หน้า เพิ่ม Stock
              เพื่อกำหนดจำนวนขั้นต่ำของแต่ละรายการ
            </p>
          </div>
        </div>

        {/* Notify all */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink font-[family-name:var(--font-body)]">
              แจ้งเตือนทุกคนในกลุ่ม
            </p>
            <p className="text-xs text-muted mt-0.5 font-[family-name:var(--font-body)]">
              ส่งข้อความไปยังทุกคนในรายชื่อด้านล่าง
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                notifyAllGroupMembers: !settings.notifyAllGroupMembers,
              })
            }
            role="switch"
            aria-checked={settings.notifyAllGroupMembers}
            aria-label="แจ้งเตือนทุกคนในกลุ่ม"
            className={`relative w-[3.25rem] h-8 rounded-full transition-colors duration-short ease-out
              focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 ${
                settings.notifyAllGroupMembers ? "bg-accent" : "bg-rule"
              }`}
          >
            <span
              className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-card transition-transform duration-short ease-out ${
                settings.notifyAllGroupMembers
                  ? "translate-x-6"
                  : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Recipients */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-2 font-[family-name:var(--font-body)]">
            ผู้รับการแจ้งเตือน
          </p>
          <p className="text-xs text-muted mb-4 font-[family-name:var(--font-body)]">
            เพิ่ม LINE User ID ของคนที่ต้องการให้ได้รับข้อความแจ้งเตือน
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="input-field flex-1 text-sm font-[family-name:var(--font-mono)]"
              placeholder="LINE User ID (เช่น Uabc123...)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            />
            <button onClick={addRecipient} className="btn-primary text-sm">
              เพิ่ม
            </button>
          </div>

          {settings.recipientUserIds.length === 0 ? (
            <div className="text-center py-6 bg-paper rounded-lg border border-dashed border-rule">
              <p className="text-sm text-muted font-[family-name:var(--font-body)]">
                ยังไม่มีผู้รับการแจ้งเตือน
              </p>
              <p className="text-xs text-muted/70 mt-1 font-[family-name:var(--font-body)]">
                เพิ่ม User ID ด้านบน
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.recipientUserIds.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between bg-paper rounded-lg p-3"
                >
                  <span className="text-sm text-ink font-[family-name:var(--font-mono)] truncate">
                    {userId}
                  </span>
                  <button
                    onClick={() => removeRecipient(userId)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-danger hover:bg-danger-bg transition-colors duration-short ease-out flex-shrink-0 focus-visible:outline-2 focus-visible:outline-focus"
                    aria-label={`ลบ ${userId}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
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
            className={`p-4 rounded-lg text-sm font-medium text-center font-[family-name:var(--font-body)] ${
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

        {/* Info Card */}
        <div className="card bg-accent-bg border border-accent/10 p-5">
          <p className="text-sm text-ink font-semibold mb-2 font-[family-name:var(--font-body)]">
            ℹ️ วิธีการหา LINE User ID
          </p>
          <ol className="text-xs text-ink-2 space-y-1.5 list-decimal list-inside leading-relaxed font-[family-name:var(--font-body)]">
            <li>เข้า LINE Official Account Manager</li>
            <li>ไปที่ Insights → Members</li>
            <li>ค้นหาชื่อผู้ใช้ที่ต้องการ</li>
            <li>คัดลอก User ID มาใส่ที่นี่</li>
          </ol>
        </div>
      </div>

      <BottomNav current="settings" />
    </div>
  );
}
