import { z } from "zod";
import { RiskLevel } from "../../../generated/prisma/enums";

const createSellerFraudProfileSchema = z.object({
  vendorId: z.string().min(1, "vendorId is required"),
  complaints: z.number().min(0).optional(),
  fakeProductReports: z.number().min(0).optional(),
  reviewAbuseCount: z.number().min(0).optional(),
  suspiciousOrders: z.number().min(0).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
});

const updateSellerFraudProfileSchema = z.object({
  complaints: z.number().min(0).optional(),
  fakeProductReports: z.number().min(0).optional(),
  reviewAbuseCount: z.number().min(0).optional(),
  suspiciousOrders: z.number().min(0).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
});

const batchRecalculateSchema = z.object({
  vendorIds: z.array(z.string()).optional(),
});

export const SellerFraudProfileValidation = {
  createSellerFraudProfileSchema,
  updateSellerFraudProfileSchema,
  batchRecalculateSchema,
};
