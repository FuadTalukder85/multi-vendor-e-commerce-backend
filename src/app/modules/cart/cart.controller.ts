import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ICartIdentification } from "./cart.interface";
import { CartService } from "./cart.service";

const getCartIdentification = (req: Request): ICartIdentification => {
  const userId = req.user?.userId;
  const sessionId =
    (req.headers["x-session-id"] as string) ||
    req.cookies?.cart_session_id ||
    (req.query?.sessionId as string) ||
    req.body?.sessionId;

  return {
    userId,
    sessionId: userId ? undefined : sessionId,
  };
};

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const identification = getCartIdentification(req);
  const result = await CartService.addToCart(identification, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Product added to cart successfully",
    data: result,
  });
});

const getGroupedCart = catchAsync(async (req: Request, res: Response) => {
  const identification = getCartIdentification(req);
  const result = await CartService.getGroupedCart(identification);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Cart retrieved successfully",
    data: result,
  });
});

const updateCartItem = catchAsync(async (req: Request, res: Response) => {
  const identification = getCartIdentification(req);
  const result = await CartService.updateCartItem(
    identification,
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Cart item updated successfully",
    data: result,
  });
});

const removeCartItem = catchAsync(async (req: Request, res: Response) => {
  const identification = getCartIdentification(req);
  const result = await CartService.removeCartItem(
    identification,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Cart item removed successfully",
    data: result,
  });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
  const identification = getCartIdentification(req);
  const result = await CartService.clearCart(identification);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Cart cleared successfully",
    data: result,
  });
});

const mergeGuestCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const sessionId =
    req.body.sessionId ||
    (req.headers["x-session-id"] as string) ||
    req.cookies?.cart_session_id;

  const result = await CartService.mergeGuestCartOnLogin(userId, sessionId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Guest cart merged successfully",
    data: result,
  });
});

export const CartController = {
  addToCart,
  getGroupedCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCart,
};
