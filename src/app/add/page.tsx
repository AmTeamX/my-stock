"use client";

import { useState, useRef } from "react";
import BottomNav from "../components/BottomNav";
import { useRouter } from "next/navigation";
import { useLiffUser } from "../components/useLiffUser";
import { useWardId } from "../components/useWardId";

const CATEGORIES = [
  "เวชภัณฑ์",
  "อุปกรณ์การแพทย์",
  "ยา",
  "อุปกรณ์สำนักงาน",
  "วัสดุสิ้นเปลือง",
  "อื่นๆ",
];

const UNITS = ["กล่อง", "ชิ้น", "ขวด", "แพ็ค", "ม้วน", "คู่", "ชุด", "อัน"];

export default function AddStockPage() {
  const router = useRouter();
  const { userName } = useLiffUser();
  const { wardId } = useWardId();
  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    unit: "ชิ้น",
    minThreshold: 10,
    category: "เวชภัณฑ์",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Allow any image size
    // (no client-side limit — server handles validation)
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage("❌ กรุณากรอกชื่อรายการ");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: userName, wardId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เพิ่มไม่สำเร็จ");

      if (imageFile) {
        const stocksRes = await fetch("/api/stock");
        const stocksData = await stocksRes.json();
        const stocks = stocksData.stocks || [];
        const newItem = stocks.find((s: any) => s.name === form.name.trim());
        if (newItem?.id) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          await fetch("/api/stock/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, stockId: newItem.id }),
          });
        }
      }

      setMessage(
        `✅ เพิ่ม ${form.name} จำนวน ${form.quantity} ${form.unit} สำเร็จ`,
      );
      setForm({
        name: "",
        quantity: 1,
        unit: "ชิ้น",
        minThreshold: 10,
        category: "เวชภัณฑ์",
      });
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="header-app">
        <h1 className="text-3xl font-extrabold tracking-tight">เพิ่ม Stock</h1>
        <p className="text-sm text-white/75 mt-1">
          เพิ่มรายการใหม่หรือเติมของที่มีอยู่แล้ว
        </p>
      </div>

      <div className="px-4 mt-4">
        <form onSubmit={handleSubmit} className="card p-5 space-y-5">
          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-3">
              รูปภาพรายการ{" "}
              <span className="text-muted font-normal text-xs">
                (ไม่บังคับ)
              </span>
            </label>
            <div
              className="relative w-full h-44 rounded-lg border-2 border-dashed border-rule
                         flex items-center justify-center cursor-pointer overflow-hidden
                         hover:border-accent transition-colors duration-short ease-out bg-paper"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="เลือกรูปภาพ"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-short ease-out">
                    <span className="text-white text-sm font-medium bg-ink/50 px-4 py-2 rounded-md">
                      แตะเพื่อเปลี่ยนรูป
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm text-ink-2 font-medium">
                    แตะเพื่อเลือกรูปภาพ
                  </p>
                  <p className="text-xs text-muted mt-1">
                    รองรับ JPG, PNG · ขนาดไม่เกิน 3MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="stock-name"
              className="block text-sm font-semibold text-ink-2 mb-2"
            >
              ชื่อรายการ <span className="text-danger">*</span>
            </label>
            <input
              id="stock-name"
              type="text"
              className="input-field"
              placeholder="เช่น ถุงมือยาง, เข็มฉีดยา..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-2">
              จำนวนเริ่มต้น
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, quantity: Math.max(0, form.quantity - 1) })
                }
                className="btn-ghost w-11 h-11 p-0 text-lg flex items-center justify-center"
                aria-label="ลดจำนวน"
              >
                −
              </button>
              <input
                type="number"
                className="input-field flex-1 text-center text-lg font-bold tabular-nums"
                min={0}
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
              />
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, quantity: form.quantity + 1 })
                }
                className="btn-primary w-11 h-11 p-0 text-lg flex items-center justify-center"
                aria-label="เพิ่มจำนวน"
              >
                +
              </button>
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-2">
              หน่วย
            </label>
            <div className="grid grid-cols-4 gap-2">
              {UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm({ ...form, unit })}
                  className={`py-2.5 rounded-md text-sm font-semibold whitespace-nowrap
                    transition-colors duration-short ease-out
                    active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-focus ${
                      form.unit === unit
                        ? "bg-accent text-accent-ink"
                        : "bg-paper-3 text-ink-2 hover:bg-rule"
                    }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-ink-2 mb-2">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`py-2.5 px-3 rounded-md text-sm font-semibold whitespace-nowrap
                    transition-colors duration-short ease-out
                    active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-focus ${
                      form.category === cat
                        ? "bg-accent text-accent-ink"
                        : "bg-paper-3 text-ink-2 hover:bg-rule"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Min threshold */}
          <div>
            <label
              htmlFor="min-threshold"
              className="block text-sm font-semibold text-ink-2 mb-2"
            >
              🔻 จำนวนขั้นต่ำก่อนแจ้งเตือนของรายการนี้
            </label>
            <div className="bg-warning-bg border border-warning/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  id="min-threshold"
                  type="number"
                  className="input-field bg-white flex-1"
                  min={0}
                  value={form.minThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minThreshold: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                />
                <span className="text-sm text-ink-2 font-medium whitespace-nowrap">
                  {form.unit}
                </span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                💡 แต่ละรายการสามารถตั้งค่าจำนวนขั้นต่ำของตัวเองได้ เช่น
                ถุงมือตั้งไว้ 10 กล่อง เข็มฉีดยาตั้งไว้ 50 ชิ้น
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="btn-primary w-full text-base"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกรายการ"}
          </button>

          {/* Message */}
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
        </form>
      </div>

      <BottomNav current="add" />
    </div>
  );
}
