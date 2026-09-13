import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { FraudAuditLogService } from "./fraudAuditLog.service";

const createFraudAuditLog = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudAuditLogService.createFraudAuditLog(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Fraud audit log entry created successfully",
    data: result,
  });
});

const getFraudAuditLogsByTargetUserId = catchAsync(
  async (req: Request, res: Response) => {
    const targetUserId = req.params.targetUserId as string;
    const result = await FraudAuditLogService.getFraudAuditLogsByTargetUserId(
      targetUserId,
      req.query,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "User fraud audit logs retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllFraudAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudAuditLogService.getAllFraudAuditLogs(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud audit logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getFraudAuditLogById = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudAuditLogService.getFraudAuditLogById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud audit log retrieved successfully",
    data: result,
  });
});

const updateFraudAuditLog = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudAuditLogService.updateFraudAuditLog(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud audit log updated successfully",
    data: result,
  });
});

const deleteFraudAuditLog = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudAuditLogService.deleteFraudAuditLog(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud audit log deleted successfully",
    data: result,
  });
});

export const FraudAuditLogController = {
  createFraudAuditLog,
  getFraudAuditLogsByTargetUserId,
  getAllFraudAuditLogs,
  getFraudAuditLogById,
  updateFraudAuditLog,
  deleteFraudAuditLog,
};
