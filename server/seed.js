/**
 * Seed script — inserts dummy data directly via the MySQL pool for the
 * already-registered user (id=1, email=test@example.com).
 *
 * Run:  node server/seed.js
 */

require('dotenv').config({ path: __dirname + '/.env' });

const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const USER_ID = 1;

// ─── helpers ────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

async function insert(sql, params) {
  const [r] = await pool.execute(sql, params);
  return r.insertId;
}

// ─── data definitions ────────────────────────────────────────────────────────

const categories = [
  { name: 'Electronics',    description: 'Gadgets, devices and accessories' },
  { name: 'Clothing',       description: 'Apparel and fashion items' },
  { name: 'Home & Garden',  description: 'Furniture, tools and décor' },
  { name: 'Sports',         description: 'Sports and outdoor equipment' },
  { name: 'Books',          description: 'Books, magazines and stationery' },
];

const brands = [
  { name: 'TechPro',    description: 'Premium tech products' },
  { name: 'StyleCo',    description: 'Trendy fashion brand' },
  { name: 'HomeEase',   description: 'Quality home products' },
  { name: 'ActiveGear', description: 'Sports & fitness gear' },
  { name: 'ReadMore',   description: 'Books and educational material' },
];

const sellers = [
  { name: 'Global Supplies Ltd',  email: 'contact@globalsupplies.com', phone: '555-100-2000', address: '10 Trade St, NY' },
  { name: 'FastStock Inc',        email: 'sales@faststock.com',        phone: '555-200-3000', address: '5 Commerce Ave, CA' },
  { name: 'MegaWholesale',        email: 'info@megawholesale.com',     phone: '555-300-4000', address: '88 Market Blvd, TX' },
];

const productTemplates = [
  { name: 'Wireless Headphones', catIdx: 0, brandIdx: 0, basePrice: 79.99,  costPrice: 40.00 },
  { name: 'Smart Watch',         catIdx: 0, brandIdx: 0, basePrice: 149.99, costPrice: 80.00 },
  { name: 'USB-C Hub',           catIdx: 0, brandIdx: 0, basePrice: 34.99,  costPrice: 15.00 },
  { name: 'Bluetooth Speaker',   catIdx: 0, brandIdx: 0, basePrice: 59.99,  costPrice: 28.00 },
  { name: 'Running T-Shirt',     catIdx: 1, brandIdx: 1, basePrice: 24.99,  costPrice: 10.00 },
  { name: 'Slim Fit Jeans',      catIdx: 1, brandIdx: 1, basePrice: 49.99,  costPrice: 22.00 },
  { name: 'Yoga Pants',          catIdx: 1, brandIdx: 1, basePrice: 34.99,  costPrice: 14.00 },
  { name: 'Desk Lamp',           catIdx: 2, brandIdx: 2, basePrice: 29.99,  costPrice: 12.00 },
  { name: 'Garden Hose',         catIdx: 2, brandIdx: 2, basePrice: 19.99,  costPrice:  8.00 },
  { name: 'Yoga Mat',            catIdx: 3, brandIdx: 3, basePrice: 39.99,  costPrice: 18.00 },
  { name: 'Dumbbell Set',        catIdx: 3, brandIdx: 3, basePrice: 89.99,  costPrice: 45.00 },
  { name: 'JavaScript Handbook', catIdx: 4, brandIdx: 4, basePrice: 29.99,  costPrice: 10.00 },
];

// Variants per product: [ {name, extraPrice, qty} ]
const variantTemplates = [
  [{ name: 'Black', ep: 0,  qty: 40 }, { name: 'White', ep: 5, qty: 30 }, { name: 'Blue', ep: 5, qty: 25 }],
  [{ name: '42mm',  ep: 0,  qty: 25 }, { name: '46mm',  ep: 20, qty: 20 }],
  [{ name: '4-in-1', ep: 0, qty: 50 }, { name: '7-in-1', ep: 15, qty: 30 }],
  [{ name: 'Mini',  ep: 0,  qty: 35 }, { name: 'Standard', ep: 20, qty: 30 }],
  [{ name: 'S',     ep: 0,  qty: 60 }, { name: 'M',  ep: 0,  qty: 80 }, { name: 'L',  ep: 0, qty: 70 }],
  [{ name: '30x32', ep: 0,  qty: 40 }, { name: '32x32', ep: 0, qty: 45 }, { name: '34x32', ep: 2, qty: 35 }],
  [{ name: 'XS',    ep: 0,  qty: 55 }, { name: 'S',  ep: 0,  qty: 65 }, { name: 'M',  ep: 0, qty: 55 }],
  [{ name: 'White', ep: 0,  qty: 70 }, { name: 'Black', ep: 0, qty: 60 }],
  [{ name: '25ft',  ep: 0,  qty: 80 }, { name: '50ft',  ep: 15, qty: 50 }],
  [{ name: '4mm',   ep: 0,  qty: 90 }, { name: '6mm',   ep: 5,  qty: 60 }],
  [{ name: '5kg',   ep: 0,  qty: 30 }, { name: '10kg',  ep: 40, qty: 25 }, { name: '15kg', ep: 80, qty: 15 }],
  [{ name: 'Paperback', ep: 0, qty: 100 }, { name: 'Hardcover', ep: 10, qty: 50 }],
];

