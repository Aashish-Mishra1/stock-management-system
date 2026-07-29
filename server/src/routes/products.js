const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  validateRequest, 
  productSchema, 
  productVariantSchema, 
  paginationSchema 
} = require('../middleware/validation');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createProductVariant,
  getProductVariants,
  updateProductVariant,
  deleteProductVariant
} = require('../controllers/productController');

// All routes require authentication
router.use(authenticate);

// Product routes
router.get('/', validateRequest(paginationSchema), getProducts);
router.post('/', validateRequest(productSchema), createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Product variant routes
router.get('/:productId/variants', getProductVariants);
router.post('/variants', validateRequest(productVariantSchema), createProductVariant);
router.put('/variants/:id', updateProductVariant);
router.delete('/variants/:id', deleteProductVariant);

module.exports = router;