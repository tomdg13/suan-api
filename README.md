# Suan Mouakhom Market — Backend API

NestJS + TypeORM + MySQL backend for the multi-vendor marketplace
(matches `marketplace_schema_v3.sql`).

## 1. Setup

```bash
npm install
cp .env.example .env
# edit .env with your MySQL credentials
```

Run the schema file against your MySQL server first:

```bash
mysql -u root -p < marketplace_schema_v3.sql
```

(Put that SQL file in this folder, or point the path correctly — it was
provided separately in our earlier conversation.)

## 2. Run

```bash
npm run start:dev
```

API will be available at `http://localhost:3000/api`

## 3. Project structure

```
src/
  config/database.config.ts     MySQL connection config (from .env)
  modules/
    auth/          JWT login (POST /api/auth/login)
    users/         User accounts, roles: buyer/seller/admin
    stores/        Seller stores + onboarding applications
    catalog/       Categories + units (shared reference data)
    products/      Products, variants (500g/1kg/2kg/5kg), images
    cart/          Persistent cart, grouped by store
    orders/        Checkout (splits cart into one order PER STORE),
                    order status, order items
    reviews/       Product/store reviews
    dashboard/      Admin dashboard endpoints (raw SQL, matches
                    dashboard_queries_v3.sql)
```

## 4. Key endpoints

| Method | Endpoint                         | Notes                             |
|--------|-----------------------------------|------------------------------------|
| POST   | /api/users                        | Register (buyer by default)       |
| POST   | /api/auth/login                   | Returns JWT access token          |
| GET    | /api/categories                   | List categories                   |
| GET    | /api/products                     | List/search/filter products       |
| GET    | /api/products/:id                 | Product detail (variants, images) |
| POST   | /api/products/store/:storeId      | Create product (seller, auth)     |
| POST   | /api/stores                       | Create store (auth)               |
| GET    | /api/stores                       | List stores (?featured=true)      |
| POST   | /api/cart                         | Add item to cart (auth)           |
| GET    | /api/cart                         | Cart grouped by store (auth)      |
| POST   | /api/orders/checkout              | Checkout — splits into per-store orders |
| GET    | /api/orders/my                    | My orders (auth)                  |
| GET    | /api/orders/store/:storeId        | Orders for a store (seller view)  |
| PATCH  | /api/orders/:id/status             | Update order status (seller/admin)|
| POST   | /api/reviews                      | Leave a review (auth)             |
| GET    | /api/dashboard/overview           | Full admin dashboard (admin only) |

## 5. Notes / next steps

- `synchronize: false` in database.config.ts — the schema is managed by
  the SQL file, not TypeORM auto-sync. Run migrations manually if you
  change entities.
- Checkout logic (`orders.service.ts`) splits the cart by store into
  separate `orders` rows — mirrors Shopee/Lazada behavior. Delivery fee
  is currently a flat `20,000 LAK` placeholder per store shipment;
  wire in real logistics pricing when ready.
- Promotion/coupon application logic is stubbed (`discountAmount = 0`
  in checkout) — needs implementing against the `promotions` table.
- Seller wallet crediting on delivery, payment gateway integration
  (BCEL One / OnePay / QR Pay), and image upload handling are not yet
  implemented — these need external service credentials from you.
- Add role guards (`@Roles('seller')`) to store/product write endpoints
  once you're ready to lock down who can create products for which store.
