import status from "http-status";
import { PayoutStatus, Role, SubOrderStatus } from "../../../generated/prisma/enums";
import { PayoutSubOrderModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { IRequestUser } from "../../types/request.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { PayoutService } from "../payout/payout.service";
import {
  payoutSubOrderFilterableFields,
  payoutSubOrderSearchableFields,
  standardPayoutSubOrderInclude,
} from "./payoutSubOrder.constant";
import { IAddSubOrderToPayoutPayload } from "./payoutSubOrder.interface";

const getAllPayoutSubOrdersAdmin = async (queryParams: IQueryParams) => {
  const query = new QueryBuilder<PayoutSubOrderModel>(prisma.payoutSubOrder, queryParams, {
    searchableFields: payoutSubOrderSearchableFields,
    filterableFields: payoutSubOrderFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardPayoutSubOrderInclude);

  return await query.execute();
};

const getVendorPayoutSubOrders = async (user: IRequestUser, queryParams: IQueryParams) => {
  const vendorId = await PayoutService.resolveVendorIdForUser(user);

  const query = new QueryBuilder<PayoutSubOrderModel>(prisma.payoutSubOrder, queryParams, {
    searchableFields: payoutSubOrderSearchableFields,
    filterableFields: payoutSubOrderFilterableFields,
  })
    .where({
      subOrder: {
        vendorId,
      },
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardPayoutSubOrderInclude);

  return await query.execute();
};

const getPayoutSubOrdersByPayoutId = async (user: IRequestUser, payoutId: string) => {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: { id: true, vendorId: true },
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await PayoutService.resolveVendorIdForUser(user);
    if (payout.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to view links for this payout");
    }
  }

  return await prisma.payoutSubOrder.findMany({
    where: { payoutId },
    include: standardPayoutSubOrderInclude,
  });
};

const getPayoutSubOrdersBySubOrderId = async (user: IRequestUser, subOrderId: string) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    select: { id: true, vendorId: true },
  });

  if (!subOrder) {
    throw new AppError(status.NOT_FOUND, "Sub-order not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await PayoutService.resolveVendorIdForUser(user);
    if (subOrder.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to view links for this sub-order");
    }
  }

  return await prisma.payoutSubOrder.findMany({
    where: { subOrderId },
    include: standardPayoutSubOrderInclude,
  });
};

const getPayoutSubOrderByIds = async (user: IRequestUser, payoutId: string, subOrderId: string) => {
  const link = await prisma.payoutSubOrder.findUnique({
    where: {
      payoutId_subOrderId: {
        payoutId,
        subOrderId,
      },
    },
    include: standardPayoutSubOrderInclude,
  });

  if (!link) {
    throw new AppError(status.NOT_FOUND, "Payout and sub-order relationship record not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await PayoutService.resolveVendorIdForUser(user);
    if (link.subOrder.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You do not have permission to view this relationship record");
    }
  }

  return link;
};

const addSubOrderToPayout = async (payload: IAddSubOrderToPayoutPayload) => {
  const { payoutId, subOrderId } = payload;

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new AppError(status.NOT_FOUND, "Payout record not found");
  }

  if (payout.status === PayoutStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Cannot link additional sub-orders to an already PAID payout");
  }

  if (payout.status === PayoutStatus.FAILED) {
    throw new AppError(status.BAD_REQUEST, "Cannot link sub-orders to a FAILED payout");
  }

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      payoutLinks: {
        include: {
          payout: {
            select: { id: true, status: true },
          },
        },
      },
    },
  });

  if (!subOrder) {
    throw new AppError(status.NOT_FOUND, "Sub-order record not found");
  }

  if (subOrder.vendorId !== payout.vendorId) {
    throw new AppError(
      status.BAD_REQUEST,
      "Store mismatch: The sub-order does not belong to the recipient vendor of this payout",
    );
  }

  if (subOrder.status !== SubOrderStatus.DELIVERED) {
    throw new AppError(
      status.BAD_REQUEST,
      `Sub-order status is '${subOrder.status}'. Only DELIVERED sub-orders can be settled.`,
    );
  }

  if (subOrder.payoutStatus === PayoutStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Sub-order has already been settled and paid");
  }

  const existingActiveLink = subOrder.payoutLinks.find(
    (l) => l.payout.status === PayoutStatus.UNPAID || l.payout.status === PayoutStatus.PROCESSING,
  );

  if (existingActiveLink) {
    throw new AppError(
      status.CONFLICT,
      `Sub-order is already associated with an active payout (${existingActiveLink.payout.id})`,
    );
  }

  return await prisma.$transaction(async (tx) => {
    const link = await tx.payoutSubOrder.create({
      data: {
        payoutId,
        subOrderId,
      },
      include: standardPayoutSubOrderInclude,
    });

    await tx.payout.update({
      where: { id: payoutId },
      data: {
        amount: {
          increment: subOrder.vendorEarning,
        },
      },
    });

    await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        payoutStatus: PayoutStatus.PROCESSING,
      },
    });

    return link;
  });
};

const removeSubOrderFromPayout = async (payoutId: string, subOrderId: string) => {
  const link = await prisma.payoutSubOrder.findUnique({
    where: {
      payoutId_subOrderId: {
        payoutId,
        subOrderId,
      },
    },
    include: {
      payout: true,
      subOrder: true,
    },
  });

  if (!link) {
    throw new AppError(status.NOT_FOUND, "Payout and sub-order relationship record not found");
  }

  if (link.payout.status === PayoutStatus.PAID) {
    throw new AppError(status.BAD_REQUEST, "Cannot remove sub-orders from an already PAID payout");
  }

  return await prisma.$transaction(async (tx) => {
    await tx.payoutSubOrder.delete({
      where: {
        payoutId_subOrderId: {
          payoutId,
          subOrderId,
        },
      },
    });

    const newAmount = Math.max(0, Number(link.payout.amount) - Number(link.subOrder.vendorEarning));

    await tx.payout.update({
      where: { id: payoutId },
      data: {
        amount: newAmount,
      },
    });

    await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        payoutStatus: PayoutStatus.UNPAID,
      },
    });

    return {
      payoutId,
      subOrderId,
      removedEarning: Number(link.subOrder.vendorEarning),
      updatedPayoutAmount: newAmount,
    };
  });
};

export const PayoutSubOrderService = {
  getAllPayoutSubOrdersAdmin,
  getVendorPayoutSubOrders,
  getPayoutSubOrdersByPayoutId,
  getPayoutSubOrdersBySubOrderId,
  getPayoutSubOrderByIds,
  addSubOrderToPayout,
  removeSubOrderFromPayout,
};
