export const couponSearchableFields = ["code"];

export const couponFilterableFields = ["searchTerm", "scope", "vendorId", "discountType", "isActive", "minPurchase"];

export const standardCouponInclude = {
  vendor: {
    select: {
      id: true,
      storeName: true,
      storeSlug: true,
      storeLogo: true,
    },
  },
  _count: {
    select: {
      usageLogs: true,
    },
  },
};
