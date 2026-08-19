const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRequest, saleSchema } = require('../middleware/validation');
const {
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
} = require('../controllers/saleController');

// All routes require authentication
router.use(authenticate);

// Sale routes — static routes MUST come before /:id
router.get('/analytics', getSalesAnalytics);
router.get('/top-products', getTopProducts);
router.get('/dashboard-stats', getDashboardStats);
router.get('/years', getYearlySales);
router.get('/months', getMonthlySales);
router.get('/weeks', getWeeklySales);
router.get('/days', getDailySales);
router.get('/', getSales);
router.post('/', validateRequest(saleSchema), createSale);
router.get('/:id', getSale);
router.put('/:id', updateSale);
router.patch('/:id', updateSale);
router.delete('/:id', deleteSale);

module.exports = router;