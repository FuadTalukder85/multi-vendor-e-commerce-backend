import status from "http-status";
import { Role, VendorStatus } from "../../../generated/prisma/enums";
import { CouponModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { IRequestUser } from "../../types/request.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { couponFilterableFields, couponSearchableFields, standardCouponInclude } from "./coupon.constant";
import {
  ICreateCouponPayload,
  IUpdateCouponPayload,
  IValidateCouponPayload,
  IValidateCouponResult,
} from "./coupon.interface";

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

const createCoupon = async (user: IRequestUser, payload: ICreateCouponPayload) => {
  const normalizedCode = payload.code.trim().toUpperCase();

  // Check code uniqueness
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (existingCoupon) {
    throw new AppError(status.CONFLICT, `Coupon code '${normalizedCode}' already exists`);
  }

  let finalVendorId: string | null = null;

  if (user.role === Role.VENDOR) {
    const vendorId = await resolveVendorIdForUser(user);
    if (payload.scope === "platform") {
      throw new AppError(status.FORBIDDEN, "Vendors can only create vendor-scoped coupons");
    }
    finalVendorId = vendorId;
  } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    if (payload.scope === "vendor") {
      if (!payload.vendorId) {
        throw new AppError(status.BAD_REQUEST, "vendorId is required for vendor-scoped coupons");
      }
      const vendorExists = await prisma.vendorProfile.findUnique({
        where: { id: payload.vendorId },
        select: { id: true },
      });
      if (!vendorExists) {
        throw new AppError(status.NOT_FOUND, "Specified vendor does not exist");
      }
      finalVendorId = payload.vendorId;
    } else {
      finalVendorId = null;
    }
  }

  return await prisma.coupon.create({
    data: {
      code: normalizedCode,
      scope: payload.scope,
      vendorId: finalVendorId,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minPurchase: payload.minPurchase ?? null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      usageLimit: payload.usageLimit ?? null,
      isActive: payload.isActive ?? true,
    },
    include: standardCouponInclude,
  });
};

const getAllCouponsAdmin = async (queryParams: IQueryParams) => {
  const couponQuery = new QueryBuilder<CouponModel>(prisma.coupon, queryParams, {
    searchableFields: couponSearchableFields,
    filterableFields: couponFilterableFields,
  });

  return await couponQuery.search().filter().sort().paginate().include(standardCouponInclude).execute();
};

const getVendorCoupons = async (user: IRequestUser, queryParams: IQueryParams) => {
  const vendorId = await resolveVendorIdForUser(user);

  const couponQuery = new QueryBuilder<CouponModel>(
    prisma.coupon,
    { ...queryParams, vendorId },
    {
      searchableFields: couponSearchableFields,
      filterableFields: couponFilterableFields,
    },
  );

  return await couponQuery.search().filter().sort().paginate().include(standardCouponInclude).execute();
};

const getPublicCoupons = async (queryParams: IQueryParams) => {
  const now = new Date();

  // Find active coupons that haven't expired
  const whereConditions: Record<string, unknown> = {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  if (queryParams.vendorId) {
    whereConditions.AND = [
      {
        OR: [{ scope: "platform" }, { vendorId: queryParams.vendorId as string }],
      },
    ];
  } else {
    // Default public: show platform-wide active coupons
    whereConditions.scope = "platform";
  }

  const couponQuery = new QueryBuilder<CouponModel>(prisma.coupon, queryParams, {
    searchableFields: couponSearchableFields,
    filterableFields: couponFilterableFields,
  });

  couponQuery.where(whereConditions);

  return await couponQuery
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      vendor: {
        select: {
          id: true,
          storeName: true,
          storeSlug: true,
          storeLogo: true,
        },
      },
    })
    .execute();
};

const getCouponById = async (id: string, user?: IRequestUser) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: standardCouponInclude,
  });

  if (!coupon) {
    throw new AppError(status.NOT_FOUND, "Coupon not found");
  }

  if (user && user.role === Role.VENDOR && coupon.scope === "vendor") {
    const vendorId = await resolveVendorIdForUser(user);
    if (coupon.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You cannot access coupons belonging to another store");
    }
  }

  return coupon;
};

const getCouponByCode = async (code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
    include: standardCouponInclude,
  });

  if (!coupon) {
    throw new AppError(status.NOT_FOUND, `Coupon '${normalizedCode}' not found`);
  }

  return coupon;
};

