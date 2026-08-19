const { Product, ProductVariant } = require('../models/Product');
const { Category, Brand } = require('../models/Category');

// Product Controllers
const createProduct = async (req, res, next) => {
  try {
    const { name, description, sku, categoryId, brandId, basePrice, costPrice, imageUrl } = req.validatedData.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    // accept optional initial stock from un-validated body for convenience
    const initialStock = req.body && req.body.stock !== undefined ? Number(req.body.stock) : 0;
    
    // Check if SKU already exists
    if (sku) {
      const existingProduct = await Product.findBySku(sku);
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }
    
    // Verify category and brand belong to user
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category || category.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }
    
    if (brandId) {
      const brand = await Brand.findById(brandId);
      if (!brand || brand.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand'
        });
      }
    }
    
    const productId = await Product.create({
      name,
      description,
      sku,
      categoryId,
      brandId,
      userId,
      basePrice,
      costPrice,
      imageUrl
    });
    
    const newProduct = await Product.findById(productId);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: newProduct }
    });

    // If initial stock was provided, create a default variant so aggregated stock is not zero
    try {
      if (initialStock && initialStock > 0) {
        await ProductVariant.create({
          productId,
          variantName: 'Default',
          sku: null,
          price: Number(basePrice) || 0,
          quantityInStock: Number(initialStock),
          attributes: null
        });
      }
    } catch (err) {
      // do not fail product creation if variant creation fails; log for debugging
      // eslint-disable-next-line no-console
      console.error('createProduct: failed to create default variant', err && err.message ? err.message : err);
    }
    
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, sortBy, sortOrder, categoryId, brandId, status, minPrice, maxPrice } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const filters = {
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      brandId: brandId ? parseInt(brandId) : undefined,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      status,
      sortBy,
      sortOrder
    };
    
    const result = await Product.findByUserId(userId, page, limit, filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.getProductWithVariants(parseInt(id));
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product belongs to user
    if (product.user_id !== (req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { product }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, sku, categoryId, brandId, basePrice, costPrice, imageUrl, status } = req.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if product exists and belongs to user
    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct || existingProduct.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if SKU is being changed and if new SKU exists
    if (sku && sku !== existingProduct.sku) {
      const productWithSku = await Product.findBySku(sku);
      if (productWithSku) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }
    
    // Verify category and brand
    if (categoryId && categoryId !== existingProduct.category_id) {
      const category = await Category.findById(categoryId);
      if (!category || category.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }
    
    if (brandId && brandId !== existingProduct.brand_id) {
      const brand = await Brand.findById(brandId);
      if (!brand || brand.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand'
        });
      }
    }
    
    const updated = await Product.updateById(parseInt(id), {
      name,
      description,
      sku,
      category_id: categoryId,
      brand_id: brandId,
      base_price: basePrice,
      cost_price: costPrice,
      image_url: imageUrl,
      status
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update product'
      });
    }
    
    const updatedProduct = await Product.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if product exists and belongs to user
    const product = await Product.findById(parseInt(id));
    if (!product || product.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const deleted = await Product.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete product'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Product Variant Controllers
const createProductVariant = async (req, res, next) => {
  try {
    const { productId, variantName, sku, price, quantityInStock, attributes } = req.validatedData.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if product exists and belongs to user
    const product = await Product.findById(productId);
    if (!product || product.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if SKU already exists
    if (sku) {
      const existingVariant = await ProductVariant.findBySku(sku);
      if (existingVariant) {
        return res.status(409).json({
          success: false,
          message: 'Product variant with this SKU already exists'
        });
      }
    }
    
    const variantId = await ProductVariant.create({
      productId,
      variantName,
      sku,
      price,
      quantityInStock,
      attributes
    });
    
    const newVariant = await ProductVariant.findById(variantId);
    
    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: { variant: newVariant }
    });
    
  } catch (error) {
    next(error);
  }
};

const getProductVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if product exists and belongs to user
    const product = await Product.findById(parseInt(productId));
    if (!product || product.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const variants = await ProductVariant.findByProductId(parseInt(productId));
    
    res.json({
      success: true,
      data: { variants }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variantName, sku, price, quantityInStock, attributes } = req.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if variant exists and belongs to user via parent product
    const variant = await ProductVariant.findById(parseInt(id));
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }
    const parentProduct = await Product.findById(variant.product_id);
    if (!parentProduct || parentProduct.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check if SKU is being changed and if new SKU exists
    if (sku && sku !== variant.sku) {
      const variantWithSku = await ProductVariant.findBySku(sku);
      if (variantWithSku) {
        return res.status(409).json({
          success: false,
          message: 'Product variant with this SKU already exists'
        });
      }
    }
    
    const updated = await ProductVariant.updateById(parseInt(id), {
      variant_name: variantName,
      sku,
      price,
      quantity_in_stock: quantityInStock,
      attributes
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update product variant'
      });
    }
    
    const updatedVariant = await ProductVariant.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Product variant updated successfully',
      data: { variant: updatedVariant }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteProductVariant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if variant exists and belongs to user via parent product
    const variant = await ProductVariant.findById(parseInt(id));
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }
    const parentProduct = await Product.findById(variant.product_id);
    if (!parentProduct || parentProduct.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }
    
    const deleted = await ProductVariant.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete product variant'
      });
    }
    
    res.json({
      success: true,
      message: 'Product variant deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

const getTotalProducts = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    const [rows] = await require('../config/database').pool.execute(
      `SELECT COALESCE(SUM(pv.quantity_in_stock), 0) AS totalQuantity
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.user_id = ?`,
      [userId]
    );
    res.json({
      success: true,
      data: { totalQuantity: Number(rows[0].totalQuantity) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Products
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getTotalProducts,

  // Product Variants
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant
};