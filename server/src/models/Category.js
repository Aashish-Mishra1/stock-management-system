const { pool } = require('../config/database');

class Category {
  static async create(categoryData) {
    const { name, description, userId } = categoryData;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, user_id) VALUES (?, ?, ?)',
      [name, description, userId]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return categories[0];
  }

  static async findByUserId(userId, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM categories WHERE user_id = ?';
    const queryParams = [userId];
    
    if (search) {
      query += ` AND (c.name LIKE ? OR c.description LIKE ?)`;
      countQuery += ` AND (c.name LIKE ? OR c.description LIKE ?)`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
    }
    
    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [categories] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (search) {
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam);
    }
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      categories,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = ['name', 'description'];
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
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    // Check if category has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (products[0].count > 0) {
      throw new Error('Cannot delete category with existing products');
    }
    
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findByName(name, userId) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE name = ? AND user_id = ?',
      [name, userId]
    );
    return categories[0];
  }

  static async getAllByUserId(userId) {
    const [categories] = await pool.execute(
      'SELECT id, name FROM categories WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return categories;
  }
}

class Brand {
  static async create(brandData) {
    const { name, description, userId } = brandData;
    
    const [result] = await pool.execute(
      'INSERT INTO brands (name, description, user_id) VALUES (?, ?, ?)',
      [name, description, userId]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [brands] = await pool.execute(
      'SELECT * FROM brands WHERE id = ?',
      [id]
    );
    return brands[0];
  }

  static async findByUserId(userId, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = `
      SELECT b.*, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id
      WHERE b.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM brands WHERE user_id = ?';
    const queryParams = [userId];
    
    if (search) {
      query += ` AND (b.name LIKE ? OR b.description LIKE ?)`;
      countQuery += ` AND (b.name LIKE ? OR b.description LIKE ?)`;
      const searchParam = `%${search}%`;
      queryParams.push(searchParam, searchParam);
    }
    
    query += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [brands] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (search) {
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam);
    }
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      brands,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = ['name', 'description'];
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
      `UPDATE brands SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    // Check if brand has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE brand_id = ?',
      [id]
    );
    
    if (products[0].count > 0) {
      throw new Error('Cannot delete brand with existing products');
    }
    
    const [result] = await pool.execute(
      'DELETE FROM brands WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findByName(name, userId) {
    const [brands] = await pool.execute(
      'SELECT * FROM brands WHERE name = ? AND user_id = ?',
      [name, userId]
    );
    return brands[0];
  }

  static async getAllByUserId(userId) {
    const [brands] = await pool.execute(
      'SELECT id, name FROM brands WHERE user_id = ? ORDER BY name',
      [userId]
    );
    return brands;
  }
}

module.exports = {
  Category,
  Brand
};