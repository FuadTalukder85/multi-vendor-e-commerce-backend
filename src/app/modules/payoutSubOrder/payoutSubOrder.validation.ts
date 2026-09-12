import { z } from "zod";

const addSubOrderToPayoutSchema = z.object({
  payoutId: z.string().min(1, "Payout ID is required"),
  subOrderId: z.string().min(1, "Sub-order ID is required"),
});

export const PayoutSubOrderValidation = {
  addSubOrderToPayoutSchema,
};
