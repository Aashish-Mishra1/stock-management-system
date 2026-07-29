const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  refreshToken
} = require('../controllers/authController');

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/refresh-token', refreshToken);
router.delete('/account', deleteAccount);

module.exports = router;