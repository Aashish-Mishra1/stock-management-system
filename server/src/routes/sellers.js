const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  validateRequest, 
  sellerSchema, 
  paginationSchema 
} = require('../middleware/validation');
const {
  createSeller,
  getSellers,
  getAllSellers,
  getSeller,
  updateSeller,
  deleteSeller
} = require('../controllers/sellerController');

// All routes require authentication
router.use(authenticate);

// Seller routes
router.get('/', validateRequest(paginationSchema), getSellers);
router.get('/all', getAllSellers);
router.post('/', validateRequest(sellerSchema), createSeller);
router.get('/:id', getSeller);
router.put('/:id', updateSeller);
router.delete('/:id', deleteSeller);

module.exports = router;