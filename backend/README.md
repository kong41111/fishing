# 🐟 FishStock Backend — MySQL + Node.js

ระบบ Backend สำหรับ FishStock — ติดตั้งบน PC ที่ร้าน เป็น local server

## 📋 สิ่งที่ต้องติดตั้งบน PC

1. **MySQL 8** (หรือ MariaDB 10+)
2. **Node.js 20+**
3. **Git** (สำหรับ pull update)

---

## 🚀 ติดตั้งครั้งแรก (~30 นาที)

### Step 1: ติดตั้ง MySQL

#### Windows:
1. ดาวน์โหลด **MySQL Community Server** จาก https://dev.mysql.com/downloads/installer/
2. เลือก **mysql-installer-community** → Download → No thanks, just start
3. รัน installer → เลือก **Server only**
4. **ตั้ง root password** (จดไว้!)
5. รอติดตั้งเสร็จ → Finish

#### ตรวจสอบ:
เปิด PowerShell → พิมพ์:
```powershell
mysql -u root -p
```
ใส่ password → ถ้าเข้า prompt `mysql>` ได้ = สำเร็จ ✅

---

### Step 2: สร้าง Database + User

ใน MySQL prompt:
```sql
-- สร้าง database + user สำหรับแอป
CREATE DATABASE fishstock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fishstock'@'localhost' IDENTIFIED BY 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON fishstock.* TO 'fishstock'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Import Schema

```powershell
cd C:\Users\User\Desktop\Fishing\backend
mysql -u fishstock -p fishstock < sql\schema.sql
```

ตรวจ:
```sql
mysql -u fishstock -p
USE fishstock;
SHOW TABLES;
-- ควรเห็นตาราง 13 ตัว: users, products, sales, ฯลฯ
```

---

### Step 4: ติดตั้ง Node.js + Dependencies

1. ดาวน์โหลด Node.js 20 LTS จาก https://nodejs.org → next ๆ
2. เปิด PowerShell:
```powershell
cd C:\Users\User\Desktop\Fishing\backend
npm install
```

### Step 5: ตั้งค่า .env

```powershell
copy .env.example .env
notepad .env
```

แก้:
- `DB_PASS=ChangeThisPassword123!` ← ตรงกับที่ตั้งใน MySQL
- `JWT_SECRET=` ← random string ยาว ๆ (เช่นใช้ https://randomkeygen.com)
- `DEFAULT_ADMIN_PASS=` ← password ของ admin

### Step 6: สร้าง Admin Account

```powershell
npm run create-admin
```

ควรเห็น:
```
✅ Created admin: admin / Fish@Stock2026
```

### Step 7: Migrate ข้อมูลเก่า (ถ้ามี)

ถ้ามี backup JSON จากระบบเดิม (จาก Settings → Export):
```powershell
npm run migrate "C:\path\to\FishStock-Backup-xxxx.json"
```

### Step 8: Start Server

```powershell
npm start
```

ควรเห็น:
```
✅ MySQL connected to fishstock
🚀 FishStock backend on http://localhost:3000
🌐 LAN access: http://<your-ip>:3000
```

---

## 🌐 เปิดบน Browser

### บน PC เดียวกัน:
```
http://localhost:3000
```

### บนเครื่องอื่นใน Wi-Fi เดียวกัน:
หา IP ของ PC ก่อน:
```powershell
ipconfig
```
หา `IPv4 Address` (เช่น `192.168.1.100`)

แล้วบน iPad/มือถือ เปิด:
```
http://192.168.1.100:3000
```

---

## 🔥 เปิด Firewall (Windows)

ครั้งแรก Windows จะถาม → Allow

หรือเปิด port manual:
```powershell
# Run PowerShell as Administrator
netsh advfirewall firewall add rule name="FishStock" dir=in action=allow protocol=TCP localport=3000
```

---

## 🚀 รัน Server ตลอดเวลา (Production)

### Option A: PM2 (แนะนำ)
```powershell
npm install -g pm2
pm2 start src/server.js --name fishstock
pm2 startup
pm2 save
```

### Option B: Task Scheduler
1. เปิด Task Scheduler
2. Create Task → Triggers: At startup
3. Actions: `node C:\Users\User\Desktop\Fishing\backend\src\server.js`
4. Run whether user is logged in or not

---

## 💾 Backup MySQL อัตโนมัติ

### Backup รายวัน → Google Drive

สร้างไฟล์ `backup.bat`:
```batch
@echo off
set DATE=%date:~-4%-%date:~3,2%-%date:~0,2%
mysqldump -u fishstock -pChangeThisPassword123! fishstock > "C:\Users\User\Google Drive\fishstock-backup\backup-%DATE%.sql"
```

ตั้ง Task Scheduler รันทุกคืน 23:00

---

## 🆘 Troubleshooting

| ปัญหา | แก้ |
|---|---|
| MySQL connection failed | ตรวจ password ใน .env + service MySQL ทำงานอยู่ |
| Port 3000 already in use | เปลี่ยน PORT ใน .env เป็น 3001 |
| Can't access from iPad | เช็ค Firewall + IP + Wi-Fi เดียวกัน |
| Admin login fail | รัน `npm run create-admin` ใหม่ |
| Migration fail | ตรวจไฟล์ JSON มีข้อมูลครบ + database ว่าง |

---

## 📁 โครงสร้างโฟลเดอร์

```
backend/
├── sql/
│   └── schema.sql          ← MySQL schema
├── src/
│   ├── server.js           ← Entry point
│   ├── db.js               ← DB connection
│   ├── migrate.js          ← Import JSON
│   ├── create-admin.js     ← Setup admin
│   ├── middleware/
│   │   └── auth.js         ← JWT
│   └── routes/
│       ├── auth.js         ← /api/login
│       └── products.js     ← /api/products
├── .env                    ← Local config (ไม่ commit)
├── .env.example
├── package.json
└── README.md
```

---

## 🔄 Next Steps (เซสชั่นต่อไป)

ผมต้อง:
1. ✅ สร้าง routes ที่เหลือ (sales, customers, suppliers, expenses, stock, categories)
2. ✅ Refactor `index.html` ให้เรียก API แทน localStorage
3. ✅ Test ทั้งระบบ
4. ✅ Deploy script + monitoring

ประมาณ 2-3 สัปดาห์ทำงาน
