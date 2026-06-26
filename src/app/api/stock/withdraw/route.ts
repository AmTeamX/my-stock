import { NextRequest, NextResponse } from "next/server";
import { withdrawStock, getSettings } from "@/lib/supabase";
import {
  multicastMessage,
  pushMessage,
  buildLowStockFlexMessage,
} from "@/lib/line";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockId, quantity, note, userId } = body;

    if (!stockId) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการที่ต้องการเบิก" },
        { status: 400 },
      );
    }

    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "กรุณาระบุจำนวนที่ต้องการเบิก" },
        { status: 400 },
      );
    }

    const result = await withdrawStock({
      stockId,
      quantity: parseInt(quantity),
      note: note || "",
      userId: userId || "unknown",
    });

    // Notifications
    if (result.lowStock) {
      const settings = await getSettings();
      if (settings.enabled && settings.recipientUserIds.length > 0) {
        const messages = buildLowStockFlexMessage(
          result.itemName,
          result.remaining,
          "หน่วย",
          result.threshold,
        );
        if (settings.notifyAllGroupMembers) {
          await multicastMessage(settings.recipientUserIds, messages);
        } else {
          for (const uid of settings.recipientUserIds) {
            await pushMessage(uid, messages);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      lowStock: result.lowStock,
      itemName: result.itemName,
      remaining: result.remaining,
      threshold: result.threshold,
      message: `เบิก ${result.itemName} จำนวน ${quantity} สำเร็จ เหลือ ${result.remaining} หน่วย`,
    });
  } catch (error: any) {
    console.error("POST /api/stock/withdraw error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการเบิก" },
      { status: 500 },
    );
  }
}
