import { z } from "zod";

const createFraudAuditLogSchema = z.object({
  targetUserId: z.string().min(1, "targetUserId is required"),
  triggerType: z.string().min(1, "triggerType is required"),
  reasonSummary: z.string().min(1, "reasonSummary is required"),
  metricsSnapshot: z.record(z.string(), z.unknown()).optional(),
  scoreAtEvent: z.number().min(0).max(100),
  action: z.string().min(1, "action is required"),
});

const updateFraudAuditLogSchema = z.object({
  reasonSummary: z.string().optional(),
  action: z.string().optional(),
});

export const FraudAuditLogValidation = {
  createFraudAuditLogSchema,
  updateFraudAuditLogSchema,
};
