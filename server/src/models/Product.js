const { pool } = require('../config/database');

class Product {
  static async create(productData) {
    const { 
      name, description, sku, categoryId, brandId, userId, 
      basePrice, costPrice, imageUrl, status = 'active' 
    } = productData;
    
    const [result] = await pool.execute(
      `INSERT INTO products (name, description, sku, category_id, brand_id, user_id, 
                            base_price, cost_price, image_url, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, sku, categoryId, brandId, userId, basePrice, costPrice, imageUrl, status]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              u.username as created_by
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );
    return products[0];
  }

  static async findByUserId(userId, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.user_id = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.user_id = ?';
    const queryParams = [userId];
    
    // Apply filters
    if (filters.search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      const searchParam = `%${filters.search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }
    
    if (filters.categoryId) {
      query += ` AND p.category_id = ?`;
      countQuery += ` AND p.category_id = ?`;
      queryParams.push(filters.categoryId);
    }
    
    if (filters.brandId) {
      query += ` AND p.brand_id = ?`;
      countQuery += ` AND p.brand_id = ?`;
      queryParams.push(filters.brandId);
    }
    
    if (filters.status) {
      query += ` AND p.status = ?`;
      countQuery += ` AND p.status = ?`;
      queryParams.push(filters.status);
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    const [products] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (filters.search) {
      const searchParam = `%${filters.search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    if (filters.categoryId) countParams.push(filters.categoryId);
    if (filters.brandId) countParams.push(filters.brandId);
    if (filters.status) countParams.push(filters.status);
    
    const [totalResult] = await pool.execute(countQuery, countParams);
    
    return {
      products,
      total: totalResult[0].total,
      page,
      totalPages: Math.ceil(totalResult[0].total / limit)
    };
  }

  static async updateById(id, updateData) {
    const allowedFields = [
      'name', 'description', 'sku', 'category_id', 'brand_id', 
      'base_price', 'cost_price', 'image_url', 'status'
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
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findBySku(sku) {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE sku = ?',
      [sku]
    );
    return products[0];
  }

  static async getProductWithVariants(id) {
    // Get product details
    const product = await this.findById(id);
    if (!product) return null;

    // Get product variants
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at',
      [id]
    );

    return {
      ...product,
      variants
    };
  }
}

class ProductVariant {
  static async create(variantData) {
    const { 
      productId, variantName, sku, price, quantityInStock = 0, attributes 
    } = variantData;
    
    const [result] = await pool.execute(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, 
                                   quantity_in_stock, attributes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, variantName, sku, price, quantityInStock, JSON.stringify(attributes)]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [variants] = await pool.execute(
      `SELECT pv.*, p.name as product_name, p.user_id
       FROM product_variants pv
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE pv.id = ?`,
      [id]
    );
    
    if (variants[0] && variants[0].attributes) {
      variants[0].attributes = JSON.parse(variants[0].attributes);
    }
    
    return variants[0];
  }

  static async findByProductId(productId) {
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at',
      [productId]
    );
    
    return variants.map(variant => ({
      ...variant,
      attributes: variant.attributes ? JSON.parse(variant.attributes) : null
    }));
  }

  static async updateById(id, updateData) {
    const allowedFields = ['variant_name', 'sku', 'price', 'quantity_in_stock', 'attributes'];
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'attributes') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async updateStock(id, quantity, operation = 'add') {
    const operator = operation === 'add' ? '+' : '-';
    const [result] = await pool.execute(
      `UPDATE product_variants SET quantity_in_stock = quantity_in_stock ${operator} ? WHERE id = ?`,
      [Math.abs(quantity), id]
    );
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await pool.execute(
      'DELETE FROM product_variants WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async findBySku(sku) {
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE sku = ?',
      [sku]
    );
    
    if (variants[0] && variants[0].attributes) {
      variants[0].attributes = JSON.parse(variants[0].attributes);
    }
    
    return variants[0];
  }

  static async checkStock(id, requiredQuantity) {
    const [variants] = await pool.execute(
      'SELECT quantity_in_stock FROM product_variants WHERE id = ?',
      [id]
    );
    
    if (!variants[0]) return false;
    return variants[0].quantity_in_stock >= requiredQuantity;
  }
}

module.exports = {
  Product,
  ProductVariant
};