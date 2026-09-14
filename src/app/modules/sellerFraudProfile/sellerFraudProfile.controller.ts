import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SellerFraudProfileService } from "./sellerFraudProfile.service";

const getMySellerFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await SellerFraudProfileService.getMySellerFraudProfile(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My seller fraud profile retrieved successfully",
    data: result,
  });
});

const recalculateMySellerFraudProfile = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const vendorProfile = await SellerFraudProfileService.getMySellerFraudProfile(userId);
    const result = await SellerFraudProfileService.recalculateSellerFraudProfile(
      vendorProfile.vendorId,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "My seller fraud profile recalculated successfully",
      data: result,
    });
  },
);

const recalculateVendorFraudProfile = catchAsync(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const result = await SellerFraudProfileService.recalculateSellerFraudProfile(vendorId);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Vendor seller fraud profile recalculated successfully",
      data: result,
    });
  },
);

const getSellerFraudProfileByVendorId = catchAsync(
  async (req: Request, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const result = await SellerFraudProfileService.getSellerFraudProfileByVendorId(
      vendorId,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Vendor seller fraud profile retrieved successfully",
      data: result,
    });
  },
);

const getAllSellerFraudProfiles = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.getAllSellerFraudProfiles(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Seller fraud profiles retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSellerFraudProfileById = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.getSellerFraudProfileById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Seller fraud profile retrieved successfully",
    data: result,
  });
});

const createSellerFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.createSellerFraudProfile(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Seller fraud profile created successfully",
    data: result,
  });
});

const updateSellerFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.updateSellerFraudProfile(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Seller fraud profile updated successfully",
    data: result,
  });
});

const batchRecalculateSellerFraudProfiles = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SellerFraudProfileService.batchRecalculateSellerFraudProfiles(
      req.body,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Batch seller fraud profiles recalculated successfully",
      data: result,
    });
  },
);

const deleteSellerFraudProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.deleteSellerFraudProfile(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Seller fraud profile deleted successfully",
    data: result,
  });
});

const getHighRiskSellers = catchAsync(async (req: Request, res: Response) => {
  const result = await SellerFraudProfileService.getHighRiskSellers(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "High risk seller fraud profiles retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const SellerFraudProfileController = {
  getMySellerFraudProfile,
  recalculateMySellerFraudProfile,
  recalculateVendorFraudProfile,
  getSellerFraudProfileByVendorId,
  getAllSellerFraudProfiles,
  getSellerFraudProfileById,
  createSellerFraudProfile,
  updateSellerFraudProfile,
  batchRecalculateSellerFraudProfiles,
  deleteSellerFraudProfile,
  getHighRiskSellers,
};
