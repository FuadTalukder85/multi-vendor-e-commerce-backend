export interface IRecordCouponUsagePayload {
  couponCode: string;
  userId: string;
  orderId?: string | null;
  discountAmount?: number | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  phone?: string | null;
  paymentFingerprint?: string | null;
  deliveryAddress?: string | null;
}

export interface ICouponUsageLogFilterableParams {
  searchTerm?: string;
  couponCode?: string;
  userId?: string;
  orderId?: string;
  ipAddress?: string;
  deviceId?: string;
}
