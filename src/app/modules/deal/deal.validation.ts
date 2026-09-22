import { z } from "zod";
import { DealRequestStatus } from "../../../generated/prisma/enums";

const createDealSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    variantId: z.string().optional().nullable(),
    vendorId: z.string().optional(),
    title: z.string().max(120, "Title cannot exceed 120 characters").optional().nullable(),
    dealPrice: z.number().positive("Deal price must be greater than 0"),
    quantityLimit: z.number().int().positive().optional().nullable(),
    maxPerCustomer: z.number().int().positive().optional().nullable(),
    startAt: z.string().min(1, "Start time is required"),
    endAt: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End time must be after start time",
    path: ["endAt"],
  });

const createDealRequestSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required"),
    variantId: z.string().optional().nullable(),
    proposedDealPrice: z.number().positive("Proposed deal price must be greater than 0"),
    requestedStartAt: z.string().min(1, "Requested start time is required"),
    requestedEndAt: z.string().min(1, "Requested end time is required"),
    quantityLimit: z.number().int().positive().optional().nullable(),
    maxPerCustomer: z.number().int().positive().optional().nullable(),
    note: z.string().max(500).optional().nullable(),
  })
  .refine((data) => new Date(data.requestedEndAt) > new Date(data.requestedStartAt), {
    message: "Requested end time must be after start time",
    path: ["requestedEndAt"],
  });

const reviewDealRequestSchema = z.object({
  status: z.enum([DealRequestStatus.APPROVED, DealRequestStatus.REJECTED]),
  reviewNote: z.string().max(500).optional().nullable(),
  approvedDealPrice: z.number().positive().optional(),
  approvedStartAt: z.string().optional(),
  approvedEndAt: z.string().optional(),
  approvedQuantityLimit: z.number().int().positive().optional().nullable(),
});

export const DealValidation = {
  createDealSchema,
  createDealRequestSchema,
  reviewDealRequestSchema,
};
