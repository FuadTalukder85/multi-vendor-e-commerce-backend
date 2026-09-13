import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { SellerFraudProfileController } from "./sellerFraudProfile.controller";
import { SellerFraudProfileValidation } from "./sellerFraudProfile.validation";

const router = Router();

// Vendor: View my seller fraud profile
router.get(
  "/my-profile",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.getMySellerFraudProfile,
);

// Vendor: Trigger manual recalculation for own profile
router.post(
  "/recalculate/me",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.recalculateMySellerFraudProfile,
);

// Admin: Query high risk sellers
router.get(
  "/high-risk",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.getHighRiskSellers,
);

// Admin: Trigger batch recalculation
router.post(
  "/batch-recalculate",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(SellerFraudProfileValidation.batchRecalculateSchema),
  SellerFraudProfileController.batchRecalculateSellerFraudProfiles,
);

// Admin: Trigger recalculation for a specific vendor
router.post(
  "/recalculate/:vendorId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.recalculateVendorFraudProfile,
);

// Get profile by vendor ID
router.get(
  "/vendor/:vendorId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.getSellerFraudProfileByVendorId,
);

// Admin: Get all seller fraud profiles
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.getAllSellerFraudProfiles,
);

// Admin: Create seller fraud profile manually
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(SellerFraudProfileValidation.createSellerFraudProfileSchema),
  SellerFraudProfileController.createSellerFraudProfile,
);

// Admin: Get single seller fraud profile
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.getSellerFraudProfileById,
);

// Admin: Update seller fraud profile manually
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(SellerFraudProfileValidation.updateSellerFraudProfileSchema),
  SellerFraudProfileController.updateSellerFraudProfile,
);

// Admin: Delete seller fraud profile
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SellerFraudProfileController.deleteSellerFraudProfile,
);

export const SellerFraudProfileRoutes = router;
