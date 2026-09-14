import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { FraudProfileController } from "./fraudProfile.controller";
import { FraudProfileValidation } from "./fraudProfile.validation";

const router = Router();

// Customer: View my fraud risk profile
router.get(
  "/my-profile",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.getMyFraudProfile,
);

// Customer: Trigger manual recalculation for own profile
router.post(
  "/recalculate/me",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.recalculateMyFraudProfile,
);

// Admin: Query high risk profiles
router.get(
  "/high-risk",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.getHighRiskProfiles,
);

// Admin: Trigger batch recalculation
router.post(
  "/batch-recalculate",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(FraudProfileValidation.batchRecalculateSchema),
  FraudProfileController.batchRecalculateFraudProfiles,
);

// Admin: Trigger recalculation for a specific user
router.post(
  "/recalculate/:userId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.recalculateUserFraudProfile,
);

// Get profile by user ID
router.get(
  "/user/:userId",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.getFraudProfileByUserId,
);

// Admin: Get all fraud profiles
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.getAllFraudProfiles,
);

// Admin: Create fraud profile manually
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(FraudProfileValidation.createFraudProfileSchema),
  FraudProfileController.createFraudProfile,
);

// Admin: Get single fraud profile
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.getFraudProfileById,
);

// Admin: Update fraud profile manually
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(FraudProfileValidation.updateFraudProfileSchema),
  FraudProfileController.updateFraudProfile,
);

// Admin: Delete fraud profile
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  FraudProfileController.deleteFraudProfile,
);

export const FraudProfileRoutes = router;
