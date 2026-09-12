import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { CouponUsageLogService } from "./couponUsageLog.service";

const getAllUsageLogsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponUsageLogService.getAllUsageLogsAdmin(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin coupon usage logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getVendorUsageLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponUsageLogService.getVendorUsageLogs(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor coupon usage logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyUsageLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponUsageLogService.getMyUsageLogs(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My coupon usage logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUsageLogById = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponUsageLogService.getUsageLogById(req.params.id as string, req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Coupon usage log retrieved successfully",
    data: result,
  });
});

const recordCouponUsage = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponUsageLogService.recordCouponUsage(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Coupon usage recorded successfully",
    data: result,
  });
});

export const CouponUsageLogController = {
  getAllUsageLogsAdmin,
  getVendorUsageLogs,
  getMyUsageLogs,
  getUsageLogById,
  recordCouponUsage,
};
