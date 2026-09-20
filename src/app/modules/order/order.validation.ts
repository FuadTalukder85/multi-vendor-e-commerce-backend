import { z } from "zod";
import { PaymentStatus } from "../../../generated/prisma/enums";

const createOrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

const createOrderSchema = z
  .object({
    items: z.array(createOrderItemSchema).optional(),
    selectedCartItemIds: z
      .array(z.string().min(1, "Cart Item ID cannot be empty"))
      .min(1, "At least one cart item ID must be selected")
      .optional(),
    shippingAddressId: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentIntentId: z.string().optional(),
    couponCode: z.string().optional(),
  })
  .refine(
    (data) => (data.items && data.items.length > 0) || (data.selectedCartItemIds && data.selectedCartItemIds.length > 0),
    {
      message: "Either selectedCartItemIds or items array must be provided to place an order",
      path: ["items"],
    },
  );

const createPaymentIntentSchema = z
  .object({
    items: z.array(createOrderItemSchema).optional(),
    selectedCartItemIds: z
      .array(z.string().min(1, "Cart Item ID cannot be empty"))
      .min(1, "At least one cart item ID must be selected")
      .optional(),
    shippingAddressId: z.string().optional(),
    couponCode: z.string().optional(),
  })
  .refine(
    (data) => (data.items && data.items.length > 0) || (data.selectedCartItemIds && data.selectedCartItemIds.length > 0),
    {
      message: "Either selectedCartItemIds or items array must be provided",
      path: ["items"],
    },
  );

const updatePaymentStatusSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus, {
    message: `Payment status must be one of: ${Object.values(PaymentStatus).join(", ")}`,
  }),
  paymentIntentId: z.string().optional(),
});

export const OrderValidation = {
  createOrderSchema,
  createPaymentIntentSchema,
  updatePaymentStatusSchema,
};
