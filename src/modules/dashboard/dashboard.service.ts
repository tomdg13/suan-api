import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary() {
    const [row] = await this.dataSource.query(`
      SELECT
        (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status != 'cancelled') AS total_sales,
        (SELECT COUNT(*) FROM orders WHERE status != 'cancelled')                       AS total_orders,
        (SELECT COUNT(*) FROM stores WHERE status = 'active')                            AS total_stores,
        (SELECT COUNT(*) FROM users WHERE role = 'buyer')                                AS total_customers
    `);
    return row;
  }

  async getTodaySales() {
    const [row] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue_today,
        COUNT(*) AS orders_today
      FROM orders
      WHERE DATE(order_date) = CURDATE() AND status != 'cancelled'
    `);
    return row;
  }

  getRevenueTrend(days = 30) {
    return this.dataSource.query(
      `
      SELECT DATE(order_date) AS order_day, COUNT(*) AS order_count, SUM(total_amount) AS revenue
      FROM orders
      WHERE order_date >= CURDATE() - INTERVAL ? DAY AND status != 'cancelled'
      GROUP BY DATE(order_date)
      ORDER BY order_day
    `,
      [days - 1],
    );
  }

  getOrderStatusBreakdown() {
    return this.dataSource.query(`
      SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS total_amount
      FROM orders
      GROUP BY status
    `);
  }

  getPendingApplications() {
    return this.dataSource.query(`
      SELECT id, store_name, owner_name, phone, product_types, submitted_at
      FROM store_applications
      WHERE status = 'pending'
      ORDER BY submitted_at ASC
    `);
  }

  getTopStores() {
    return this.dataSource.query(`
      SELECT
        s.id, s.store_name, s.province, s.rating_avg, s.follower_count,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount),0) AS total_revenue
      FROM stores s
      LEFT JOIN orders o ON o.store_id = s.id AND o.status != 'cancelled'
      GROUP BY s.id, s.store_name, s.province, s.rating_avg, s.follower_count
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
  }

  getTopProducts() {
    return this.dataSource.query(`
      SELECT p.id, p.name_lao, st.store_name,
        SUM(oi.qty) AS total_qty_sold, SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN stores st ON p.store_id = st.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name_lao, st.store_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
  }

  getSalesByCategory() {
    return this.dataSource.query(`
      SELECT c.name_lao AS category, SUM(oi.qty) AS total_qty_sold, SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY c.id, c.name_lao
      ORDER BY total_revenue DESC
    `);
  }

  getActiveFlashSales() {
    return this.dataSource.query(`
      SELECT fs.id, p.name_lao, fs.sale_price, fs.stock_limit, fs.sold_qty,
        fs.starts_at, fs.ends_at,
        ROUND(fs.sold_qty / fs.stock_limit * 100, 1) AS percent_sold
      FROM flash_sales fs
      JOIN products p ON fs.product_id = p.id
      WHERE NOW() BETWEEN fs.starts_at AND fs.ends_at
      ORDER BY percent_sold DESC
    `);
  }

  getRecentOrders() {
    return this.dataSource.query(`
      SELECT o.id, o.order_code, u.full_name AS customer, st.store_name,
        o.order_date, o.status, o.payment_status, o.total_amount
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN stores st ON o.store_id = st.id
      ORDER BY o.order_date DESC
      LIMIT 15
    `);
  }

  getPendingWithdrawals() {
    return this.dataSource.query(`
      SELECT wr.id, s.store_name, wr.amount, wr.bank_name, wr.account_number,
        wr.status, wr.requested_at
      FROM withdrawal_requests wr
      JOIN stores s ON wr.store_id = s.id
      WHERE wr.status = 'pending'
      ORDER BY wr.requested_at ASC
    `);
  }

  getLowStock() {
    return this.dataSource.query(`
      SELECT p.id, p.name_lao, s.store_name,
        COALESCE(pv.variant_label, 'default') AS variant,
        COALESCE(pv.stock_qty, p.stock_qty) AS stock_qty
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = 1
      WHERE p.is_active = 1 AND COALESCE(pv.stock_qty, p.stock_qty) < 10
      ORDER BY stock_qty ASC
    `);
  }

  getSalesByProvince() {
    return this.dataSource.query(`
      SELECT ua.province,
        COUNT(DISTINCT o.id) AS order_count,
        COUNT(DISTINCT o.user_id) AS customer_count,
        SUM(o.total_amount) AS revenue
      FROM orders o
      JOIN user_addresses ua ON o.address_id = ua.id
      WHERE o.status != 'cancelled'
      GROUP BY ua.province
      ORDER BY revenue DESC
    `);
  }

  getPaymentMethodBreakdown() {
    return this.dataSource.query(`
      SELECT payment_method, COUNT(*) AS transaction_count, SUM(total_amount) AS total_amount
      FROM orders
      WHERE payment_status = 'paid'
      GROUP BY payment_method
    `);
  }
}
