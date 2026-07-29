const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  validateRequest, 
  purchaseSchema, 
  paginationSchema 
} = require('../middleware/validation');
const {
  createPurchase,
  getPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseDashboardStats
} = require('../controllers/sellerController');

// All routes require authentication
router.use(authenticate);

// Purchase routes
router.get('/', validateRequest(paginationSchema), getPurchases);
router.post('/', validateRequest(purchaseSchema), createPurchase);
router.get('/dashboard-stats', getPurchaseDashboardStats);
router.get('/:id', getPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;