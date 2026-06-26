import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Types matching our database
export interface StockRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  category: string;
  image_url: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  created_at: string;
  stock_name: string;
  type: "add" | "withdraw";
  quantity: number;
  user_id: string;
  note: string;
}

export interface SheetSettings {
  enabled: boolean;
  threshold: number;
  recipientUserIds: string[];
  notifyAllGroupMembers: boolean;
}

// --- Client ---
let _sb: SupabaseClient | null = null;

function sb(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key)
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  _sb = createClient(url, key);
  return _sb;
}

// ===== STOCK =====

export async function getStockList(): Promise<StockRow[]> {
  const { data, error } = await sb().from("stocks").select("*").order("name");
  if (error) throw new Error(error.message);
  return (data || []) as any;
}

export async function addStock(opts: {
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: string;
  imageUrl?: string;
  userId?: string;
}): Promise<void> {
  const client = sb();

  // Check existing
  const { data: existing } = await client
    .from("stocks")
    .select("id, quantity")
    .ilike("name", opts.name)
    .maybeSingle();
  const found = existing as { id: string; quantity: number } | null;

  if (found) {
    const newQty = found.quantity + opts.quantity;
    await client
      .from("stocks")
      .update({
        quantity: newQty,
        unit: opts.unit,
        min_threshold: opts.minThreshold,
        category: opts.category,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", found.id);

    await addTx({
      stockName: opts.name,
      type: "add",
      quantity: opts.quantity,
      userId: opts.userId || "unknown",
      note: `เติมเพิ่ม (จาก ${found.quantity} เป็น ${newQty})`,
    });
  } else {
    const newId = `ITEM-${Date.now()}`;
    await client.from("stocks").insert({
      id: newId,
      name: opts.name,
      quantity: opts.quantity,
      unit: opts.unit,
      min_threshold: opts.minThreshold,
      category: opts.category,
      image_url: opts.imageUrl || "",
    } as any);

    await addTx({
      stockName: opts.name,
      type: "add",
      quantity: opts.quantity,
      userId: opts.userId || "unknown",
      note: "เพิ่มรายการใหม่",
    });
  }
}

export async function withdrawStock(opts: {
  stockId: string;
  quantity: number;
  note?: string;
  userId?: string;
}): Promise<{
  success: boolean;
  lowStock: boolean;
  itemName: string;
  remaining: number;
  threshold: number;
}> {
  const client = sb();

  const { data: stock, error } = await client
    .from("stocks")
    .select("*")
    .eq("id", opts.stockId)
    .single();

  if (error || !stock) throw new Error("ไม่พบรายการ Stock นี้");
  if ((stock as any).quantity < opts.quantity) {
    throw new Error(
      `จำนวนคงเหลือไม่พอ (เหลือ ${(stock as any).quantity} ${(stock as any).unit})`,
    );
  }

  const newQty = (stock as any).quantity - opts.quantity;
  await client
    .from("stocks")
    .update({ quantity: newQty, updated_at: new Date().toISOString() } as any)
    .eq("id", opts.stockId);

  await addTx({
    stockName: (stock as any).name,
    type: "withdraw",
    quantity: opts.quantity,
    userId: opts.userId || "unknown",
    note: opts.note || "",
  });

  return {
    success: true,
    lowStock: newQty <= (stock as any).min_threshold,
    itemName: (stock as any).name,
    remaining: newQty,
    threshold: (stock as any).min_threshold,
  };
}

export async function updateStockImage(
  stockId: string,
  imageUrl: string,
): Promise<void> {
  await sb()
    .from("stocks")
    .update({ image_url: imageUrl } as any)
    .eq("id", stockId);
}

// ===== TRANSACTIONS =====

async function addTx(opts: {
  stockName: string;
  type: "add" | "withdraw";
  quantity: number;
  userId: string;
  note: string;
}): Promise<void> {
  await sb()
    .from("transactions")
    .insert({
      id: `TX-${Date.now()}`,
      stock_name: opts.stockName,
      type: opts.type,
      quantity: opts.quantity,
      user_id: opts.userId,
      note: opts.note,
    } as any);
}

export async function getTransactions(limit = 50): Promise<TransactionRow[]> {
  const { data, error } = await sb()
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as any;
}

// ===== SETTINGS =====

export async function getSettings(): Promise<SheetSettings> {
  const { data, error } = await sb().from("settings").select("*");
  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  ((data || []) as any[]).forEach((row: any) => {
    map[row.key] = row.value || "";
  });

  return {
    enabled: map["enabled"] === "true",
    threshold: parseInt(map["threshold"] || "10", 10),
    recipientUserIds: map["recipientUserIds"]
      ? map["recipientUserIds"].split(",").filter(Boolean)
      : [],
    notifyAllGroupMembers: map["notifyAllGroupMembers"] === "true",
  };
}

export async function updateSettings(
  settings: Partial<SheetSettings>,
): Promise<void> {
  const client = sb();
  const current = await getSettings();
  const merged = { ...current, ...settings };
  const entries = [
    { key: "enabled", value: String(merged.enabled) },
    { key: "threshold", value: String(merged.threshold) },
    { key: "recipientUserIds", value: merged.recipientUserIds.join(",") },
    {
      key: "notifyAllGroupMembers",
      value: String(merged.notifyAllGroupMembers),
    },
  ];
  for (const e of entries) {
    await client.from("settings").upsert(e as any, { onConflict: "key" });
  }
}

// ===== STORAGE =====

export async function uploadImageToStorage(
  base64Image: string,
  fileName: string,
): Promise<string> {
  const client = sb();
  let data = base64Image;
  let contentType = "image/png";

  if (base64Image.startsWith("data:")) {
    const m = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      contentType = m[1];
      data = m[2];
    }
  }

  const buffer = Buffer.from(data, "base64");
  const { error } = await client.storage
    .from("stock-images")
    .upload(fileName, buffer, { contentType, upsert: true });
  if (error) throw new Error(error.message);

  const { data: pub } = client.storage
    .from("stock-images")
    .getPublicUrl(fileName);
  return pub.publicUrl;
}

// ===== INIT =====

export async function initializeSheets(): Promise<void> {
  const { error } = await sb().from("stocks").select("id").limit(1);
  if (error) {
    console.warn("Supabase tables not found. Run supabase-schema.sql first.");
  }
}
