import status from "http-status";
import { PayoutStatus, SubOrderStatus, VendorStatus } from "../../../generated/prisma/enums";
import { PayoutModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { IRequestUser } from "../../types/request.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { payoutFilterableFields, payoutSearchableFields, standardPayoutInclude } from "./payout.constant";
import {
  IAdminPayoutStatistics,
  ICreatePayoutAdminPayload,
  IRequestPayoutPayload,
  IUpdatePayoutStatusPayload,
  IVendorPayoutStatistics,
} from "./payout.interface";
import { StripeService } from "./stripe.service";

const resolveVendorIdForUser = async (user: IRequestUser): Promise<string> => {
  let vendorId = user.tenantId;

  if (!vendorId) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true, status: true },
    });

    if (!vendorProfile) {
      throw new AppError(status.FORBIDDEN, "You do not have an associated vendor store");
    }

    vendorId = vendorProfile.id;
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { id: true, status: true },
  });

  if (!vendor || vendor.status !== VendorStatus.APPROVED) {
    throw new AppError(status.FORBIDDEN, "Vendor store is not active or approved");
  }

  return vendor.id;
};

const requestVendorPayout = async (user: IRequestUser, payload: IRequestPayoutPayload) => {
  const vendorId = await resolveVendorIdForUser(user);

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankName: true,
      stripeAccountId: true,
    },
  });

  if (!vendor) {
    throw new AppError(status.NOT_FOUND, "Vendor profile not found");
  }

  const hasBankingInfo = Boolean(vendor.bankAccountNumber && vendor.bankName);
  const hasStripeAccount = Boolean(vendor.stripeAccountId);

  if (!hasBankingInfo && !hasStripeAccount) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please configure your bank account credentials or Stripe Connect account before requesting a payout",
    );
  }

  let eligibleSubOrders;

  if (payload.subOrderIds && payload.subOrderIds.length > 0) {
    const uniqueIds = Array.from(new Set(payload.subOrderIds));

    const subOrders = await prisma.subOrder.findMany({
      where: {
        id: { in: uniqueIds },
        vendorId,
      },
      include: {
        payoutLinks: {
          include: {
            payout: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (subOrders.length !== uniqueIds.length) {
      throw new AppError(
        status.BAD_REQUEST,
        "One or more specified sub-orders do not exist or belong to another store",
      );
    }

    for (const subOrder of subOrders) {
      if (subOrder.status !== SubOrderStatus.DELIVERED) {
        throw new AppError(
          status.BAD_REQUEST,
          `Sub-order '${subOrder.id}' cannot be paid out because its status is ${subOrder.status}. Only DELIVERED sub-orders can be settled.`,
        );
      }

      if (subOrder.payoutStatus !== PayoutStatus.UNPAID) {
        throw new AppError(
          status.BAD_REQUEST,
          `Sub-order '${subOrder.id}' cannot be requested because its payout status is ${subOrder.payoutStatus}.`,
        );
      }

      const activeLink = subOrder.payoutLinks.find(
        (link) => link.payout.status === PayoutStatus.UNPAID || link.payout.status === PayoutStatus.PROCESSING,
      );

      if (activeLink) {
        throw new AppError(
          status.CONFLICT,
          `Sub-order '${subOrder.id}' is already tied to an active payout request (${activeLink.payout.id}).`,
        );
      }
    }

    eligibleSubOrders = subOrders;
  } else {
    // Auto-discover all delivered unpaid sub-orders for this vendor
    const subOrders = await prisma.subOrder.findMany({
      where: {
        vendorId,
        status: SubOrderStatus.DELIVERED,
        payoutStatus: PayoutStatus.UNPAID,
      },
      include: {
        payoutLinks: {
          include: {
            payout: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Filter out any that may already have active payout links
    eligibleSubOrders = subOrders.filter((subOrder) => {
      const activeLink = subOrder.payoutLinks.find(
        (link) => link.payout.status === PayoutStatus.UNPAID || link.payout.status === PayoutStatus.PROCESSING,
      );
      return !activeLink;
    });

    if (eligibleSubOrders.length === 0) {
      throw new AppError(
        status.BAD_REQUEST,
        "No delivered sub-orders with unpaid balance are currently available for payout withdrawal",
      );
    }
  }

  const totalAmount = eligibleSubOrders.reduce((sum, order) => sum + Number(order.vendorEarning), 0);

  if (totalAmount <= 0) {
    throw new AppError(status.BAD_REQUEST, "Total calculated payout amount must be greater than zero");
  }

  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        vendorId,
        amount: totalAmount,
        status: PayoutStatus.UNPAID,
        subOrders: {
          create: eligibleSubOrders.map((subOrder) => ({
            subOrderId: subOrder.id,
          })),
        },
      },
      include: standardPayoutInclude,
    });

    await tx.subOrder.updateMany({
      where: {
        id: { in: eligibleSubOrders.map((s) => s.id) },
      },
      data: {
        payoutStatus: PayoutStatus.PROCESSING,
      },
    });

    return payout;
  });
};

const getVendorPayouts = async (user: IRequestUser, queryParams: IQueryParams) => {
  const vendorId = await resolveVendorIdForUser(user);

  const payoutQuery = new QueryBuilder<PayoutModel>(prisma.payout, queryParams, {
    searchableFields: payoutSearchableFields,
    filterableFields: payoutFilterableFields,
  })
    .where({ vendorId })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardPayoutInclude);

  return await payoutQuery.execute();
};

const getVendorPayoutById = async (user: IRequestUser, payoutId: string) => {
  const vendorId = await resolveVendorIdForUser(user);

  const payout = await prisma.payout.findFirst({
    where: {
      id: payoutId,
      vendorId,
    },
    include: standardPayoutInclude,
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  return payout;
};

const cancelVendorPayout = async (user: IRequestUser, payoutId: string) => {
  const vendorId = await resolveVendorIdForUser(user);

  const payout = await prisma.payout.findFirst({
    where: {
      id: payoutId,
      vendorId,
    },
    include: {
      subOrders: true,
    },
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  if (payout.status !== PayoutStatus.UNPAID) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot cancel payout request in '${payout.status}' status. Only UNPAID requests can be cancelled.`,
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updatedPayout = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.FAILED,
      },
      include: standardPayoutInclude,
    });

    const subOrderIds = payout.subOrders.map((link) => link.subOrderId);

    if (subOrderIds.length > 0) {
      await tx.subOrder.updateMany({
        where: { id: { in: subOrderIds } },
        data: {
          payoutStatus: PayoutStatus.UNPAID,
        },
      });
    }

    return updatedPayout;
  });
};

const getVendorPayoutStatistics = async (user: IRequestUser): Promise<IVendorPayoutStatistics> => {
  const vendorId = await resolveVendorIdForUser(user);

  const [vendor, deliveredSubOrders, unpaidDeliveredSubOrders, payouts] = await Promise.all([
    prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: {
        bankAccountNumber: true,
        bankName: true,
        stripeAccountId: true,
      },
    }),
    prisma.subOrder.findMany({
      where: {
        vendorId,
        status: SubOrderStatus.DELIVERED,
      },
      select: {
        vendorEarning: true,
      },
    }),
    prisma.subOrder.findMany({
      where: {
        vendorId,
        status: SubOrderStatus.DELIVERED,
        payoutStatus: PayoutStatus.UNPAID,
      },
      select: {
        id: true,
        vendorEarning: true,
      },
    }),
    prisma.payout.findMany({
      where: { vendorId },
      select: {
        amount: true,
        status: true,
      },
    }),
  ]);

  const totalEarnings = deliveredSubOrders.reduce((sum, s) => sum + Number(s.vendorEarning), 0);

  const availableBalance = unpaidDeliveredSubOrders.reduce((sum, s) => sum + Number(s.vendorEarning), 0);

  let totalPaidOut = 0;
  let pendingPayoutAmount = 0;

  payouts.forEach((p) => {
    const amt = Number(p.amount);
    if (p.status === PayoutStatus.PAID) {
      totalPaidOut += amt;
    } else if (p.status === PayoutStatus.UNPAID || p.status === PayoutStatus.PROCESSING) {
      pendingPayoutAmount += amt;
    }
  });

  const hasPayoutMethod = Boolean((vendor?.bankAccountNumber && vendor?.bankName) || vendor?.stripeAccountId);

  return {
    totalEarnings,
    totalPaidOut,
    pendingPayoutAmount,
    availableBalance,
    eligibleSubOrdersCount: unpaidDeliveredSubOrders.length,
    hasPayoutMethod,
  };
};

const getAllPayoutsAdmin = async (queryParams: IQueryParams) => {
  const payoutQuery = new QueryBuilder<PayoutModel>(prisma.payout, queryParams, {
    searchableFields: payoutSearchableFields,
    filterableFields: payoutFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardPayoutInclude);

  return await payoutQuery.execute();
};

const getPayoutByIdAdmin = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: standardPayoutInclude,
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  return payout;
};

const createPayoutAdmin = async (payload: ICreatePayoutAdminPayload) => {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: payload.vendorId },
    select: { id: true, status: true },
  });

  if (!vendor || vendor.status !== VendorStatus.APPROVED) {
    throw new AppError(status.BAD_REQUEST, "Target vendor is not active or approved");
  }

  const uniqueIds = Array.from(new Set(payload.subOrderIds));

  const subOrders = await prisma.subOrder.findMany({
    where: {
      id: { in: uniqueIds },
      vendorId: payload.vendorId,
    },
  });

  if (subOrders.length !== uniqueIds.length) {
    throw new AppError(status.BAD_REQUEST, "One or more sub-orders not found or do not belong to the target vendor");
  }

  for (const subOrder of subOrders) {
    if (subOrder.status !== SubOrderStatus.DELIVERED) {
      throw new AppError(
        status.BAD_REQUEST,
        `Sub-order '${subOrder.id}' is not in DELIVERED status (${subOrder.status})`,
      );
    }

    if (subOrder.payoutStatus !== PayoutStatus.UNPAID) {
      throw new AppError(
        status.BAD_REQUEST,
        `Sub-order '${subOrder.id}' already has payoutStatus '${subOrder.payoutStatus}'`,
      );
    }
  }

  const totalAmount = subOrders.reduce((sum, order) => sum + Number(order.vendorEarning), 0);

  if (totalAmount <= 0) {
    throw new AppError(status.BAD_REQUEST, "Total payout amount must be greater than zero");
  }

  const initialStatus = payload.status ?? PayoutStatus.UNPAID;

  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        vendorId: payload.vendorId,
        amount: totalAmount,
        status: initialStatus,
        stripeTransferId: payload.stripeTransferId ?? null,
        processedAt: initialStatus === PayoutStatus.PAID ? new Date() : null,
        subOrders: {
          create: subOrders.map((subOrder) => ({
            subOrderId: subOrder.id,
          })),
        },
      },
      include: standardPayoutInclude,
    });

    const targetSubOrderPayoutStatus =
      initialStatus === PayoutStatus.PAID
        ? PayoutStatus.PAID
        : initialStatus === PayoutStatus.FAILED
          ? PayoutStatus.UNPAID
          : PayoutStatus.PROCESSING;

    await tx.subOrder.updateMany({
      where: { id: { in: subOrders.map((s) => s.id) } },
      data: {
        payoutStatus: targetSubOrderPayoutStatus,
      },
    });

    return payout;
  });
};

const updatePayoutStatusAdmin = async (payoutId: string, payload: IUpdatePayoutStatusPayload) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      subOrders: true,
    },
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  if (payout.status === PayoutStatus.PAID && payload.status === PayoutStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Payout is already marked as PAID");
  }

  return await prisma.$transaction(async (tx) => {
    const isNowPaid = payload.status === PayoutStatus.PAID;
    const processedAt = isNowPaid ? new Date() : payout.processedAt;

    const updatedPayout = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: payload.status,
        stripeTransferId: payload.stripeTransferId !== undefined ? payload.stripeTransferId : payout.stripeTransferId,
        processedAt,
      },
      include: standardPayoutInclude,
    });

    const subOrderIds = payout.subOrders.map((link) => link.subOrderId);

    if (subOrderIds.length > 0) {
      let subOrderStatusToSet: PayoutStatus;

      switch (payload.status) {
        case PayoutStatus.PAID:
          subOrderStatusToSet = PayoutStatus.PAID;
          break;
        case PayoutStatus.FAILED:
          subOrderStatusToSet = PayoutStatus.UNPAID; // Reverts so suborders can be settled in future
          break;
        case PayoutStatus.PROCESSING:
        case PayoutStatus.UNPAID:
        default:
          subOrderStatusToSet = PayoutStatus.PROCESSING;
          break;
      }

      await tx.subOrder.updateMany({
        where: { id: { in: subOrderIds } },
        data: {
          payoutStatus: subOrderStatusToSet,
        },
      });
    }

    return updatedPayout;
  });
};

const getAdminPayoutStatistics = async (): Promise<IAdminPayoutStatistics> => {
  const [subOrders, payouts] = await Promise.all([
    prisma.subOrder.findMany({
      where: { status: SubOrderStatus.DELIVERED },
      select: {
        subtotal: true,
        commissionAmount: true,
        vendorEarning: true,
      },
    }),
    prisma.payout.findMany({
      select: {
        amount: true,
        status: true,
      },
    }),
  ]);

  let totalPlatformVolume = 0;
  let totalCommissionEarned = 0;
  let totalVendorEarnings = 0;

  subOrders.forEach((s) => {
    totalPlatformVolume += Number(s.subtotal);
    totalCommissionEarned += Number(s.commissionAmount);
    totalVendorEarnings += Number(s.vendorEarning);
  });

  let totalPaidOut = 0;
  let pendingPayoutsAmount = 0;
  let pendingPayoutsCount = 0;
  let paidPayoutsCount = 0;
  let failedPayoutsCount = 0;

  payouts.forEach((p) => {
    const amt = Number(p.amount);
    if (p.status === PayoutStatus.PAID) {
      totalPaidOut += amt;
      paidPayoutsCount += 1;
    } else if (p.status === PayoutStatus.UNPAID || p.status === PayoutStatus.PROCESSING) {
      pendingPayoutsAmount += amt;
      pendingPayoutsCount += 1;
    } else if (p.status === PayoutStatus.FAILED) {
      failedPayoutsCount += 1;
    }
  });

  return {
    totalPlatformVolume,
    totalCommissionEarned,
    totalVendorEarnings,
    totalPaidOut,
    pendingPayoutsAmount,
    pendingPayoutsCount,
    paidPayoutsCount,
    failedPayoutsCount,
  };
};

const createStripeOnboardingLink = async (user: IRequestUser) => {
  const vendorId = await resolveVendorIdForUser(user);
  return await StripeService.createAccountOnboardingLink(user, vendorId);
};

const getStripeConnectStatus = async (user: IRequestUser) => {
  const vendorId = await resolveVendorIdForUser(user);
  return await StripeService.getConnectAccountStatus(vendorId);
};

const getStripeDashboardLink = async (user: IRequestUser) => {
  const vendorId = await resolveVendorIdForUser(user);
  return await StripeService.createExpressDashboardLink(vendorId);
};

const disbursePayoutWithStripe = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      vendor: {
        select: {
          id: true,
          storeName: true,
          stripeAccountId: true,
        },
      },
      subOrders: true,
    },
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  if (payout.status === PayoutStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Payout has already been disbursed and marked as PAID");
  }

  if (!payout.vendor.stripeAccountId) {
    throw new AppError(
      status.BAD_REQUEST,
      `Vendor '${payout.vendor.storeName}' has not connected a Stripe account yet. Please notify them to complete Stripe onboarding.`,
    );
  }

  // Execute Stripe Transfer
  const transferId = await StripeService.executeTransferToVendor(
    payout.id,
    Number(payout.amount),
    payout.vendor.stripeAccountId,
  );

  // Atomically update payout and suborders
  return await prisma.$transaction(async (tx) => {
    const updatedPayout = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PAID,
        stripeTransferId: transferId,
        processedAt: new Date(),
      },
      include: standardPayoutInclude,
    });

    const subOrderIds = payout.subOrders.map((l) => l.subOrderId);

    if (subOrderIds.length > 0) {
      await tx.subOrder.updateMany({
        where: { id: { in: subOrderIds } },
        data: {
          payoutStatus: PayoutStatus.PAID,
        },
      });
    }

    return updatedPayout;
  });
};

export const PayoutService = {
  resolveVendorIdForUser,
  requestVendorPayout,
  getVendorPayouts,
  getVendorPayoutById,
  cancelVendorPayout,
  getVendorPayoutStatistics,
  getAllPayoutsAdmin,
  getPayoutByIdAdmin,
  createPayoutAdmin,
  updatePayoutStatusAdmin,
  getAdminPayoutStatistics,
  createStripeOnboardingLink,
  getStripeConnectStatus,
  getStripeDashboardLink,
  disbursePayoutWithStripe,
};
