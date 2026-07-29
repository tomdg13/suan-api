-- ============================================================
-- SUAN MOUAKHOM MARKET — Phase 3 National Marketplace
-- Database: MySQL 8.0+
-- Covers: multi-vendor stores, product variants, cart, reviews,
-- promotions/flash sales, payments, delivery, seller wallet, admin
-- ============================================================

CREATE DATABASE IF NOT EXISTS suan_market
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE suan_market;

-- ============================================================
-- 1. USERS & AUTH
-- Single users table for buyers, sellers, admins (role-based)
-- ============================================================
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(30) NOT NULL UNIQUE,
    email           VARCHAR(150) DEFAULT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer',
    avatar_url      VARCHAR(255) DEFAULT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE user_addresses (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    label           VARCHAR(50) DEFAULT 'home',   -- home, work, etc.
    recipient_name  VARCHAR(150) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    address_line    VARCHAR(255) NOT NULL,
    village         VARCHAR(100) DEFAULT NULL,
    district        VARCHAR(100) DEFAULT NULL,
    province        VARCHAR(100) DEFAULT NULL,
    latitude        DECIMAL(10,7) DEFAULT NULL,
    longitude       DECIMAL(10,7) DEFAULT NULL,
    is_default      TINYINT(1) NOT NULL DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addr_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. STORES (sellers/farms) — Phase 2/3 multi-vendor
-- ============================================================
CREATE TABLE stores (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id        INT UNSIGNED NOT NULL,          -- FK -> users.id (role=seller)
    store_name      VARCHAR(150) NOT NULL,
    slug            VARCHAR(180) NOT NULL UNIQUE,
    logo_url        VARCHAR(255) DEFAULT NULL,
    cover_url       VARCHAR(255) DEFAULT NULL,
    description     TEXT DEFAULT NULL,
    province        VARCHAR(100) DEFAULT NULL,
    district        VARCHAR(100) DEFAULT NULL,
    phone           VARCHAR(30) DEFAULT NULL,
    whatsapp        VARCHAR(30) DEFAULT NULL,
    is_verified     TINYINT(1) NOT NULL DEFAULT 0,      -- "ยืนยันตัวตน" badge
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,       -- "ร้านค้าแนะนำ"
    rating_avg      DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
    follower_count  INT UNSIGNED NOT NULL DEFAULT 0,
    status          ENUM('active','suspended','closed') NOT NULL DEFAULT 'active',
    opened_at       DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_store_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    INDEX idx_store_owner (owner_id),
    INDEX idx_store_status (status)
) ENGINE=InnoDB;

-- Seller onboarding / application review (screens 1-3 in your mockup)
CREATE TABLE store_applications (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    store_name      VARCHAR(150) NOT NULL,
    owner_name      VARCHAR(150) NOT NULL,
    phone           VARCHAR(30) NOT NULL,
    address         VARCHAR(255) DEFAULT NULL,
    product_types   VARCHAR(255) DEFAULT NULL,     -- e.g. "ปลาสด, ไก่-ไข่, ผักสด"
    id_card_image   VARCHAR(255) DEFAULT NULL,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by     INT UNSIGNED DEFAULT NULL,      -- admin user id
    review_notes    TEXT DEFAULT NULL,
    submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     DATETIME DEFAULT NULL,
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_app_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_app_status (status)
) ENGINE=InnoDB;

CREATE TABLE store_followers (
    store_id        INT UNSIGNED NOT NULL,
    user_id         INT UNSIGNED NOT NULL,
    followed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, user_id),
    CONSTRAINT fk_follow_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    CONSTRAINT fk_follow_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORIES / UNITS (shared platform-wide)
-- ============================================================
CREATE TABLE categories (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_id       INT UNSIGNED DEFAULT NULL,      -- supports sub-categories
    name_lao        VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100) DEFAULT NULL,
    icon_url        VARCHAR(255) DEFAULT NULL,
    sort_order      INT UNSIGNED DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB;

CREATE TABLE units (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,    -- kg, g, piece, bale, sack, dozen
    name_lao        VARCHAR(50) NOT NULL,
    name_en         VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- ============================================================
-- 4. PRODUCTS (now owned by a store, not a single farm)
-- ============================================================
CREATE TABLE products (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id        INT UNSIGNED NOT NULL,
    category_id     INT UNSIGNED NOT NULL,
    unit_id         INT UNSIGNED NOT NULL,
    name_lao        VARCHAR(150) NOT NULL,
    name_en         VARCHAR(150) DEFAULT NULL,
    description     TEXT DEFAULT NULL,
    base_price      DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- default/display price
    stock_qty       DECIMAL(12,2) NOT NULL DEFAULT 0,
    sold_count      INT UNSIGNED NOT NULL DEFAULT 0,       -- "ขายแล้ว 210+"
    rating_avg      DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
    is_flash_sale   TINYINT(1) NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_store    FOREIGN KEY (store_id)    REFERENCES stores(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_unit     FOREIGN KEY (unit_id)     REFERENCES units(id),
    INDEX idx_products_store (store_id),
    INDEX idx_products_category (category_id),
    FULLTEXT INDEX ft_products_name (name_lao, name_en)
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    image_url       VARCHAR(255) NOT NULL,
    sort_order      INT UNSIGNED DEFAULT 0,
    CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Weight/size variants: 500g, 1kg, 2kg, 5kg each with own price
CREATE TABLE product_variants (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    variant_label   VARCHAR(50) NOT NULL,     -- "500g", "1kg", "2kg", "5kg"
    price           DECIMAL(12,2) NOT NULL,
    stock_qty       DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_default      TINYINT(1) NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variant_product (product_id)
) ENGINE=InnoDB;

-- Badges: สดจากฟาร์ม, ปลอดสาร, แช่เย็น, ส่งไว
CREATE TABLE product_tags (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    label_lao       VARCHAR(100) NOT NULL,
    icon_url        VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE product_tag_map (
    product_id      INT UNSIGNED NOT NULL,
    tag_id          INT UNSIGNED NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    CONSTRAINT fk_ptag_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_ptag_tag     FOREIGN KEY (tag_id)     REFERENCES product_tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    store_id        INT UNSIGNED NOT NULL,
    user_id         INT UNSIGNED NOT NULL,
    order_item_id   INT UNSIGNED DEFAULT NULL,     -- proof of purchase
    rating          TINYINT UNSIGNED NOT NULL,     -- 1-5
    comment         TEXT DEFAULT NULL,
    image_url       VARCHAR(255) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_review_store   FOREIGN KEY (store_id)   REFERENCES stores(id),
    CONSTRAINT fk_review_user    FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    INDEX idx_review_product (product_id),
    INDEX idx_review_store (store_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. CART (persistent, grouped by store at checkout)
-- ============================================================
CREATE TABLE cart_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    variant_id      INT UNSIGNED DEFAULT NULL,
    qty             DECIMAL(12,2) NOT NULL DEFAULT 1,
    added_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    UNIQUE KEY uq_cart_line (user_id, product_id, variant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. PROMOTIONS / FLASH SALES / COUPONS
-- ============================================================
CREATE TABLE promotions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id        INT UNSIGNED DEFAULT NULL,      -- NULL = platform-wide promo
    code            VARCHAR(50) DEFAULT NULL UNIQUE, -- coupon code, NULL if automatic
    title           VARCHAR(150) NOT NULL,
    discount_type   ENUM('percent','fixed') NOT NULL,
    discount_value  DECIMAL(12,2) NOT NULL,
    min_spend       DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_discount    DECIMAL(12,2) DEFAULT NULL,     -- cap for percent discounts
    starts_at       DATETIME NOT NULL,
    ends_at         DATETIME NOT NULL,
    usage_limit     INT UNSIGNED DEFAULT NULL,
    used_count      INT UNSIGNED NOT NULL DEFAULT 0,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_promo_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_promo_active (is_active, starts_at, ends_at)
) ENGINE=InnoDB;

CREATE TABLE flash_sales (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id      INT UNSIGNED NOT NULL,
    sale_price      DECIMAL(12,2) NOT NULL,
    stock_limit     INT UNSIGNED NOT NULL,
    sold_qty        INT UNSIGNED NOT NULL DEFAULT 0,
    starts_at       DATETIME NOT NULL,
    ends_at         DATETIME NOT NULL,
    CONSTRAINT fk_flash_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_flash_time (starts_at, ends_at)
) ENGINE=InnoDB;

-- ============================================================
-- 8. ORDERS
-- One checkout can split into multiple orders (one per store)
-- so delivery/payment/status is tracked per-store like Shopee/Lazada
-- ============================================================
CREATE TABLE orders (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_code      VARCHAR(30) NOT NULL UNIQUE,
    user_id         INT UNSIGNED NOT NULL,
    store_id        INT UNSIGNED NOT NULL,
    address_id      INT UNSIGNED NOT NULL,
    promotion_id    INT UNSIGNED DEFAULT NULL,
    subtotal        DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    delivery_fee    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    delivery_method ENUM('delivery','pickup') NOT NULL DEFAULT 'delivery',
    status          ENUM('pending','confirmed','preparing','shipped','delivered','cancelled')
                    NOT NULL DEFAULT 'pending',
    payment_status  ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
    payment_method  ENUM('bcel_one','onepay','visa_mastercard','qr_pay','cod') DEFAULT NULL,
    order_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at    DATETIME DEFAULT NULL,
    notes           TEXT DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT fk_orders_store   FOREIGN KEY (store_id)     REFERENCES stores(id),
    CONSTRAINT fk_orders_address FOREIGN KEY (address_id)   REFERENCES user_addresses(id),
    CONSTRAINT fk_orders_promo   FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_store (store_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_date (order_date)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        INT UNSIGNED NOT NULL,
    product_id      INT UNSIGNED NOT NULL,
    variant_id      INT UNSIGNED DEFAULT NULL,
    item_name       VARCHAR(150) NOT NULL,
    variant_label   VARCHAR(50) DEFAULT NULL,
    qty             DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(14,2) NOT NULL,
    CONSTRAINT fk_orderitems_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_orderitems_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    INDEX idx_orderitems_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE order_tracking (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        INT UNSIGNED NOT NULL,
    status          VARCHAR(50) NOT NULL,
    note            VARCHAR(255) DEFAULT NULL,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tracking_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 9. PAYMENTS / TRANSACTIONS
-- ============================================================
CREATE TABLE payment_transactions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        INT UNSIGNED NOT NULL,
    method          ENUM('bcel_one','onepay','visa_mastercard','qr_pay','cod') NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    status          ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    reference_no    VARCHAR(100) DEFAULT NULL,
    paid_at         DATETIME DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. SELLER WALLET / WITHDRAWALS ("รับเงิน", "ถอนเงิน")
-- ============================================================
CREATE TABLE seller_wallets (
    store_id        INT UNSIGNED PRIMARY KEY,
    balance         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_earned    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE wallet_transactions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id        INT UNSIGNED NOT NULL,
    order_id        INT UNSIGNED DEFAULT NULL,
    type            ENUM('sale_credit','withdrawal','adjustment') NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,     -- positive=credit, negative=debit
    note            VARCHAR(255) DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wtx_store FOREIGN KEY (store_id) REFERENCES stores(id),
    CONSTRAINT fk_wtx_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE withdrawal_requests (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    store_id        INT UNSIGNED NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    bank_name       VARCHAR(100) DEFAULT NULL,
    account_number  VARCHAR(50) DEFAULT NULL,
    status          ENUM('pending','approved','paid','rejected') NOT NULL DEFAULT 'pending',
    requested_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at    DATETIME DEFAULT NULL,
    CONSTRAINT fk_wd_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. SYSTEM SETTINGS (for admin "ตั้งค่าระบบ")
-- ============================================================
CREATE TABLE system_settings (
    setting_key     VARCHAR(100) PRIMARY KEY,
    setting_value   TEXT,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO units (code, name_lao, name_en) VALUES
  ('kg',    'ກິໂລ',    'Kilogram'),
  ('g',     'ກຣາມ',    'Gram'),
  ('piece', 'ໂຕ/ໜ່ວຍ',  'Piece'),
  ('bale',  'ຟ່ອນ',    'Bale'),
  ('sack',  'ກະສອບ',   'Sack'),
  ('dozen', 'ໂຫລ',     'Dozen');

INSERT INTO categories (name_lao, name_en, sort_order) VALUES
  ('ຜັກ/ຫົວ',      'Vegetables',      1),
  ('ໝາກໄມ້',        'Fruits',          2),
  ('ປາ/ສັດນ້ຳ',     'Fish / Aquatic',  3),
  ('ໄກ່/ໄຂ່',       'Poultry / Eggs',  4),
  ('ເຂົ້າ/ເຄື່ອງແປ',  'Rice / Grain',    5),
  ('ສິນຄ້າແປຮູບ',    'Processed Goods', 6),
  ('ອຸປະກອນການກະສິ', 'Farm Equipment',  7),
  ('ອື່ນໆ',         'Others',          8);

INSERT INTO product_tags (code, label_lao) VALUES
  ('fresh_farm',   'ສົດຈາກຟາມ'),
  ('organic',      'ປອດສານ'),
  ('chilled',      'ແຊ່ເຢັນ'),
  ('fast_ship',    'ສົ່ງໄວ');
