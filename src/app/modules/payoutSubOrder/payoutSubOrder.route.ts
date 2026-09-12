import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { PermissionManager } from "../../utils/permissionManager";
import { PayoutSubOrderController } from "./payoutSubOrder.controller";
import { PayoutSubOrderValidation } from "./payoutSubOrder.validation";

const router = Router();

// ==========================================
// ADMIN LISTING
// ==========================================

// List all payout-suborder links across the platform
router.get(
  "/admin",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("payout:read"),
  PayoutSubOrderController.getAllPayoutSubOrdersAdmin,
);

// ==========================================
// VENDOR LISTING
// ==========================================

// List all payout-suborder relations for vendor's store
router.get(
  "/vendor/me",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("payout:read"),
  PayoutSubOrderController.getVendorPayoutSubOrders,
);

// ==========================================
// RELATIONAL LOOKUPS (Vendor scoped or Admin)
// ==========================================

// List sub-orders linked to a given payout
router.get(
  "/by-payout/:payoutId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PayoutSubOrderController.getPayoutSubOrdersByPayoutId,
);

// Get payout links for a given sub-order
router.get(
  "/by-suborder/:subOrderId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PayoutSubOrderController.getPayoutSubOrdersBySubOrderId,
);

// Single relation item
router.get(
  "/:payoutId/:subOrderId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PayoutSubOrderController.getPayoutSubOrderByIds,
);

// ==========================================
// ADMIN MUTATIONS (Link / Unlink)
// ==========================================

// Link a sub-order to an existing unpaid payout
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("payout:update"),
  validateRequest(PayoutSubOrderValidation.addSubOrderToPayoutSchema),
  PayoutSubOrderController.addSubOrderToPayout,
);

// Unlink a sub-order from an unpaid payout
router.delete(
  "/:payoutId/:subOrderId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("payout:update"),
  PayoutSubOrderController.removeSubOrderFromPayout,
);

export const PayoutSubOrderRoutes = router;
