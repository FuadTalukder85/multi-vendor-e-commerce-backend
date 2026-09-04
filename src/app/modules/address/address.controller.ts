import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AddressService } from "./address.service";

const createAddress = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.createAddress(req.user.userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Address created successfully",
    data: result,
  });
});

const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.getMyAddresses(req.user.userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Addresses retrieved successfully",
    data: result,
  });
});

const getAddressById = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.getAddressById(req.user.userId, req.params.id as string, req.user.role);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Address retrieved successfully",
    data: result,
  });
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.updateAddress(req.user.userId, req.params.id as string, req.body, req.user.role);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Address updated successfully",
    data: result,
  });
});

const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.setDefaultAddress(req.user.userId, req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Default address updated successfully",
    data: result,
  });
});

const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.deleteAddress(req.user.userId, req.params.id as string, req.user.role);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Address deleted successfully",
    data: result,
  });
});

const getAllAddresses = catchAsync(async (req: Request, res: Response) => {
  const result = await AddressService.getAllAddresses(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Addresses retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const AddressController = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getAllAddresses,
};
