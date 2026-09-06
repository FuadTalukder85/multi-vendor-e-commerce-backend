export const couponUsageLogSearchableFields = ["couponCode", "ipAddress", "phone", "deviceId"];

export const couponUsageLogFilterableFields = [
  "searchTerm",
  "couponCode",
  "userId",
  "orderId",
  "ipAddress",
  "deviceId",
  "createdAt",
  "usedAt",
];

export const standardCouponUsageLogInclude = {
  coupon: {
    select: {
      id: true,
      code: true,
      scope: true,
      vendorId: true,
      discountType: true,
      discountValue: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      paymentStatus: true,
    },
  },
};
