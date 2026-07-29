const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  validateRequest, 
  saleSchema, 
  paginationSchema 
} = require('../middleware/validation');
const {
  createSale,
  getSales,
  getSale,
  updateSale,
  deleteSale,
  getSalesAnalytics,
  getTopProducts,
  getDashboardStats
} = require('../controllers/saleController');

// All routes require authentication
router.use(authenticate);

// Sale routes
router.get('/', validateRequest(paginationSchema), getSales);
router.post('/', validateRequest(saleSchema), createSale);
router.get('/analytics', getSalesAnalytics);
router.get('/top-products', getTopProducts);
router.get('/dashboard-stats', getDashboardStats);
router.get('/:id', getSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;