"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const user_info_model_1 = require("../user_info/user_info.model");
const general_info_model_1 = __importDefault(require("../general_info/general_info.model"));
const address_model_1 = __importDefault(require("../address/address.model"));
const educational_qualification_model_1 = __importDefault(require("../educational_qualification/educational_qualification.model"));
const personal_info_model_1 = __importDefault(require("../personal_info/personal_info.model"));
const family_status_model_1 = __importDefault(require("../family_status/family_status.model"));
const occupation_model_1 = __importDefault(require("../occupation/occupation.model"));
const marital_info_model_1 = __importDefault(require("../marital_info/marital_info.model"));
const payments_service_1 = require("../payments/payments.service");
const notification_service_1 = require("../notifications/notification.service");
const bibahoMail_1 = require("../../../shared/bibahoMail");
const bkash_refund_1 = require("../bkash/bkash.refund");
exports.AdminController = {
    // Dashboard Statistics
    getDashboardStats: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const totalUsers = yield user_info_model_1.UserInfoModel.countDocuments();
        const activeUsers = yield user_info_model_1.UserInfoModel.countDocuments({ user_status: 'active' });
        const inactiveUsers = yield user_info_model_1.UserInfoModel.countDocuments({ user_status: 'inactive' });
        const bannedUsers = yield user_info_model_1.UserInfoModel.countDocuments({ user_status: 'banned' });
        const pendingUsers = yield user_info_model_1.UserInfoModel.countDocuments({ user_status: 'pending' });
        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRegistrations = yield user_info_model_1.UserInfoModel.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        // Get payment statistics
        const totalPayments = yield payments_service_1.PaymentService.getAllPayments();
        const completedPayments = totalPayments.filter((p) => p.status === 'Completed');
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const [totalBiodatas, verifiedBiodatas, pendingBiodatas] = yield Promise.all([
            general_info_model_1.default.countDocuments(),
            general_info_model_1.default.countDocuments({ biodata_status: 'approved' }),
            general_info_model_1.default.countDocuments({ biodata_status: 'pending' }),
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Dashboard statistics retrieved successfully",
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: inactiveUsers,
                    banned: bannedUsers,
                    pending: pendingUsers,
                    recent: recentRegistrations
                },
                biodatas: {
                    total: totalBiodatas,
                    verified: verifiedBiodatas,
                    pending: pendingBiodatas
                },
                payments: {
                    total: totalPayments.length,
                    completed: completedPayments.length,
                    pending: totalPayments.filter((p) => p.status === 'Pending').length,
                    revenue: totalRevenue
                },
                refunds: {
                    total: 25,
                    pending: 8,
                    approved: 12,
                    rejected: 3,
                    processed: 2
                }
            }
        });
    })),
    // Get all users with pagination and filters
    getAllUsers: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { page = 1, limit = 10, search = '', status = '', user_type = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {};
        if (search) {
            filter.$or = [
                { user_name: { $regex: search, $options: 'i' } },
                { user_id: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (status && status !== 'all') {
            filter.user_status = status;
        }
        if (user_type && user_type !== 'all') {
            filter.user_role = user_type;
        }
        const users = yield user_info_model_1.UserInfoModel.find(filter)
            .select('-password -__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();
        const total = yield user_info_model_1.UserInfoModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNum);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Users retrieved successfully",
            data: {
                users,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limitNum,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        });
    })),
    // Get user by ID with complete biodata
    getUserById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const user = yield user_info_model_1.UserInfoModel.findById(id).select('-password -__v').lean();
        if (!user) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }
        // Get complete biodata
        const generalInfo = yield general_info_model_1.default.findOne({ user: user._id }).lean();
        const address = yield address_model_1.default.findOne({ user: user._id }).lean();
        const personalInfo = yield personal_info_model_1.default.findOne({ user: user._id }).lean();
        const educationQualification = yield educational_qualification_model_1.default.findOne({ user: user._id }).lean();
        const familyStatus = yield family_status_model_1.default.findOne({ user: user._id }).lean();
        const occupation = yield occupation_model_1.default.findOne({ user: user._id }).lean();
        const maritalInfo = yield marital_info_model_1.default.findOne({ user: user._id }).lean();
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User details retrieved successfully",
            data: {
                user,
                biodata: {
                    generalInfo,
                    address,
                    personalInfo,
                    educationQualification,
                    familyStatus,
                    occupation,
                    maritalInfo
                }
            }
        });
    })),
    // Update user status
    updateUserStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { status, reason } = req.body;
        const validStatuses = ['active', 'inactive', 'banned', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: "Invalid status value"
            });
        }
        const user = yield user_info_model_1.UserInfoModel.findByIdAndUpdate(id, Object.assign(Object.assign({ user_status: status }, (reason && { status_reason: reason })), { updatedAt: new Date() }), { new: true, select: '-password -__v' });
        if (!user) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: `User status updated to ${status} successfully`,
            data: user
        });
    })),
    // Delete user (soft delete)
    deleteUser: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const user = yield user_info_model_1.UserInfoModel.findByIdAndUpdate(id, {
            user_status: 'deleted',
            deletedAt: new Date()
        }, { new: true, select: '-password -__v' });
        if (!user) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "User deleted successfully"
        });
    })),
    // Get biodatas with filters — aggregation pipeline joining GeneralInfo + UserInfo + Address
    getAllBiodatas: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { page = 1, limit = 20, search = '', bio_type = '', status = '' } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
        // Pre-filter: find matching user IDs if search targets user_id number
        let matchingUserIds = null;
        const searchStr = search.trim();
        if (searchStr) {
            const numericId = parseInt(searchStr);
            if (!isNaN(numericId)) {
                const matchedUser = yield user_info_model_1.UserInfoModel.findOne({ user_id: numericId }).select('_id').lean();
                if (matchedUser)
                    matchingUserIds = [matchedUser._id];
                else
                    matchingUserIds = [];
            }
            else {
                const matchedUsers = yield user_info_model_1.UserInfoModel.find({
                    $or: [
                        { user_name: { $regex: searchStr, $options: 'i' } },
                        { email: { $regex: searchStr, $options: 'i' } },
                    ],
                }).select('_id').lean();
                matchingUserIds = matchedUsers.map((u) => u._id);
            }
        }
        const matchConditions = {};
        if (matchingUserIds !== null)
            matchConditions.user = { $in: matchingUserIds };
        if (bio_type && bio_type !== 'all')
            matchConditions.bio_type = bio_type;
        const countPipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
            { $match: { userDoc: { $ne: null } } },
            ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
            ...(status && status !== 'all' ? [{ $match: { 'userDoc.user_status': status } }] : []),
            { $count: 'totalCount' },
        ];
        const countResult = yield general_info_model_1.default.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
        const dataPipeline = [
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
            { $match: { userDoc: { $ne: null } } },
            { $lookup: { from: 'addresses', localField: 'user', foreignField: 'user', as: 'addressDoc' } },
            { $addFields: { addressDoc: { $first: '$addressDoc' } } },
            ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
            ...(status && status !== 'all' ? [{ $match: { 'userDoc.user_status': status } }] : []),
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: limitNum * (pageNum - 1) },
            { $limit: limitNum },
            {
                $project: {
                    _id: '$userDoc._id',
                    user: '$userDoc._id',
                    generalInfo_id: '$_id',
                    user_id: '$userDoc.user_id',
                    user_status: '$userDoc.user_status',
                    bio_type: 1, date_of_birth: 1, height: 1, gender: 1, weight: 1,
                    blood_group: 1, screen_color: 1, nationality: 1, marital_status: 1,
                    religion: 1, religious_type: 1, request_practicing_status: 1, photos: 1,
                    views_count: 1, likes_count: 1, dislikes_count: 1, purchases_count: 1,
                    isFeatured: 1, isMarriageDone: 1,
                    zilla: '$addressDoc.zilla', upzilla: '$addressDoc.upzilla',
                    biodata_status: 1, version: 1, approved_data: 1, pending_changes: 1,
                    admin_note: 1, last_approved_at: 1, last_approved_by: 1,
                    createdAt: 1, updatedAt: 1,
                },
            },
        ];
        const biodatas = yield general_info_model_1.default.aggregate(dataPipeline);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Biodatas retrieved successfully',
            data: {
                biodatas,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalItems: totalCount,
                    itemsPerPage: limitNum,
                    hasNext: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrev: pageNum > 1,
                },
            },
        });
    })),
    // Update biodata status
    // TODO: same join + user_status filter as getAllBiodatas, so the badge matches the Pending list.
    getPendingBiodataCount: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const [result] = yield general_info_model_1.default.aggregate([
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
            { $match: { 'userDoc.user_status': 'pending' } },
            { $count: 'count' },
        ]);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: "Pending biodata count retrieved successfully",
            data: { count: (result === null || result === void 0 ? void 0 : result.count) || 0 }
        });
    })),
    updateBiodataStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { status, reason } = req.body;
        const validStatuses = ['active', 'inactive', 'banned', 'pending', 'blocked'];
        if (!validStatuses.includes(status)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        // id may be the user's _id (admin endpoint) OR the GeneralInfo _id (fallback endpoint).
        // Try to resolve to the user's _id via GeneralInfo first.
        let userId = id;
        const generalInfoDoc = yield general_info_model_1.default.findById(id).select('user').lean();
        if (generalInfoDoc) {
            userId = generalInfoDoc.user;
        }
        const user = yield user_info_model_1.UserInfoModel.findByIdAndUpdate(userId, Object.assign(Object.assign({ user_status: status }, (reason && { status_reason: reason })), { updatedAt: new Date() }), { new: true, select: '-password -__v' });
        if (!user) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }
        const statusLabels = {
            active: 'সক্রিয়',
            inactive: 'নিষ্ক্রিয়',
            banned: 'নিষিদ্ধ',
            pending: 'পর্যালোচনাধীন',
            blocked: 'ব্লক',
        };
        notification_service_1.NotificationService.notify({
            recipient: user._id,
            audience: 'user',
            type: 'moderation',
            title: 'বায়োডাটার স্ট্যাটাস পরিবর্তন',
            message: `আপনার বায়োডাটা এখন ${statusLabels[status]}।${reason ? ` কারণ: ${reason}` : ''}`,
            link: '/user/account/dashboard',
        });
        (0, bibahoMail_1.mailUser)(user.email, 'আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে', {
            title: 'আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন হয়েছে',
            tone: status === 'active' ? 'success' : 'warning',
            paragraphs: [`Bibaho অ্যাডমিন আপনার বায়োডাটার স্ট্যাটাস পরিবর্তন করেছেন। আপনার বায়োডাটা এখন <strong>${statusLabels[status]}</strong>।`],
            details: [{ label: 'কারণ', value: reason }],
            action: { label: 'ড্যাশবোর্ড দেখুন', path: '/user/account/dashboard' },
        });
        res.status(http_status_1.default.OK).json({
            success: true,
            message: `Biodata status updated to ${status} successfully`,
            data: user
        });
    })),
    // Payment Management
    getAllPayments: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { page = 1, limit = 10, search = '', status = '', start_date = '', end_date = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        try {
            // This would need to be implemented in your payment service
            const payments = yield payments_service_1.PaymentService.getAllPayments();
            // Apply filters (this is a simplified version - you'd want to implement this in the service)
            let filteredPayments = payments;
            if (search) {
                filteredPayments = payments.filter((payment) => {
                    var _a, _b;
                    return ((_a = payment.user_name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) ||
                        ((_b = payment.transaction_id) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(search.toLowerCase()));
                });
            }
            if (status && status !== 'all') {
                filteredPayments = filteredPayments.filter((payment) => payment.status === status);
            }
            // Pagination
            const total = filteredPayments.length;
            const skip = (pageNum - 1) * limitNum;
            const paginatedPayments = filteredPayments.slice(skip, skip + limitNum);
            const totalPages = Math.ceil(total / limitNum);
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payments retrieved successfully",
                data: {
                    payments: paginatedPayments,
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limitNum,
                        hasNext: pageNum < totalPages,
                        hasPrev: pageNum > 1
                    }
                }
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving payments"
            });
        }
    })),
    getPaymentById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const payment = yield payments_service_1.PaymentService.getPaymentById(id);
            if (!payment) {
                return res.status(http_status_1.default.NOT_FOUND).json({
                    success: false,
                    message: "Payment not found"
                });
            }
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment retrieved successfully",
                data: payment
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving payment"
            });
        }
    })),
    updatePaymentStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        const validStatuses = ['Pending', 'Completed', 'Refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
            });
        }
        try {
            // You would need to implement this method in your payment service
            const updatedPayment = yield payments_service_1.PaymentService.updatePaymentById(id, {
                status
            });
            if (!updatedPayment) {
                return res.status(http_status_1.default.NOT_FOUND).json({
                    success: false,
                    message: "Payment not found"
                });
            }
            res.status(http_status_1.default.OK).json({
                success: true,
                message: `Payment status updated to ${status} successfully`,
                data: updatedPayment
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error updating payment status"
            });
        }
    })),
    refundPayment: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const payment = yield payments_service_1.PaymentService.getPaymentById(req.params.id).catch(() => null);
        if (!payment) {
            return res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Payment not found"
            });
        }
        try {
            const result = yield (0, bkash_refund_1.processRefund)({
                paymentID: payment.payment_id,
                trxID: payment.transaction_id,
                reason: (_a = req.body) === null || _a === void 0 ? void 0 : _a.reason,
            });
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment refunded successfully",
                data: result
            });
        }
        catch (error) {
            if (!(error instanceof bkash_refund_1.RefundError))
                throw error;
            res.status(error.statusCode).json({ success: false, message: error.message });
        }
    })),
    getPaymentStats: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const payments = yield payments_service_1.PaymentService.getAllPayments();
            const totalPayments = payments.length;
            const completedPayments = payments.filter((p) => p.status === 'Completed').length;
            const pendingPayments = payments.filter((p) => p.status === 'Pending').length;
            const refundedPayments = payments.filter((p) => p.status === 'Refunded').length;
            const totalRevenue = payments
                .filter((p) => p.status === 'Completed')
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Payment statistics retrieved successfully",
                data: {
                    totalPayments,
                    completedPayments,
                    pendingPayments,
                    refundedPayments,
                    totalRevenue
                }
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving payment statistics"
            });
        }
    })),
    // Refund Management
    getAllRefunds: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { page = 1, limit = 10, search = '', status = '', start_date = '', end_date = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        try {
            // Build filter for refunds
            const filter = {};
            if (status && status !== 'all') {
                filter.status = status;
            }
            if (start_date || end_date) {
                filter.createdAt = {};
                if (start_date)
                    filter.createdAt.$gte = new Date(start_date);
                if (end_date)
                    filter.createdAt.$lte = new Date(end_date);
            }
            // Mock refunds data - replace with actual refund model query
            const mockRefunds = [
                {
                    id: '1',
                    payment_id: 'PAY001',
                    user_id: 'USER001',
                    user_name: 'John Doe',
                    original_amount: 500,
                    refund_amount: 450,
                    currency: 'BDT',
                    reason: 'Service not satisfactory',
                    status: 'pending',
                    requested_at: new Date('2024-01-15'),
                    processed_at: null,
                    admin_notes: null
                },
                {
                    id: '2',
                    payment_id: 'PAY002',
                    user_id: 'USER002',
                    user_name: 'Jane Smith',
                    original_amount: 1000,
                    refund_amount: 1000,
                    currency: 'BDT',
                    reason: 'Duplicate payment',
                    status: 'approved',
                    requested_at: new Date('2024-01-10'),
                    processed_at: new Date('2024-01-12'),
                    admin_notes: 'Verified duplicate payment'
                }
            ];
            // Apply search filter
            let filteredRefunds = mockRefunds;
            if (search) {
                filteredRefunds = mockRefunds.filter((refund) => refund.user_name.toLowerCase().includes(search.toLowerCase()) ||
                    refund.payment_id.toLowerCase().includes(search.toLowerCase()));
            }
            // Apply status filter
            if (status && status !== 'all') {
                filteredRefunds = filteredRefunds.filter((refund) => refund.status === status);
            }
            const total = filteredRefunds.length;
            const paginatedRefunds = filteredRefunds.slice(skip, skip + limitNum);
            const totalPages = Math.ceil(total / limitNum);
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Refunds retrieved successfully",
                data: {
                    refunds: paginatedRefunds,
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limitNum,
                        hasNext: pageNum < totalPages,
                        hasPrev: pageNum > 1
                    }
                }
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving refunds"
            });
        }
    })),
    getRefundById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            // Mock refund data - replace with actual refund model query
            const mockRefund = {
                id: id,
                payment_id: 'PAY001',
                user_id: 'USER001',
                user_name: 'John Doe',
                original_amount: 500,
                refund_amount: 450,
                currency: 'BDT',
                reason: 'Service not satisfactory',
                status: 'pending',
                requested_at: new Date('2024-01-15'),
                processed_at: null,
                admin_notes: null,
                payment_details: {
                    method: 'bKash',
                    transaction_id: 'TXN123456',
                    phone: '+8801712345678'
                }
            };
            if (!mockRefund) {
                return res.status(http_status_1.default.NOT_FOUND).json({
                    success: false,
                    message: "Refund not found"
                });
            }
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Refund retrieved successfully",
                data: mockRefund
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving refund"
            });
        }
    })),
    updateRefundStatus: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { status, admin_notes, refund_amount } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected', 'processed'];
        if (!validStatuses.includes(status)) {
            return res.status(http_status_1.default.BAD_REQUEST).json({
                success: false,
                message: "Invalid status value"
            });
        }
        try {
            // Mock update - replace with actual refund model update
            const updatedRefund = {
                id: id,
                payment_id: 'PAY001',
                user_id: 'USER001',
                user_name: 'John Doe',
                original_amount: 500,
                refund_amount: refund_amount || 450,
                currency: 'BDT',
                reason: 'Service not satisfactory',
                status: status,
                requested_at: new Date('2024-01-15'),
                processed_at: status === 'processed' ? new Date() : null,
                admin_notes: admin_notes || null
            };
            res.status(http_status_1.default.OK).json({
                success: true,
                message: `Refund status updated to ${status} successfully`,
                data: updatedRefund
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error updating refund status"
            });
        }
    })),
    getRefundStats: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Mock refund statistics - replace with actual refund model queries
            const totalRefunds = 25;
            const pendingRefunds = 8;
            const approvedRefunds = 12;
            const rejectedRefunds = 3;
            const processedRefunds = 2;
            const totalRefundAmount = 15750;
            res.status(http_status_1.default.OK).json({
                success: true,
                message: "Refund statistics retrieved successfully",
                data: {
                    totalRefunds,
                    pendingRefunds,
                    approvedRefunds,
                    rejectedRefunds,
                    processedRefunds,
                    totalRefundAmount
                }
            });
        }
        catch (error) {
            res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error retrieving refund statistics"
            });
        }
    }))
};
