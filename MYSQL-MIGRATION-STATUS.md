# 🗄 MySQL Migration — Status & Next Steps

## ✅ เสร็จแล้ว (Session นี้)

### Backend (Node.js + Express + MySQL2 + JWT)
- ✅ `backend/sql/schema.sql` — **13 ตาราง** ครบทุก entity
- ✅ `backend/src/server.js` — Express + static serve + all routes
- ✅ `backend/src/db.js` — MySQL pool connection
- ✅ `backend/src/middleware/auth.js` — JWT + role check
- ✅ `backend/src/create-admin.js` — สร้าง admin ครั้งแรก
- ✅ `backend/src/migrate.js` — Import JSON backup → MySQL

### Routes (CRUD ครบ)
- ✅ `routes/auth.js` — `/api/login`, `/api/me`, `/api/change-password`
- ✅ `routes/products.js` — CRUD + clear all
- ✅ `routes/categories.js` — CRUD + cascade rename/delete
- ✅ `routes/suppliers.js` — CRUD
- ✅ `routes/customers.js` — CRUD
- ✅ `routes/expenses.js` — CRUD + date filter
- ✅ `routes/stock.js` — รับเข้า/จ่ายออก + transactions
- ✅ `routes/sales.js` — POS checkout + void + KPI summary
- ✅ `routes/sync.js` — Pull/Push full state

### Frontend
- ✅ `api-client.js` — wrapper สำหรับเรียก API ทุก endpoint
- ✅ Loaded ใน `index.html` (`<script src="api-client.js">`)
- ✅ `window.API` พร้อมใช้ทุกหน้า

### Docs
- ✅ `backend/README.md` — คู่มือติดตั้ง Windows step-by-step

---

## ⏳ ยังไม่เสร็จ (เซสชั่นต่อไป)

### 1. ติดตั้ง MySQL บน PC (User ทำเอง)
ตาม `backend/README.md`:
- ติดตั้ง MySQL 8 + Node.js 20
- สร้าง database
- รัน `npm install` + `npm run create-admin`
- รัน `npm run migrate <backup.json>` (ถ้ามีข้อมูลเก่า)
- Start server: `npm start`

### 2. Frontend Integration (Dev ทำ)
**ตอนนี้:** `api-client.js` โหลดแล้ว แต่ `index.html` **ยังใช้ localStorage ทั้งหมด**

**ต้องเพิ่ม:**
- 🅰️ **Sync Mode Toggle** ใน Settings — เลือก localStorage หรือ API
- 🅱️ **Auto-detect** — ลองเรียก `/api/health` ตอนเปิด → ถ้าเจอ ใช้ API
- 🅲️ **Login flow** — ใช้ `API.login()` แทนการเช็ค localStorage
- 🅳️ **CRUD calls** — แทนที่ `saveState()` ในจุดสำคัญด้วย API calls
  - `addProduct` → `API.products.create(p)`
  - `delProduct` → `API.products.remove(code)`
  - `checkout` → `API.sales.checkout(bill)`
  - ฯลฯ
- 🅴️ **Refresh views** — pull จาก API แทน localStorage

### 3. Test (Dev + User ทำร่วม)
- Test ทุก feature บน MySQL
- Run parallel กับระบบเดิม 1 อาทิตย์
- Cutover เมื่อมั่นใจ

---

## 🚀 ขั้นตอนถัดไป (User)

### 📅 ตอนนี้ (1-2 ชั่วโมง)
1. อ่าน `backend/README.md`
2. ติดตั้ง MySQL 8 + Node.js 20 บน PC ที่ร้าน
3. ทำตาม Step 1-8 ใน README
4. ทดสอบ:
   ```
   curl http://localhost:3000/api/health
   ```
   ควรเห็น `{"ok":true,"time":"..."}`
5. ทดสอบ login:
   ```bash
   curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"Fish@Stock2026"}'
   ```
   ควรได้ token

