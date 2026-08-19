const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRequest, categorySchema } = require('../middleware/validation');
const {
  createCategory,
  getCategories,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/catagoryController');

// All routes require authentication
router.use(authenticate);

// Category routes
router.get('/', getCategories);
router.get('/all', getAllCategories);
router.post('/', validateRequest(categorySchema), createCategory);
router.get('/:id', getCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;