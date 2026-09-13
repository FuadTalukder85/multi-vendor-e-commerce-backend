import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ReviewFraudLogService } from "./reviewFraudLog.service";

const analyzeReviewFraud = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  const deviceId = req.body?.deviceId;
  const ipAddress =
    req.body?.ipAddress ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip;

  const result = await ReviewFraudLogService.analyzeReviewFraud(
    reviewId,
    deviceId,
    ipAddress,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review fraud analysis completed successfully",
    data: result,
  });
});

const getReviewFraudLogByReviewId = catchAsync(
  async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId as string;
    const result = await ReviewFraudLogService.getReviewFraudLogByReviewId(
      reviewId,
      req.user?.userId,
      req.user?.role,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Review fraud log retrieved successfully",
      data: result,
    });
  },
);

const getReviewFraudLogsByProductId = catchAsync(
  async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const result = await ReviewFraudLogService.getReviewFraudLogsByProductId(
      productId,
      req.query,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Product review fraud logs retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllReviewFraudLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.getAllReviewFraudLogs(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review fraud logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getReviewFraudLogById = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.getReviewFraudLogById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review fraud log retrieved successfully",
    data: result,
  });
});

const createReviewFraudLog = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.createReviewFraudLog(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Review fraud log created successfully",
    data: result,
  });
});

const updateReviewFraudLog = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.updateReviewFraudLog(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review fraud log updated successfully",
    data: result,
  });
});

const batchAnalyzeReviewFraud = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.batchAnalyzeReviewFraud(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Batch review fraud analysis completed successfully",
    data: result,
  });
});

const deleteReviewFraudLog = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.deleteReviewFraudLog(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review fraud log deleted successfully",
    data: result,
  });
});

const getFlaggedReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewFraudLogService.getFlaggedReviews(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Flagged review fraud logs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const ReviewFraudLogController = {
  analyzeReviewFraud,
  getReviewFraudLogByReviewId,
  getReviewFraudLogsByProductId,
  getAllReviewFraudLogs,
  getReviewFraudLogById,
  createReviewFraudLog,
  updateReviewFraudLog,
  batchAnalyzeReviewFraud,
  deleteReviewFraudLog,
  getFlaggedReviews,
};
