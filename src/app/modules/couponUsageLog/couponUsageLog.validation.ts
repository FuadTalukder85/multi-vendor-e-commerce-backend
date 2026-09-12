import { z } from "zod";

const recordCouponUsageSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .transform((val) => val.toUpperCase()),
  userId: z.string().min(1, "User ID is required"),
  orderId: z.string().optional().nullable(),
  discountAmount: z.number().nonnegative("Discount amount cannot be negative").optional().nullable(),
  deviceId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  paymentFingerprint: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
});

export const CouponUsageLogValidation = {
  recordCouponUsageSchema,
};
