import { z } from "zod";

const createCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30, "Code cannot exceed 30 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code must contain only alphanumeric characters, hyphens, or underscores")
      .transform((val) => val.toUpperCase()),
    scope: z.enum(["platform", "vendor"]),
    vendorId: z.string().optional().nullable(),
    discountType: z.enum(["percentage", "flat"]),
    discountValue: z.number().positive("Discount value must be greater than 0"),
    minPurchase: z.number().nonnegative("Minimum purchase cannot be negative").optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
    usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: "Expiration date must be in the future",
      path: ["expiresAt"],
    },
  );

const updateCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30, "Code cannot exceed 30 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code must contain only alphanumeric characters, hyphens, or underscores")
      .transform((val) => val.toUpperCase())
      .optional(),
    scope: z.enum(["platform", "vendor"]).optional(),
    vendorId: z.string().optional().nullable(),
    discountType: z.enum(["percentage", "flat"]).optional(),
    discountValue: z.number().positive("Discount value must be greater than 0").optional(),
    minPurchase: z.number().nonnegative("Minimum purchase cannot be negative").optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
    usageLimit: z.number().int().positive("Usage limit must be a positive integer").optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && data.discountValue !== undefined && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        return false;
      }
      return true;
    },
    {
      message: "Expiration date must be in the future",
      path: ["expiresAt"],
    },
  );

const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Coupon code is required")
    .transform((val) => val.toUpperCase()),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        vendorId: z.string().min(1, "Vendor ID is required"),
        price: z.number().nonnegative("Price must be non-negative"),
        quantity: z.number().int().positive("Quantity must be a positive integer"),
      }),
    )
    .optional(),
  subtotal: z.number().nonnegative("Subtotal must be non-negative").optional(),
});

const toggleCouponStatusSchema = z.object({
  isActive: z.boolean().optional(),
});

export const CouponValidation = {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  toggleCouponStatusSchema,
};
