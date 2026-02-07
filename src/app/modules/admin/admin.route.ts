import { Router } from "express";
import { AdminController } from "./admin.controller";
import { adminAuth, adminLogin } from "./admin.middleware";

const router = Router();

// Auth
router.post('/login', adminLogin);

// Apply admin auth middleware to all routes below
router.use(adminAuth);

// Dashboard
router.get('/dashboard/stats', AdminController.getDashboardStats);

// User Management
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.delete('/users/:id', AdminController.deleteUser);

// Biodata Management  
router.get('/biodatas', AdminController.getAllBiodatas);
router.patch('/biodatas/:id/status', AdminController.updateBiodataStatus);

// Payment Management
router.get('/payments', AdminController.getAllPayments);
router.get('/payments/stats', AdminController.getPaymentStats);
router.get('/payments/:id', AdminController.getPaymentById);
router.patch('/payments/:id/status', AdminController.updatePaymentStatus);

// Refund Management
router.get('/refunds', AdminController.getAllRefunds);
router.get('/refunds/stats', AdminController.getRefundStats);
router.get('/refunds/:id', AdminController.getRefundById);
router.patch('/refunds/:id/status', AdminController.updateRefundStatus);

export default router;