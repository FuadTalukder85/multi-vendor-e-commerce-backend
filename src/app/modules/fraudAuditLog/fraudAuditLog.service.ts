import status from "http-status";
import type { InputJsonValue } from "../../../generated/prisma/internal/prismaNamespace";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  fraudAuditLogFilterableFields,
  fraudAuditLogSearchableFields,
} from "./fraudAuditLog.constant";
import {
  ICreateFraudAuditLogPayload,
  IUpdateFraudAuditLogPayload,
} from "./fraudAuditLog.interface";

const createFraudAuditLog = async (payload: ICreateFraudAuditLogPayload) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: payload.targetUserId },
  });

  if (!targetUser) {
    throw new AppError(status.NOT_FOUND, "Target user not found");
  }

  const metricsSnapshot = payload.metricsSnapshot
    ? (payload.metricsSnapshot as InputJsonValue)
    : ({} as InputJsonValue);

  return await prisma.fraudAuditLog.create({
    data: {
      targetUserId: payload.targetUserId,
      triggerType: payload.triggerType,
      reasonSummary: payload.reasonSummary,
      metricsSnapshot,
      scoreAtEvent: payload.scoreAtEvent,
      action: payload.action,
    },
    include: {
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });
};

const getFraudAuditLogsByTargetUserId = async (
  targetUserId: string,
  query: IQueryParams,
  currentUserId?: string,
  role?: Role,
) => {
  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!isAdmin && targetUserId !== currentUserId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to user fraud audit logs");
  }

  const queryWithUser = {
    ...query,
    targetUserId,
  };

  const fraudAuditQuery = new QueryBuilder(prisma.fraudAuditLog, queryWithUser, {
    searchableFields: fraudAuditLogSearchableFields,
    filterableFields: fraudAuditLogFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    });

  return await fraudAuditQuery.execute();
};

const getAllFraudAuditLogs = async (query: IQueryParams) => {
  const fraudAuditQuery = new QueryBuilder(prisma.fraudAuditLog, query, {
    searchableFields: fraudAuditLogSearchableFields,
    filterableFields: fraudAuditLogFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    });

  return await fraudAuditQuery.execute();
};

const getFraudAuditLogById = async (id: string) => {
  const log = await prisma.fraudAuditLog.findUnique({
    where: { id },
    include: {
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Fraud audit log not found");
  }

  return log;
};

const updateFraudAuditLog = async (
  id: string,
  payload: IUpdateFraudAuditLogPayload,
) => {
  const log = await prisma.fraudAuditLog.findUnique({
    where: { id },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Fraud audit log not found");
  }

  return await prisma.fraudAuditLog.update({
    where: { id },
    data: {
      reasonSummary: payload.reasonSummary ?? log.reasonSummary,
      action: payload.action ?? log.action,
    },
    include: {
      targetUser: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

const deleteFraudAuditLog = async (id: string) => {
  const log = await prisma.fraudAuditLog.findUnique({
    where: { id },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Fraud audit log not found");
  }

  return await prisma.fraudAuditLog.delete({
    where: { id },
  });
};

export const FraudAuditLogService = {
  createFraudAuditLog,
  getFraudAuditLogsByTargetUserId,
  getAllFraudAuditLogs,
  getFraudAuditLogById,
  updateFraudAuditLog,
  deleteFraudAuditLog,
};
