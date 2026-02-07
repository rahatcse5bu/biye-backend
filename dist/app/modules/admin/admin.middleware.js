"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = exports.adminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_1 = __importDefault(require("http-status"));
// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-admin';
// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return res.status(http_status_1.default.UNAUTHORIZED).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        try {
            // Verify JWT token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (decoded.role !== 'admin') {
                return res.status(http_status_1.default.FORBIDDEN).json({
                    success: false,
                    message: 'Access denied. Admin role required.'
                });
            }
            req.admin = decoded;
            next();
        }
        catch (jwtError) {
            // Fallback to demo token for development
            if (token === 'demo-admin-token') {
                req.admin = { id: 1, email: 'admin@pncnikah.com', role: 'admin' };
                next();
            }
            else {
                return res.status(http_status_1.default.UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid or expired token.'
                });
            }
        }
    }
    catch (error) {
        res.status(http_status_1.default.UNAUTHORIZED).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};
exports.adminAuth = adminAuth;
// Admin login endpoint
const adminLogin = (req, res) => {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
        return res.status(http_status_1.default.BAD_REQUEST).json({
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
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
        res.status(http_status_1.default.OK).json({
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
    }
    else {
        res.status(http_status_1.default.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid email or password'
        });
    }
};
exports.adminLogin = adminLogin;
