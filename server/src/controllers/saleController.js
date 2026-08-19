const Sale = require('../models/Sale');
const { ProductVariant } = require('../models/Product');

const createSale = async (req, res, next) => {
  try {
    const { customerName, customerEmail, customerPhone, paymentMethod, items } = req.validatedData.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const { productVariantId: rawId, quantity: rawQuantity, unitPrice: rawUnitPrice } = item;
      const productVariantId = Number(rawId);
      const quantity = Number(rawQuantity);
      const unitPrice = Number(rawUnitPrice);
      
      // Check if product variant exists
      let variant = await ProductVariant.findById(productVariantId);
      if (!variant) {
        // Try fallback: maybe frontend passed a product id instead of a variant id.
        const variants = await ProductVariant.findByProductId(productVariantId);
        if (Array.isArray(variants) && variants.length > 0) {
          variant = variants[0];
        }
      }

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Product variant with ID ${productVariantId} not found`
        });
      }
      
      // Check if variant belongs to user's product
      if (variant.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for one or more products'
        });
      }
      
      // Use the actual variant id to ensure downstream operations use correct PK
      const realVariantId = Number(variant.id ?? variant.ID ?? variant._id ?? variant.Id ?? variant.Id ?? variant.id);
      if (!Number.isFinite(realVariantId) || Number.isNaN(realVariantId)) {
        return res.status(500).json({ success: false, message: 'Internal error: invalid variant id' });
      }
      validatedItems.push({
        productVariantId: realVariantId,
        quantity,
        unitPrice
      });
      
      totalAmount += quantity * unitPrice;
    }
    
    const saleId = await Sale.create({
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      userId,
      totalAmount
    }, validatedItems);
    
    const newSale = await Sale.findById(saleId);
    
    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale: newSale }
    });
    
  } catch (error) {
    if (error.message && error.message.startsWith('Insufficient stock')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;
    const { startDate, endDate, paymentMethod } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const filters = {
      search,
      startDate,
      endDate,
      paymentMethod
    };
    
    const result = await Sale.findByUserId(userId, page, limit, filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const sale = await Sale.findById(parseInt(id));
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    // Check if sale belongs to user
    if (sale.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { sale }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, customerEmail, customerPhone, paymentMethod } = req.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if sale exists and belongs to user
    const existingSale = await Sale.findById(parseInt(id));
    if (!existingSale || existingSale.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    const updated = await Sale.updateById(parseInt(id), {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      payment_method: paymentMethod
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update sale'
      });
    }
    
    const updatedSale = await Sale.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Sale updated successfully',
      data: { sale: updatedSale }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if sale exists and belongs to user
    const sale = await Sale.findById(parseInt(id));
    if (!sale || sale.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    const deleted = await Sale.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete sale'
      });
    }
    
    res.json({
      success: true,
      message: 'Sale deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be one of: daily, weekly, monthly, yearly'
      });
    }
    
    const analytics = await Sale.getSalesAnalytics(userId, period);
    
    res.json({
      success: true,
      data: { analytics, period }
    });
    
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const products = await Sale.getTopProducts(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: { products }
    });
    
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const stats = await Sale.getDashboardStats(userId);
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    next(error);
  }
};

const getYearlySales = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    const data = await Sale.getSalesByPeriod(userId, 'yearly');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getMonthlySales = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await Sale.getSalesByPeriod(userId, 'monthly');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getWeeklySales = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await Sale.getSalesByPeriod(userId, 'weekly');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getDailySales = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await Sale.getSalesByPeriod(userId, 'daily');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSale,
  updateSale,
  deleteSale,
  getSalesAnalytics,
  getTopProducts,
  getDashboardStats,
  getYearlySales,
  getMonthlySales,
  getWeeklySales,
  getDailySales
};