-- ============================================================
-- ADMIN DASHBOARD QUERIES — Suan Mouakhom Market (v3)
-- Matches marketplace_schema_v3.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. TOP SUMMARY CARDS (ยอดขายรวม, คำสั่งซื้อรวม, ร้านค้าทั้งหมด, ลูกค้าทั้งหมด)
-- ------------------------------------------------------------
SELECT
    (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status != 'cancelled') AS total_sales,
    (SELECT COUNT(*) FROM orders WHERE status != 'cancelled')                       AS total_orders,
    (SELECT COUNT(*) FROM stores WHERE status = 'active')                            AS total_stores,
    (SELECT COUNT(*) FROM users WHERE role = 'buyer')                                AS total_customers;

-- ------------------------------------------------------------
-- 2. TODAY'S SALES (ยอดขายวันนี้)
-- ------------------------------------------------------------
SELECT
    COALESCE(SUM(total_amount), 0) AS revenue_today,
    COUNT(*)                       AS orders_today
FROM orders
WHERE DATE(order_date) = CURDATE()
  AND status != 'cancelled';

-- ------------------------------------------------------------
-- 3. REVENUE TREND — last 30 days (for the dashboard line chart)
-- ------------------------------------------------------------
SELECT
    DATE(order_date)   AS order_day,
    COUNT(*)            AS order_count,
    SUM(total_amount)   AS revenue
FROM orders
WHERE order_date >= CURDATE() - INTERVAL 29 DAY
  AND status != 'cancelled'
GROUP BY DATE(order_date)
ORDER BY order_day;

-- ------------------------------------------------------------
-- 4. ORDER STATUS BREAKDOWN (donut chart)
-- ------------------------------------------------------------
SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS total_amount
FROM orders
GROUP BY status;

-- ------------------------------------------------------------
-- 5. PENDING SELLER APPLICATIONS (จัดการผู้ขาย queue)
-- ------------------------------------------------------------
SELECT
    sa.id, sa.store_name, sa.owner_name, sa.phone, sa.product_types,
    sa.submitted_at
FROM store_applications sa
WHERE sa.status = 'pending'
ORDER BY sa.submitted_at ASC;

-- ------------------------------------------------------------
-- 6. TOP STORES BY REVENUE (จัดการร้านค้า / รายงาน)
-- ------------------------------------------------------------
SELECT
    s.id, s.store_name, s.province, s.rating_avg, s.follower_count,
    COUNT(DISTINCT o.id)          AS total_orders,
    COALESCE(SUM(o.total_amount),0) AS total_revenue
FROM stores s
LEFT JOIN orders o ON o.store_id = s.id AND o.status != 'cancelled'
GROUP BY s.id, s.store_name, s.province, s.rating_avg, s.follower_count
ORDER BY total_revenue DESC
LIMIT 10;

-- ------------------------------------------------------------
-- 7. TOP SELLING PRODUCTS PLATFORM-WIDE
-- ------------------------------------------------------------
SELECT
    p.id, p.name_lao, st.store_name,
    SUM(oi.qty)          AS total_qty_sold,
    SUM(oi.subtotal)     AS total_revenue
FROM order_items oi
JOIN products p  ON oi.product_id = p.id
JOIN stores st   ON p.store_id = st.id
JOIN orders o    ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY p.id, p.name_lao, st.store_name
ORDER BY total_revenue DESC
LIMIT 10;

-- ------------------------------------------------------------
-- 8. SALES BY CATEGORY (pie chart)
-- ------------------------------------------------------------
SELECT
    c.name_lao          AS category,
    SUM(oi.qty)          AS total_qty_sold,
    SUM(oi.subtotal)     AS total_revenue
FROM order_items oi
JOIN products p   ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN orders o     ON oi.order_id = o.id
WHERE o.status != 'cancelled'
GROUP BY c.id, c.name_lao
ORDER BY total_revenue DESC;

-- ------------------------------------------------------------
-- 9. ACTIVE FLASH SALES (สินค้าขายด่วน monitoring)
-- ------------------------------------------------------------
SELECT
    fs.id, p.name_lao, fs.sale_price, fs.stock_limit, fs.sold_qty,
    fs.starts_at, fs.ends_at,
    ROUND(fs.sold_qty / fs.stock_limit * 100, 1) AS percent_sold
FROM flash_sales fs
JOIN products p ON fs.product_id = p.id
WHERE NOW() BETWEEN fs.starts_at AND fs.ends_at
ORDER BY percent_sold DESC;

-- ------------------------------------------------------------
-- 10. RECENT ORDERS TABLE
-- ------------------------------------------------------------
SELECT
    o.id, o.order_code, u.full_name AS customer, st.store_name,
    o.order_date, o.status, o.payment_status, o.total_amount
FROM orders o
JOIN users u   ON o.user_id = u.id
JOIN stores st ON o.store_id = st.id
ORDER BY o.order_date DESC
LIMIT 15;

-- ------------------------------------------------------------
-- 11. WITHDRAWAL REQUESTS QUEUE (ถอนเงิน approvals)
-- ------------------------------------------------------------
SELECT
    wr.id, s.store_name, wr.amount, wr.bank_name, wr.account_number,
    wr.status, wr.requested_at
FROM withdrawal_requests wr
JOIN stores s ON wr.store_id = s.id
WHERE wr.status = 'pending'
ORDER BY wr.requested_at ASC;

-- ------------------------------------------------------------
-- 12. LOW STOCK ALERT (across all stores, checks variants too)
-- ------------------------------------------------------------
SELECT
    p.id, p.name_lao, s.store_name,
    COALESCE(pv.variant_label, 'default') AS variant,
    COALESCE(pv.stock_qty, p.stock_qty)   AS stock_qty
FROM products p
JOIN stores s ON p.store_id = s.id
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = 1
WHERE p.is_active = 1
  AND COALESCE(pv.stock_qty, p.stock_qty) < 10
ORDER BY stock_qty ASC;

-- ------------------------------------------------------------
-- 13. MAP DATA — orders/customers by province (for the Laos map widget)
-- ------------------------------------------------------------
SELECT
    ua.province,
    COUNT(DISTINCT o.id)   AS order_count,
    COUNT(DISTINCT o.user_id) AS customer_count,
    SUM(o.total_amount)    AS revenue
FROM orders o
JOIN user_addresses ua ON o.address_id = ua.id
WHERE o.status != 'cancelled'
GROUP BY ua.province
ORDER BY revenue DESC;

-- ------------------------------------------------------------
-- 14. PLATFORM PAYMENT METHOD BREAKDOWN (for "ช่องทางชำระเงิน" reporting)
-- ------------------------------------------------------------
SELECT
    payment_method,
    COUNT(*)            AS transaction_count,
    SUM(total_amount)   AS total_amount
FROM orders
WHERE payment_status = 'paid'
GROUP BY payment_method;
