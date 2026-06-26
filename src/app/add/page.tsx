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
      // Step 1: Create stock item
      const res = await fetch("/api/stock/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เพิ่มไม่สำเร็จ");

      // Step 2: Upload image if selected
      if (imageFile) {
        // Re-fetch stocks to get the new stockId
        const stocksRes = await fetch("/api/stock");
        const stocksData = await stocksRes.json();
        const stocks = stocksData.stocks || [];
        // Find the newly created item by name
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
      <div className="bg-[#06C755] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">➕ เพิ่ม Stock</h1>
        <p className="text-sm opacity-90">
          เพิ่มรายการใหม่หรือเติมของที่มีอยู่แล้ว
        </p>
      </div>

      <div className="px-4 mt-4">
        <form onSubmit={handleSubmit} className="card space-y-4">
          {/* รูปภาพ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              📷 รูปภาพรายการ (ไม่บังคับ)
            </label>
            <div
              className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-200
                         flex items-center justify-center cursor-pointer overflow-hidden
                         hover:border-[#06C755] transition-colors bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-1">📸</div>
                  <p className="text-sm text-gray-400">แตะเพื่อเลือกรูปภาพ</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    ขนาดไม่เกิน 3MB
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              ชื่อรายการ <span className="text-red-400">*</span>
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              จำนวน
            </label>
            <input
              type="number"
              className="input-field"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
            />
          </div>

          {/* หน่วย */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              หน่วย
            </label>
            <div className="grid grid-cols-4 gap-2">
              {UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setForm({ ...form, unit })}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    form.unit === unit
                      ? "bg-[#06C755] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    form.category === cat
                      ? "bg-[#06C755] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* จำนวนขั้นต่ำ - per item */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <label className="block text-sm font-medium text-amber-800 mb-1">
              🔻 จำนวนขั้นต่ำก่อนแจ้งเตือนของรายการนี้
            </label>
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-amber-700">{form.unit}</span>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ แต่ละรายการสามารถตั้งค่าจำนวนขั้นต่ำของตัวเองได้ เช่น
              ถุงมือตั้งไว้ 10 กล่อง เข็มฉีดยาตั้งไว้ 50 ชิ้น
              ระบบจะแจ้งเตือนตามค่าของแต่ละรายการ
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? "⏳ กำลังบันทึก..." : "💾 บันทึกรายการ"}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm text-center ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
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
