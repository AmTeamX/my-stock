"use client";

import { useState, useRef } from "react";
import { StockItem } from "@/types";

interface StockCardProps {
  stock: StockItem;
  onUpdate: () => void;
}

export default function StockCard({ stock, onUpdate }: StockCardProps) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawQty, setWithdrawQty] = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLow = stock.quantity <= stock.minThreshold;

  const handleWithdraw = async () => {
    if (withdrawQty <= 0 || withdrawQty > stock.quantity) return;
    setWithdrawing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: stock.id,
          quantity: withdrawQty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เบิกไม่สำเร็จ");
      }

      setMessage(`✅ เบิก ${stock.name} ${withdrawQty} ${stock.unit} สำเร็จ`);

      if (data.lowStock) {
        setMessage(
          (prev) =>
            prev +
            `\n⚠️ ${stock.name} เหลือน้อยกว่า ${stock.minThreshold} ${stock.unit} แล้ว!`,
        );
      }

      setShowWithdraw(false);
      setWithdrawQty(1);
      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleQuickWithdraw = async (qty: number) => {
    if (qty > stock.quantity) return;
    setWithdrawing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: stock.id,
          quantity: qty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เบิกไม่สำเร็จ");

      if (data.lowStock) {
        setMessage(
          `⚠️ ${stock.name} ใกล้หมดแล้ว! เหลือ ${data.remaining} ${stock.unit}`,
        );
      }

      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setMessage("❌ รูปภาพต้องมีขนาดไม่เกิน 3MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via API
      const res = await fetch("/api/stock/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          stockId: stock.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");

      setMessage("✅ อัปโหลดรูปภาพสำเร็จ");
      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={`card animate-slide-up ${isLow ? "border-l-4 border-l-[#FF6B6B]" : ""}`}
    >
      {/* Image + Title row */}
      <div className="flex gap-3 mb-3">
        {/* Image area */}
        <div
          className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {stock.imageUrl ? (
            <>
              <img
                src={stock.imageUrl}
                alt={stock.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              📦
            </div>
          )}
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <span className="text-white text-xs animate-pulse">⏳</span>
            ) : (
              <span className="text-white text-xs">📷</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 truncate">
              {stock.name}
            </h3>
            {isLow && (
              <span className="chip bg-red-100 text-red-600 text-[10px] flex-shrink-0">
                ⚠️ ใกล้หมด
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{stock.category}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-2xl font-bold text-[#06C755]">
              {stock.quantity}
            </p>
            <p className="text-xs text-gray-400">{stock.unit}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${
            isLow
              ? "bg-[#FF6B6B]"
              : stock.quantity < stock.minThreshold * 3
                ? "bg-yellow-400"
                : "bg-[#06C755]"
          }`}
          style={{
            width: `${Math.min(
              100,
              (stock.quantity / (stock.minThreshold * 5 || 1)) * 100,
            )}%`,
          }}
        />
      </div>

      {/* Threshold info */}
      <div className="flex items-center gap-1 mb-2 text-[10px] text-gray-400">
        <span>🔻</span>
        <span>
          แจ้งเตือนเมื่อเหลือน้อยกว่า{" "}
          <span className="font-medium text-gray-500">
            {stock.minThreshold} {stock.unit}
          </span>
        </span>
      </div>

      {/* Action buttons */}
      {!showWithdraw ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickWithdraw(1)}
            disabled={withdrawing || stock.quantity < 1}
            className="flex-1 py-2 bg-[#06C755] text-white rounded-lg text-sm font-medium
                       active:opacity-80 transition-opacity disabled:opacity-40"
          >
            -1
          </button>
          <button
            onClick={() => handleQuickWithdraw(5)}
            disabled={withdrawing || stock.quantity < 5}
            className="flex-1 py-2 bg-[#06C755] text-white rounded-lg text-sm font-medium
                       active:opacity-80 transition-opacity disabled:opacity-40"
          >
            -5
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={withdrawing || stock.quantity < 1}
            className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium
                       active:bg-gray-200 transition-colors disabled:opacity-40"
          >
            ระบุจำนวน
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field flex-1 text-center text-lg"
              value={withdrawQty}
              min={1}
              max={stock.quantity}
              onChange={(e) =>
                setWithdrawQty(
                  Math.min(parseInt(e.target.value) || 1, stock.quantity),
                )
              }
              autoFocus
            />
            <span className="text-sm text-gray-400">{stock.unit}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={
                withdrawing || withdrawQty <= 0 || withdrawQty > stock.quantity
              }
              className="flex-1 btn-primary text-sm py-2 disabled:opacity-40"
            >
              {withdrawing ? "กำลังดำเนินการ..." : "ยืนยันเบิก"}
            </button>
            <button
              onClick={() => {
                setShowWithdraw(false);
                setWithdrawQty(1);
                setMessage("");
              }}
              className="flex-1 btn-secondary text-sm py-2"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mt-3 p-2 rounded-lg text-xs whitespace-pre-line ${
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

      {/* Low stock warning in card */}
      {isLow && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600 flex items-center gap-1">
          <span>📢</span>
          <span>แจ้งเตือนไปยังผู้เกี่ยวข้องแล้ว</span>
        </div>
      )}
    </div>
  );
}