const updateCoupon = async (id: string, user: IRequestUser, payload: IUpdateCouponPayload) => {
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!existingCoupon) {
    throw new AppError(status.NOT_FOUND, "Coupon not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await resolveVendorIdForUser(user);
    if (existingCoupon.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You can only update coupons belonging to your store");
    }
    if (payload.scope === "platform") {
      throw new AppError(status.FORBIDDEN, "Vendors cannot change coupon scope to platform");
    }
  }

  if (payload.code && payload.code.trim().toUpperCase() !== existingCoupon.code) {
    const codeTaken = await prisma.coupon.findUnique({
      where: { code: payload.code.trim().toUpperCase() },
    });

    if (codeTaken && codeTaken.id !== id) {
      throw new AppError(status.CONFLICT, `Coupon code '${payload.code}' is already taken`);
    }
  }

  const updateData: Record<string, unknown> = {};

  if (payload.code !== undefined) updateData.code = payload.code.trim().toUpperCase();
  if (payload.scope !== undefined) updateData.scope = payload.scope;
  if (payload.discountType !== undefined) updateData.discountType = payload.discountType;
  if (payload.discountValue !== undefined) updateData.discountValue = payload.discountValue;
  if (payload.minPurchase !== undefined) updateData.minPurchase = payload.minPurchase;
  if (payload.expiresAt !== undefined) {
    updateData.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }
  if (payload.usageLimit !== undefined) updateData.usageLimit = payload.usageLimit;
  if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    if (payload.vendorId !== undefined) {
      updateData.vendorId = payload.vendorId;
    }
  }

  return await prisma.coupon.update({
    where: { id },
    data: updateData,
    include: standardCouponInclude,
  });
};

const toggleCouponStatus = async (id: string, user: IRequestUser, isActive?: boolean) => {
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!existingCoupon) {
    throw new AppError(status.NOT_FOUND, "Coupon not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await resolveVendorIdForUser(user);
    if (existingCoupon.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You can only modify coupons belonging to your store");
    }
  }

  const newStatus = isActive !== undefined ? isActive : !existingCoupon.isActive;

  return await prisma.coupon.update({
    where: { id },
    data: { isActive: newStatus },
    include: standardCouponInclude,
  });
};

const deleteCoupon = async (id: string, user: IRequestUser) => {
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id },
  });

  if (!existingCoupon) {
    throw new AppError(status.NOT_FOUND, "Coupon not found");
  }

  if (user.role === Role.VENDOR) {
    const vendorId = await resolveVendorIdForUser(user);
    if (existingCoupon.vendorId !== vendorId) {
      throw new AppError(status.FORBIDDEN, "You can only delete coupons belonging to your store");
    }
  }

  return await prisma.coupon.delete({
    where: { id },
  });
};

const validateAndApplyCoupon = async (
  payload: IValidateCouponPayload,
  userId?: string,
): Promise<IValidateCouponResult> => {
  const normalizedCode = payload.code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new AppError(status.NOT_FOUND, `Coupon '${normalizedCode}' does not exist`);
  }

  if (!coupon.isActive) {
    throw new AppError(status.BAD_REQUEST, `Coupon '${normalizedCode}' is inactive`);
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
    throw new AppError(status.BAD_REQUEST, `Coupon '${normalizedCode}' has expired`);
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(status.BAD_REQUEST, `Coupon '${normalizedCode}' has reached its overall redemption limit`);
  }

  // Check per-user usage if userId is available
  if (userId) {
    const userUsageCount = await prisma.couponUsageLog.count({
      where: {
        couponCode: coupon.code,
        userId,
      },
    });

    // Default per-user limit check: 1 use per user unless specified
    if (userUsageCount >= 1) {
      throw new AppError(status.BAD_REQUEST, `You have already used coupon '${normalizedCode}'`);
    }
  }

  let eligibleSubtotal = 0;

  if (payload.items && payload.items.length > 0) {
    if (coupon.scope === "vendor") {
      const vendorItems = payload.items.filter((item) => item.vendorId === coupon.vendorId);

      if (vendorItems.length === 0) {
        throw new AppError(
          status.BAD_REQUEST,
          "This coupon is only valid for items sold by the designated vendor store",
        );
      }

      eligibleSubtotal = Number(vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    } else {
      eligibleSubtotal = Number(payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    }
  } else if (payload.subtotal !== undefined) {
    eligibleSubtotal = Number(payload.subtotal.toFixed(2));
  } else {
    throw new AppError(status.BAD_REQUEST, "Either cart items or a valid subtotal must be provided");
  }

  // Minimum purchase check
  if (coupon.minPurchase !== null && eligibleSubtotal < Number(coupon.minPurchase)) {
    throw new AppError(
      status.BAD_REQUEST,
      `Minimum purchase amount of $${Number(coupon.minPurchase).toFixed(2)} required for coupon '${coupon.code}' (Eligible cart: $${eligibleSubtotal.toFixed(2)})`,
    );
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Number(((eligibleSubtotal * Number(coupon.discountValue)) / 100).toFixed(2));
  } else {
    discountAmount = Number(Math.min(Number(coupon.discountValue), eligibleSubtotal).toFixed(2));
  }

  const finalPayable = Number(Math.max(0, eligibleSubtotal - discountAmount).toFixed(2));

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      scope: coupon.scope,
      vendorId: coupon.vendorId,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minPurchase: coupon.minPurchase !== null ? Number(coupon.minPurchase) : null,
      expiresAt: coupon.expiresAt,
    },
    eligibleSubtotal,
    discountAmount,
    finalPayable,
    message: `Coupon '${coupon.code}' applied successfully. Saved $${discountAmount.toFixed(2)}!`,
  };
};

export const CouponService = {
  createCoupon,
  getAllCouponsAdmin,
  getVendorCoupons,
  getPublicCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  validateAndApplyCoupon,
  resolveVendorIdForUser,
};
