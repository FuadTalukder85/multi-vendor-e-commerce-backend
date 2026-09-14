import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth, optionalAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { DeviceFingerprintController } from "./deviceFingerprint.controller";
import { DeviceFingerprintValidation } from "./deviceFingerprint.validation";

const router = Router();

// Client device tracking endpoint (supports optional authentication)
router.post(
  "/track",
  optionalAuth,
  validateRequest(DeviceFingerprintValidation.trackDeviceFingerprintSchema),
  DeviceFingerprintController.trackDevice,
);

// Admin: Suspicious device fingerprints
router.get(
  "/suspicious",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.getSuspiciousDeviceFingerprints,
);

// Admin: Batch flag devices
router.patch(
  "/batch-flag",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DeviceFingerprintValidation.batchFlagSchema),
  DeviceFingerprintController.batchFlagDevices,
);

// Admin: Lookup by deviceId
router.get(
  "/device-id/:deviceId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.getDeviceFingerprintByDeviceId,
);

// Admin: List all device fingerprints
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.getAllDeviceFingerprints,
);

// Admin: Create device fingerprint entry
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DeviceFingerprintValidation.createDeviceFingerprintSchema),
  DeviceFingerprintController.createDeviceFingerprint,
);

// Admin: Get single device fingerprint
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.getDeviceFingerprintById,
);

// Admin: Update device fingerprint
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DeviceFingerprintValidation.updateDeviceFingerprintSchema),
  DeviceFingerprintController.updateDeviceFingerprint,
);

// Admin: Toggle or set flag status
router.patch(
  "/:id/flag",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.toggleFlagDeviceFingerprint,
);

// Admin: Delete device fingerprint
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DeviceFingerprintController.deleteDeviceFingerprint,
);

export const DeviceFingerprintRoutes = router;
