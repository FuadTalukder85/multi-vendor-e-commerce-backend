import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DealService } from "./deal.service";

// Public: Get active flash deals
const getPublicActiveDeals = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.getPublicActiveDeals(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Active deals retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Public: Get deal by ID
const getDealById = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.getDealById(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Deal retrieved successfully",
    data: result,
  });
});

// Vendor: Submit a deal request
const createDealRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.createDealRequest(req.user, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Deal request submitted successfully. It will be reviewed by admin.",
    data: result,
  });
});

// Vendor: Get own deal requests
const getVendorDealRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.getVendorDealRequests(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor deal requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Admin: Get all deal requests
const getAllDealRequestsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.getAllDealRequestsAdmin(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Admin deal requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Admin: Review deal request (Approve / Reject)
const reviewDealRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.reviewDealRequest(req.params.id as string, req.user, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Deal request ${result.status.toLowerCase()} successfully`,
    data: result,
  });
});

// Admin: Create direct platform deal
const createDirectDeal = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.createDirectDeal(req.user, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Platform deal created successfully",
    data: result,
  });
});

// Admin/Vendor: Cancel deal
const cancelDeal = catchAsync(async (req: Request, res: Response) => {
  const result = await DealService.cancelDeal(req.params.id as string, req.user);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Deal cancelled successfully",
    data: result,
  });
});

export const DealController = {
  getPublicActiveDeals,
  getDealById,
  createDealRequest,
  getVendorDealRequests,
  getAllDealRequestsAdmin,
  reviewDealRequest,
  createDirectDeal,
  cancelDeal,
};
