import { z } from "zod";
import { SubOrderStatus } from "../../../generated/prisma/enums";

const updateSubOrderStatusSchema = z.object({
  status: z.nativeEnum(SubOrderStatus, {
    message: `Status must be one of: ${Object.values(SubOrderStatus).join(", ")}`,
  }),
  trackingNumber: z.string().optional(),
});

export const SubOrderValidation = {
  updateSubOrderStatusSchema,
};