// ─── seed function ───────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Categories
  console.log('📂 Inserting categories...');
  const catIds = [];
  for (const c of categories) {
    const id = await insert(
      'INSERT IGNORE INTO categories (name, description, user_id) VALUES (?,?,?)',
      [c.name, c.description, USER_ID]
    );
    if (id) { catIds.push(id); }
    else {
      const [[row]] = await pool.execute('SELECT id FROM categories WHERE name=? AND user_id=?', [c.name, USER_ID]);
      catIds.push(row.id);
    }
  }
  console.log(`   ✅ ${catIds.length} categories`);

  // 2. Brands
  console.log('🏷️  Inserting brands...');
  const brandIds = [];
  for (const b of brands) {
    const id = await insert(
      'INSERT IGNORE INTO brands (name, description, user_id) VALUES (?,?,?)',
      [b.name, b.description, USER_ID]
    );
    if (id) { brandIds.push(id); }
    else {
      const [[row]] = await pool.execute('SELECT id FROM brands WHERE name=? AND user_id=?', [b.name, USER_ID]);
      brandIds.push(row.id);
    }
  }
  console.log(`   ✅ ${brandIds.length} brands`);

  // 3. Sellers
  console.log('🏪 Inserting sellers...');
  const sellerIds = [];
  for (const s of sellers) {
    const id = await insert(
      'INSERT IGNORE INTO sellers (name, email, phone, address, user_id) VALUES (?,?,?,?,?)',
      [s.name, s.email, s.phone, s.address, USER_ID]
    );
    if (id) { sellerIds.push(id); }
    else {
      const [[row]] = await pool.execute('SELECT id FROM sellers WHERE email=? AND user_id=?', [s.email, USER_ID]);
      sellerIds.push(row.id);
    }
  }
  console.log(`   ✅ ${sellerIds.length} sellers`);

  // 4. Products + variants
  console.log('📦 Inserting products and variants...');
  const variantIds = []; // flat list of all variant ids with their price

  for (let i = 0; i < productTemplates.length; i++) {
    const t = productTemplates[i];
    const sku = `SKU-${String(i + 1).padStart(3, '0')}`;

    // idempotent: skip if SKU already exists
    const [[existing]] = await pool.execute('SELECT id FROM products WHERE sku=?', [sku]);
    let productId = existing?.id;

    if (!productId) {
      productId = await insert(
        `INSERT INTO products
           (name, description, sku, category_id, brand_id, user_id, base_price, cost_price, status)
         VALUES (?,?,?,?,?,?,?,?,'active')`,
        [t.name, `Quality ${t.name.toLowerCase()} for everyday use`, sku,
         catIds[t.catIdx], brandIds[t.brandIdx], USER_ID, t.basePrice, t.costPrice]
      );
    }

    const vTemplates = variantTemplates[i];
    for (let j = 0; j < vTemplates.length; j++) {
      const v = vTemplates[j];
      const vSku = `${sku}-V${j + 1}`;
      const [[vExisting]] = await pool.execute('SELECT id FROM product_variants WHERE sku=?', [vSku]);
      let variantId = vExisting?.id;

      if (!variantId) {
        variantId = await insert(
          `INSERT INTO product_variants
             (product_id, variant_name, sku, price, quantity_in_stock)
           VALUES (?,?,?,?,?)`,
          [productId, v.name, vSku, t.basePrice + v.ep, v.qty]
        );
      }

      variantIds.push({ id: variantId, price: t.basePrice + v.ep });
    }
  }
  console.log(`   ✅ ${productTemplates.length} products, ${variantIds.length} variants`);

  // 5. Sales spread across last 6 months
  console.log('💰 Inserting sales...');
  const paymentMethods = ['cash', 'card', 'bank_transfer'];
  const customers = [
    { name: 'Alice Johnson',  email: 'alice@email.com',   phone: '555-010-1010' },
    { name: 'Bob Smith',      email: 'bob@email.com',     phone: '555-020-2020' },
    { name: 'Carol White',    email: 'carol@email.com',   phone: '555-030-3030' },
    { name: 'David Brown',    email: 'david@email.com',   phone: '555-040-4040' },
    { name: 'Eva Martinez',   email: 'eva@email.com',     phone: '555-050-5050' },
  ];

  let salesCount = 0;
  const now = new Date();

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const salesThisMonth = rand(8, 14);
    for (let s = 0; s < salesThisMonth; s++) {
      const c = pick(customers);
      const pm = pick(paymentMethods);
      // random day in that month
      const saleDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, rand(1, 28));

      // pick 1–3 variants for this sale
      const itemCount = rand(1, 3);
      const chosenVariants = [];
      const usedIdxs = new Set();
      for (let k = 0; k < itemCount; k++) {
        let idx;
        do { idx = rand(0, variantIds.length - 1); } while (usedIdxs.has(idx));
        usedIdxs.add(idx);
        chosenVariants.push({ ...variantIds[idx], qty: rand(1, 3) });
      }

      const totalAmount = chosenVariants.reduce((sum, v) => sum + v.price * v.qty, 0);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [sr] = await connection.execute(
          `INSERT INTO sales
             (customer_name, customer_email, customer_phone, payment_method, user_id, total_amount, sale_date)
           VALUES (?,?,?,?,?,?,?)`,
          [c.name, c.email, c.phone, pm, USER_ID, totalAmount.toFixed(2), saleDate]
        );
        const saleId = sr.insertId;

        for (const v of chosenVariants) {
          await connection.execute(
            `INSERT INTO sale_items (sale_id, product_variant_id, quantity, unit_price, total_price)
             VALUES (?,?,?,?,?)`,
            [saleId, v.id, v.qty, v.price, (v.price * v.qty).toFixed(2)]
          );
          // deduct stock (floor at 0)
          await connection.execute(
            `UPDATE product_variants
             SET quantity_in_stock = GREATEST(0, quantity_in_stock - ?)
             WHERE id = ?`,
            [v.qty, v.id]
          );
        }

        await connection.commit();
        salesCount++;
      } catch (e) {
        await connection.rollback();
        console.warn('  ⚠️  Sale skipped:', e.message);
      } finally {
        connection.release();
      }
    }
  }
  console.log(`   ✅ ${salesCount} sales`);

  // 6. Purchases (restocking) — a handful per month
  console.log('🚚 Inserting purchases...');
  let purchasesCount = 0;

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    for (let p = 0; p < rand(2, 4); p++) {
      const sellerId = pick(sellerIds);
      const purchaseDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, rand(1, 10));

      // restock 2–4 variants
      const itemCount = rand(2, 4);
      const chosenVariants = [];
      const usedIdxs = new Set();
      for (let k = 0; k < itemCount; k++) {
        let idx;
        do { idx = rand(0, variantIds.length - 1); } while (usedIdxs.has(idx));
        usedIdxs.add(idx);
        const costPerUnit = +(variantIds[idx].price * 0.55).toFixed(2);
        chosenVariants.push({ ...variantIds[idx], qty: rand(10, 50), cost: costPerUnit });
      }

      const totalAmount = chosenVariants.reduce((sum, v) => sum + v.cost * v.qty, 0);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [pr] = await connection.execute(
          `INSERT INTO purchases (seller_id, user_id, status, total_amount, purchase_date)
           VALUES (?,?,'completed',?,?)`,
          [sellerId, USER_ID, totalAmount.toFixed(2), purchaseDate]
        );
        const purchaseId = pr.insertId;

        for (const v of chosenVariants) {
          await connection.execute(
            `INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, total_cost)
             VALUES (?,?,?,?,?)`,
            [purchaseId, v.id, v.qty, v.cost, (v.cost * v.qty).toFixed(2)]
          );
          await connection.execute(
            `UPDATE product_variants SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?`,
            [v.qty, v.id]
          );
        }

        await connection.commit();
        purchasesCount++;
      } catch (e) {
        await connection.rollback();
        console.warn('  ⚠️  Purchase skipped:', e.message);
      } finally {
        connection.release();
      }
    }
  }
  console.log(`   ✅ ${purchasesCount} purchases`);

  console.log('\n✅ Seed complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  pool.end();
  process.exit(1);
});
