import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key)
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY required");
  _sb = createClient(url, key);
  return _sb;
}

export interface Ward {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}
export interface StockRow {
  id: string;
  ward_id: string;
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
  ward_id: string;
  created_at: string;
  stock_name: string;
  type: "add" | "withdraw";
  quantity: number;
  user_id: string;
  note: string;
}

// ===== WARDS =====
export async function createWard(name: string, userId: string): Promise<Ward> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const id = `WARD-${Date.now()}`;
  await sb()
    .from("wards")
    .insert({ id, name, invite_code: code, created_by: userId } as any);
  await sb()
    .from("ward_members")
    .insert({ ward_id: id, user_id: userId, display_name: "" } as any);
  return {
    id,
    name,
    invite_code: code,
    created_by: userId,
    created_at: new Date().toISOString(),
  };
}

export async function joinWardByCode(
  code: string,
  userId: string,
): Promise<Ward> {
  const { data, error } = await sb()
    .from("wards")
    .select("*")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (error || !data) throw new Error("ไม่พบวอร์ดนี้ — ตรวจสอบรหัสอีกครั้ง");
  const ward = data as any;
  const { data: existing } = await sb()
    .from("ward_members")
    .select("user_id")
    .eq("ward_id", ward.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing)
    await sb()
      .from("ward_members")
      .insert({ ward_id: ward.id, user_id: userId, display_name: "" } as any);
  return {
    id: ward.id,
    name: ward.name,
    invite_code: ward.invite_code,
    created_by: ward.created_by,
    created_at: ward.created_at,
  };
}

export async function getMyWards(userId: string): Promise<Ward[]> {
  const { data } = await sb()
    .from("ward_members")
    .select("ward_id")
    .eq("user_id", userId);
  if (!data || data.length === 0) return [];
  const ids = (data as any[]).map((r) => r.ward_id);
  const { data: wards } = await sb()
    .from("wards")
    .select("*")
    .in("id", ids)
    .order("name");
  return (wards || []) as any;
}

export async function getWardMembers(
  wardId: string,
): Promise<{ user_id: string; display_name: string }[]> {
  const { data } = await sb()
    .from("ward_members")
    .select("user_id, display_name")
    .eq("ward_id", wardId);
  return (data || []) as any;
}

export async function getDisplayName(
  wardId: string,
  userId: string,
): Promise<string> {
  const { data } = await sb()
    .from("ward_members")
    .select("display_name")
    .eq("ward_id", wardId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as any)?.display_name || "";
}

export async function setDisplayName(
  wardId: string,
  userId: string,
  name: string,
): Promise<void> {
  await sb()
    .from("ward_members")
    .update({ display_name: name.trim() } as any)
    .eq("ward_id", wardId)
    .eq("user_id", userId);
}

export async function renameWard(wardId: string, name: string): Promise<void> {
  await sb()
    .from("wards")
    .update({ name } as any)
    .eq("id", wardId);
}

export async function leaveWard(wardId: string, userId: string): Promise<void> {
  await sb()
    .from("ward_members")
    .delete()
    .eq("ward_id", wardId)
    .eq("user_id", userId);
}

// ===== STOCK =====
export async function getStockList(wardId: string): Promise<StockRow[]> {
  const { data, error } = await sb()
    .from("stocks")
    .select("*")
    .eq("ward_id", wardId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data || []) as any;
}

export async function addStock(opts: {
  wardId: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: string;
  imageUrl?: string;
  userId?: string;
}): Promise<void> {
  const client = sb();
  const { data: existing } = await client
    .from("stocks")
    .select("id, quantity")
    .eq("ward_id", opts.wardId)
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
      .eq("id", found.id)
      .eq("ward_id", opts.wardId);
    await addTx({
      wardId: opts.wardId,
      stockName: opts.name,
      type: "add",
      quantity: opts.quantity,
      userId: opts.userId || "unknown",
      note: `เติมเพิ่ม (จาก ${found.quantity} เป็น ${newQty})`,
    });
  } else {
    const newId = `ITEM-${Date.now()}`;
    await client
      .from("stocks")
      .insert({
        id: newId,
        ward_id: opts.wardId,
        name: opts.name,
        quantity: opts.quantity,
        unit: opts.unit,
        min_threshold: opts.minThreshold,
        category: opts.category,
        image_url: opts.imageUrl || "",
      } as any);
    await addTx({
      wardId: opts.wardId,
      stockName: opts.name,
      type: "add",
      quantity: opts.quantity,
      userId: opts.userId || "unknown",
      note: "เพิ่มรายการใหม่",
    });
  }
}

