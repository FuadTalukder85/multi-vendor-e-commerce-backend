import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DeviceFingerprintUserService } from "./deviceFingerprintUser.service";

const linkDeviceToUser = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintUserService.linkDeviceToUser(
    req.body,
    req.user?.userId,
    req.user?.role,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device linked to user successfully",
    data: result,
  });
});

const getMyDevices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await DeviceFingerprintUserService.getMyDevices(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "My linked devices retrieved successfully",
    data: result,
  });
});

const getDevicesByUserId = catchAsync(async (req: Request, res: Response) => {
  const targetUserId = req.params.userId as string;
  const result = await DeviceFingerprintUserService.getDevicesByUserId(targetUserId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "User devices retrieved successfully",
    data: result,
  });
});

const getUsersByDeviceFingerprintId = catchAsync(
  async (req: Request, res: Response) => {
    const deviceFingerprintId = req.params.deviceFingerprintId as string;
    const result =
      await DeviceFingerprintUserService.getUsersByDeviceFingerprintId(
        deviceFingerprintId,
      );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Device linked users retrieved successfully",
      data: result,
    });
  },
);

const getAllDeviceFingerprintUsers = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await DeviceFingerprintUserService.getAllDeviceFingerprintUsers(req.query);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Device user links retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getDeviceFingerprintUserById = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await DeviceFingerprintUserService.getDeviceFingerprintUserById(
        req.params.id as string,
        req.user?.userId,
        req.user?.role,
      );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Device-user link retrieved successfully",
      data: result,
    });
  },
);

const updateDeviceFingerprintUser = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await DeviceFingerprintUserService.updateDeviceFingerprintUser(
        req.params.id as string,
        req.body,
        req.user?.userId,
        req.user?.role,
      );

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Device-user link updated successfully",
      data: result,
    });
  },
);

const unlinkDeviceFromUser = catchAsync(async (req: Request, res: Response) => {
  const result = await DeviceFingerprintUserService.unlinkDeviceFromUser(
    req.params.id as string,
    req.user?.userId,
    req.user?.role,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Device unlinked successfully",
    data: result,
  });
});

export const DeviceFingerprintUserController = {
  linkDeviceToUser,
  getMyDevices,
  getDevicesByUserId,
  getUsersByDeviceFingerprintId,
  getAllDeviceFingerprintUsers,
  getDeviceFingerprintUserById,
  updateDeviceFingerprintUser,
  unlinkDeviceFromUser,
};
