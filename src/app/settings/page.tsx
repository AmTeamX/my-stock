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
        <div className="header-green">
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">
              ⚙️ ตั้งค่า
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-[#06C755]/10 rounded-full flex items-center justify-center mb-4 animate-pulse-soft">
            <span className="text-3xl">⚙️</span>
          </div>
          <p className="text-gray-400 font-medium">กำลังโหลด...</p>
        </div>
        <BottomNav current="settings" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="header-green">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">⚙️ ตั้งค่า</h1>
          <p className="text-sm text-white/80 mt-1">
            จัดการการแจ้งเตือนสต็อกใกล้หมด
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Enable/Disable */}
        <div className="card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#06C755]/10 rounded-2xl flex items-center justify-center text-xl">
              🔔
            </div>
            <div>
              <p className="font-semibold text-gray-800">เปิดการแจ้งเตือน</p>
              <p className="text-xs text-gray-400 mt-0.5">
                ส่งข้อความเมื่อของใกล้หมด
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, enabled: !settings.enabled })
            }
            className={`relative w-[3.25rem] h-8 rounded-full transition-all duration-300 ${
              settings.enabled
                ? "bg-gradient-to-r from-[#06C755] to-[#05A84A]"
                : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-all duration-300 ${
                settings.enabled ? "translate-x-6" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Default Threshold */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">
              🔻
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                ค่าเริ่มต้นจำนวนขั้นต่ำ
              </p>
              <p className="text-xs text-gray-400 mt-0.5">สำหรับรายการใหม่</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <input
              type="number"
              className="input-field bg-white"
              min={1}
              value={settings.threshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  threshold: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
            />
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                💡 <strong>แต่ละรายการตั้งค่าแยกกันได้!</strong> ไปที่หน้า
                &quot;เพิ่ม Stock&quot; เพื่อกำหนดจำนวนขั้นต่ำของแต่ละรายการ
              </p>
            </div>
          </div>
        </div>

        {/* Notify all */}
        <div className="card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl">
              👥
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                แจ้งเตือนทุกคนในกลุ่ม
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                ส่งข้อความไปยังทุกคนในรายชื่อด้านล่าง
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({
                ...settings,
                notifyAllGroupMembers: !settings.notifyAllGroupMembers,
              })
            }
            className={`relative w-[3.25rem] h-8 rounded-full transition-all duration-300 ${
              settings.notifyAllGroupMembers
                ? "bg-gradient-to-r from-[#06C755] to-[#05A84A]"
                : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-md transition-all duration-300 ${
                settings.notifyAllGroupMembers
                  ? "translate-x-6"
                  : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>

        {/* Recipients */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <p className="font-semibold text-gray-800">ผู้รับการแจ้งเตือน</p>
              <p className="text-xs text-gray-400 mt-0.5">เพิ่ม LINE User ID</p>
            </div>
          </div>

          {/* Add recipient input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="input-field flex-1 text-sm"
              placeholder="LINE User ID (เช่น Uabc123...)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            />
            <button
              onClick={addRecipient}
              className="btn-primary text-sm py-2.5 px-5"
            >
              เพิ่ม
            </button>
          </div>

          {/* Recipient list */}
          {settings.recipientUserIds.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">
                ยังไม่มีผู้รับการแจ้งเตือน
              </p>
              <p className="text-xs text-gray-300 mt-1">เพิ่ม User ID ด้านบน</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.recipientUserIds.map((userId, idx) => (
                <div
                  key={userId}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-3 animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      👤
                    </div>
                    <span className="text-sm text-gray-700 font-mono truncate">
                      {userId}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRecipient(userId)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full text-base"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg">⏳</span> กำลังบันทึก...
            </span>
          ) : (
            "💾 บันทึกการตั้งค่า"
          )}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium text-center animate-scale-in ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-700 border border-green-100"
                : message.startsWith("⚠️")
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {message}
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5">
          <p className="text-sm text-blue-700 font-semibold mb-2 flex items-center gap-2">
            <span>ℹ️</span> วิธีการหา LINE User ID
          </p>
          <ol className="text-xs text-blue-600 space-y-1.5 list-decimal list-inside leading-relaxed">
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
