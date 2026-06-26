import { NextRequest, NextResponse } from "next/server";
import { getDisplayName, setDisplayName } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const wardId = request.nextUrl.searchParams.get("wardId") || "";
  const userId = request.nextUrl.searchParams.get("userId") || "";
  const displayName = await getDisplayName(wardId, userId);
  return NextResponse.json({ displayName });
}

export async function POST(request: NextRequest) {
  try {
    const { wardId, userId, displayName } = await request.json();
    await setDisplayName(wardId, userId, displayName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
