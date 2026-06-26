import { NextRequest, NextResponse } from "next/server";

/**
 * LINE Webhook endpoint
 * รับ event จาก LINE (เช่น มีคนแอดไลน์เป็นเพื่อน, ส่งข้อความ)
 * ใช้สำหรับ:
 * - รับข้อความแชทและตอบกลับ
 * - ติดตามการ add friend
 * - รับ postback จาก Rich Menu
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      switch (event.type) {
        case "follow":
          // มีคนแอดไลน์เป็นเพื่อน
          console.log("New follower:", event.source.userId);
          // ส่งข้อความต้อนรับได้ที่นี่
          break;

        case "message":
          // รับข้อความจากผู้ใช้
          if (event.message.type === "text") {
            // สามารถทำ chatbot ตอบกลับอัตโนมัติได้ที่นี่
            console.log("Message from:", event.source.userId, event.message.text);
          }
          break;

        case "postback":
          // รับ postback จาก Rich Menu
          const data = event.postback?.data;
          console.log("Postback:", data);
          break;

        default:
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
