const { pool } = require('../config/database');

class Sale {
  static async create(saleData, items) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        customerName, customerEmail, customerPhone, 
        paymentMethod, userId, totalAmount 
      } = saleData;
      
      // Create sale record
      const [saleResult] = await connection.execute(
        `INSERT INTO sales (customer_name, customer_email, customer_phone, 
                           payment_method, user_id, total_amount) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customerName, customerEmail, customerPhone, paymentMethod, userId, totalAmount]
      );
      
      const saleId = saleResult.insertId;
      
      // Create sale items and update stock
      for (const item of items) {
        const { productVariantId, quantity, unitPrice } = item;
        const totalPrice = quantity * unitPrice;
        
        // Check stock availability
        const [stockCheck] = await connection.execute(
          'SELECT quantity_in_stock FROM product_variants WHERE id = ?',
          [productVariantId]
        );
        
        if (!stockCheck[0] || stockCheck[0].quantity_in_stock < quantity) {
          throw new Error(`Insufficient stock for product variant ${productVariantId}`);
        }
        
        // Create sale item
        await connection.execute(
          `INSERT INTO sale_items (sale_id, product_variant_id, quantity, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, productVariantId, quantity, unitPrice, totalPrice]
        );
        
        // Update stock
        await connection.execute(
          'UPDATE product_variants SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
          [quantity, productVariantId]
        );
      }
      
      await connection.commit();
      return saleId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const [sales] = await pool.execute(
      `SELECT s.*, u.username as created_by
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    
    if (!sales[0]) return null;
    
    // Get sale items
    const [items] = await pool.execute(
      `SELECT si.*, pv.variant_name, p.name as product_name
       FROM sale_items si
       LEFT JOIN product_variants pv ON si.product_variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE si.sale_id = ?`,
      [id]
    );
    
    return {
      ...sales[0],
      items
    };
  }

  static async findByUserId(userId, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, COUNT(si.id) as total_items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM sales WHERE user_id = ?';
    const queryParams = [userId];
    
    // Apply date filters
    if (filters.startDate) {
      query += ` AND s.sale_date >= ?`;
      countQuery += ` AND s.sale_date >= ?`;
      queryParams.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ` AND s.sale_date <= ?`;
      countQuery += ` AND s.sale_date <= ?`;
      queryParams.push(filters.endDate);
    }
    
    // Apply search filter
    if (filters.search) {
      query += ` AND (s.customer_name LIKE ? OR s.customer_email LIKE ?)`;
      countQuery += ` AND (s.customer_name LIKE ? OR s.customer_email LIKE ?)`;
      const searchParam = `%${filters.search}%`;
      queryParams.push(searchParam, searchParam);
    }
    
    // Apply payment method filter
    if (filters.paymentMethod) {
      query += ` AND s.payment_method = ?`;
      countQuery += ` AND s.payment_method = ?`;
      queryParams.push(filters.paymentMethod);
    }
    
    query += ` GROUP BY s.id ORDER BY s.sale_date DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [sales] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (filters.startDate) countParams.push(filters.startDate);
    if (filters.endDate) countParams.push(filters.endDate);
    if (filters.search) {
      const searchParam = `%${filters.search}%`;
      countParams.push(searchParam, searchParam);
    }
    if (filters.paymentMethod) countParams.push(filters.paymentMethod);
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      sales,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = [
      'customer_name', 'customer_email', 'customer_phone', 'payment_method'
    ];
    
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE sales SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get sale items to restore stock
      const [items] = await connection.execute(
        'SELECT product_variant_id, quantity FROM sale_items WHERE sale_id = ?',
        [id]
      );
      
      // Restore stock
      for (const item of items) {
        await connection.execute(
          'UPDATE product_variants SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?',
          [item.quantity, item.product_variant_id]
        );
      }
      
      // Delete sale (items will be deleted by CASCADE)
      const [result] = await connection.execute(
        'DELETE FROM sales WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getSalesAnalytics(userId, period = 'daily') {
    let dateFormat, groupBy;
    
    switch (period) {
      case 'yearly':
        dateFormat = '%Y';
        groupBy = 'YEAR(sale_date)';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        groupBy = 'YEAR(sale_date), MONTH(sale_date)';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        groupBy = 'YEAR(sale_date), WEEK(sale_date)';
        break;
      default: // daily
        dateFormat = '%Y-%m-%d';
        groupBy = 'DATE(sale_date)';
    }
    
    const [analytics] = await pool.execute(
      `SELECT 
         DATE_FORMAT(sale_date, ?) as period,
         COUNT(*) as total_sales,
         SUM(total_amount) as total_revenue,
         AVG(total_amount) as average_sale
       FROM sales 
       WHERE user_id = ?
       GROUP BY ${groupBy}
       ORDER BY period DESC
       LIMIT 30`,
      [dateFormat, userId]
    );
    
    return analytics;
  }

  static async getDashboardStats(userId) {
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_sales,
         SUM(total_amount) as total_revenue,
         AVG(total_amount) as average_sale_value
       FROM sales 
       WHERE user_id = ?`,
      [userId]
    );
    
    const [todayStats] = await pool.execute(
      `SELECT 
         COUNT(*) as today_sales,
         COALESCE(SUM(total_amount), 0) as today_revenue
       FROM sales 
       WHERE user_id = ? AND DATE(sale_date) = CURDATE()`,
      [userId]
    );
    
    const [monthStats] = await pool.execute(
      `SELECT 
         COUNT(*) as month_sales,
         COALESCE(SUM(total_amount), 0) as month_revenue
       FROM sales 
       WHERE user_id = ? AND YEAR(sale_date) = YEAR(CURDATE()) AND MONTH(sale_date) = MONTH(CURDATE())`,
      [userId]
    );
    
    return {
      ...stats[0],
      ...todayStats[0],
      ...monthStats[0]
    };
  }

  static async getTopProducts(userId, limit = 10) {
    const [products] = await pool.execute(
      `SELECT 
         p.name as product_name,
         pv.variant_name,
         SUM(si.quantity) as total_sold,
         SUM(si.total_price) as total_revenue
       FROM sale_items si
       JOIN product_variants pv ON si.product_variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.user_id = ?
       GROUP BY si.product_variant_id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [userId, limit]
    );
    
    return products;
  }
}

module.exports = Sale;