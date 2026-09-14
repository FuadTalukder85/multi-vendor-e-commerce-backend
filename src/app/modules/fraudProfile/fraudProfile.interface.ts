import { RiskLevel } from "../../../generated/prisma/enums";

export interface ICreateFraudProfilePayload {
  userId: string;
  riskScore?: number;
  riskLevel?: RiskLevel;
  fraudTypes?: string[];
}

export interface IUpdateFraudProfilePayload {
  riskScore?: number;
  riskLevel?: RiskLevel;
  fraudTypes?: string[];
}

export interface IBatchRecalculatePayload {
  userIds?: string[];
}
