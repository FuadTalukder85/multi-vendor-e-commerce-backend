import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { DeviceFingerprintUserController } from "./deviceFingerprintUser.controller";
import { DeviceFingerprintUserValidation } from "./deviceFingerprintUser.validation";

const router = Router();

// Customer: View my linked devices
router.get(
  "/my-devices",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.getMyDevices,
);

// Customer or Admin: Link device to user
router.post(
  "/link",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DeviceFingerprintUserValidation.linkDeviceUserSchema),
  DeviceFingerprintUserController.linkDeviceToUser,
);

// Admin: Get all devices for a specific user
router.get(
  "/user/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.getDevicesByUserId,
);

// Admin: Get all users for a specific device fingerprint
router.get(
  "/device/:deviceFingerprintId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.getUsersByDeviceFingerprintId,
);

// Admin: List all device fingerprint user links with filters & search
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.getAllDeviceFingerprintUsers,
);

// Get single link details
router.get(
  "/:id",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.getDeviceFingerprintUserById,
);

// Update link record signals (address, phone, paymentFingerprint)
router.patch(
  "/:id",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DeviceFingerprintUserValidation.updateDeviceUserSchema),
  DeviceFingerprintUserController.updateDeviceFingerprintUser,
);

// Unlink device / delete link
router.delete(
  "/:id",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintUserController.unlinkDeviceFromUser,
);

export const DeviceFingerprintUserRoutes = router;
