import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CouponService } from "./coupon.service";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.createCoupon(req.user, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

const getAllCouponsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getAllCouponsAdmin(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin coupons retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getVendorCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getVendorCoupons(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor coupons retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPublicCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getPublicCoupons(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Available coupons retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getCouponById(req.params.id as string, req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon retrieved successfully",
    data: result,
  });
});

const getCouponByCode = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getCouponByCode(req.params.code as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon details retrieved successfully",
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.updateCoupon(req.params.id as string, req.user, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon updated successfully",
    data: result,
  });
});

const toggleCouponStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.toggleCouponStatus(req.params.id as string, req.user, req.body.isActive);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon status toggled successfully",
    data: result,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.deleteCoupon(req.params.id as string, req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon deleted successfully",
    data: result,
  });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await CouponService.validateAndApplyCoupon(req.body, userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  getAllCouponsAdmin,
  getVendorCoupons,
  getPublicCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon,
};
