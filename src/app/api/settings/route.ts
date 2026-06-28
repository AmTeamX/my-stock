import { NextRequest, NextResponse } from "next/server";
import { getUserNotifySetting, setUserNotifySetting } from "@/lib/supabase";

// Get current user's notification preference
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") || "";
    const notify = await getUserNotifySetting(userId);
    return NextResponse.json({ notify });
  } catch (error: any) {
    return NextResponse.json({ notify: false }); // default false
  }
}

// Toggle user's notification preference
export async function POST(request: NextRequest) {
  try {
    const { userId, notify } = await request.json();
    await setUserNotifySetting(userId, notify);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
