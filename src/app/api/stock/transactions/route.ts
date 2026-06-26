import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const wardId = request.nextUrl.searchParams.get("wardId") || "";
    const rows = await getTransactions(wardId, 50);
    const transactions = rows.map((tx) => ({
      id: tx.id,
      date: new Date(tx.created_at).toLocaleString("th-TH"),
      stockName: tx.stock_name,
      type: tx.type,
      quantity: tx.quantity,
      userId: tx.user_id,
      note: tx.note,
    }));
    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
