"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// Apply admin auth middleware to all routes below
router.use((0, auth_1.auth)("admin"));
// Dashboard
router.get('/dashboard/stats', admin_controller_1.AdminController.getDashboardStats);
// User Management
router.get('/users', admin_controller_1.AdminController.getAllUsers);
router.get('/users/:id', admin_controller_1.AdminController.getUserById);
router.patch('/users/:id/status', admin_controller_1.AdminController.updateUserStatus);
router.delete('/users/:id', admin_controller_1.AdminController.deleteUser);
// Biodata Management  
router.get('/biodatas', admin_controller_1.AdminController.getAllBiodatas);
router.patch('/biodatas/:id/status', admin_controller_1.AdminController.updateBiodataStatus);
// Payment Management
router.get('/payments', admin_controller_1.AdminController.getAllPayments);
router.get('/payments/stats', admin_controller_1.AdminController.getPaymentStats);
router.get('/payments/:id', admin_controller_1.AdminController.getPaymentById);
router.patch('/payments/:id/status', admin_controller_1.AdminController.updatePaymentStatus);
// Refund Management
router.get('/refunds', admin_controller_1.AdminController.getAllRefunds);
router.get('/refunds/stats', admin_controller_1.AdminController.getRefundStats);
router.get('/refunds/:id', admin_controller_1.AdminController.getRefundById);
router.patch('/refunds/:id/status', admin_controller_1.AdminController.updateRefundStatus);
exports.default = router;
