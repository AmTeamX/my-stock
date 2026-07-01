import { NextRequest, NextResponse } from "next/server";
import { getStockList, updateStock, deleteStock } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Helper to log transaction
async function logTx(opts: {
  wardId: string;
  stockName: string;
  type: "add" | "withdraw";
  quantity: number;
  userId: string;
  note: string;
}) {
  const sb = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_ANON_KEY || "",
  );
  await sb.from("transactions").insert({
    id: `TX-${Date.now()}`,
    ward_id: opts.wardId,
    stock_name: opts.stockName,
    type: opts.type,
    quantity: opts.quantity,
    user_id: opts.userId,
    note: opts.note,
  } as any);
}

export async function GET(request: NextRequest) {
  try {
    const wardId = request.nextUrl.searchParams.get("wardId") || "";
    const stocks = await getStockList(wardId);
    const mapped = stocks.map((s) => ({
      id: s.id,
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      minThreshold: s.min_threshold,
      category: s.category,
      updatedAt: s.updated_at,
      imageUrl: s.image_url,
    }));
    return NextResponse.json({ stocks: mapped, total: mapped.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      stockId,
      name,
      quantity,
      unit,
      minThreshold,
      category,
      wardId,
      userId,
      restockQty,
    } = await request.json();
    if (!stockId || !name)
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });

    // Get old stock to compare
    const stocks = await getStockList(wardId || "");
    const old = stocks.find((s) => s.id === stockId);

    await updateStock({
      wardId: wardId || "",
      stockId,
      name,
      quantity: parseInt(quantity) || 0,
      unit: unit || "ชิ้น",
      minThreshold: parseInt(minThreshold) || 0,
      category: category || "อื่นๆ",
    });

    // Log restock transaction if quantity increased
    if (restockQty && restockQty > 0 && old) {
      await logTx({
        wardId: wardId || "",
        stockName: name,
        type: "add",
        quantity: parseInt(restockQty),
        userId: userId || "unknown",
        note: `เติมเพิ่ม (จาก ${old.quantity} เป็น ${parseInt(quantity)})`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { stockId, wardId } = await request.json();
    if (!stockId)
      return NextResponse.json({ error: "กรุณาระบุรายการ" }, { status: 400 });
    await deleteStock(wardId || "", stockId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
