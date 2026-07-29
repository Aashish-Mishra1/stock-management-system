const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  validateRequest, 
  brandSchema, 
  paginationSchema 
} = require('../middleware/validation');
const {
  createBrand,
  getBrands,
  getAllBrands,
  getBrand,
  updateBrand,
  deleteBrand
} = require('../controllers/catagoryController');

// All routes require authentication
router.use(authenticate);

// Brand routes
router.get('/', validateRequest(paginationSchema), getBrands);
router.get('/all', getAllBrands);
router.post('/', validateRequest(brandSchema), createBrand);
router.get('/:id', getBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

module.exports = router;