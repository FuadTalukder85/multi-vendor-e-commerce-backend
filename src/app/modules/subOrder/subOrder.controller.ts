import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubOrderService } from "./subOrder.service";

const getVendorSubOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.getVendorSubOrders(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor sub-orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getVendorSubOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.getVendorSubOrderById(req.user, req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor sub-order retrieved successfully",
    data: result,
  });
});

const updateVendorSubOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.updateVendorSubOrderStatus(req.user, req.params.id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Sub-order status updated successfully",
    data: result,
  });
});

const getAllSubOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.getAllSubOrdersAdmin(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All sub-orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSubOrderByIdAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.getSubOrderByIdAdmin(req.params.id as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Sub-order details retrieved successfully",
    data: result,
  });
});

const updateSubOrderStatusAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SubOrderService.updateSubOrderStatusAdmin(req.params.id as string, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Sub-order status updated successfully",
    data: result,
  });
});

export const SubOrderController = {
  getVendorSubOrders,
  getVendorSubOrderById,
  updateVendorSubOrderStatus,
  getAllSubOrdersAdmin,
  getSubOrderByIdAdmin,
  updateSubOrderStatusAdmin,
};
