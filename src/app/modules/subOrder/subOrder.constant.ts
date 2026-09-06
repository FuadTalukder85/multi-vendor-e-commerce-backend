export const subOrderSearchableFields = ["trackingNumber", "order.orderNumber", "vendor.storeName"];

export const subOrderFilterableFields = ["searchTerm", "status", "payoutStatus", "vendorId", "orderId", "createdAt"];

export const standardSubOrderInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      paymentStatus: true,
      paymentMethod: true,
      createdAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      shippingAddress: {
        select: {
          id: true,
          label: true,
          street: true,
          city: true,
          zip: true,
          country: true,
          phone: true,
        },
      },
    },
  },
  vendor: {
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeLogo: true,
      commissionRate: true,
    },
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: true,
        },
      },
      variant: {
        select: {
          id: true,
          sku: true,
          attributes: true,
          image: true,
        },
      },
    },
  },
};
