const { Category, Brand } = require('../models/Category');

// Category Controllers
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.validatedData.body;
    const userId = req.user.id;
    
    // Check if category name already exists for this user
    const existingCategory = await Category.findByName(name, userId);
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    
    const categoryId = await Category.create({
      name,
      description,
      userId
    });
    
    const newCategory = await Category.findById(categoryId);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: newCategory }
    });
    
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { page, limit, search } = req.validatedData.query;
    const userId = req.user.id;
    
    const result = await Category.findByUserId(userId, page, limit, search);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const categories = await Category.getAllByUserId(userId);
    
    res.json({
      success: true,
      data: { categories }
    });
    
  } catch (error) {
    next(error);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const category = await Category.findById(parseInt(id));
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category belongs to user
    if (category.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { category }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    
    // Check if category exists and belongs to user
    const existingCategory = await Category.findById(parseInt(id));
    if (!existingCategory || existingCategory.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if name is being changed and if new name exists
    if (name && name !== existingCategory.name) {
      const categoryWithName = await Category.findByName(name, userId);
      if (categoryWithName) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }
    
    const updated = await Category.updateById(parseInt(id), {
      name,
      description
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update category'
      });
    }
    
    const updatedCategory = await Category.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if category exists and belongs to user
    const category = await Category.findById(parseInt(id));
    if (!category || category.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const deleted = await Category.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete category. It may have associated products.'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

// Brand Controllers
const createBrand = async (req, res, next) => {
  try {
    const { name, description } = req.validatedData.body;
    const userId = req.user.id;
    
    // Check if brand name already exists for this user
    const existingBrand = await Brand.findByName(name, userId);
    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: 'Brand with this name already exists'
      });
    }
    
    const brandId = await Brand.create({
      name,
      description,
      userId
    });
    
    const newBrand = await Brand.findById(brandId);
    
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: { brand: newBrand }
    });
    
  } catch (error) {
    next(error);
  }
};

const getBrands = async (req, res, next) => {
  try {
    const { page, limit, search } = req.validatedData.query;
    const userId = req.user.id;
    
    const result = await Brand.findByUserId(userId, page, limit, search);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

const getAllBrands = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const brands = await Brand.getAllByUserId(userId);
    
    res.json({
      success: true,
      data: { brands }
    });
    
  } catch (error) {
    next(error);
  }
};

const getBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const brand = await Brand.findById(parseInt(id));
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    // Check if brand belongs to user
    if (brand.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { brand }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    
    // Check if brand exists and belongs to user
    const existingBrand = await Brand.findById(parseInt(id));
    if (!existingBrand || existingBrand.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    // Check if name is being changed and if new name exists
    if (name && name !== existingBrand.name) {
      const brandWithName = await Brand.findByName(name, userId);
      if (brandWithName) {
        return res.status(409).json({
          success: false,
          message: 'Brand with this name already exists'
        });
      }
    }
    
    const updated = await Brand.updateById(parseInt(id), {
      name,
      description
    });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update brand'
      });
    }
    
    const updatedBrand = await Brand.findById(parseInt(id));
    
    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: { brand: updatedBrand }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if brand exists and belongs to user
    const brand = await Brand.findById(parseInt(id));
    if (!brand || brand.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }
    
    const deleted = await Brand.deleteById(parseInt(id));
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete brand. It may have associated products.'
      });
    }
    
    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Categories
  createCategory,
  getCategories,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  
  // Brands
  createBrand,
  getBrands,
  getAllBrands,
  getBrand,
  updateBrand,
  deleteBrand
};