import { z } from "zod";
import { RiskLevel } from "../../../generated/prisma/enums";

const createFraudProfileSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  fraudTypes: z.array(z.string()).optional(),
});

const updateFraudProfileSchema = z.object({
  riskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  fraudTypes: z.array(z.string()).optional(),
});

const batchRecalculateSchema = z.object({
  userIds: z.array(z.string()).optional(),
});

export const FraudProfileValidation = {
  createFraudProfileSchema,
  updateFraudProfileSchema,
  batchRecalculateSchema,
};
