import { GoogleAuth } from "google-auth-library";
import { google, sheets_v4 } from "googleapis";

// Column mapping for Stock sheet
const STOCK_COLUMNS = {
  ID: 0,
  NAME: 1,
  QUANTITY: 2,
  UNIT: 3,
  MIN_THRESHOLD: 4,
  CATEGORY: 5,
  UPDATED_AT: 6,
  IMAGE_URL: 7,
};

// Column mapping for Transactions sheet
const TX_COLUMNS = {
  ID: 0,
  DATE: 1,
  STOCK_NAME: 2,
  TYPE: 3,
  QUANTITY: 4,
  USER_ID: 5,
  NOTE: 6,
};

// Column mapping for Settings sheet
const SETTINGS_COLUMNS = {
  KEY: 0,
  VALUE: 1,
};

function getAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n",
  );
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
  return auth;
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

function getSheetId(): string {
  return process.env.GOOGLE_SHEET_ID || "";
}

// ===== STOCK OPERATIONS =====

export async function getStockList(): Promise<any[]> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  let rows: any[][] = [];

  // Try A:H (with image column), fallback to A:G
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "stock!A:H",
    });
    rows = response.data.values || [];
  } catch {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "stock!A:G",
    });
    rows = response.data.values || [];
  }
  // Skip header row
  return rows.slice(1).map((row, index) => ({
    id: row[STOCK_COLUMNS.ID] || `${index + 2}`,
    name: row[STOCK_COLUMNS.NAME] || "",
    quantity: parseInt(row[STOCK_COLUMNS.QUANTITY] || "0", 10),
    unit: row[STOCK_COLUMNS.UNIT] || "",
    minThreshold: parseInt(row[STOCK_COLUMNS.MIN_THRESHOLD] || "0", 10),
    category: row[STOCK_COLUMNS.CATEGORY] || "",
    updatedAt: row[STOCK_COLUMNS.UPDATED_AT] || "",
    imageUrl: row[STOCK_COLUMNS.IMAGE_URL] || "",
  }));
}

export async function addStock(data: {
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: string;
  imageUrl?: string;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  // Check if item already exists
  const existing = await getStockList();
  const found = existing.find(
    (item) => item.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (found) {
    // Update existing item quantity
    const rowIndex = parseInt(found.id, 10);
    const newQty = found.quantity + data.quantity;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `stock!C${rowIndex}:H${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            newQty,
            data.unit || found.unit,
            data.minThreshold || found.minThreshold,
            data.category || found.category,
            new Date().toLocaleString("th-TH"),
            data.imageUrl || found.imageUrl || "",
          ],
        ],
      },
    });
  } else {
    // Add new item
    const newId = `ITEM-${Date.now()}`;
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "stock!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            newId,
            data.name,
            data.quantity,
            data.unit,
            data.minThreshold,
            data.category,
            new Date().toLocaleString("th-TH"),
            data.imageUrl || "",
          ],
        ],
      },
    });
  }
}

export async function withdrawStock(data: {
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
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  const allStock = await getStockList();
  const stock = allStock.find((s) => s.id === data.stockId);

  if (!stock) {
    throw new Error("ไม่พบรายการStockนี้");
  }

  if (stock.quantity < data.quantity) {
    throw new Error(
      `จำนวนคงเหลือไม่พอ (เหลือ ${stock.quantity} ${stock.unit})`,
    );
  }

  const newQty = stock.quantity - data.quantity;
  const rowIndex = parseInt(stock.id, 10);

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `stock!C${rowIndex}:H${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          newQty,
          stock.unit,
          stock.minThreshold,
          stock.category,
          new Date().toLocaleString("th-TH"),
          stock.imageUrl || "",
        ],
      ],
    },
  });

  // Record transaction
  await addTransaction({
    stockName: stock.name,
    type: "withdraw",
    quantity: data.quantity,
    userId: data.userId || "unknown",
    note: data.note || "",
  });

  const lowStock = newQty <= stock.minThreshold;

  return {
    success: true,
    lowStock,
    itemName: stock.name,
    remaining: newQty,
    threshold: stock.minThreshold,
  };
}

// ===== TRANSACTION OPERATIONS =====

async function addTransaction(data: {
  stockName: string;
  type: "add" | "withdraw";
  quantity: number;
  userId: string;
  note: string;
}): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  const txId = `TX-${Date.now()}`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "transactions!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          txId,
          new Date().toLocaleString("th-TH"),
          data.stockName,
          data.type,
          data.quantity,
          data.userId,
          data.note,
        ],
      ],
    },
  });
}

