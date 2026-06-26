import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    await registerUser(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Register user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
