import { NextRequest, NextResponse } from "next/server";
import { withdrawStock, getNotifyEnabledUserIds } from "@/lib/supabase";
import { multicastMessage, buildLowStockFlexMessage } from "@/lib/line";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockId, quantity, note, userId, wardId } = body;
    if (!stockId)
      return NextResponse.json(
        { error: "กรุณาระบุรายการที่ต้องการเบิก" },
        { status: 400 },
      );
    if (!quantity || quantity <= 0)
      return NextResponse.json(
        { error: "กรุณาระบุจำนวนที่ต้องการเบิก" },
        { status: 400 },
      );

    const result = await withdrawStock({
      wardId: wardId || "",
      stockId,
      quantity: parseInt(quantity),
      note: note || "",
      userId: userId || "unknown",
    });

    let notified = 0;
    if (result.lowStock) {
      const userIds = await getNotifyEnabledUserIds(wardId || "");
      console.log(
        `[notify] lowStock: ${result.itemName}, wardId: ${wardId}, notifyEnabled: ${userIds.length} users`,
        userIds,
      );

      if (userIds.length > 0) {
        const messages = buildLowStockFlexMessage(
          result.itemName,
          result.remaining,
          "หน่วย",
          result.threshold,
        );
        const ok = await multicastMessage(userIds, messages);
        if (ok) notified = userIds.length;
        console.log(
          `[notify] multicast result: ${ok}, sent to ${notified} users`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      lowStock: result.lowStock,
      itemName: result.itemName,
      remaining: result.remaining,
      threshold: result.threshold,
      notified,
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
