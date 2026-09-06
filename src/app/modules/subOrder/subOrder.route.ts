import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { PermissionManager } from "../../utils/permissionManager";
import { SubOrderController } from "./subOrder.controller";
import { SubOrderValidation } from "./subOrder.validation";

const router = Router();

// ==========================================
// VENDOR ROUTES (Scoped via PermissionManager)
// ==========================================

// Get vendor's own sub-orders with sorting, filtering, searching, and pagination
router.get(
  "/vendor/me",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("order:read"),
  SubOrderController.getVendorSubOrders,
);

// Get single vendor sub-order by ID
router.get(
  "/vendor/:id",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("order:read"),
  SubOrderController.getVendorSubOrderById,
);

// Update vendor sub-order status (e.g. CONFIRMED, SHIPPED, DELIVERED, CANCELLED) & tracking
router.patch(
  "/vendor/:id/status",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requireVendorPermission("order:update"),
  validateRequest(SubOrderValidation.updateSubOrderStatusSchema),
  SubOrderController.updateVendorSubOrderStatus,
);

// ==========================================
// ADMIN ROUTES (PermissionManager guarded)
// ==========================================

// Get all platform sub-orders with sorting, filtering, searching, and pagination
router.get(
  "/admin/all",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("order:read"),
  SubOrderController.getAllSubOrdersAdmin,
);

// Get any sub-order by ID
router.get(
  "/admin/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("order:read"),
  SubOrderController.getSubOrderByIdAdmin,
);

// Update any sub-order status
router.patch(
  "/admin/:id/status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  PermissionManager.requirePermission("order:update"),
  validateRequest(SubOrderValidation.updateSubOrderStatusSchema),
  SubOrderController.updateSubOrderStatusAdmin,
);

export const SubOrderRoutes = router;
