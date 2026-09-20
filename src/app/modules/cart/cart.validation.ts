import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be at least 1")
    .default(1),
  sessionId: z.string().optional(),
});

const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative")
    .optional(),
  savedForLater: z.boolean().optional(),
});

const mergeGuestCartSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required for merging guest cart"),
});

export const CartValidation = {
  addToCartSchema,
  updateCartItemSchema,
  mergeGuestCartSchema,
};
