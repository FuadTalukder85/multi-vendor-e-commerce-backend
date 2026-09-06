import { SubOrderStatus } from "../../../generated/prisma/enums";

export interface IUpdateSubOrderStatusPayload {
  status: SubOrderStatus;
  trackingNumber?: string;
}
