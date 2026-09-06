import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { PermissionManager } from "../../utils/permissionManager";
import { CouponUsageLogController } from "./couponUsageLog.controller";
import { CouponUsageLogValidation } from "./couponUsageLog.validation";

const router = Router();

// Admin-only listing of all coupon usage logs
router.get(
  "/admin",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("coupon:read"),
  CouponUsageLogController.getAllUsageLogsAdmin,
);

// Vendor self-service logs for their store's coupons
router.get(
  "/vendor/me",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("coupon:read"),
  CouponUsageLogController.getVendorUsageLogs,
);

// Customer personal usage log history
router.get(
  "/my-logs",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  CouponUsageLogController.getMyUsageLogs,
);

// Single usage log detail
router.get(
  "/:id",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  CouponUsageLogController.getUsageLogById,
);

// Record coupon usage (Admin or internal flow)
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(CouponUsageLogValidation.recordCouponUsageSchema),
  CouponUsageLogController.recordCouponUsage,
);

export const CouponUsageLogRoutes = router;
