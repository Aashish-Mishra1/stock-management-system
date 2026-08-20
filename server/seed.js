/**
 * Seed script — cleans up existing dummy data for USER_ID and inserts
 * a large, realistic Indian e-commerce/inventory dataset.
 *
 * Run:  node server/seed.js
 */

require('dotenv').config({ path: __dirname + '/.env' });

const { pool } = require('./src/config/database');

const USER_ID = 1;

// ─── Helpers ────────────────────────────────────────────────────────────────

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

async function insert(sql, params) {
  const [r] = await pool.execute(sql, params);
  return r.insertId;
}

// ─── Data Definitions (Indian Context) ──────────────────────────────────────

const categories = [
  { name: 'Ethnic Wear',          description: 'Sarees, kurtas, lehengas, and traditional wear' },
  { name: 'Spices & Groceries',   description: 'Authentic Indian masalas, dry fruits, and pantry staples' },
  { name: 'Ayurveda & Wellness',  description: 'Herbal supplements, hair oils, and skincare' },
  { name: 'Electronics & Home',   description: 'Mixer grinders, smart devices, and mobile accessories' },
  { name: 'Handicrafts & Decor',  description: 'Brass idols, pooja items, and artisan textiles' },
  { name: 'Tea & Beverages',      description: 'Darjeeling tea, Assam CTC, and filter coffee' },
];

const brands = [
  { name: 'FabIndia',         description: 'Handcrafted ethnic fashion & home' },
  { name: 'Tata Sampann',     description: 'Pure and unadulterated kitchen essentials' },
  { name: 'Patanjali',        description: 'Herbal and Ayurvedic daily care' },
  { name: 'Prestige',         description: 'Reliable Indian kitchen appliances' },
  { name: 'Kama Ayurveda',    description: 'Luxury botanical beauty and wellness' },
  { name: 'Boat Life',        description: 'Trendy audio gear and smart electronics' },
  { name: 'Organic India',    description: 'Healthy herbal teas and organic infusions' },
  { name: 'Manyavar',         description: 'Celebration wear and men ethnic fashion' },
];

const sellers = [
  { name: 'Chandi Chowk Wholesalers', email: 'sales@chandnichowk.in',   phone: '+91 98110 23456', address: 'Shop 42, Nai Sarak, Delhi' },
  { name: 'Surat Textile Hub',        email: 'orders@surattextile.in',  phone: '+91 98250 87654', address: 'Ring Road Market, Surat, Gujarat' },
  { name: 'Kerala Spice Merchants',   email: 'trade@keralaspices.in',   phone: '+91 94470 11223', address: 'Jew Town, Mattancherry, Kochi' },
  { name: 'Bangalore Tech Supplies',  email: 'b2b@blrtechsupplies.com', phone: '+91 98860 99887', address: 'SP Road, Bangalore, Karnataka' },
  { name: 'Jaipur Craft Emporium',    email: 'info@jaipurcrafts.co.in', phone: '+91 94140 55443', address: 'Johari Bazaar, Jaipur, Rajasthan' },
];

