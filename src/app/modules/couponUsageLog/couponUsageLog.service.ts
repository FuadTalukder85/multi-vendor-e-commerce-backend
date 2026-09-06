import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { CouponUsageLogModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { IRequestUser } from "../../types/request.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CouponService } from "../coupon/coupon.service";
import {
  couponUsageLogFilterableFields,
  couponUsageLogSearchableFields,
  standardCouponUsageLogInclude,
} from "./couponUsageLog.constant";
import { IRecordCouponUsagePayload } from "./couponUsageLog.interface";

const getAllUsageLogsAdmin = async (queryParams: IQueryParams) => {
  const normalizedParams = {
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...queryParams,
  };

  const logQuery = new QueryBuilder<CouponUsageLogModel>(prisma.couponUsageLog, normalizedParams, {
    searchableFields: couponUsageLogSearchableFields,
    filterableFields: couponUsageLogFilterableFields,
  });

  return await logQuery.search().filter().sort().paginate().include(standardCouponUsageLogInclude).execute();
};

const getVendorUsageLogs = async (user: IRequestUser, queryParams: IQueryParams) => {
  const vendorId = await CouponService.resolveVendorIdForUser(user);

  const normalizedParams = {
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...queryParams,
  };

  // Vendor can only view usage logs for coupons that belong to their store
  const logQuery = new QueryBuilder<CouponUsageLogModel>(prisma.couponUsageLog, normalizedParams, {
    searchableFields: couponUsageLogSearchableFields,
    filterableFields: couponUsageLogFilterableFields,
  });

  logQuery.where({
    coupon: {
      vendorId,
    },
  });

  return await logQuery.search().filter().sort().paginate().include(standardCouponUsageLogInclude).execute();
};

const getMyUsageLogs = async (user: IRequestUser, queryParams: IQueryParams) => {
  const normalizedParams = {
    sortBy: "createdAt",
    sortOrder: "desc" as const,
    ...queryParams,
    userId: user.userId,
  };

  const logQuery = new QueryBuilder<CouponUsageLogModel>(prisma.couponUsageLog, normalizedParams, {
    searchableFields: couponUsageLogSearchableFields,
    filterableFields: couponUsageLogFilterableFields,
  });

  return await logQuery
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      coupon: {
        select: {
          id: true,
          code: true,
          scope: true,
          discountType: true,
          discountValue: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paymentStatus: true,
        },
      },
    })
    .execute();
};

const getUsageLogById = async (id: string, user: IRequestUser) => {
  const log = await prisma.couponUsageLog.findUnique({
    where: { id },
    include: standardCouponUsageLogInclude,
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Coupon usage log not found");
  }

  // Permission assertion
  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    return log;
  }

  if (user.role === Role.CUSTOMER && log.userId === user.userId) {
    return log;
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await CouponService.resolveVendorIdForUser(user);
    if (log.coupon.vendorId === vendorId) {
      return log;
    }
  }

  throw new AppError(status.FORBIDDEN, "You do not have permission to view this usage log");
};

const recordCouponUsage = async (
  payload: IRecordCouponUsagePayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = prisma,
) => {
  const normalizedCode = payload.couponCode.trim().toUpperCase();

  const coupon = await client.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new AppError(status.NOT_FOUND, `Coupon '${normalizedCode}' not found`);
  }

  // Atomically increment usedCount on Coupon
  await client.coupon.update({
    where: { code: normalizedCode },
    data: {
      usedCount: { increment: 1 },
    },
  });

  // Create usage log
  return await client.couponUsageLog.create({
    data: {
      couponCode: normalizedCode,
      userId: payload.userId,
      orderId: payload.orderId ?? null,
      discountAmount: payload.discountAmount ?? null,
      deviceId: payload.deviceId ?? null,
      ipAddress: payload.ipAddress ?? null,
      phone: payload.phone ?? null,
      paymentFingerprint: payload.paymentFingerprint ?? null,
      deliveryAddress: payload.deliveryAddress ?? null,
    },
    include: standardCouponUsageLogInclude,
  });
};

export const CouponUsageLogService = {
  getAllUsageLogsAdmin,
  getVendorUsageLogs,
  getMyUsageLogs,
  getUsageLogById,
  recordCouponUsage,
};
