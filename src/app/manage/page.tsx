"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomNav from "../components/BottomNav";
import { useLiffUser } from "../components/useLiffUser";
import { useWardId } from "../components/useWardId";
import { StockItem } from "@/types";
import { Camera, Pencil, Trash2, Search, Package } from "lucide-react";

const UNITS = ["กล่อง", "ชิ้น", "ขวด", "แพ็ค", "ม้วน", "คู่", "ชุด", "อัน"];
const CATS = [
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

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    unit: "ชิ้น",
    minThreshold: 10,
    category: "เวชภัณฑ์",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit modal
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: 0,
    unit: "",
    minThreshold: 0,
    category: "",
  });

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

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setImagePreview(r.result as string);
    r.readAsDataURL(file);
    setUploading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const rr = new FileReader();
        rr.onload = () => res(rr.result as string);
        rr.onerror = rej;
        rr.readAsDataURL(file);
      });
      const resp = await fetch("/api/stock/upload-image-temp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: b64 }),
      });
      const d = await resp.json();
      if (!resp.ok) throw new Error(d.error);
      setImageUrl(d.imageUrl);
    } catch (err: any) {
      setMessage("❌ " + err.message);
      setImagePreview("");
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
        body: JSON.stringify({ ...form, userId: userName, wardId, imageUrl }),
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
      setImagePreview("");
      setImageUrl("");
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
    setEditForm({
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
        body: JSON.stringify({ stockId: editing.id, ...editForm, wardId }),
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

  const closeAdd = () => {
    setShowAdd(false);
    setMessage("");
    setForm({
      name: "",
      quantity: 1,
      unit: "ชิ้น",
      minThreshold: 10,
      category: "เวชภัณฑ์",
    });
    setImagePreview("");
    setImageUrl("");
  };

  // Modal form component (shared by add + edit)
  const ModalForm = ({
    title,
    onSave,
    onClose,
    isEdit,
  }: {
    title: string;
    onSave: () => void;
    onClose: () => void;
    isEdit: boolean;
  }) => (
    <div className="space-y-4">
      {/* Image upload (add only) */}
      {!isEdit && (
        <div>
          <label className="block text-sm font-semibold text-ink-2 mb-2">
            📷 รูปภาพรายการ{" "}
            <span className="text-muted font-normal text-xs">(ไม่บังคับ)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-full h-36 rounded-lg border-2 border-dashed border-rule flex items-center justify-center cursor-pointer overflow-hidden hover:border-accent transition-colors duration-short ease-out bg-paper"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
            }}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
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
            onChange={handleImage}
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-ink-2 mb-2">
          ชื่อรายการ <span className="text-danger">*</span>
        </label>
        <input
          className="input-field"
          placeholder="เช่น ถุงมือยาง, เข็มฉีดยา"
          value={isEdit ? editForm.name : form.name}
          onChange={(e) =>
            isEdit
              ? setEditForm({ ...editForm, name: e.target.value })
              : setForm({ ...form, name: e.target.value })
          }
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
            value={isEdit ? editForm.quantity : form.quantity}
            onChange={(e) =>
              isEdit
                ? setEditForm({
                    ...editForm,
                    quantity: Math.max(0, parseInt(e.target.value) || 0),
                  })
                : setForm({
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
            value={isEdit ? editForm.unit : form.unit}
            onChange={(e) =>
              isEdit
                ? setEditForm({ ...editForm, unit: e.target.value })
                : setForm({ ...form, unit: e.target.value })
            }
          >
            {UNITS.map((u) => (
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
          value={isEdit ? editForm.category : form.category}
          onChange={(e) =>
            isEdit
              ? setEditForm({ ...editForm, category: e.target.value })
              : setForm({ ...form, category: e.target.value })
          }
        >
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-ink-2 mb-2">
          🔻 จำนวนขั้นต่ำก่อนแจ้งเตือน
        </label>
        <input
          type="number"
          className="input-field"
          min={0}
          value={isEdit ? editForm.minThreshold : form.minThreshold}
          onChange={(e) =>
            isEdit
              ? setEditForm({
                  ...editForm,
                  minThreshold: Math.max(0, parseInt(e.target.value) || 0),
                })
              : setForm({
                  ...form,
                  minThreshold: Math.max(0, parseInt(e.target.value) || 0),
                })
          }
        />
      </div>
      <button
        onClick={onSave}
        disabled={
          busy || (!isEdit && uploading) || (!isEdit && !form.name.trim())
        }
        className="btn-primary w-full"
      >
        {!isEdit && uploading
          ? "⏳ กำลังอัปโหลดรูป..."
          : busy
            ? "กำลังบันทึก..."
            : "💾 บันทึก"}
      </button>
    </div>
  );

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
            className="bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/30 transition-colors duration-short ease-out"
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
            <div key={s.id} className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-paper-3 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
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
                onClick={() => openEdit(s)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="btn-danger text-xs py-1.5 px-3"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-muted py-8">
              {search
                ? "ไม่พบรายการ"
                : "ยังไม่มีรายการ — กด + เพิ่ม เพื่อเริ่ม"}
            </p>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-modal bg-ink/40 flex items-end sm:items-center justify-center"
          onClick={closeAdd}
        >
          <div
            className="bg-paper-2 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">➕ เพิ่มรายการใหม่</h2>
              <button onClick={closeAdd} className="text-muted text-xl">
                &times;
              </button>
            </div>
            <ModalForm
              title="เพิ่มรายการใหม่"
              onSave={handleAdd}
              onClose={closeAdd}
              isEdit={false}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-modal bg-ink/40 flex items-end sm:items-center justify-center"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-paper-2 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ink text-lg">
                <Pencil size={16} className="inline mr-1" />
                แก้ไข {editing.name}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-muted text-xl"
              >
                &times;
              </button>
            </div>
            <ModalForm
              title="แก้ไข"
              onSave={handleUpdate}
              onClose={() => setEditing(null)}
              isEdit={true}
            />
          </div>
        </div>
      )}

      {message && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-toast px-6 py-3 rounded-xl text-sm font-medium shadow-lg ${message.startsWith("✅") ? "bg-success-bg text-success border border-success/20" : "bg-danger-bg text-danger border border-danger/20"}`}
        >
          {message}
        </div>
      )}

      <BottomNav current="manage" />
    </div>
  );
}
