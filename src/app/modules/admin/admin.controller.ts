import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserInfoModel } from "../user_info/user_info.model";
import GeneralInfo from "../general_info/general_info.model";
import Address from "../address/address.model";
import EducationalQualification from "../educational_qualification/educational_qualification.model";
import PersonalInfo from "../personal_info/personal_info.model";
import FamilyStatus from "../family_status/family_status.model";
import Occupation from "../occupation/occupation.model";
import MaritalInfo from "../marital_info/marital_info.model";
import Contact from "../contact/contact.model";
import { PaymentService } from "../payments/payments.service";

export const AdminController = {
  // Dashboard Statistics
  getDashboardStats: catchAsync(async (req: Request, res: Response) => {
    const totalUsers = await UserInfoModel.countDocuments();
    const activeUsers = await UserInfoModel.countDocuments({ user_status: 'active' });
    const inactiveUsers = await UserInfoModel.countDocuments({ user_status: 'inactive' });
    const bannedUsers = await UserInfoModel.countDocuments({ user_status: 'banned' });
    const pendingUsers = await UserInfoModel.countDocuments({ user_status: 'pending' });

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRegistrations = await UserInfoModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get payment statistics
    const totalPayments = await PaymentService.getAllPayments();
    const completedPayments = totalPayments.filter((p: any) => p.status === 'completed');
    const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Mock additional statistics
    const totalBiodatas = totalUsers; // Assuming each user has one biodata
    const verifiedBiodatas = Math.floor(totalUsers * 0.7);
    
    res.status(httpStatus.OK).json({
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
          pending: totalBiodatas - verifiedBiodatas
        },
        payments: {
          total: totalPayments.length,
          completed: completedPayments.length,
          pending: totalPayments.filter((p: any) => p.status === 'pending').length,
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
  }),

  // Get all users with pagination and filters
  getAllUsers: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', status = '', user_type = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    
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
      filter.user_type = user_type;
    }

    const users = await UserInfoModel.find(filter)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await UserInfoModel.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(httpStatus.OK).json({
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
  }),

  // Get user by ID with complete biodata
  getUserById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const user = await UserInfoModel.findById(id).select('-password -__v').lean();
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    // Get complete biodata
    const generalInfo = await GeneralInfo.findOne({ user: user._id }).lean();
    const address = await Address.findOne({ user: user._id }).lean();
    const personalInfo = await PersonalInfo.findOne({ user: user._id }).lean();
    const educationQualification = await EducationalQualification.findOne({ user: user._id }).lean();
    const familyStatus = await FamilyStatus.findOne({ user: user._id }).lean();
    const occupation = await Occupation.findOne({ user: user._id }).lean();
    const maritalInfo = await MaritalInfo.findOne({ user: user._id }).lean();

    res.status(httpStatus.OK).json({
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
  }),

  // Update user status
  updateUserStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'inactive', 'banned', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const user = await UserInfoModel.findByIdAndUpdate(
      id,
      { 
        user_status: status,
        ...(reason && { status_reason: reason }),
        updatedAt: new Date()
      },
      { new: true, select: '-password -__v' }
    );

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: `User status updated to ${status} successfully`,
      data: user
    });
  }),

  // Delete user (soft delete)
  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await UserInfoModel.findByIdAndUpdate(
      id,
      { 
        user_status: 'deleted',
        deletedAt: new Date()
      },
      { new: true, select: '-password -__v' }
    );

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: "User deleted successfully"
    });
  }),

  // Get biodatas with filters
  getAllBiodatas: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter for users
    const userFilter: any = {};
    
    if (search) {
      userFilter.$or = [
        { user_name: { $regex: search, $options: 'i' } },
        { user_id: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      userFilter.user_status = status;
    }

    const users = await UserInfoModel.find(userFilter)
      .select('_id user_id user_name email user_status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get biodata info for each user
    const biodatas = await Promise.all(
      users.map(async (user) => {
        const generalInfo = await GeneralInfo.findOne({ user: user._id }).select('date_of_birth').lean();
        const personalInfo = await PersonalInfo.findOne({ user: user._id }).select('').lean();
        const educationInfo = await EducationalQualification.findOne({ user: user._id }).select('education_medium').lean();
        const occupation = await Occupation.findOne({ user: user._id }).select('').lean();
        const address = await Address.findOne({ user: user._id }).select('present_division present_zilla').lean();
        const contact = await Contact.findOne({ user: user._id }).select('full_name').lean();

        // Calculate age from date_of_birth
        const age = generalInfo?.date_of_birth 
          ? Math.floor((Date.now() - new Date(generalInfo.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;

        return {
          id: user._id,
          user_id: user.user_id,
          name: contact?.full_name || user.email.split('@')[0],
          email: user.email,
          age: age,
          occupation: 'Not specified', // occupation field needs to be identified
          location: address ? `${address.present_zilla || 'Unknown'}, ${address.present_division || 'Unknown'}` : 'Not specified',
          status: user.user_status,
          marital_status: generalInfo?.marital_status || 'Not specified',
          education: educationInfo?.education_medium || 'Not specified',
          created_at: (user as any).createdAt,
          updated_at: (user as any).updatedAt
        };
      })
    );

    const total = await UserInfoModel.countDocuments(userFilter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Biodatas retrieved successfully",
      data: {
        biodatas,
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
  }),

  // Update biodata status
  updateBiodataStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'inactive', 'pending', 'blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const user = await UserInfoModel.findByIdAndUpdate(
      id,
      { 
        user_status: status,
        ...(reason && { status_reason: reason }),
        updatedAt: new Date()
      },
      { new: true, select: '-password -__v' }
    );

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: "Biodata not found"
      });
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: `Biodata status updated to ${status} successfully`,
      data: user
    });
  }),

  // Payment Management
  getAllPayments: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', status = '', start_date = '', end_date = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    try {
      // This would need to be implemented in your payment service
      const payments = await PaymentService.getAllPayments();
      
      // Apply filters (this is a simplified version - you'd want to implement this in the service)
      let filteredPayments = payments;
      
      if (search) {
        filteredPayments = payments.filter((payment: any) => 
          payment.user_name?.toLowerCase().includes((search as string).toLowerCase()) ||
          payment.transaction_id?.toLowerCase().includes((search as string).toLowerCase())
        );
      }

      if (status && status !== 'all') {
        filteredPayments = filteredPayments.filter((payment: any) => payment.status === status);
      }

      // Pagination
      const total = filteredPayments.length;
      const skip = (pageNum - 1) * limitNum;
      const paginatedPayments = filteredPayments.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(total / limitNum);

      res.status(httpStatus.OK).json({
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
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving payments"
      });
    }
  }),

  getPaymentById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const payment = await PaymentService.getPaymentById(id);
      
      if (!payment) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Payment not found"
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: "Payment retrieved successfully",
        data: payment
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving payment"
      });
    }
  }),

  updatePaymentStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid status value"
      });
    }

    try {
      // You would need to implement this method in your payment service
      const updatedPayment = await PaymentService.updatePayment(id, { 
        status
      });

      if (!updatedPayment) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Payment not found"
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: `Payment status updated to ${status} successfully`,
        data: updatedPayment
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating payment status"
      });
    }
  }),

  getPaymentStats: catchAsync(async (req: Request, res: Response) => {
    try {
      const payments = await PaymentService.getAllPayments();
      
      const totalPayments = payments.length;
      const completedPayments = payments.filter((p: any) => p.status === 'completed').length;
      const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
      const failedPayments = payments.filter((p: any) => p.status === 'failed').length;
      const totalRevenue = payments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      res.status(httpStatus.OK).json({
        success: true,
        message: "Payment statistics retrieved successfully",
        data: {
          totalPayments,
          completedPayments,
          pendingPayments,
          failedPayments,
          totalRevenue
        }
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving payment statistics"
      });
    }
  }),

  // Refund Management
  getAllRefunds: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', status = '', start_date = '', end_date = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    try {
      // Build filter for refunds
      const filter: any = {};
      
      if (status && status !== 'all') {
        filter.status = status;
      }

      if (start_date || end_date) {
        filter.createdAt = {};
        if (start_date) filter.createdAt.$gte = new Date(start_date as string);
        if (end_date) filter.createdAt.$lte = new Date(end_date as string);
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
        filteredRefunds = mockRefunds.filter((refund: any) => 
          refund.user_name.toLowerCase().includes((search as string).toLowerCase()) ||
          refund.payment_id.toLowerCase().includes((search as string).toLowerCase())
        );
      }

      // Apply status filter
      if (status && status !== 'all') {
        filteredRefunds = filteredRefunds.filter((refund: any) => refund.status === status);
      }

      const total = filteredRefunds.length;
      const paginatedRefunds = filteredRefunds.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(total / limitNum);

      res.status(httpStatus.OK).json({
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
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving refunds"
      });
    }
  }),

  getRefundById: catchAsync(async (req: Request, res: Response) => {
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
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Refund not found"
        });
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: "Refund retrieved successfully",
        data: mockRefund
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving refund"
      });
    }
  }),

  updateRefundStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, admin_notes, refund_amount } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'processed'];
    if (!validStatuses.includes(status)) {
      return res.status(httpStatus.BAD_REQUEST).json({
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

      res.status(httpStatus.OK).json({
        success: true,
        message: `Refund status updated to ${status} successfully`,
        data: updatedRefund
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error updating refund status"
      });
    }
  }),

  getRefundStats: catchAsync(async (req: Request, res: Response) => {
    try {
      // Mock refund statistics - replace with actual refund model queries
      const totalRefunds = 25;
      const pendingRefunds = 8;
      const approvedRefunds = 12;
      const rejectedRefunds = 3;
      const processedRefunds = 2;
      const totalRefundAmount = 15750;

      res.status(httpStatus.OK).json({
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
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error retrieving refund statistics"
      });
    }
  })
};