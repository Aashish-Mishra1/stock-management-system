const { z } = require('zod');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error during validation'
      });
    }
  };
};

// Auth validation schemas
const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

// Product validation schemas
const productSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    sku: z.string().min(1).max(100).optional(),
    categoryId: z.number().int().positive().optional(),
    brandId: z.number().int().positive().optional(),
    basePrice: z.number().positive(),
    costPrice: z.number().positive().optional(),
    imageUrl: z.string().url().optional()
  })
});

const productVariantSchema = z.object({
  body: z.object({
    productId: z.number().int().positive(),
    variantName: z.string().min(1).max(255),
    sku: z.string().min(1).max(100).optional(),
    price: z.number().positive(),
    quantityInStock: z.number().int().min(0).default(0),
    attributes: z.record(z.any()).optional()
  })
});

// Category validation schema
const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional()
  })
});

// Brand validation schema
const brandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional()
  })
});

// Seller validation schema
const sellerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().min(10).max(20).optional(),
    address: z.string().optional()
  })
});

// Sale validation schema
const saleSchema = z.object({
  body: z.object({
    customerName: z.string().min(1).max(255).optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().min(10).max(20).optional(),
    paymentMethod: z.enum(['cash', 'card', 'bank_transfer', 'other']).default('cash'),
    items: z.array(z.object({
      productVariantId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive()
    })).min(1)
  })
});

// Purchase validation schema
const purchaseSchema = z.object({
  body: z.object({
    sellerId: z.number().int().positive().optional(),
    status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
    items: z.array(z.object({
      productVariantId: z.number().int().positive(),
      quantity: z.number().int().positive(),
      unitCost: z.number().positive()
    })).min(1)
  })
});

// Pagination schema
const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val ?? '1') || 1),
    limit: z.string().optional().transform(val => Math.min(parseInt(val ?? '10') || 10, 100)),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    categoryId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    brandId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    status: z.enum(['active', 'inactive']).optional()
  })
});

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  productSchema,
  productVariantSchema,
  categorySchema,
  brandSchema,
  sellerSchema,
  saleSchema,
  purchaseSchema,
  paginationSchema
};