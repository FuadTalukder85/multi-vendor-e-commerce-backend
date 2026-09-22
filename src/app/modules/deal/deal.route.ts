import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth, optionalAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { DealController } from "./deal.controller";
import { DealValidation } from "./deal.validation";

const router = Router();

// 1. Vendor routes: Submit and view deal requests
router.post(
  "/requests",
  checkAuth(Role.VENDOR),
  validateRequest(DealValidation.createDealRequestSchema),
  DealController.createDealRequest
);

router.get(
  "/requests/vendor/me",
  checkAuth(Role.VENDOR),
  DealController.getVendorDealRequests
);

// 2. Admin routes: Review requests & direct deal creation
router.get(
  "/requests/admin",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DealController.getAllDealRequestsAdmin
);

router.patch(
  "/requests/:id/review",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DealValidation.reviewDealRequestSchema),
  DealController.reviewDealRequest
);

router.post(
  "/admin/direct",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DealValidation.createDealSchema),
  DealController.createDirectDeal
);

// 3. Actions & Status changes
router.patch(
  "/:id/cancel",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.VENDOR),
  DealController.cancelDeal
);

// 4. Public: Active Hot Deals & Specific Deal by ID (Must be at the end so /:id doesn't shadow /requests/...)
router.get("/", DealController.getPublicActiveDeals);
router.get("/:id", optionalAuth, DealController.getDealById);

export const DealRoutes = router;
