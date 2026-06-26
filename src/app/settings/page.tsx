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
        <div className="bg-[#06C755] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
          <h1 className="text-2xl font-bold mb-1">⚙️ ตั้งค่า</h1>
        </div>
        <div className="text-center py-12 text-gray-400">
          <div className="animate-pulse text-4xl mb-2">⚙️</div>
          <p>กำลังโหลด...</p>
        </div>
        <BottomNav current="settings" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#06C755] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">⚙️ ตั้งค่า</h1>
        <p className="text-sm opacity-90">จัดการการแจ้งเตือนสต็อกใกล้หมด</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Enable/Disable */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">🔔 เปิดการแจ้งเตือน</p>
            <p className="text-xs text-gray-400 mt-0.5">
              ส่งข้อความเมื่อของใกล้หมด
            </p>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, enabled: !settings.enabled })
            }
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.enabled ? "bg-[#06C755]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.enabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Default Threshold for New Items */}
        <div className="card">
          <p className="font-medium text-gray-800 mb-2">
            🔻 ค่าเริ่มต้นจำนวนขั้นต่ำสำหรับรายการใหม่
          </p>
          <p className="text-xs text-gray-400 mb-3">
            ค่าเริ่มต้นนี้จะถูกใช้เมื่อเพิ่มรายการใหม่
            (สามารถเปลี่ยนทีหลังได้ที่หน้าเพิ่ม Stock)
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
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>แต่ละรายการตั้งค่าแยกกันได้!</strong> ไปที่หน้า
              &quot;เพิ่ม Stock&quot; เพื่อกำหนดจำนวนขั้นต่ำของแต่ละรายการ เช่น
              ถุงมือ 10 กล่อง, เข็มฉีดยา 50 ชิ้น
            </p>
          </div>
        </div>

        {/* Notify all */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">
              👥 แจ้งเตือนทุกคนในกลุ่ม
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
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
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.notifyAllGroupMembers ? "bg-[#06C755]" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                settings.notifyAllGroupMembers
                  ? "translate-x-7"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Recipients */}
        <div className="card">
          <p className="font-medium text-gray-800 mb-2">
            👤 ผู้รับการแจ้งเตือน
          </p>
          <p className="text-xs text-gray-400 mb-3">
            เพิ่ม LINE User ID ของคนที่ต้องการให้ได้รับข้อความแจ้งเตือน
            (สามารถหา User ID ได้จาก LINE Official Account Manager)
          </p>

          {/* Add recipient input */}
          <div className="flex gap-2 mb-3">
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
              className="btn-primary text-sm py-2 px-4"
            >
              เพิ่ม
            </button>
          </div>

          {/* Recipient list */}
          {settings.recipientUserIds.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              ยังไม่มีผู้รับการแจ้งเตือน — เพิ่ม User ID ด้านบน
            </p>
          ) : (
            <div className="space-y-2">
              {settings.recipientUserIds.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                >
                  <span className="text-sm text-gray-700 font-mono truncate flex-1">
                    {userId}
                  </span>
                  <button
                    onClick={() => removeRecipient(userId)}
                    className="text-red-400 hover:text-red-600 text-sm ml-2 p-1"
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
          className="btn-primary w-full disabled:opacity-40"
        >
          {saving ? "⏳ กำลังบันทึก..." : "💾 บันทึกการตั้งค่า"}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-700"
                : message.startsWith("⚠️")
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700 font-medium mb-1">
            ℹ️ วิธีการหา LINE User ID
          </p>
          <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
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
