import { z } from "zod";
import { ReviewFraudStatus } from "../../../generated/prisma/enums";

const createReviewFraudLogSchema = z.object({
  reviewId: z.string().min(1, "reviewId is required"),
  reviewerId: z.string().min(1, "reviewerId is required"),
  productId: z.string().min(1, "productId is required"),
  deviceId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  reviewerAccountAgeDays: z.number().min(0).optional().nullable(),
  hasVerifiedPurchase: z.boolean().optional(),
  sellerRelationshipFlag: z.boolean().optional(),
  suspicionScore: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(ReviewFraudStatus).optional(),
});

const updateReviewFraudLogSchema = z.object({
  hasVerifiedPurchase: z.boolean().optional(),
  sellerRelationshipFlag: z.boolean().optional(),
  suspicionScore: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(ReviewFraudStatus).optional(),
});

const batchAnalyzeSchema = z.object({
  reviewIds: z.array(z.string()).optional(),
  productId: z.string().optional(),
});

export const ReviewFraudLogValidation = {
  createReviewFraudLogSchema,
  updateReviewFraudLogSchema,
  batchAnalyzeSchema,
};