const productTemplates = [
  // Ethnic Wear (catIdx: 0)
  { name: 'Banarasi Silk Saree',         catIdx: 0, brandIdx: 0, basePrice: 2499.00, costPrice: 1200.00 },
  { name: 'Cotton Chikankari Kurta',     catIdx: 0, brandIdx: 0, basePrice: 1299.00, costPrice: 550.00 },
  { name: 'Men Wedding Kurta Pyjama Set',catIdx: 0, brandIdx: 7, basePrice: 3499.00, costPrice: 1600.00 },
  { name: 'Embroidered Dupatta',         catIdx: 0, brandIdx: 0, basePrice: 699.00,  costPrice: 280.00 },
  
  // Spices & Groceries (catIdx: 1)
  { name: 'Kashmiri Mogra Saffron',      catIdx: 1, brandIdx: 1, basePrice: 450.00,  costPrice: 260.00 },
  { name: 'Organic Turmeric Powder',     catIdx: 1, brandIdx: 1, basePrice: 160.00,  costPrice: 75.00 },
  { name: 'Shahi Biryani Masala Box',    catIdx: 1, brandIdx: 1, basePrice: 120.00,  costPrice: 55.00 },
  { name: 'Premium California Almonds',  catIdx: 1, brandIdx: 1, basePrice: 799.00,  costPrice: 520.00 },

  // Ayurveda & Wellness (catIdx: 2)
  { name: 'Kumkumadi Miraculous Oil',    catIdx: 2, brandIdx: 4, basePrice: 1895.00, costPrice: 850.00 },
  { name: 'Pure Bringadi Hair Treatment',catIdx: 2, brandIdx: 4, basePrice: 1250.00, costPrice: 550.00 },
  { name: 'Ashwagandha Vitality Capsule',catIdx: 2, brandIdx: 2, basePrice: 299.00,  costPrice: 110.00 },
  { name: 'Pure Vedic Cow Ghee (A2)',    catIdx: 2, brandIdx: 2, basePrice: 1100.00, costPrice: 650.00 },

  // Electronics & Home (catIdx: 3)
  { name: '750W Mixer Grinder (3 Jars)', catIdx: 3, brandIdx: 3, basePrice: 3299.00, costPrice: 1900.00 },
  { name: 'Induction Cooktop 2000W',     catIdx: 3, brandIdx: 3, basePrice: 2499.00, costPrice: 1400.00 },
  { name: 'Wireless Bluetooth Earbuds',  catIdx: 3, brandIdx: 5, basePrice: 1499.00, costPrice: 600.00 },
  { name: 'Smart Fitness Tracker Watch', catIdx: 3, brandIdx: 5, basePrice: 2199.00, costPrice: 950.00 },

  // Handicrafts & Decor (catIdx: 4)
  { name: 'Handmade Brass Diya (Pair)',  catIdx: 4, brandIdx: 0, basePrice: 599.00,  costPrice: 240.00 },
  { name: 'Jaipuri Blue Pottery Vase',   catIdx: 4, brandIdx: 0, basePrice: 899.00,  costPrice: 380.00 },
  { name: 'Ganesha Brass Idol (6 Inch)', catIdx: 4, brandIdx: 0, basePrice: 1599.00, costPrice: 700.00 },

  // Tea & Beverages (catIdx: 5)
  { name: 'Darjeeling First Flush Tea',  catIdx: 5, brandIdx: 6, basePrice: 650.00,  costPrice: 300.00 },
  { name: 'South Indian Filter Coffee',  catIdx: 5, brandIdx: 6, basePrice: 280.00,  costPrice: 120.00 },
  { name: 'Tulsi Green Tea Classic',     catIdx: 5, brandIdx: 6, basePrice: 240.00,  costPrice: 95.00 },
];

