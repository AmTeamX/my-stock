import { NextRequest, NextResponse } from "next/server";
import { getNotifyEnabledUserIds, registerUser } from "@/lib/supabase";
import { multicastMessage, buildLowStockFlexMessage } from "@/lib/line";

export async function GET(request: NextRequest) {
  const wardId = request.nextUrl.searchParams.get("wardId") || "";
  const users = await getNotifyEnabledUserIds(wardId);
  return NextResponse.json({ notifyEnabledUsers: users, count: users.length, wardId });
}

export async function POST(request: NextRequest) {
  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  await registerUser(userId);
  const messages = buildLowStockFlexMessage("🧪 ทดสอบแจ้งเตือน", 5, "ชิ้น", 10);
  const ok = await multicastMessage([userId], messages);
  return NextResponse.json({ success: ok, message: ok ? "✅ ส่งสำเร็จ — เช็ค LINE!" : "❌ ส่งไม่สำเร็จ — เช็ค token หรือว่า user ได้ add bot หรือยัง", userId });
}
