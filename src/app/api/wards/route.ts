import { NextRequest, NextResponse } from "next/server";
import {
  getMyWards,
  createWard,
  joinWardByCode,
  renameWard,
  leaveWard,
} from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "";
    const wards = await getMyWards(userId);
    return NextResponse.json({ wards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, code, userId, wardId } = body;
    if (!userId)
      return NextResponse.json({ error: "userId required" }, { status: 400 });

    if (action === "create") {
      if (!name)
        return NextResponse.json(
          { error: "กรุณากรอกชื่อวอร์ด" },
          { status: 400 },
        );
      const ward = await createWard(name, userId);
      return NextResponse.json({ ward });
    }

    if (action === "join") {
      if (!code)
        return NextResponse.json(
          { error: "กรุณากรอกรหัสวอร์ด" },
          { status: 400 },
        );
      const ward = await joinWardByCode(code, userId);
      return NextResponse.json({ ward });
    }

    if (action === "rename") {
      if (!wardId || !name)
        return NextResponse.json(
          { error: "wardId and name required" },
          { status: 400 },
        );
      await renameWard(wardId, name);
      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      if (!wardId)
        return NextResponse.json({ error: "wardId required" }, { status: 400 });
      await leaveWard(wardId, userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
