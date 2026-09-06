export const payoutSubOrderSearchableFields = ["payoutId", "subOrderId", "subOrder.order.orderNumber"];

export const payoutSubOrderFilterableFields = ["payoutId", "subOrderId", "createdAt"];

export const standardPayoutSubOrderInclude = {
  payout: {
    select: {
      id: true,
      vendorId: true,
      amount: true,
      status: true,
      stripeTransferId: true,
      createdAt: true,
      processedAt: true,
      vendor: {
        select: {
          id: true,
          storeName: true,
          storeSlug: true,
        },
      },
    },
  },
  subOrder: {
    select: {
      id: true,
      orderId: true,
      vendorId: true,
      subtotal: true,
      commissionAmount: true,
      vendorEarning: true,
      status: true,
      payoutStatus: true,
      deliveredAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
  },
};
