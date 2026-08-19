const { Seller, Purchase } = require('../models/Saller');
const { ProductVariant } = require('../models/Product');

// Seller Controllers
const createSeller = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.validatedData.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if seller email already exists for this user
    if (email) {
      const existingSeller = await Seller.findByEmail(email, userId);
      if (existingSeller) {
        return res.status(409).json({
          success: false,
          message: 'Seller with this email already exists'
        });
      }
    }
    
    const sellerId = await Seller.create({
      name,
      email,
      phone,
      address,
      userId
    });
    
    const newSeller = await Seller.findById(sellerId);
    
    res.status(201).json({
      success: true,
      message: 'Seller created successfully',
      data: { seller: newSeller }
    });
    
  } catch (error) {
    next(error);
  }
};

const getSellers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const result = await Seller.findByUserId(userId, page, limit, search);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getAllSellers = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const sellers = await Seller.getAllByUserId(userId);
    
    res.json({
      success: true,
      data: { sellers }
    });
    
  } catch (error) {
    next(error);
  }
};

const getSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const seller = await Seller.findById(parseInt(id));
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Check if seller belongs to user
    if (seller.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { seller }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    const userId = req.user.id;
    
    // Check if seller exists and belongs to user
    const existingSeller = await Seller.findById(parseInt(id));
    if (!existingSeller || existingSeller.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    // Check if email is being changed and if new email exists
    if (email && email !== existingSeller.email) {
      const sellerWithEmail = await Seller.findByEmail(email, userId);
      if (sellerWithEmail) {
        return res.status(409).json({
          success: false,
          message: 'Seller with this email already exists'
        });
      }
    }
    
    const updated = await Seller.updateById(parseInt(id), {
      name,
      email,
      phone,
      address
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update seller'
      });
    }
    
    const updatedSeller = await Seller.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Seller updated successfully',
      data: { seller: updatedSeller }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if seller exists and belongs to user
    const seller = await Seller.findById(parseInt(id));
    if (!seller || seller.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    const deleted = await Seller.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete seller.'
      });
    }
    
    res.json({
      success: true,
      message: 'Seller deleted successfully'
    });
    
  } catch (error) {
    if (error.message === 'Cannot delete seller with existing purchases') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Purchase Controllers
const createPurchase = async (req, res, next) => {
  try {
    const { sellerId, status, items } = req.validatedData.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Validate seller if provided
    if (sellerId) {
      const seller = await Seller.findById(sellerId);
      if (!seller || seller.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid seller'
        });
      }
    }
    
    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const { productVariantId, quantity, unitCost } = item;
      
      // Check if product variant exists
      let variant = await ProductVariant.findById(productVariantId);
      if (!variant) {
        // Fallback: maybe frontend passed a product id instead of a variant id
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
      
      validatedItems.push({
        productVariantId,
        quantity,
        unitCost
      });
      
      totalAmount += quantity * unitCost;
    }
    
    const purchaseId = await Purchase.create({
      sellerId,
      userId,
      status,
      totalAmount
    }, validatedItems);
    
    const newPurchase = await Purchase.findById(purchaseId);
    
    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: { purchase: newPurchase }
    });
    
  } catch (error) {
    if (error.message && error.message.startsWith('Insufficient stock')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const getPurchases = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sellerId, status, startDate, endDate, search } = req.query;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const filters = {
      sellerId: sellerId ? parseInt(sellerId) : undefined,
      status,
      startDate,
      endDate,
      search
    };
    
    const result = await Purchase.findByUserId(userId, page, limit, filters);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    const purchase = await Purchase.findById(parseInt(id));
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    // Check if purchase belongs to user
    if (purchase.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { purchase }
    });
    
  } catch (error) {
    next(error);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sellerId, status } = req.body;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if purchase exists and belongs to user
    const existingPurchase = await Purchase.findById(parseInt(id));
    if (!existingPurchase || existingPurchase.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    // Validate seller if being changed
    if (sellerId && sellerId !== existingPurchase.seller_id) {
      const seller = await Seller.findById(sellerId);
      if (!seller || seller.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid seller'
        });
      }
    }
    
    // If status is being changed, use special method to handle stock updates
    if (status && status !== existingPurchase.status) {
      const updated = await Purchase.updateStatus(parseInt(id), status);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update purchase status'
        });
      }
    }
    
    // Update other fields
    const updateData = {};
    if (sellerId) updateData.seller_id = sellerId;
    
    if (Object.keys(updateData).length > 0) {
      await Purchase.updateById(parseInt(id), updateData);
    }
    
    const updatedPurchase = await Purchase.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Purchase updated successfully',
      data: { purchase: updatedPurchase }
    });
    
  } catch (error) {
    if (error.message && error.message.startsWith('Insufficient stock')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? (process.env.DEV_USER_ID ? Number(process.env.DEV_USER_ID) : null);
    
    // Check if purchase exists and belongs to user
    const purchase = await Purchase.findById(parseInt(id));
    if (!purchase || purchase.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    const deleted = await Purchase.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete purchase'
      });
    }
    
    res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

const getPurchaseDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const stats = await Purchase.getDashboardStats(userId);
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Sellers
  createSeller,
  getSellers,
  getAllSellers,
  getSeller,
  updateSeller,
  deleteSeller,
  
  // Purchases
  createPurchase,
  getPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseDashboardStats
};