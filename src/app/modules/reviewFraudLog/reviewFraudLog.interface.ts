import { ReviewFraudStatus } from "../../../generated/prisma/enums";

export interface ICreateReviewFraudLogPayload {
  reviewId: string;
  reviewerId: string;
  productId: string;
  deviceId?: string;
  ipAddress?: string;
  reviewerAccountAgeDays?: number;
  hasVerifiedPurchase?: boolean;
  sellerRelationshipFlag?: boolean;
  suspicionScore?: number;
  status?: ReviewFraudStatus;
}

export interface IUpdateReviewFraudLogPayload {
  hasVerifiedPurchase?: boolean;
  sellerRelationshipFlag?: boolean;
  suspicionScore?: number;
  status?: ReviewFraudStatus;
}

export interface IBatchAnalyzeReviewFraudPayload {
  reviewIds?: string[];
  productId?: string;
}
