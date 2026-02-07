import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';

interface AuthRequest extends Request {
  admin?: any;
}

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-admin';

// Simple admin authentication middleware
export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.role !== 'admin') {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Access denied. Admin role required.'
        });
      }
      
      req.admin = decoded;
      next();
    } catch (jwtError) {
      // Fallback to demo token for development
      if (token === 'demo-admin-token') {
        req.admin = { id: 1, email: 'admin@pncnikah.com', role: 'admin' };
        next();
      } else {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or expired token.'
        });
      }
    }
  } catch (error) {
    res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Admin login endpoint
export const adminLogin = (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Simple hardcoded admin credentials for demo
  const adminCredentials = [
    { id: 1, email: 'admin@pncnikah.com', password: 'admin123', name: 'Main Admin' },
    { id: 2, email: 'manager@pncnikah.com', password: 'manager123', name: 'Manager' }
  ];
  
  const admin = adminCredentials.find(a => a.email === email && a.password === password);
  
  if (admin) {
    // Generate JWT token
    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin'
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(httpStatus.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin'
        }
      }
    });
  } else {
    res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
};