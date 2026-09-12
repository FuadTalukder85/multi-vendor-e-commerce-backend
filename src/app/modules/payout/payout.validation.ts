import { z } from "zod";
import { PayoutStatus } from "../../../generated/prisma/enums";

const requestPayoutSchema = z.object({
  subOrderIds: z
    .array(z.string().min(1, "Sub-order ID cannot be empty"))
    .min(1, "At least one sub-order ID must be provided if specifying subOrderIds")
    .optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

const createPayoutAdminSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
  subOrderIds: z
    .array(z.string().min(1, "Sub-order ID cannot be empty"))
    .min(1, "At least one sub-order ID must be provided"),
  status: z
    .nativeEnum(PayoutStatus, {
      message: `Status must be one of: ${Object.values(PayoutStatus).join(", ")}`,
    })
    .optional(),
  stripeTransferId: z.string().trim().optional().nullable(),
});

const updatePayoutStatusSchema = z.object({
  status: z.nativeEnum(PayoutStatus, {
    message: `Status must be one of: ${Object.values(PayoutStatus).join(", ")}`,
  }),
  stripeTransferId: z.string().trim().optional().nullable(),
});

export const PayoutValidation = {
  requestPayoutSchema,
  createPayoutAdminSchema,
  updatePayoutStatusSchema,
};