export async function getTransactions(limit: number = 50): Promise<any[]> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "transactions!A:G",
    });

    const rows = response.data.values || [];
    return rows
      .slice(1)
      .slice(-limit)
      .reverse()
      .map((row) => ({
        id: row[TX_COLUMNS.ID] || "",
        date: row[TX_COLUMNS.DATE] || "",
        stockName: row[TX_COLUMNS.STOCK_NAME] || "",
        type: row[TX_COLUMNS.TYPE] || "",
        quantity: parseInt(row[TX_COLUMNS.QUANTITY] || "0", 10),
        userId: row[TX_COLUMNS.USER_ID] || "",
        note: row[TX_COLUMNS.NOTE] || "",
      }));
  } catch {
    return [];
  }
}

// ===== SETTINGS OPERATIONS =====

export interface SheetSettings {
  enabled: boolean;
  threshold: number;
  recipientUserIds: string[];
  notifyAllGroupMembers: boolean;
}

export async function getSettings(): Promise<SheetSettings> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "settings!A:B",
    });

    const rows = response.data.values || [];
    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      settings[row[0]] = row[1] || "";
    });

    return {
      enabled: settings["enabled"] === "true",
      threshold: parseInt(
        settings["threshold"] ||
          process.env.LOW_STOCK_THRESHOLD_DEFAULT ||
          "10",
        10,
      ),
      recipientUserIds: settings["recipientUserIds"]
        ? settings["recipientUserIds"].split(",").filter(Boolean)
        : [],
      notifyAllGroupMembers: settings["notifyAllGroupMembers"] === "true",
    };
  } catch {
    return {
      enabled: true,
      threshold: parseInt(process.env.LOW_STOCK_THRESHOLD_DEFAULT || "10", 10),
      recipientUserIds: [],
      notifyAllGroupMembers: false,
    };
  }
}

export async function updateSettings(
  settings: Partial<SheetSettings>,
): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  const current = await getSettings();
  const updated = { ...current, ...settings };

  const values = [
    ["enabled", String(updated.enabled)],
    ["threshold", String(updated.threshold)],
    ["recipientUserIds", updated.recipientUserIds.join(",")],
    ["notifyAllGroupMembers", String(updated.notifyAllGroupMembers)],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "settings!A:B",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

// ===== INITIALIZATION =====

export async function initializeSheets(): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  // Get existing sheet names
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existingNames = (spreadsheet.data.sheets || []).map(
    (s) => s.properties?.title || "",
  );

  // Helper: create sheet tab if not exists (returns true if already existed)
  async function ensureSheet(title: string): Promise<boolean> {
    if (existingNames.includes(title)) return true;
    // Remove default "Sheet1" if it exists and this is the first real sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
    return false;
  }

  // --- Stock sheet ---
  const hadStock = await ensureSheet("stock");
  if (!hadStock) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "stock!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            "ID",
            "ชื่อรายการ",
            "จำนวน",
            "หน่วย",
            "จำนวนขั้นต่ำ",
            "หมวดหมู่",
            "อัพเดทล่าสุด",
            "รูปภาพ",
          ],
        ],
      },
    });
  } else {
    // Sheet exists — check if H column missing, add it
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "stock!H1",
      });
    } catch {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "stock!H1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["รูปภาพ"]] },
      });
    }
  }

  // --- Transactions sheet ---
  const hadTx = await ensureSheet("transactions");
  if (!hadTx) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "transactions!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["ID", "วันที่", "รายการ", "ประเภท", "จำนวน", "ผู้ใช้", "หมายเหตุ"],
        ],
      },
    });
  }

  // --- Settings sheet ---
  const hadSettings = await ensureSheet("settings");
  if (!hadSettings) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "settings!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Key", "Value"],
          ["enabled", "true"],
          ["threshold", process.env.LOW_STOCK_THRESHOLD_DEFAULT || "10"],
          ["recipientUserIds", ""],
          ["notifyAllGroupMembers", "false"],
        ],
      },
    });
  }
}

// ===== IMAGE UPDATE =====

export async function updateStockImage(
  stockId: string,
  imageUrl: string,
): Promise<void> {
  const sheets = await getSheetsClient();
  const sheetId = getSheetId();

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `stock!H${parseInt(stockId)}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[imageUrl]],
    },
  });
}
