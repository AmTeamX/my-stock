// ประเภทข้อมูลสำหรับรายการ Stock
export interface StockItem {
  id: string; // unique ID (row number)
  name: string; // ชื่อรายการ
  quantity: number; // จำนวนคงเหลือ
  unit: string; // หน่วย (กล่อง, ชิ้น, ขวด, etc.)
  minThreshold: number; // จำนวนขั้นต่ำก่อนแจ้งเตือน
  category: string; // หมวดหมู่
  updatedAt: string; // อัพเดทล่าสุด
  imageUrl: string; // URL รูปภาพ
}

// ประเภทสำหรับการเพิ่ม Stock
export interface AddStockPayload {
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: string;
  imageUrl?: string;
}

// ประเภทสำหรับการเบิก Stock
export interface WithdrawPayload {
  stockId: string;
  quantity: number;
  note?: string;
}

// ประเภทประวัติการทำรายการ
export interface Transaction {
  id: string;
  date: string;
  stockName: string;
  type: "add" | "withdraw";
  quantity: number;
  userId: string;
  note: string;
}

// ประเภทการตั้งค่าการแจ้งเตือน
export interface NotificationSettings {
  enabled: boolean;
  threshold: number; // แจ้งเมื่อของเหลือน้อยกว่านี้
  recipientUserIds: string[]; // LINE User IDs ที่ต้องการให้แจ้งเตือน
  notifyAllGroupMembers: boolean; // แจ้งทุกคนในกลุ่มหรือไม่
}

// LINE Profile
export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
