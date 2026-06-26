import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/googleSheets";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await updateSettings({
      enabled: body.enabled,
      threshold: body.threshold,
      recipientUserIds: body.recipientUserIds,
      notifyAllGroupMembers: body.notifyAllGroupMembers,
    });

    return NextResponse.json({ success: true, message: "บันทึกการตั้งค่าสำเร็จ" });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการบันทึก" },
      { status: 500 }
    );
  }
}
