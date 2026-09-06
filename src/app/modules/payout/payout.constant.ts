export const payoutSearchableFields = ["id", "stripeTransferId", "vendor.storeName"];

export const payoutFilterableFields = ["searchTerm", "status", "vendorId", "createdAt"];

export const standardPayoutInclude = {
  vendor: {
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeLogo: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankName: true,
      stripeAccountId: true,
    },
  },
  subOrders: {
    include: {
      subOrder: {
        select: {
          id: true,
          orderId: true,
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
    },
  },
};
