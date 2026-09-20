export interface IAddToCartPayload {
  productId: string;
  variantId?: string;
  quantity?: number;
  sessionId?: string;
}

export interface IUpdateCartItemPayload {
  quantity?: number;
  savedForLater?: boolean;
}

export interface IMergeGuestCartPayload {
  sessionId: string;
}

export interface ICartIdentification {
  userId?: string;
  sessionId?: string;
}

export interface IGroupedCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  vendorId: string;
  title: string;
  slug: string;
  image: string | null;
  variantSku: string | null;
  variantAttributes: Record<string, unknown> | null;
  quantity: number;
  priceSnapshot: number;
  currentPrice: number;
  availableStock: number;
  savedForLater: boolean;
  isPriceChanged: boolean;
  isOutOfStock: boolean;
  isUnavailable: boolean;
  unavailabilityReason?: string;
  itemSubtotal: number;
  addedAt: Date;
  updatedAt: Date;
}

export interface IGroupedCartVendor {
  vendorId: string;
  storeName: string;
  storeSlug: string;
  storeLogo: string | null;
  items: IGroupedCartItem[];
  subtotal: number;
  itemCount: number;
  hasIssues: boolean;
}

export interface IGroupedCartResponse {
  vendorGroups: IGroupedCartVendor[];
  savedForLater: IGroupedCartItem[];
  summary: {
    totalActiveItems: number;
    totalActiveQuantity: number;
    totalSavedForLaterCount: number;
    subtotal: number;
    hasPriceChanges: boolean;
    hasOutOfStockItems: boolean;
    hasUnavailableItems: boolean;
    canCheckout: boolean;
  };
}

export interface IMergeCartResult {
  mergedCount: number;
  cleanedGuestCount: number;
  activeItemsCount: number;
}
