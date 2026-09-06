export const orderSearchableFields = ["orderNumber", "customer.name", "customer.email", "customer.phone"];

export const orderFilterableFields = [
  "searchTerm",
  "paymentStatus",
  "paymentMethod",
  "customerId",
  "shippingAddressId",
  "totalAmount",
  "createdAt",
];

export const standardOrderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
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
  subOrders: {
    include: {
      vendor: {
        select: {
          id: true,
          storeName: true,
          storeSlug: true,
          storeLogo: true,
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
    },
  },
};
