export interface ICreateFraudAuditLogPayload {
  targetUserId: string;
  triggerType: string;
  reasonSummary: string;
  metricsSnapshot?: Record<string, unknown>;
  scoreAtEvent: number;
  action: string;
}

export interface IUpdateFraudAuditLogPayload {
  reasonSummary?: string;
  action?: string;
}
