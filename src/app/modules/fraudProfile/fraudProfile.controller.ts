import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { FraudProfileService } from "./fraudProfile.service";

const getMyFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await FraudProfileService.getMyFraudProfile(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My fraud profile retrieved successfully",
    data: result,
  });
});

const recalculateMyFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await FraudProfileService.recalculateFraudProfile(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My fraud profile recalculated successfully",
    data: result,
  });
});

const recalculateUserFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.userId as string;
  const result = await FraudProfileService.recalculateFraudProfile(targetUserId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User fraud profile recalculated successfully",
    data: result,
  });
});

const getFraudProfileByUserId = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.userId as string;
  const result = await FraudProfileService.getFraudProfileByUserId(
    targetUserId,
    req.user?.userId,
    req.user?.role,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User fraud profile retrieved successfully",
    data: result,
  });
});

const getAllFraudProfiles = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.getAllFraudProfiles(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud profiles retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getFraudProfileById = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.getFraudProfileById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud profile retrieved successfully",
    data: result,
  });
});

const createFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.createFraudProfile(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Fraud profile created successfully",
    data: result,
  });
});

const updateFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.updateFraudProfile(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud profile updated successfully",
    data: result,
  });
});

const batchRecalculateFraudProfiles = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FraudProfileService.batchRecalculateFraudProfiles(req.body);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Batch fraud profiles recalculated successfully",
      data: result,
    });
  },
);

const deleteFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.deleteFraudProfile(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Fraud profile deleted successfully",
    data: result,
  });
});

const getHighRiskProfiles = catchAsync(async (req: Request, res: Response) => {
  const result = await FraudProfileService.getHighRiskProfiles(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "High risk fraud profiles retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const FraudProfileController = {
  getMyFraudProfile,
  recalculateMyFraudProfile,
  recalculateUserFraudProfile,
  getFraudProfileByUserId,
  getAllFraudProfiles,
  getFraudProfileById,
  createFraudProfile,
  updateFraudProfile,
  batchRecalculateFraudProfiles,
  deleteFraudProfile,
  getHighRiskProfiles,
};