export async function withdrawStock(opts: {
  wardId: string;
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
    .eq("ward_id", opts.wardId)
    .single();
  if (error || !stock) throw new Error("ไม่พบรายการ Stock นี้");
  const s = stock as any;
  if (s.quantity < opts.quantity)
    throw new Error(`จำนวนคงเหลือไม่พอ (เหลือ ${s.quantity} ${s.unit})`);

  const newQty = s.quantity - opts.quantity;
  await client
    .from("stocks")
    .update({ quantity: newQty, updated_at: new Date().toISOString() } as any)
    .eq("id", opts.stockId)
    .eq("ward_id", opts.wardId);
  await addTx({
    wardId: opts.wardId,
    stockName: s.name,
    type: "withdraw",
    quantity: opts.quantity,
    userId: opts.userId || "unknown",
    note: opts.note || "",
  });

  return {
    success: true,
    lowStock: newQty <= s.min_threshold,
    itemName: s.name,
    remaining: newQty,
    threshold: s.min_threshold,
  };
}

export async function updateStockImage(
  wardId: string,
  stockId: string,
  imageUrl: string,
): Promise<void> {
  await sb()
    .from("stocks")
    .update({ image_url: imageUrl } as any)
    .eq("id", stockId)
    .eq("ward_id", wardId);
}

// ===== TRANSACTIONS =====
async function addTx(opts: {
  wardId: string;
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
      ward_id: opts.wardId,
      stock_name: opts.stockName,
      type: opts.type,
      quantity: opts.quantity,
      user_id: opts.userId,
      note: opts.note,
    } as any);
}

export async function getTransactions(
  wardId: string,
  limit = 50,
): Promise<TransactionRow[]> {
  const { data, error } = await sb()
    .from("transactions")
    .select("*")
    .eq("ward_id", wardId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data || []) as any;
}

// ===== NOTIFICATIONS =====
export async function registerUser(userId: string): Promise<void> {
  if (!userId || userId === "unknown") return;
  try {
    await sb()
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          notify: true,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "user_id" },
      );
  } catch {
    /* table might not exist */
  }
}

export async function getUserNotifySetting(userId: string): Promise<boolean> {
  try {
    const { data } = await sb()
      .from("user_settings")
      .select("notify")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as any)?.notify ?? true;
  } catch {
    return true;
  }
}

export async function setUserNotifySetting(
  userId: string,
  notify: boolean,
): Promise<void> {
  await sb()
    .from("user_settings")
    .upsert(
      { user_id: userId, notify, updated_at: new Date().toISOString() } as any,
      { onConflict: "user_id" },
    );
}

export async function getNotifyEnabledUserIds(
  wardId: string,
): Promise<string[]> {
  // Get ward members first
  try {
    const members = await getWardMembers(wardId);
    const ids = members.map((m) => m.user_id);
    if (ids.length > 0) {
      const { data } = await sb()
        .from("user_settings")
        .select("user_id")
        .eq("notify", true)
        .in("user_id", ids);
      if (data && data.length > 0)
        return (data as any[]).map((r: any) => r.user_id);
    }
  } catch {}
  // Fallback: all users with notify enabled
  try {
    const { data } = await sb()
      .from("user_settings")
      .select("user_id")
      .eq("notify", true);
    if (data && data.length > 0)
      return (data as any[]).map((r: any) => r.user_id);
  } catch {}
  return [];
}

// ===== STORAGE =====
export async function uploadImageToStorage(
  base64Image: string,
  fileName: string,
): Promise<string> {
  const client = sb();
  let data = base64Image,
    contentType = "image/png";
  if (base64Image.startsWith("data:")) {
    const m = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      contentType = m[1];
      data = m[2];
    }
  }
  const buf = Buffer.from(data, "base64");
  const { error } = await client.storage
    .from("stock-images")
    .upload(fileName, buf, { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return client.storage.from("stock-images").getPublicUrl(fileName).data
    .publicUrl;
}

export async function initializeSheets(): Promise<void> {
  const { error } = await sb().from("stocks").select("id").limit(1);
  if (error)
    console.warn("Supabase tables not found. Run supabase-schema.sql first.");
}
