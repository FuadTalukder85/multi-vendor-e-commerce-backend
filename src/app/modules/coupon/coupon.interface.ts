export type CouponScopeType = "platform" | "vendor";
export type DiscountType = "percentage" | "flat";

export interface ICreateCouponPayload {
  code: string;
  scope: CouponScopeType;
  vendorId?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number | null;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface IUpdateCouponPayload {
  code?: string;
  scope?: CouponScopeType;
  vendorId?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  minPurchase?: number | null;
  expiresAt?: string | Date | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

export interface ICartItemForValidation {
  productId: string;
  vendorId: string;
  price: number;
  quantity: number;
}

export interface IValidateCouponPayload {
  code: string;
  items?: ICartItemForValidation[];
  subtotal?: number;
}

export interface IValidateCouponResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    scope: string;
    vendorId: string | null;
    discountType: string;
    discountValue: number;
    minPurchase: number | null;
    expiresAt: Date | null;
  };
  eligibleSubtotal: number;
  discountAmount: number;
  finalPayable: number;
  message: string;
}

export interface ICouponFilterableParams {
  searchTerm?: string;
  scope?: CouponScopeType;
  vendorId?: string;
  discountType?: DiscountType;
  isActive?: boolean | string;
  isExpired?: boolean | string;
}
