import { RiskLevel } from "../../../generated/prisma/enums";

export interface ICreateSellerFraudProfilePayload {
  vendorId: string;
  totalOrders?: number;
  cancelledOrders?: number;
  returnedOrders?: number;
  complaints?: number;
  refundRate?: number;
  fakeProductReports?: number;
  lateShipmentRate?: number;
  customerRating?: number;
  reviewAbuseCount?: number;
  suspiciousOrders?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
}

export interface IUpdateSellerFraudProfilePayload {
  complaints?: number;
  fakeProductReports?: number;
  reviewAbuseCount?: number;
  suspiciousOrders?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
}

export interface IBatchRecalculateSellerRiskPayload {
  vendorIds?: string[];
}
