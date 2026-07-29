const { pool } = require('../config/database');

class Seller {
  static async create(sellerData) {
    const { name, email, phone, address, userId } = sellerData;
    
    const [result] = await pool.execute(
      'INSERT INTO sellers (name, email, phone, address, user_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, address, userId]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [sellers] = await pool.execute(
      'SELECT * FROM sellers WHERE id = ?',
      [id]
    );
    return sellers[0];
  }

  static async findByUserId(userId, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, COUNT(p.id) as total_purchases
      FROM sellers s
      LEFT JOIN purchases p ON s.id = p.seller_id
      WHERE s.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM sellers WHERE user_id = ?';
    const queryParams = [userId];
    
    if (search) {
      query += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`;
      countQuery += ` AND (s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }
    
    query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [sellers] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (search) {
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      sellers,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = ['name', 'email', 'phone', 'address'];
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
      `UPDATE sellers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    // Check if seller has purchases
    const [purchases] = await pool.execute(
      'SELECT COUNT(*) as count FROM purchases WHERE seller_id = ?',
      [id]
    );
    
    if (purchases[0].count > 0) {
      throw new Error('Cannot delete seller with existing purchases');
    }
    
    const [result] = await pool.execute(
      'DELETE FROM sellers WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findByEmail(email, userId) {
    const [sellers] = await pool.execute(
      'SELECT * FROM sellers WHERE email = ? AND user_id = ?',
      [email, userId]
    );
    return sellers[0];
  }

  static async getAllByUserId(userId) {
    const [sellers] = await pool.execute(
      'SELECT id, name FROM sellers WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return sellers;
  }
}

class Purchase {
  static async create(purchaseData, items) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { sellerId, userId, status = 'pending', totalAmount } = purchaseData;
      
      // Create purchase record
      const [purchaseResult] = await connection.execute(
        `INSERT INTO purchases (seller_id, user_id, status, total_amount) 
         VALUES (?, ?, ?, ?)`,
        [sellerId, userId, status, totalAmount]
      );
      
      const purchaseId = purchaseResult.insertId;
      
      // Create purchase items and update stock if completed
      for (const item of items) {
        const { productVariantId, quantity, unitCost } = item;
        const totalCost = quantity * unitCost;
        
        // Create purchase item
        await connection.execute(
          `INSERT INTO purchase_items (purchase_id, product_variant_id, quantity, unit_cost, total_cost) 
           VALUES (?, ?, ?, ?, ?)`,
          [purchaseId, productVariantId, quantity, unitCost, totalCost]
        );
        
        // Update stock if purchase is completed
        if (status === 'completed') {
          await connection.execute(
            'UPDATE product_variants SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?',
            [quantity, productVariantId]
          );
        }
      }
      
      await connection.commit();
      return purchaseId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const [purchases] = await pool.execute(
      `SELECT p.*, s.name as seller_name, u.username as created_by
       FROM purchases p
       LEFT JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (!purchases[0]) return null;
    
    // Get purchase items
    const [items] = await pool.execute(
      `SELECT pi.*, pv.variant_name, pr.name as product_name
       FROM purchase_items pi
       LEFT JOIN product_variants pv ON pi.product_variant_id = pv.id
       LEFT JOIN products pr ON pv.product_id = pr.id
       WHERE pi.purchase_id = ?`,
      [id]
    );
    
    return {
      ...purchases[0],
      items
    };
  }

  static async findByUserId(userId, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, s.name as seller_name, COUNT(pi.id) as total_items
      FROM purchases p
      LEFT JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
      WHERE p.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM purchases WHERE user_id = ?';
    const queryParams = [userId];
    
    // Apply filters
    if (filters.sellerId) {
      query += ` AND p.seller_id = ?`;
      countQuery += ` AND p.seller_id = ?`;
      queryParams.push(filters.sellerId);
    }
    
    if (filters.status) {
      query += ` AND p.status = ?`;
      countQuery += ` AND p.status = ?`;
      queryParams.push(filters.status);
    }
    
    if (filters.startDate) {
      query += ` AND p.purchase_date >= ?`;
      countQuery += ` AND p.purchase_date >= ?`;
      queryParams.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ` AND p.purchase_date <= ?`;
      countQuery += ` AND p.purchase_date <= ?`;
      queryParams.push(filters.endDate);
    }
    
    query += ` GROUP BY p.id ORDER BY p.purchase_date DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [purchases] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (filters.sellerId) countParams.push(filters.sellerId);
    if (filters.status) countParams.push(filters.status);
    if (filters.startDate) countParams.push(filters.startDate);
    if (filters.endDate) countParams.push(filters.endDate);
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      purchases,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = ['seller_id', 'status'];
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
      `UPDATE purchases SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async updateStatus(id, newStatus) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get current purchase
      const [purchases] = await connection.execute(
        'SELECT status FROM purchases WHERE id = ?',
        [id]
      );
      
      if (!purchases[0]) {
        throw new Error('Purchase not found');
      }
      
      const currentStatus = purchases[0].status;
      
      // Update purchase status
      await connection.execute(
        'UPDATE purchases SET status = ? WHERE id = ?',
        [newStatus, id]
      );
      
      // Handle stock updates based on status change
      if (currentStatus === 'pending' && newStatus === 'completed') {
        // Add stock when completing purchase
        const [items] = await connection.execute(
          'SELECT product_variant_id, quantity FROM purchase_items WHERE purchase_id = ?',
          [id]
        );
        
        for (const item of items) {
          await connection.execute(
            'UPDATE product_variants SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?',
            [item.quantity, item.product_variant_id]
          );
        }
      } else if (currentStatus === 'completed' && newStatus === 'cancelled') {
        // Remove stock when cancelling completed purchase
        const [items] = await connection.execute(
          'SELECT product_variant_id, quantity FROM purchase_items WHERE purchase_id = ?',
          [id]
        );
        
        for (const item of items) {
          await connection.execute(
            'UPDATE product_variants SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
            [item.quantity, item.product_variant_id]
          );
        }
      }
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteById(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get purchase status and items
      const [purchases] = await connection.execute(
        'SELECT status FROM purchases WHERE id = ?',
        [id]
      );
      
      if (!purchases[0]) {
        throw new Error('Purchase not found');
      }
      
      // If purchase was completed, remove stock
      if (purchases[0].status === 'completed') {
        const [items] = await connection.execute(
          'SELECT product_variant_id, quantity FROM purchase_items WHERE purchase_id = ?',
          [id]
        );
        
        for (const item of items) {
          await connection.execute(
            'UPDATE product_variants SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?',
            [item.quantity, item.product_variant_id]
          );
        }
      }
      
      // Delete purchase (items will be deleted by CASCADE)
      const [result] = await connection.execute(
        'DELETE FROM purchases WHERE id = ?',
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

  static async getDashboardStats(userId) {
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_purchases,
         SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_spent,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_purchases
       FROM purchases 
       WHERE user_id = ?`,
      [userId]
    );
    
    return stats[0];
  }
}

module.exports = {
  Seller,
  Purchase
};