const variantTemplates = [
  // Banarasi Saree
  [{ name: 'Royal Maroon', ep: 0, qty: 30 }, { name: 'Peacock Green', ep: 100, qty: 25 }, { name: 'Golden Mustard', ep: 150, qty: 20 }],
  // Cotton Kurta
  [{ name: 'White - M', ep: 0, qty: 45 }, { name: 'White - L', ep: 0, qty: 50 }, { name: 'Sky Blue - M', ep: 50, qty: 40 }, { name: 'Sky Blue - L', ep: 50, qty: 35 }],
  // Kurta Pyjama Set
  [{ name: 'Beige - 40', ep: 0, qty: 25 }, { name: 'Beige - 42', ep: 0, qty: 30 }, { name: 'Maroon - 40', ep: 200, qty: 20 }],
  // Dupatta
  [{ name: 'Red Phulkari', ep: 0, qty: 50 }, { name: 'Golden Zari', ep: 100, qty: 40 }],
  
  // Saffron
  [{ name: '1 Gram Box', ep: 0, qty: 100 }, { name: '5 Gram Jar', ep: 1400, qty: 40 }],
  // Turmeric
  [{ name: '200g Pouch', ep: 0, qty: 120 }, { name: '500g Jar', ep: 110, qty: 80 }],
  // Biryani Masala
  [{ name: '100g Pack', ep: 0, qty: 150 }, { name: 'Combo (Pack of 3)', ep: 210, qty: 60 }],
  // Almonds
  [{ name: '500g Pack', ep: 0, qty: 80 }, { name: '1kg Value Pack', ep: 700, qty: 50 }],

  // Kumkumadi Oil
  [{ name: '12ml Bottle', ep: 0, qty: 45 }, { name: '30ml Bottle', ep: 1600, qty: 25 }],
  // Bringadi Hair Oil
  [{ name: '100ml Bottle', ep: 0, qty: 60 }, { name: '200ml Bottle', ep: 950, qty: 35 }],
  // Ashwagandha
  [{ name: '60 Capsules', ep: 0, qty: 90 }, { name: '120 Capsules', ep: 250, qty: 50 }],
  // Cow Ghee
  [{ name: '500ml Glass Jar', ep: 0, qty: 40 }, { name: '1 Litre Tin', ep: 1050, qty: 30 }],

  // Mixer Grinder
  [{ name: 'Classic White', ep: 0, qty: 30 }, { name: 'Matte Black Edition', ep: 200, qty: 25 }],
  // Induction Cooktop
  [{ name: 'Standard Push-Button', ep: 0, qty: 35 }, { name: 'Touch Panel Premium', ep: 350, qty: 20 }],
  // Earbuds
  [{ name: 'Active Black', ep: 0, qty: 70 }, { name: 'Bold Blue', ep: 0, qty: 50 }, { name: 'Ivory White', ep: 0, qty: 40 }],
  // Smart Watch
  [{ name: 'Pitch Black Strap', ep: 0, qty: 40 }, { name: 'Deep Wine Strap', ep: 50, qty: 30 }],

  // Brass Diya
  [{ name: 'Small (Pair)', ep: 0, qty: 60 }, { name: 'Large (Pair)', ep: 300, qty: 40 }],
  // Pottery Vase
  [{ name: 'Floral Motif (8")', ep: 0, qty: 30 }, { name: 'Classic Royal Blue (10")', ep: 250, qty: 20 }],
  // Ganesha Idol
  [{ name: 'Antique Brass Finish', ep: 0, qty: 25 }, { name: 'Glossy Gold Finish', ep: 200, qty: 15 }],

  // Darjeeling Tea
  [{ name: '100g Tin Caddy', ep: 0, qty: 50 }, { name: '250g Vacuum Pack', ep: 650, qty: 35 }],
  // Filter Coffee
  [{ name: '80:20 Blend (200g)', ep: 0, qty: 80 }, { name: '70:30 Blend (500g)', ep: 280, qty: 60 }],
  // Tulsi Green Tea
  [{ name: '25 Tea Bags Box', ep: 0, qty: 100 }, { name: '100g Loose Leaf Tin', ep: 40, qty: 70 }],
];

const customers = [
  { name: 'Aarav Sharma',     email: 'aarav.sharma@gmail.com',    phone: '+91 98201 12345' },
  { name: 'Priya Iyer',       email: 'priya.iyer@yahoo.co.in',    phone: '+91 94440 23456' },
  { name: 'Rohan Deshmukh',   email: 'rohan.d@rediffmail.com',    phone: '+91 98220 34567' },
  { name: 'Ananya Banerjee',  email: 'ananya.b@gmail.com',        phone: '+91 98300 45678' },
  { name: 'Vikramjit Singh',  email: 'vikram.singh@hotmail.com',  phone: '+91 98140 56789' },
  { name: 'Sneha Patel',      email: 'sneha.patel@gmail.com',     phone: '+91 98240 67890' },
  { name: 'Karthik Raja',     email: 'karthik.raja@outlook.com',  phone: '+91 98410 78901' },
  { name: 'Deepika Nair',     email: 'deepika.nair@gmail.com',    phone: '+91 94470 89012' },
  { name: 'Amitabh Verma',    email: 'amitabh.verma@gmail.com',   phone: '+91 98100 90123' },
  { name: 'Pooja Agarwal',    email: 'pooja.agarwal@yahoo.com',   phone: '+91 93310 01234' },
];

const paymentMethods = ['upi', 'card', 'netbanking', 'cash'];

