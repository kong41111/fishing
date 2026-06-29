-- FishStock — MySQL Schema
-- Run: mysql -u root -p fishstock < schema.sql

CREATE DATABASE IF NOT EXISTS fishstock
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fishstock;

-- ==========================================
-- USERS (login)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(50) UNIQUE NOT NULL,
  icon  VARCHAR(10) DEFAULT '📦'
) ENGINE=InnoDB;

-- ==========================================
-- SUPPLIERS
-- ==========================================
CREATE TABLE IF NOT EXISTS suppliers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  phone      VARCHAR(50),
  email      VARCHAR(100),
  cats       JSON,                  -- ["รอก", "คัน"]
  note       TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

-- ==========================================
-- CUSTOMERS
-- ==========================================
CREATE TABLE IF NOT EXISTS customers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  phone        VARCHAR(50),
  email        VARCHAR(100),
  tier         ENUM('ทั่วไป','Silver','Gold','VIP') DEFAULT 'ทั่วไป',
  total_spent  DECIMAL(12,2) DEFAULT 0,
  total_bills  INT DEFAULT 0,
  points       INT DEFAULT 0,
  note         TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_name  (name)
) ENGINE=InnoDB;

-- ==========================================
-- PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(50) UNIQUE NOT NULL,
  barcode     VARCHAR(50),
  name        VARCHAR(255) NOT NULL,
  category    VARCHAR(50),
  qty         INT NOT NULL DEFAULT 0,
  cost        DECIMAL(10,2) DEFAULT 0,
  price       DECIMAL(10,2) DEFAULT 0,
  img         LONGTEXT,             -- base64 หรือ URL
  note        TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code     (code),
  INDEX idx_barcode  (barcode),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- ==========================================
-- SALES (bills)
-- ==========================================
CREATE TABLE IF NOT EXISTS sales (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bill_no         VARCHAR(30) UNIQUE NOT NULL,
  customer_id     INT,
  customer_name   VARCHAR(200),
  total           DECIMAL(12,2) DEFAULT 0,
  discount        DECIMAL(10,2) DEFAULT 0,
  member_discount DECIMAL(10,2) DEFAULT 0,
  vat             DECIMAL(10,2) DEFAULT 0,
  net             DECIMAL(12,2) DEFAULT 0,
  pay_method      ENUM('cash','qr','card') NOT NULL DEFAULT 'cash',
  received        DECIMAL(12,2) DEFAULT 0,
  change_amt      DECIMAL(10,2) DEFAULT 0,
  sold_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      INT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL,
  INDEX idx_billno   (bill_no),
  INDEX idx_soldat   (sold_at),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ==========================================
-- SALE_ITEMS (line items)
-- ==========================================
CREATE TABLE IF NOT EXISTS sale_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sale_id     INT NOT NULL,
  code        VARCHAR(50) NOT NULL,
  name        VARCHAR(255),
  price       DECIMAL(10,2),
  qty         INT NOT NULL,
  subtotal    DECIMAL(12,2) GENERATED ALWAYS AS (price * qty) STORED,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  INDEX idx_sale (sale_id),
  INDEX idx_code (code)
) ENGINE=InnoDB;

-- ==========================================
-- STOCK_MOVEMENTS (in/out/sale)
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_code  VARCHAR(50) NOT NULL,
  product_name  VARCHAR(255),
  type          ENUM('in','out','sale','void') NOT NULL,
  qty           INT NOT NULL,         -- + ขึ้น / - ลง
  after_qty     INT,
  supplier_id   INT,
  cost          DECIMAL(10,2),
  note          TEXT,
  bill_img      LONGTEXT,             -- base64 รูปบิล
  occurred_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by    INT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE SET NULL,
  INDEX idx_code (product_code),
  INDEX idx_type (type),
  INDEX idx_when (occurred_at)
) ENGINE=InnoDB;

-- ==========================================
-- EXPENSES
-- ==========================================
CREATE TABLE IF NOT EXISTS expenses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category    VARCHAR(50) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  spent_at    DATE NOT NULL,
  note        TEXT,
  bill_img    LONGTEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_when     (spent_at),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- ==========================================
-- STOCK_COUNT_SESSIONS (นับสต็อก)
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_count_sessions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  counted_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_products    INT,
  counted_products  INT,
  match_count       INT,
  under_count       INT,
  over_count        INT,
  adjusted_count    INT,
  total_system_qty  INT,
  total_counted_qty INT,
  total_diff        INT,
  created_by        INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_count_details (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  session_id    INT NOT NULL,
  product_code  VARCHAR(50),
  product_name  VARCHAR(255),
  sys_qty       INT,
  counted_qty   INT,
  diff          INT,
  note          TEXT,
  FOREIGN KEY (session_id) REFERENCES stock_count_sessions(id) ON DELETE CASCADE,
  INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- ==========================================
-- Z_REPORTS (ปิดยอดประจำวัน)
-- ==========================================
CREATE TABLE IF NOT EXISTS z_reports (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  report_date  DATE UNIQUE NOT NULL,
  data         JSON NOT NULL,      -- เก็บทุกอย่าง (KPI, breakdown)
  opening_cash DECIMAL(10,2) DEFAULT 0,
  counted_cash DECIMAL(10,2) DEFAULT 0,
  expected     DECIMAL(10,2) DEFAULT 0,
  variance     DECIMAL(10,2) DEFAULT 0,
  closed_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_by    INT,
  FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==========================================
-- PARKED_SALES (พักบิล)
-- ==========================================
CREATE TABLE IF NOT EXISTS parked_sales (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100),
  items       JSON NOT NULL,           -- [{code, name, qty, price}, ...]
  discount    DECIMAL(10,2) DEFAULT 0,
  total       DECIMAL(10,2) DEFAULT 0,
  pay_method  VARCHAR(20),
  parked_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ==========================================
-- LOGIN_LOG (security)
-- ==========================================
CREATE TABLE IF NOT EXISTS login_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50),
  success    TINYINT(1),
  device_id  VARCHAR(100),
  user_agent VARCHAR(255),
  ip         VARCHAR(45),
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_when     (attempted_at),
  INDEX idx_username (username)
) ENGINE=InnoDB;

-- ==========================================
-- APP_SETTINGS (key-value)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_settings (
  k VARCHAR(50) PRIMARY KEY,
  v JSON
) ENGINE=InnoDB;

-- ==========================================
-- Default data
-- ==========================================
INSERT IGNORE INTO categories (name, icon) VALUES
  ('คัน',     '🪝'),
  ('รอก',     '🎣'),
  ('เบ็ด',    '📌'),
  ('สาย',     '🧵'),
  ('เหยื่อ',  '🐛'),
  ('อุปกรณ์', '🧰'),
  ('อื่นๆ',   '🎒');

-- Default admin: password = Fish@Stock2026 (use bcrypt in real app)
-- Hash นี้ใช้ของจริงตอน setup จะต่างกัน
-- INSERT IGNORE INTO users (username, name, role, password_hash) VALUES
--   ('admin', 'Admin', 'admin', '$2b$10$REPLACE_ME');
