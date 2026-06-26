# 📦 MyStock - ระบบจัดการ Stock พยาบาลผ่าน LINE

แอปพลิเคชันสำหรับจัดการ Stock ของพยาบาล ใช้งานผ่าน LINE LIFF (LINE Front-end Framework) 
เชื่อมต่อกับ Google Sheets เป็นฐานข้อมูล

## ✨ Features

- 📋 **ดูรายการ Stock** - ดูของทั้งหมดที่อยู่ในคลัง แยกตามหมวดหมู่ ค้นหาได้
- ➕ **เพิ่ม Stock** - เพิ่มรายการใหม่ หรือเติมจำนวนของที่มีอยู่แล้ว
- 📤 **เบิกของ** - เบิกของออกจาก Stock พร้อมปุ่ม Quick Withdraw (-1, -5)
- 📜 **ประวัติการทำรายการ** - ดูประวัติการเบิก-เพิ่ม Stock ย้อนหลัง
- ⚠️ **แจ้งเตือนใกล้หมด** - เมื่อเบิกของแล้วเหลือน้อยกว่าระดับที่ตั้งไว้ ระบบจะส่งข้อความแจ้งเตือนผ่าน LINE
- ⚙️ **ตั้งค่าการแจ้งเตือน** - กำหนดจำนวนขั้นต่ำ, เพิ่มผู้รับการแจ้งเตือน
- 📱 **LINE Rich Menu** - เมนูลัดภายใน LINE สำหรับเข้าถึงฟีเจอร์ต่างๆ

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets (ผ่าน Google Sheets API)
- **LINE Integration**: LINE LIFF, LINE Messaging API, LINE Rich Menu

## 📋 Prerequisites

ก่อนเริ่มต้นใช้งาน ต้องเตรียมสิ่งต่อไปนี้:

### 1. LINE Developer Account
- สมัครที่ [LINE Developers Console](https://developers.line.biz/console/)
- สร้าง Provider และ Channel (Messaging API)
- สร้าง LIFF App และจด `LIFF ID`

### 2. LINE Official Account
- ใช้ Channel เดียวกับ LIFF
- ออก `Channel Access Token` (Messaging API)
- จด `Channel Secret`

### 3. Google Cloud Project
- สร้าง Project ที่ [Google Cloud Console](https://console.cloud.google.com/)
- เปิดใช้งาน Google Sheets API
- สร้าง Service Account และดาวน์โหลด JSON Key
- จด `Service Account Email` และ `Private Key`

### 4. Google Sheet
- สร้าง Google Sheet ใหม่
- แชร์ Google Sheet ให้ Service Account Email (Editor)
- จด `Sheet ID` จาก URL

## 🚀 Installation

```bash
# 1. Clone โปรเจค
cd mystock

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า environment variables
cp .env.local.example .env.local
# แก้ไขไฟล์ .env.local ใส่ค่าต่างๆตามที่เตรียมไว้

# 4. สร้าง Sheet เริ่มต้น
curl -X POST http://localhost:3000/api/init-sheets

# 5. รัน Development Server
npm run dev

# 6. เปิดเบราว์เซอร์
# http://localhost:3000
```

## ⚙️ Environment Variables

แก้ไขไฟล์ `.env.local`:

```env
# LINE LIFF
NEXT_PUBLIC_LIFF_ID=1234567890-abcd1234

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-long-lived-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id

# Notification
LOW_STOCK_THRESHOLD_DEFAULT=10
```

## 📱 การตั้งค่า LINE LIFF

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel → LIFF → Add
3. ตั้งค่า:
   - **LIFF app name**: MyStock
   - **Size**: Full
   - **Endpoint URL**: `https://your-domain.com`
   - **Scopes**: `profile`, `chat_message.write`
   - **Bot link feature**: On (Normal)

4. หลังจาก Deploy แล้ว ให้เปลี่ยน Endpoint URL เป็น URL จริง

## 📊 Google Sheets Structure

เมื่อรัน `POST /api/init-sheets` ระบบจะสร้าง Sheet 3 แผ่น:

### `stock` - ข้อมูล Stock
| ID | ชื่อรายการ | จำนวน | หน่วย | จำนวนขั้นต่ำ | หมวดหมู่ | อัพเดทล่าสุด |
|----|-----------|-------|------|------------|--------|-------------|

### `transactions` - ประวัติ
| ID | วันที่ | รายการ | ประเภท | จำนวน | ผู้ใช้ | หมายเหตุ |
|----|-------|--------|--------|-------|--------|---------|

### `settings` - ตั้งค่า
| Key | Value |
|-----|-------|
| enabled | true/false |
| threshold | 10 |
| recipientUserIds | Uxxx,Uyyy |
| notifyAllGroupMembers | true/false |

## 🎨 Rich Menu

1. สร้างรูปภาพ Rich Menu ขนาด 2500×1686px
2. อัปโหลดรูปและสร้าง Rich Menu ผ่าน LINE Messaging API
3. ใช้ค่า config จาก `richmenu-config.json`

ตัวอย่างคำสั่งสร้าง Rich Menu ด้วย curl:

```bash
# สร้าง Rich Menu
curl -X POST https://api.line.me/v2/bot/richmenu \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d @richmenu-config.json

# อัปโหลดรูป
curl -X POST https://api.data.line.me/v2/bot/richmenu/{richMenuId}/content \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}" \
  -H "Content-Type: image/png" \
  -T richmenu-image.png

# ตั้งเป็น Default Rich Menu
curl -X POST https://api.line.me/v2/bot/user/all/richmenu/{richMenuId} \
  -H "Authorization: Bearer {CHANNEL_ACCESS_TOKEN}"
```

## 🧪 Development

```bash
# รัน Development Server
npm run dev

# Build สำหรับ Production
npm run build
npm start
```

## 📡 Deploy

แนะนำให้ Deploy บน Vercel:

1. Push โค้ดขึ้น GitHub
2. Import project ใน Vercel
3. ตั้งค่า Environment Variables ใน Vercel Dashboard
4. Deploy!

หรือใช้ Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 License

MIT