// ─── Seed Execution ──────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting Indian E-Commerce seed script...\n');

  // STEP 0: Clean up prior seed runs for idempotent executions
  const conn = await pool.getConnection();
  try {
    console.log('🧹 Purging prior dummy records for USER_ID = ' + USER_ID + '...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    await conn.query(`
      DELETE pi FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE p.user_id = ?
    `, [USER_ID]);

    await conn.query(`
      DELETE si FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.user_id = ?
    `, [USER_ID]);

    await conn.query('DELETE FROM purchases WHERE user_id = ?', [USER_ID]);
    await conn.query('DELETE FROM sales WHERE user_id = ?', [USER_ID]);

    await conn.query(`
      DELETE pv FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.user_id = ?
    `, [USER_ID]);

    await conn.query('DELETE FROM products WHERE user_id = ?', [USER_ID]);
    await conn.query('DELETE FROM sellers WHERE user_id = ?', [USER_ID]);
    await conn.query('DELETE FROM brands WHERE user_id = ?', [USER_ID]);
    await conn.query('DELETE FROM categories WHERE user_id = ?', [USER_ID]);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   ✅ Prior user data cleared successfully.\n');
  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    throw err;
  } finally {
    conn.release();
  }

  // 1. Categories
  console.log('📂 Inserting categories...');
  const catIds = [];
  for (const c of categories) {
    const id = await insert(
      'INSERT INTO categories (name, description, user_id) VALUES (?,?,?)',
      [c.name, c.description, USER_ID]
    );
    catIds.push(id);
  }
  console.log(`   ✅ ${catIds.length} categories created`);

  // 2. Brands
  console.log('🏷️  Inserting brands...');
  const brandIds = [];
  for (const b of brands) {
    const id = await insert(
      'INSERT INTO brands (name, description, user_id) VALUES (?,?,?)',
      [b.name, b.description, USER_ID]
    );
    brandIds.push(id);
  }
  console.log(`   ✅ ${brandIds.length} brands created`);

  // 3. Sellers
  console.log('🏪 Inserting suppliers / sellers...');
  const sellerIds = [];
  for (const s of sellers) {
    const id = await insert(
      'INSERT INTO sellers (name, email, phone, address, user_id) VALUES (?,?,?,?,?)',
      [s.name, s.email, s.phone, s.address, USER_ID]
    );
    sellerIds.push(id);
  }
  console.log(`   ✅ ${sellerIds.length} sellers created`);

  // 4. Products & Variants
  console.log('📦 Inserting products and product variants...');
  const variantIds = [];

  for (let i = 0; i < productTemplates.length; i++) {
    const t = productTemplates[i];
    const sku = `IND-PRD-${String(i + 1).padStart(3, '0')}`;

    const productId = await insert(
      `INSERT INTO products 
         (name, description, sku, category_id, brand_id, user_id, base_price, cost_price, status)
       VALUES (?,?,?,?,?,?,?,?,'active')`,
      [t.name, `Premium authentic ${t.name.toLowerCase()} sourced in India`, sku,
       catIds[t.catIdx], brandIds[t.brandIdx], USER_ID, t.basePrice, t.costPrice]
    );

    const vTemplates = variantTemplates[i];
    for (let j = 0; j < vTemplates.length; j++) {
      const v = vTemplates[j];
      const vSku = `${sku}-V${j + 1}`;
      const finalPrice = +(t.basePrice + v.ep).toFixed(2);

      const variantId = await insert(
        `INSERT INTO product_variants 
           (product_id, variant_name, sku, price, quantity_in_stock)
         VALUES (?,?,?,?,?)`,
        [productId, v.name, vSku, finalPrice, v.qty]
      );

      variantIds.push({ id: variantId, price: finalPrice, baseCost: t.costPrice });
    }
  }
  console.log(`   ✅ ${productTemplates.length} products and ${variantIds.length} variants created`);

  // 5. Sales (Generating 120+ order records across 6 months)
  console.log('💰 Generating historical sales and customer transactions...');
  let salesCount = 0;
  const now = new Date();

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    // Generate 18-28 orders per month for dense dummy history (~130 total sales)
    const salesThisMonth = rand(18, 28);

    for (let s = 0; s < salesThisMonth; s++) {
      const c = pick(customers);
      const pm = pick(paymentMethods);
      const saleDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, rand(1, 28), rand(9, 21), rand(0, 59));

      const itemCount = rand(1, 4);
      const chosenVariants = [];
      const usedIdxs = new Set();

      for (let k = 0; k < itemCount; k++) {
        let idx;
        do { idx = rand(0, variantIds.length - 1); } while (usedIdxs.has(idx));
        usedIdxs.add(idx);
        chosenVariants.push({ ...variantIds[idx], qty: rand(1, 3) });
      }

      const totalAmount = chosenVariants.reduce((sum, v) => sum + v.price * v.qty, 0);

      const connSale = await pool.getConnection();
      try {
        await connSale.beginTransaction();

        const [sr] = await connSale.execute(
          `INSERT INTO sales 
             (customer_name, customer_email, customer_phone, payment_method, user_id, total_amount, sale_date)
           VALUES (?,?,?,?,?,?,?)`,
          [c.name, c.email, c.phone, pm, USER_ID, totalAmount.toFixed(2), saleDate]
        );
        const saleId = sr.insertId;

        for (const v of chosenVariants) {
          await connSale.execute(
            `INSERT INTO sale_items (sale_id, product_variant_id, quantity, unit_price, total_price)
             VALUES (?,?,?,?,?)`,
            [saleId, v.id, v.qty, v.price, (v.price * v.qty).toFixed(2)]
          );

          await connSale.execute(
            `UPDATE product_variants 
             SET quantity_in_stock = GREATEST(0, quantity_in_stock - ?)
             WHERE id = ?`,
            [v.qty, v.id]
          );
        }

        await connSale.commit();
        salesCount++;
      } catch (e) {
        await connSale.rollback();
        console.warn('   ⚠️ Sale skipped due to error:', e.message);
      } finally {
        connSale.release();
      }
    }
  }
  console.log(`   ✅ ${salesCount} completed sales generated with order items`);

  // 6. Purchases / Restocking (Generating supplier restocks)
  console.log('🚚 Generating supplier restocking purchases...');
  let purchasesCount = 0;

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const batchPurchases = rand(4, 7); // ~30 total restock events

    for (let p = 0; p < batchPurchases; p++) {
      const sellerId = pick(sellerIds);
      const purchaseDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, rand(1, 10), rand(10, 17));

      const itemCount = rand(3, 6);
      const chosenVariants = [];
      const usedIdxs = new Set();

      for (let k = 0; k < itemCount; k++) {
        let idx;
        do { idx = rand(0, variantIds.length - 1); } while (usedIdxs.has(idx));
        usedIdxs.add(idx);
        const costPerUnit = +(variantIds[idx].price * 0.52).toFixed(2);
        chosenVariants.push({ ...variantIds[idx], qty: rand(15, 60), cost: costPerUnit });
      }

      const totalAmount = chosenVariants.reduce((sum, v) => sum + v.cost * v.qty, 0);

      const connPurchase = await pool.getConnection();
      try {
        await connPurchase.beginTransaction();

        const [pr] = await connPurchase.execute(
          `INSERT INTO purchases (seller_id, user_id, status, total_amount, purchase_date)
           VALUES (?,?,'completed',?,?)`,
          [sellerId, USER_ID, totalAmount.toFixed(2), purchaseDate]
        );
        const purchaseId = pr.insertId;

        for (const v of chosenVariants) {
          await connPurchase.execute(
            `INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, total_cost)
             VALUES (?,?,?,?,?)`,
            [purchaseId, v.id, v.qty, v.cost, (v.cost * v.qty).toFixed(2)]
          );

          await connPurchase.execute(
            `UPDATE product_variants SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?`,
            [v.qty, v.id]
          );
        }

        await connPurchase.commit();
        purchasesCount++;
      } catch (e) {
        await connPurchase.rollback();
        console.warn('   ⚠️ Purchase skipped due to error:', e.message);
      } finally {
        connPurchase.release();
      }
    }
  }
  console.log(`   ✅ ${purchasesCount} completed purchase restock batches generated`);

  console.log('\n🎉 Seed complete! All entities and 100+ transaction records have been populated.');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  pool.end();
  process.exit(1);
});