export interface IAddSubOrderToPayoutPayload {
  payoutId: string;
  subOrderId: string;
}

export interface IRemoveSubOrderFromPayoutPayload {
  payoutId: string;
  subOrderId: string;
}
