import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { ReviewFraudLogController } from "./reviewFraudLog.controller";
import { ReviewFraudLogValidation } from "./reviewFraudLog.validation";

const router = Router();

// Trigger review analysis for a specific review
router.post(
  "/analyze/:reviewId",
  checkAuth(Role.CUSTOMER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.analyzeReviewFraud,
);

// Admin/Vendor: Query flagged review fraud logs
router.get(
  "/flagged",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.getFlaggedReviews,
);

// Admin: Trigger batch review analysis
router.post(
  "/batch-analyze",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ReviewFraudLogValidation.batchAnalyzeSchema),
  ReviewFraudLogController.batchAnalyzeReviewFraud,
);

// Get review fraud log by reviewId
router.get(
  "/review/:reviewId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.getReviewFraudLogByReviewId,
);

// Get review fraud logs for a product
router.get(
  "/product/:productId",
  checkAuth(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.getReviewFraudLogsByProductId,
);

// Admin: List all review fraud logs
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.getAllReviewFraudLogs,
);

// Admin: Create manual log entry
router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ReviewFraudLogValidation.createReviewFraudLogSchema),
  ReviewFraudLogController.createReviewFraudLog,
);

// Admin: Get single log entry by ID
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.getReviewFraudLogById,
);

// Admin: Update log entry manually
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ReviewFraudLogValidation.updateReviewFraudLogSchema),
  ReviewFraudLogController.updateReviewFraudLog,
);

// Admin: Delete log entry
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ReviewFraudLogController.deleteReviewFraudLog,
);

export const ReviewFraudLogRoutes = router;
