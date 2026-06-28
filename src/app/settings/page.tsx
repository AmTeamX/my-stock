"use client";

import { useState, useEffect, useCallback } from "react";
import BottomNav from "../components/BottomNav";
import { useLiffUser } from "../components/useLiffUser";
import { useWardId } from "../components/useWardId";
import { storeWard } from "../components/WardGuard";

export default function SettingsPage() {
  const { userId, ready } = useLiffUser();
  const { wardId, wardName } = useWardId();
  const [notify, setNotify] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [wardNameEdit, setWardNameEdit] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!userId || !wardId) return;
    setLoading(true);
    try {
      const [notifyRes, nameRes, wardRes] = await Promise.all([
        fetch(`/api/settings?userId=${encodeURIComponent(userId)}`),
        fetch(
          `/api/settings/name?wardId=${encodeURIComponent(wardId)}&userId=${encodeURIComponent(userId)}`,
        ),
        fetch(`/api/wards?userId=${encodeURIComponent(userId)}`),
      ]);
      setNotify((await notifyRes.json()).notify);
      setNameData(await nameRes.json());
      const wards = (await wardRes.json()).wards || [];
      const current = wards.find((w: any) => w.id === wardId);
      if (current) {
        setInviteCode(current.invite_code || "");
        setWardNameEdit(current.name || "");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [userId, wardId]);

  async function setNameData(data: any) {
    setDisplayName(data.displayName || "");
  }

  useEffect(() => {
    if (ready) fetchData();
  }, [ready, fetchData]);

  const handleToggleNotify = async () => {
    const next = !notify;
    setNotify(next);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notify: next }),
      });
    } catch {
      setNotify(!next);
    }
  };

  const handleSaveName = async () => {
    const name = displayName.trim();
    setMessage("");
    try {
      const res = await fetch("/api/settings/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardId, userId, displayName: name }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      setMessage("✅ บันทึกชื่อสำเร็จ");
    } catch {
      setMessage("❌ เกิดข้อผิดพลาด");
    }
  };

  const handleRenameWard = async () => {
    const name = wardNameEdit.trim();
    if (!name) return;
    setMessage("");
    try {
      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", wardId, name, userId }),
      });
      if (!res.ok) throw new Error("ไม่สำเร็จ");
      storeWard(wardId, name);
      setMessage("✅ เปลี่ยนชื่อวอร์ดสำเร็จ");
    } catch {
      setMessage("❌ เกิดข้อผิดพลาด");
    }
  };

  const handleLeaveWard = async () => {
    if (!confirm("คุณแน่ใจที่จะออกจากวอร์ดนี้?")) return;
    setMessage("");
    try {
      const res = await fetch("/api/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", wardId, userId }),
      });
      if (!res.ok) throw new Error("ไม่สำเร็จ");
      localStorage.removeItem("mystock_ward");
      window.location.reload();
    } catch {
      setMessage("❌ เกิดข้อผิดพลาด");
    }
  };

  const handleSwitchWard = () => {
    localStorage.removeItem("mystock_ward");
    window.location.reload();
  };

  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(inviteCode)
      .then(() => setMessage("✅ คัดลอกรหัสแล้ว!"));
  };

  if (loading || !ready) {
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
        <p className="text-sm text-white/75 mt-1">{wardName}</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Display Name */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-3">👤 ชื่อของคุณในวอร์ดนี้</p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="ชื่อของคุณ"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <button onClick={handleSaveName} className="btn-primary text-sm">
              บันทึก
            </button>
          </div>
        </div>

        {/* Notification toggle */}
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">
              🔔 แจ้งเตือนฉันเมื่อของใกล้หมด
            </p>
            <p className="text-xs text-muted mt-0.5">
              {notify
                ? "รับข้อความ LINE เมื่อสต็อกต่ำกว่าเกณฑ์"
                : "ไม่รับข้อความแจ้งเตือน"}
            </p>
          </div>
          <button
            onClick={handleToggleNotify}
            role="switch"
            aria-checked={notify}
            className="relative w-[52px] h-8 rounded-full flex-shrink-0 ml-3
              focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
            style={{
              background: notify ? "var(--color-accent)" : "var(--color-rule)",
            }}
          >
            <span
              className="absolute top-[3px] w-[26px] h-[26px] bg-white rounded-full shadow-card"
              style={{
                left: notify ? "23px" : "3px",
                transition: "left var(--dur-short) var(--ease-out)",
              }}
            />
          </button>
        </div>

        {/* Invite code */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-3">🔗 เชิญเพื่อนเข้าวอร์ด</p>
          <p className="text-xs text-muted mb-3">
            ส่งรหัสนี้ให้เพื่อนกรอกตอนเข้าแอปครั้งแรก
          </p>
          <div className="flex gap-2">
            <div className="input-field flex-1 text-center font-bold text-lg tracking-widest font-[family-name:var(--font-mono)] select-all">
              {inviteCode}
            </div>
            <button onClick={handleCopyCode} className="btn-primary text-sm">
              📋 คัดลอก
            </button>
          </div>
        </div>

        {/* Rename Ward */}
        <div className="card p-5">
          <p className="font-semibold text-ink mb-3">✏️ เปลี่ยนชื่อวอร์ด</p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={wardNameEdit}
              onChange={(e) => setWardNameEdit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameWard()}
            />
            <button onClick={handleRenameWard} className="btn-primary text-sm">
              บันทึก
            </button>
          </div>
        </div>

        {/* Switch ward */}
        <button onClick={handleSwitchWard} className="btn-ghost w-full">
          🔄 เปลี่ยนวอร์ด
        </button>

        {/* Leave ward */}
        <button onClick={handleLeaveWard} className="btn-danger w-full">
          🚪 ออกจากวอร์ด
        </button>
        {message && (
          <div
            className={`p-4 rounded-lg text-sm font-medium text-center ${
              message.startsWith("✅")
                ? "bg-success-bg text-success border border-success/20"
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
