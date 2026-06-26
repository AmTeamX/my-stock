import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const d = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://api.line.me/v2";
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("❌ TOKEN missing");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TOKEN}`,
};
const config = JSON.parse(
  fs.readFileSync(path.join(d, "..", "richmenu-config.json"), "utf-8"),
);
const img = fs.readFileSync(
  path.join(d, "..", "public", "images", "richmenuv2_final.jpg"),
);

async function main() {
  // Delete old rich menu (from previous failed attempt)
  try {
    const list = await fetch(`${BASE}/bot/richmenu/list`, { headers });
    const data = await list.json();
    for (const m of data.richmenus || []) {
      await fetch(`${BASE}/bot/richmenu/${m.richMenuId}`, {
        method: "DELETE",
        headers,
      });
      console.log(`🗑️ ลบ ${m.richMenuId}`);
    }
  } catch {}

  // Create
  console.log("📤 สร้าง Rich Menu v2...");
  const c = await fetch(`${BASE}/bot/richmenu`, {
    method: "POST",
    headers,
    body: JSON.stringify(config),
  });
  const cd = await c.json();
  if (!c.ok) {
    console.error("❌", cd);
    process.exit(1);
  }
  const id = cd.richMenuId;
  console.log(`✅ ID: ${id}`);

  // Upload image
  console.log("🖼️ อัปโหลดรูป...");
  const u = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${id}/content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: img,
    },
  );
  if (!u.ok) {
    console.error("❌", await u.text());
    process.exit(1);
  }
  console.log("✅ อัปโหลดสำเร็จ");

  // Set default
  console.log("📌 ตั้งเป็น Default...");
  const s = await fetch(`${BASE}/bot/user/all/richmenu/${id}`, {
    method: "POST",
    headers,
  });
  if (!s.ok) {
    console.error("❌", await s.text());
    process.exit(1);
  }

  console.log(`🎉 Rich Menu v2 พร้อมใช้งาน!\n   ID: ${id}`);
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
