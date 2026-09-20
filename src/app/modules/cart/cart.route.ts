import { Router } from "express";
import { checkAuth, optionalAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { CartController } from "./cart.controller";
import { CartValidation } from "./cart.validation";

const router = Router();

// Retrieve grouped cart with real-time stock/price validation (guest or user)
router.get("/", optionalAuth, CartController.getGroupedCart);

// Add product/variant to cart (guest or user)
router.post(
  "/",
  optionalAuth,
  validateRequest(CartValidation.addToCartSchema),
  CartController.addToCart,
);

// Merge guest cart items into authenticated user cart upon login
router.post(
  "/merge",
  checkAuth(),
  validateRequest(CartValidation.mergeGuestCartSchema),
  CartController.mergeGuestCart,
);

// Update cart item quantity or toggle savedForLater (guest or user)
router.patch(
  "/items/:id",
  optionalAuth,
  validateRequest(CartValidation.updateCartItemSchema),
  CartController.updateCartItem,
);

// Remove specific item from cart (guest or user)
router.delete("/items/:id", optionalAuth, CartController.removeCartItem);

// Clear entire active cart (guest or user)
router.delete("/", optionalAuth, CartController.clearCart);

export const CartRoutes = router;
