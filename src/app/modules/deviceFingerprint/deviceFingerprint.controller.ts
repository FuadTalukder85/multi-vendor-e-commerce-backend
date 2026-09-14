import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DeviceFingerprintService } from "./deviceFingerprint.service";

const trackDevice = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const headerIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "0.0.0.0";

  const result = await DeviceFingerprintService.trackDeviceFingerprint(
    userId,
    req.body,
    headerIp,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprint tracked successfully",
    data: result,
  });
});

const getAllDeviceFingerprints = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.getAllDeviceFingerprints(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprints retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getDeviceFingerprintById = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.getDeviceFingerprintById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprint retrieved successfully",
    data: result,
  });
});

const getDeviceFingerprintByDeviceId = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DeviceFingerprintService.getDeviceFingerprintByDeviceId(
      req.params.deviceId as string,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Device fingerprint retrieved successfully",
      data: result,
    });
  },
);

const createDeviceFingerprint = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.createDeviceFingerprint(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Device fingerprint created successfully",
    data: result,
  });
});

const updateDeviceFingerprint = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.updateDeviceFingerprint(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprint updated successfully",
    data: result,
  });
});

const toggleFlagDeviceFingerprint = catchAsync(async (req: Request, res: Response) => {
  const flagged = req.body?.flagged !== undefined ? req.body.flagged : undefined;
  const result = await DeviceFingerprintService.toggleFlagDeviceFingerprint(
    req.params.id as string,
    flagged,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprint flag status updated successfully",
    data: result,
  });
});

const batchFlagDevices = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.batchFlagDevices(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprints batch flagged successfully",
    data: result,
  });
});

const deleteDeviceFingerprint = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintService.deleteDeviceFingerprint(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device fingerprint deleted successfully",
    data: result,
  });
});

const getSuspiciousDeviceFingerprints = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DeviceFingerprintService.getSuspiciousDeviceFingerprints(
      req.query,
    );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Suspicious device fingerprints retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const DeviceFingerprintController = {
  trackDevice,
  getAllDeviceFingerprints,
  getDeviceFingerprintById,
  getDeviceFingerprintByDeviceId,
  createDeviceFingerprint,
  updateDeviceFingerprint,
  toggleFlagDeviceFingerprint,
  batchFlagDevices,
  deleteDeviceFingerprint,
  getSuspiciousDeviceFingerprints,
};
