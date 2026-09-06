import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth, optionalAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { PermissionManager } from "../../utils/permissionManager";
import { CouponController } from "./coupon.controller";
import { CouponValidation } from "./coupon.validation";

const router = Router();

// Public / customer routes
router.get("/", CouponController.getPublicCoupons);
router.get("/code/:code", CouponController.getCouponByCode);
router.post(
  "/validate",
  optionalAuth,
  validateRequest(CouponValidation.validateCouponSchema),
  CouponController.validateCoupon,
);

// Admin-only listing of all coupons
router.get(
  "/admin",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("coupon:read"),
  CouponController.getAllCouponsAdmin,
);

// Vendor self-service coupons list
router.get(
  "/vendor/me",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:read"),
  CouponController.getVendorCoupons,
);

// Get coupon by ID
router.get("/:id", optionalAuth, CouponController.getCouponById);

// Create coupon (Admin or Vendor)
router.post(
  "/",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:create"),
  validateRequest(CouponValidation.createCouponSchema),
  CouponController.createCoupon,
);

// Update coupon (Admin or Vendor)
router.patch(
  "/:id",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:update"),
  validateRequest(CouponValidation.updateCouponSchema),
  CouponController.updateCoupon,
);

// Toggle active status
router.patch(
  "/:id/toggle-status",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:update"),
  validateRequest(CouponValidation.toggleCouponStatusSchema),
  CouponController.toggleCouponStatus,
);

// Delete coupon
router.delete(
  "/:id",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:delete"),
  CouponController.deleteCoupon,
);

export const CouponRoutes = router;
