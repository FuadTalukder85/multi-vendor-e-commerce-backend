import { DealStatus, DealRequestStatus } from "../../../generated/prisma/enums";

export interface ICreateDealPayload {
  productId: string;
  variantId?: string | null;
  vendorId?: string;
  title?: string;
  dealPrice: number;
  quantityLimit?: number | null;
  maxPerCustomer?: number | null;
  startAt: string | Date;
  endAt: string | Date;
}

export interface ICreateDealRequestPayload {
  productId: string;
  variantId?: string | null;
  proposedDealPrice: number;
  requestedStartAt: string | Date;
  requestedEndAt: string | Date;
  quantityLimit?: number | null;
  maxPerCustomer?: number | null;
  note?: string;
}

export interface IReviewDealRequestPayload {
  status: DealRequestStatus; // APPROVED or REJECTED
  reviewNote?: string;
  // Optional overrides during approval
  approvedDealPrice?: number;
  approvedStartAt?: string | Date;
  approvedEndAt?: string | Date;
  approvedQuantityLimit?: number | null;
}

export interface IDealFilterParams {
  searchTerm?: string;
  status?: DealStatus;
  vendorId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
