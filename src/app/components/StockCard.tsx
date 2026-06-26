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
  const isWarning = !isLow && stock.quantity < stock.minThreshold * 3;
  const stockLevel = Math.min(
    100,
    (stock.quantity / (stock.minThreshold * 5 || 1)) * 100,
  );

  const progressFill = isLow
    ? "bg-danger"
    : isWarning
      ? "bg-warning"
      : "bg-accent";
  const progressTrack = isLow
    ? "bg-danger-bg"
    : isWarning
      ? "bg-warning-bg"
      : "bg-paper-3";

  const handleWithdraw = async () => {
    if (withdrawQty <= 0 || withdrawQty > stock.quantity) return;
    setWithdrawing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockId: stock.id, quantity: withdrawQty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เบิกไม่สำเร็จ");

      if (data.lowStock) {
        setMessage(
          `⚠️ ${stock.name} เหลือน้อยกว่า ${stock.minThreshold} ${stock.unit} แล้ว`,
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
        body: JSON.stringify({ stockId: stock.id, quantity: qty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เบิกไม่สำเร็จ");

      if (data.lowStock) {
        setMessage(
          `⚠️ ${stock.name} ใกล้หมดแล้ว เหลือ ${data.remaining} ${stock.unit}`,
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

    if (file.size > 3 * 1024 * 1024) {
      setMessage("❌ รูปภาพต้องมีขนาดไม่เกิน 3MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/stock/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, stockId: stock.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");

      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="card">
      {/* Image + Title row */}
      <div className="flex gap-3 mb-3">
        {/* Image */}
        <div
          className="relative w-[4.5rem] h-[4.5rem] rounded-lg overflow-hidden bg-paper-3 flex-shrink-0 cursor-pointer group shadow-card"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="อัปโหลดรูปภาพ"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
          }}
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
              <div className="hidden absolute inset-0 bg-paper-3 flex items-center justify-center text-2xl">
                📦
              </div>
            </>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-2xl ${
                isLow ? "bg-danger-bg" : "bg-paper-3"
              }`}
            >
              📦
            </div>
          )}
          <div className="absolute inset-0 bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-short ease-out rounded-lg">
            {uploading ? (
              <span className="text-white text-sm font-medium">⏳</span>
            ) : (
              <span className="text-white text-sm font-medium">
                📷 เปลี่ยนรูป
              </span>
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
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-ink truncate text-[15px] leading-tight font-[family-name:var(--font-body)]">
              {stock.name}
            </h3>
            {isLow && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger-bg text-danger whitespace-nowrap font-[family-name:var(--font-body)]">
                ใกล้หมด
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5 font-[family-name:var(--font-body)]">
            {stock.category}
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <p
              className={`text-[1.75rem] font-extrabold leading-none tracking-tight font-[family-name:var(--font-display)] tabular-nums ${
                isLow ? "text-danger" : "text-accent"
              }`}
            >
              {stock.quantity}
            </p>
            <p className="text-xs text-muted font-medium font-[family-name:var(--font-body)]">
              {stock.unit}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`w-full ${progressTrack} rounded-full h-2 mb-3`}>
        <div
          className={`h-2 rounded-full ${progressFill} transition-[width] duration-500 ease-out`}
          style={{ width: `${stockLevel}%` }}
        />
      </div>

      {/* Threshold info */}
      <p className="text-[11px] text-muted mb-3 font-[family-name:var(--font-body)]">
        🔻 แจ้งเตือนเมื่อเหลือ &lt;{" "}
        <span className="font-semibold text-ink-2">
          {stock.minThreshold} {stock.unit}
        </span>
      </p>

      {/* Action buttons */}
      {!showWithdraw ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickWithdraw(1)}
            disabled={withdrawing || stock.quantity < 1}
            className="btn-primary flex-1 text-xs py-2.5 px-0"
          >
            −1
          </button>
          <button
            onClick={() => handleQuickWithdraw(5)}
            disabled={withdrawing || stock.quantity < 5}
            className="btn-primary flex-1 text-xs py-2.5 px-0"
          >
            −5
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={withdrawing || stock.quantity < 1}
            className="btn-ghost flex-1 text-xs py-2.5 px-0"
          >
            ระบุจำนวน
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 p-3 bg-paper rounded-lg border border-rule">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field flex-1 text-center text-lg font-bold"
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
            <span className="text-sm text-ink-2 font-medium font-[family-name:var(--font-body)]">
              {stock.unit}
            </span>
          </div>
          {/* Quick quantity */}
          <div className="flex gap-1.5">
            {[1, 2, 5, 10].map((qty) => (
              <button
                key={qty}
                type="button"
                disabled={qty > stock.quantity}
                onClick={() => setWithdrawQty(qty)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold font-[family-name:var(--font-body)] whitespace-nowrap transition-colors duration-short ease-out focus-visible:outline-2 focus-visible:outline-focus ${
                  withdrawQty === qty
                    ? "bg-accent text-accent-ink"
                    : "bg-paper-2 text-ink-2 border border-rule hover:border-accent"
                } disabled:opacity-30`}
              >
                {qty}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={
                withdrawing || withdrawQty <= 0 || withdrawQty > stock.quantity
              }
              className="btn-primary flex-1 text-xs py-2.5"
            >
              {withdrawing ? "กำลังดำเนินการ..." : "ยืนยันเบิก"}
            </button>
            <button
              onClick={() => {
                setShowWithdraw(false);
                setWithdrawQty(1);
                setMessage("");
              }}
              className="btn-secondary flex-1 text-xs py-2.5"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-xs font-medium whitespace-pre-line font-[family-name:var(--font-body)] ${
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

      {/* Low stock warning */}
      {isLow && (
        <div className="mt-3 p-3 bg-danger-bg rounded-lg text-xs text-danger flex items-center gap-2 border border-danger/20 font-[family-name:var(--font-body)]">
          <span aria-hidden="true">📢</span>
          <span className="font-medium">แจ้งเตือนไปยังผู้เกี่ยวข้องแล้ว</span>
        </div>
      )}
    </div>
  );
}
