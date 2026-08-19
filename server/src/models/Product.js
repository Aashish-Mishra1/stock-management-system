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
      [
        name,
        description ?? null,
        sku ?? null,
        categoryId ?? null,
        brandId ?? null,
        userId ?? null,
        basePrice ?? null,
        costPrice ?? null,
        imageUrl ?? null,
        status
      ]
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
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;
    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
             (
               SELECT COALESCE(SUM(pv.quantity_in_stock), 0)
               FROM product_variants pv
               WHERE pv.product_id = p.id
             ) AS quantity_in_stock
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

    if (filters.minPrice !== undefined) {
      query += ` AND p.base_price >= ?`;
      countQuery += ` AND p.base_price >= ?`;
      queryParams.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query += ` AND p.base_price <= ?`;
      countQuery += ` AND p.base_price <= ?`;
      queryParams.push(filters.maxPrice);
    }
    
    if (filters.status) {
      query += ` AND p.status = ?`;
      countQuery += ` AND p.status = ?`;
      queryParams.push(filters.status);
    }
    
    // Apply sorting - whitelist to prevent SQL injection
    const ALLOWED_SORT_FIELDS = ['name', 'base_price', 'cost_price', 'created_at', 'status'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = (filters.sortOrder || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY p.${safeSortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
    
    const [products] = await pool.execute(query, queryParams);
    
    // Get total count
    const countParams = [userId];
    if (filters.search) {
      const searchParam = `%${filters.search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    if (filters.categoryId) countParams.push(filters.categoryId);
    if (filters.brandId) countParams.push(filters.brandId);
    if (filters.minPrice !== undefined) countParams.push(filters.minPrice);
    if (filters.maxPrice !== undefined) countParams.push(filters.maxPrice);
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
    // Prepare attributes for storage: only store valid JSON strings
    let attributesToStore = null;
    if (attributes !== undefined && attributes !== null) {
      if (typeof attributes === 'object') {
        try {
          attributesToStore = JSON.stringify(attributes);
        } catch (err) {
          attributesToStore = null;
        }
      } else if (typeof attributes === 'string') {
        // If a string, ensure it's valid JSON first
        try {
          JSON.parse(attributes);
          attributesToStore = attributes;
        } catch (err) {
          // not valid JSON - don't store to avoid later parse errors
          attributesToStore = null;
        }
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO product_variants (product_id, variant_name, sku, price, 
                                   quantity_in_stock, attributes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(productId),
        variantName ?? null,
        sku ?? null,
        price ?? null,
        quantityInStock ?? 0,
        attributesToStore
      ]
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
      try {
        variants[0].attributes = JSON.parse(variants[0].attributes);
      } catch (err) {
        // If stored value is not valid JSON (e.g. "[object Object]"), fallback to null
        // eslint-disable-next-line no-console
        console.warn('ProductVariant.findById: failed to parse attributes, returning null', variants[0].attributes);
        variants[0].attributes = null;
      }
    }
    
    return variants[0];
  }

  static async findByProductId(productId) {
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at',
      [productId]
    );
    
    return variants.map(variant => {
      let attrs = null;
      if (variant.attributes) {
        try {
          attrs = JSON.parse(variant.attributes);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('ProductVariant.findByProductId: failed to parse attributes, returning null', variant.attributes);
          attrs = null;
        }
      }
      return {
        ...variant,
        attributes: attrs
      };
    });
  }

  static async updateById(id, updateData) {
    const allowedFields = ['variant_name', 'sku', 'price', 'quantity_in_stock', 'attributes'];
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'attributes') {
          fields.push(`${key} = ?`);
          const attrs = updateData[key];
          if (attrs === null) {
            values.push(null);
          } else if (typeof attrs === 'object') {
            try {
              values.push(JSON.stringify(attrs));
            } catch (err) {
              values.push(null);
            }
          } else if (typeof attrs === 'string') {
            try {
              JSON.parse(attrs);
              values.push(attrs);
            } catch (err) {
              values.push(null);
            }
          } else {
            values.push(null);
          }
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
      try {
        variants[0].attributes = JSON.parse(variants[0].attributes);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('ProductVariant.findBySku: failed to parse attributes, returning null', variants[0].attributes);
        variants[0].attributes = null;
      }
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