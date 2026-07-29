const errorHandler = (error, req, res, next) => {
  console.error('Error:', error);

  // MySQL duplicate entry error
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. Resource already exists.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // MySQL foreign key constraint error
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // MySQL connection error
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // JWT errors (handled in auth middleware)
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Multer file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Validation errors (should be handled by validation middleware)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Default server error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};