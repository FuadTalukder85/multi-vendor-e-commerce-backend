import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { FraudAuditLogController } from "./fraudAuditLog.controller";
import { FraudAuditLogValidation } from "./fraudAuditLog.validation";

const router = Router();

// Customer / Vendor / Admin: View audit trail for a specific target user
router.get(
  "/user/:targetUserId",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  FraudAuditLogController.getFraudAuditLogsByTargetUserId,
);

// Admin: Create audit log entry
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(FraudAuditLogValidation.createFraudAuditLogSchema),
  FraudAuditLogController.createFraudAuditLog,
);

// Admin: Get all fraud audit logs with filters & search
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudAuditLogController.getAllFraudAuditLogs,
);

// Admin: Get single audit log entry by ID
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudAuditLogController.getFraudAuditLogById,
);

// Admin: Update audit log entry
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(FraudAuditLogValidation.updateFraudAuditLogSchema),
  FraudAuditLogController.updateFraudAuditLog,
);

// Admin: Delete audit log entry
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudAuditLogController.deleteFraudAuditLog,
);

export const FraudAuditLogRoutes = router;
