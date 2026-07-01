"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "../components/BottomNav";
import { useLiffUser } from "../components/useLiffUser";
import { useWardId } from "../components/useWardId";
import { StockItem } from "@/types";
import { Camera, Pencil, Trash2, Search, Package, Plus } from "lucide-react";

const U = ["กล่อง", "ชิ้น", "ขวด", "แพ็ค", "ม้วน", "คู่", "ชุด", "อัน"];
const C = [
  "เวชภัณฑ์",
  "อุปกรณ์การแพทย์",
  "ยา",
  "อุปกรณ์สำนักงาน",
  "วัสดุสิ้นเปลือง",
  "อื่นๆ",
];

export default function ManagePage() {
  const { userName } = useLiffUser();
  const { wardId } = useWardId();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Add
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    unit: "ชิ้น",
    minThreshold: 10,
    category: "เวชภัณฑ์",
  });
  const [preview, setPreview] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [edit, setEdit] = useState({
    name: "",
    quantity: 0,
    unit: "",
    minThreshold: 0,
    category: "",
  });

  // Restock
  const [restocking, setRestocking] = useState<StockItem | null>(null);
  const [qty, setQty] = useState(1);

  const fetchStocks = useCallback(async () => {
    if (!wardId) return;
    setLoading(true);
    try {
      setStocks(
        (
          await (
            await fetch(`/api/stock?wardId=${encodeURIComponent(wardId)}`)
          ).json()
        ).stocks || [],
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, [wardId]);
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const filtered = stocks.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
    setUploading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const rr = new FileReader();
        rr.onload = () => res(rr.result as string);
        rr.onerror = rej;
        rr.readAsDataURL(f);
      });
      const resp = await fetch("/api/stock/upload-image-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });
      const d = await resp.json();
      if (!resp.ok) throw new Error(d.error);
      setImgUrl(d.imageUrl);
    } catch (err: any) {
      setMessage("❌ " + err.message);
      setPreview("");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) {
      setMessage("❌ กรุณากรอกชื่อ");
      return;
    }
    if (uploading) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/stock/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: userName,
          wardId,
          imageUrl: imgUrl,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMessage("✅ เพิ่มสำเร็จ");
      setForm({
        name: "",
        quantity: 1,
        unit: "ชิ้น",
        minThreshold: 10,
        category: "เวชภัณฑ์",
      });
      setPreview("");
      setImgUrl("");
      setShowAdd(false);
      fetchStocks();
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (s: StockItem) => {
    setEditing(s);
    setEdit({
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      minThreshold: s.minThreshold,
      category: s.category,
    });
    setMessage("");
  };
  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId: editing.id, ...edit, wardId }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMessage("✅ อัปเดตสำเร็จ");
      setEditing(null);
      fetchStocks();
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const openRestock = (s: StockItem) => {
    setRestocking(s);
    setQty(1);
    setMessage("");
  };
  const handleRestock = async () => {
    if (!restocking || qty <= 0) return;
    setBusy(true);
    setMessage("");
    try {
      const n = restocking.quantity + qty;
      const r = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: restocking.id,
          name: restocking.name,
          quantity: n,
          unit: restocking.unit,
          minThreshold: restocking.minThreshold,
          category: restocking.category,
          wardId,
            userId: userName,
            restockQty: qty,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMessage(`✅ เติม ${restocking.name} +${qty} ${restocking.unit}`);
      setRestocking(null);
      fetchStocks();
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (s: StockItem) => {
    if (!confirm(`ลบ "${s.name}"?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/stock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId: s.id, wardId }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setMessage("✅ ลบแล้ว");
      fetchStocks();
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="header-app">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">
            จัดการสต็อก
          </h1>
          <button
            onClick={() => {
              setShowAdd(true);
              setMessage("");
            }}
            className="bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
          >
            + เพิ่ม
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <input
          className="input-field"
          placeholder="🔍 ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading && <p className="text-center text-muted py-8">กำลังโหลด...</p>}
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="card flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-paper-3 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={20} className="text-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate text-sm">
                  {s.name}
                </p>
                <p className="text-xs text-muted">
                  {s.quantity} {s.unit} · {s.category}
                </p>
              </div>
              <button
                onClick={() => openRestock(s)}
                className="btn-primary text-xs py-1.5 px-2.5 flex items-center gap-1"
              >
                <Plus size={12} />
                เติม
              </button>
              <button
                onClick={() => openEdit(s)}
                className="btn-ghost text-xs py-1.5 px-2.5"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="btn-danger text-xs py-1.5 px-2.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-muted py-8">
              {search ? "ไม่พบรายการ" : "ยังไม่มีรายการ — กด + เพิ่ม"}
            </p>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center"
          onClick={() => {
            setShowAdd(false);
            setMessage("");
          }}
        >
          <div
            className="bg-paper-2 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto pb-6"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "env(safe-area-inset-bottom,0px)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">➕ เพิ่มรายการใหม่</h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setMessage("");
                }}
                className="text-muted text-xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  📷 รูปภาพ{" "}
                  <span className="text-muted font-normal text-xs">
                    (ไม่บังคับ)
                  </span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-32 rounded-lg border-2 border-dashed border-rule flex items-center justify-center cursor-pointer overflow-hidden hover:border-accent transition-colors bg-paper"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      fileRef.current?.click();
                  }}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                          <span className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </>
                  ) : uploading ? (
                    <div className="text-center">
                      <span className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-xs text-ink-2">กำลังอัปโหลด...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera size={24} className="text-muted mx-auto mb-1" />
                      <p className="text-xs text-muted">แตะเพื่อเลือกรูป</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImg}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  ชื่อรายการ <span className="text-danger">*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="เช่น ถุงมือยาง"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-2 mb-2">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-ink-2 mb-2">
                    หน่วย
                  </label>
                  <select
                    className="input-field"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    {U.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  หมวดหมู่
                </label>
                <select
                  className="input-field"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {C.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  🔻 จำนวนขั้นต่ำ
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  value={form.minThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minThreshold: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={busy || uploading || !form.name.trim()}
                className="btn-primary w-full"
              >
                {uploading
                  ? "⏳ อัปโหลดรูป..."
                  : busy
                    ? "กำลังบันทึก..."
                    : "💾 บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-paper-2 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto pb-6"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "env(safe-area-inset-bottom,0px)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">
                ✏️ แก้ไข {editing.name}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-muted text-xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  ชื่อรายการ
                </label>
                <input
                  className="input-field"
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-ink-2 mb-2">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    value={edit.quantity}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-semibold text-ink-2 mb-2">
                    หน่วย
                  </label>
                  <input
                    className="input-field"
                    value={edit.unit}
                    onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  หมวดหมู่
                </label>
                <select
                  className="input-field"
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                >
                  {C.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  🔻 จำนวนขั้นต่ำ
                </label>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  value={edit.minThreshold}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      minThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={busy}
                className="btn-primary w-full"
              >
                {busy ? "กำลังบันทึก..." : "💾 บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restocking && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center"
          onClick={() => setRestocking(null)}
        >
          <div
            className="bg-paper-2 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 pb-6"
            onClick={(e) => e.stopPropagation()}
            style={{ marginBottom: "env(safe-area-inset-bottom,0px)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">
                ➕ เติม {restocking.name}
              </h2>
              <button
                onClick={() => setRestocking(null)}
                className="text-muted text-xl"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              จำนวนปัจจุบัน:{" "}
              <span className="font-semibold text-ink">
                {restocking.quantity} {restocking.unit}
              </span>
            </p>
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-ink-2 mb-2">
                  จำนวนที่ต้องการเติม
                </label>
                <input
                  type="number"
                  className="input-field text-center text-lg font-bold"
                  min={1}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  autoFocus
                />
              </div>
              <span className="text-ink-2 font-medium pb-3">
                {restocking.unit}
              </span>
            </div>
            <div className="flex gap-2 mb-2">
              {[1, 5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQty(n)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${qty === n ? "bg-accent text-accent-ink" : "bg-paper-3 text-ink-2 hover:bg-rule"}`}
                >
                  +{n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mb-4">
              หลังเติม:{" "}
              <span className="font-semibold text-accent">
                {restocking.quantity + qty} {restocking.unit}
              </span>
            </p>
            <button
              onClick={handleRestock}
              disabled={busy || qty <= 0}
              className="btn-primary w-full"
            >
              {busy ? "กำลังบันทึก..." : "💾 ยืนยันเติม"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-toast px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${message.startsWith("✅") ? "bg-success-bg text-success border border-success/20" : "bg-danger-bg text-danger border border-danger/20"}`}
        >
          {message}
        </div>
      )}
      <BottomNav current="manage" />
    </div>
  );
}