### 📅 เซสชั่นต่อไป (เมื่อ MySQL พร้อม)
บอกผม: **"Backend พร้อมแล้ว ต่อ Frontend"**

ผมจะทำต่อ:
1. เพิ่ม Settings → "Backend URL" field
2. แก้ Login UI ให้ใช้ `API.login()`
3. แก้ทุกฟังก์ชัน CRUD ให้ใช้ API
4. ทดสอบ end-to-end

---

## 📊 Database Schema (Quick Reference)

```
users              ← Login + role
categories         ← หมวดสินค้า
products           ← สินค้า + บาร์โค้ด
suppliers          ← ซัพพลายเออร์
customers          ← ลูกค้า + tier + แต้ม
sales              ← บิลขาย
sale_items         ← รายการในบิล
stock_movements    ← in/out/sale/void
expenses           ← ค่าใช้จ่าย
stock_count_sessions  ← นับสต็อก
stock_count_details
z_reports          ← ปิดยอดประจำวัน
parked_sales       ← บิลพักไว้
login_log          ← ประวัติ login
app_settings       ← key-value settings
```

---

## 🌐 API Endpoints (Quick Reference)

```
POST   /api/login                       — Login
GET    /api/me                          — Current user
POST   /api/change-password             — Change pwd
GET    /api/health                      — Health check

GET    /api/products                    — List
POST   /api/products                    — Create
PUT    /api/products/:code              — Update
DELETE /api/products/:code              — Delete
DELETE /api/products                    — Clear all

GET    /api/categories                  — List
POST   /api/categories                  — Create
PUT    /api/categories/:id              — Update (+cascade rename)
DELETE /api/categories/:id              — Delete (+cascade move)

GET    /api/suppliers                   — List
POST   /api/suppliers                   — Create
PUT    /api/suppliers/:id               — Update
DELETE /api/suppliers/:id               — Delete

GET    /api/customers                   — List
POST   /api/customers                   — Create
PUT    /api/customers/:id               — Update
DELETE /api/customers/:id               — Delete

GET    /api/expenses?from=&to=          — List + filter
POST   /api/expenses                    — Create
DELETE /api/expenses/:id                — Delete

GET    /api/stock?code=&type=&from=&to= — List movements
POST   /api/stock/in                    — รับเข้า (transaction)
POST   /api/stock/out                   — จ่ายออก (transaction)

GET    /api/sales?from=&to=             — List bills (with items)
POST   /api/sales                       — Checkout (transaction)
DELETE /api/sales/:bill_no              — Void bill (transaction)
GET    /api/sales/summary/kpi?from=&to= — KPI summary

GET    /api/sync                        — Pull full state
POST   /api/sync                        — Push categories+settings only
```

---

## 🔐 Security Notes

- ✅ JWT tokens (12hr expiry)
- ✅ bcrypt password hashing
- ✅ SQL injection prevention (prepared statements)
- ✅ Role-based access (admin/staff)
- ✅ Login logging
- ⚠️ **CORS** open — ถ้าใช้ public ปิด origin specific
- ⚠️ **Rate limiting** ยังไม่มี — เพิ่มถ้า public

---

## 💡 ใช้งานร่วมระหว่าง 2 ระบบ

ในขณะเปลี่ยน — สามารถใช้ทั้ง 2 ระบบขนานกันได้:

### localStorage (เดิม):
- เปิด `index.html` ตรง ๆ
- หรือ DigitalOcean URL
- เร็ว ออฟไลน์ได้

### MySQL (ใหม่):
- เปิด `http://192.168.1.100:3000` (LAN)
- ข้อมูลกลาง multi-device

### Transition Plan:
1. เปิด MySQL backend
2. Migrate ข้อมูลปัจจุบัน
3. ใช้ทั้ง 2 ระบบ 1 อาทิตย์ (เทียบข้อมูล)
4. Cutover เมื่อมั่นใจ → ปิด localStorage mode

---

🎣🗄
