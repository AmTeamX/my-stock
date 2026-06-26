"use client";

import { useState, useRef } from "react";
import BottomNav from "../components/BottomNav";
import { useRouter } from "next/navigation";

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

    if (file.size > 3 * 1024 * 1024) {
      setMessage("❌ รูปภาพต้องมีขนาดไม่เกิน 3MB");
      return;
    }

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
        body: JSON.stringify(form),
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
            body: JSON.stringify({
              image: base64,
              stockId: newItem.id,
            }),
          });
        }
      }

      setMessage(
        `✅ เพิ่ม ${form.name} จำนวน ${form.quantity} ${form.unit} สำเร็จ!`,
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
      {/* Header */}
      <div className="header-green">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            ➕ เพิ่ม Stock
          </h1>
          <p className="text-sm text-white/80 mt-1">
            เพิ่มรายการใหม่หรือเติมของที่มีอยู่แล้ว
          </p>
        </div>
      </div>

      <div className="px-4 mt-4">
        <form onSubmit={handleSubmit} className="card p-5 space-y-5">
          {/* รูปภาพ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">
                📷
              </span>
              รูปภาพรายการ
              <span className="text-xs text-gray-400 font-normal">
                (ไม่บังคับ)
              </span>
            </label>
            <div
              className="relative w-full h-44 rounded-2xl border-2 border-dashed border-gray-200
                         flex items-center justify-center cursor-pointer overflow-hidden
                         hover:border-[#06C755] hover:bg-green-50/30 transition-all duration-200 bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                      แตะเพื่อเปลี่ยนรูป
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📸</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    แตะเพื่อเลือกรูปภาพ
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    รองรับ JPG, PNG • ขนาดไม่เกิน 3MB
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

          {/* ชื่อรายการ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
                📝
              </span>
              ชื่อรายการ
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="เช่น ถุงมือยาง, เข็มฉีดยา..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* จำนวน */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-sm">
                🔢
              </span>
              จำนวนเริ่มต้น
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, quantity: Math.max(0, form.quantity - 1) })
                }
                className="w-11 h-11 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg
                           active:bg-gray-200 active:scale-95 transition-all"
              >
                −
              </button>
              <input
                type="number"
                className="input-field flex-1 text-center text-lg font-bold"
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
                className="w-11 h-11 rounded-xl bg-[#06C755] text-white font-bold text-lg
                           active:bg-[#05A84A] active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* หน่วย */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center text-sm">
                📏
              </span>
              หน่วย
            </label>
            <div className="grid grid-cols-4 gap-2">
              {UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm({ ...form, unit })}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    form.unit === unit
                      ? "bg-gradient-to-br from-[#06C755] to-[#05A84A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">
                🏷️
              </span>
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    form.category === cat
                      ? "bg-gradient-to-br from-[#06C755] to-[#05A84A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* จำนวนขั้นต่ำ */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-3">
              <span className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-sm">
                🔻
              </span>
              จำนวนขั้นต่ำก่อนแจ้งเตือนของรายการนี้
            </label>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  className="input-field bg-white border-amber-200 flex-1"
                  min={0}
                  value={form.minThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minThreshold: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                />
                <span className="text-sm text-amber-700 font-medium whitespace-nowrap">
                  {form.unit}
                </span>
              </div>
              <p className="text-xs text-amber-600 leading-relaxed">
                💡 แต่ละรายการสามารถตั้งค่าจำนวนขั้นต่ำของตัวเองได้ เช่น
                ถุงมือตั้งไว้ 10 กล่อง เข็มฉีดยาตั้งไว้ 50 ชิ้น
                ระบบจะแจ้งเตือนตามค่าของแต่ละรายการ
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="btn-primary w-full text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-lg">⏳</span> กำลังบันทึก...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                💾 บันทึกรายการ
              </span>
            )}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-2xl text-sm font-medium text-center animate-scale-in ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
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
