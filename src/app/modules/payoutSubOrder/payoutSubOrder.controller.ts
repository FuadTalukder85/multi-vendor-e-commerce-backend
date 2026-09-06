import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PayoutSubOrderService } from "./payoutSubOrder.service";

const getAllPayoutSubOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutSubOrderService.getAllPayoutSubOrdersAdmin(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "All payout sub-order relationships retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getVendorPayoutSubOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutSubOrderService.getVendorPayoutSubOrders(req.user, req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Vendor payout sub-orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPayoutSubOrdersByPayoutId = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutSubOrderService.getPayoutSubOrdersByPayoutId(req.user, req.params.payoutId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Sub-orders for payout retrieved successfully",
    data: result,
  });
});

const getPayoutSubOrdersBySubOrderId = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutSubOrderService.getPayoutSubOrdersBySubOrderId(req.user, req.params.subOrderId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payout links for sub-order retrieved successfully",
    data: result,
  });
});

const getPayoutSubOrderByIds = catchAsync(async (req: Request, res: Response) => {
  const { payoutId, subOrderId } = req.params;
  const result = await PayoutSubOrderService.getPayoutSubOrderByIds(req.user, payoutId as string, subOrderId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Payout sub-order relationship details retrieved successfully",
    data: result,
  });
});

const addSubOrderToPayout = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutSubOrderService.addSubOrderToPayout(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Sub-order linked to payout successfully and payout amount updated",
    data: result,
  });
});

const removeSubOrderFromPayout = catchAsync(async (req: Request, res: Response) => {
  const { payoutId, subOrderId } = req.params;
  const result = await PayoutSubOrderService.removeSubOrderFromPayout(payoutId as string, subOrderId as string);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Sub-order unlinked from payout successfully and balance restored",
    data: result,
  });
});

export const PayoutSubOrderController = {
  getAllPayoutSubOrdersAdmin,
  getVendorPayoutSubOrders,
  getPayoutSubOrdersByPayoutId,
  getPayoutSubOrdersBySubOrderId,
  getPayoutSubOrderByIds,
  addSubOrderToPayout,
  removeSubOrderFromPayout,
};
