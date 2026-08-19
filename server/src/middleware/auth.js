const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    // Debug: log bypass flag
    // eslint-disable-next-line no-console
    console.log('Auth middleware - DISABLE_AUTH=', process.env.DISABLE_AUTH);
    // Development/testing bypass: set DISABLE_AUTH=true to skip JWT checks
    if (process.env.DISABLE_AUTH === 'true') {
      // eslint-disable-next-line no-console
      console.log('Auth middleware - bypass active, injecting DEV user id=', process.env.DEV_USER_ID);
      req.user = {
        id: Number(process.env.DEV_USER_ID) || 1,
        username: process.env.DEV_USERNAME || 'dev',
        email: process.env.DEV_EMAIL || 'dev@local',
        role: process.env.DEV_ROLE || 'admin',
      };
      return next();
    }
    // Allow test bypass via header X-DEV-USER (useful for automated API tests)
    const devHeader = req.header('X-DEV-USER') || req.header('x-dev-user');
    if (devHeader) {
      // eslint-disable-next-line no-console
      console.log('Auth middleware - header bypass active, injecting user id=', devHeader);
      req.user = {
        id: Number(devHeader) || 1,
        username: `dev${devHeader}`,
        email: `dev${devHeader}@local`,
        role: 'admin',
      };
      return next();
    }
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};