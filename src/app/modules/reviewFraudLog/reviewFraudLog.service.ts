import status from "http-status";
import { ReviewFraudStatus, Role, SubOrderStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  reviewFraudLogFilterableFields,
  reviewFraudLogSearchableFields,
} from "./reviewFraudLog.constant";
import {
  IBatchAnalyzeReviewFraudPayload,
  ICreateReviewFraudLogPayload,
  IUpdateReviewFraudLogPayload,
} from "./reviewFraudLog.interface";

const analyzeReviewFraud = async (
  reviewId: string,
  deviceId?: string,
  ipAddress?: string,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      customer: true,
      product: {
        include: {
          vendor: true,
        },
      },
      subOrder: true,
    },
  });

  if (!review) {
    throw new AppError(status.NOT_FOUND, "Review not found");
  }

  // 1. Verify purchase
  let hasVerifiedPurchase = false;
  if (review.subOrderId && review.subOrder?.status === SubOrderStatus.DELIVERED) {
    hasVerifiedPurchase = true;
  } else {
    // Check if customer has any delivered suborder for this product
    const deliveredOrderCount = await prisma.orderItem.count({
      where: {
        productId: review.productId,
        subOrder: {
          order: {
            customerId: review.customerId,
          },
          status: SubOrderStatus.DELIVERED,
        },
      },
    });
    hasVerifiedPurchase = deliveredOrderCount > 0;
  }

  // 2. Check seller relationship flag (vendor owner reviewing own product)
  const sellerRelationshipFlag = review.product.vendor.userId === review.customerId;

  // 3. Reviewer account age
  const reviewerAccountAgeDays = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(review.customer.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  // 4. Calculate suspicion score (0 - 100)
  let calculatedScore = 0;

  if (!hasVerifiedPurchase) {
    calculatedScore += 35;
  }

  if (sellerRelationshipFlag) {
    calculatedScore += 60;
  }

  if (reviewerAccountAgeDays < 3) {
    calculatedScore += 20;
  }

  if ((review.rating === 1 || review.rating === 5) && (!review.comment || review.comment.trim().length === 0)) {
    calculatedScore += 15;
  }

  const finalScore = Math.min(100, Math.max(0, calculatedScore));

  let fraudStatus: ReviewFraudStatus = ReviewFraudStatus.CLEAN;
  if (sellerRelationshipFlag || finalScore >= 75) {
    fraudStatus = ReviewFraudStatus.REMOVED;
  } else if (finalScore >= 35) {
    fraudStatus = ReviewFraudStatus.FLAGGED;
  }

  return await prisma.reviewFraudLog.upsert({
    where: { reviewId },
    update: {
      reviewerId: review.customerId,
      productId: review.productId,
      deviceId: deviceId ?? undefined,
      ipAddress: ipAddress ?? undefined,
      reviewerAccountAgeDays,
      hasVerifiedPurchase,
      sellerRelationshipFlag,
      suspicionScore: finalScore,
      status: fraudStatus,
    },
    create: {
      reviewId,
      reviewerId: review.customerId,
      productId: review.productId,
      deviceId: deviceId ?? null,
      ipAddress: ipAddress ?? null,
      reviewerAccountAgeDays,
      hasVerifiedPurchase,
      sellerRelationshipFlag,
      suspicionScore: finalScore,
      status: fraudStatus,
    },
    include: {
      review: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          vendorId: true,
        },
      },
    },
  });
};

const getReviewFraudLogByReviewId = async (
  reviewId: string,
  currentUserId?: string,
  role?: Role,
) => {
  const log = await prisma.reviewFraudLog.findUnique({
    where: { reviewId },
    include: {
      review: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          vendorId: true,
        },
      },
    },
  });

  if (!log) {
    return await analyzeReviewFraud(reviewId);
  }

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!isAdmin && log.reviewerId !== currentUserId) {
    // Check if vendor owner
    const product = await prisma.product.findUnique({
      where: { id: log.productId },
      select: { vendor: { select: { userId: true } } },
    });

    if (product?.vendor.userId !== currentUserId) {
      throw new AppError(status.FORBIDDEN, "Forbidden access to review fraud log");
    }
  }

  return log;
};

const getReviewFraudLogsByProductId = async (
  productId: string,
  query: IQueryParams,
) => {
  const queryWithProduct = {
    ...query,
    productId,
  };

  const reviewFraudQuery = new QueryBuilder(
    prisma.reviewFraudLog,
    queryWithProduct,
    {
      searchableFields: reviewFraudLogSearchableFields,
      filterableFields: reviewFraudLogFilterableFields,
    },
  )
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      review: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    });

  return await reviewFraudQuery.execute();
};

const getAllReviewFraudLogs = async (query: IQueryParams) => {
  const reviewFraudQuery = new QueryBuilder(prisma.reviewFraudLog, query, {
    searchableFields: reviewFraudLogSearchableFields,
    filterableFields: reviewFraudLogFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      review: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          vendorId: true,
        },
      },
    });

  return await reviewFraudQuery.execute();
};

const getReviewFraudLogById = async (id: string) => {
  const log = await prisma.reviewFraudLog.findUnique({
    where: { id },
    include: {
      review: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          vendorId: true,
        },
      },
    },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Review fraud log not found");
  }

  return log;
};

const createReviewFraudLog = async (payload: ICreateReviewFraudLogPayload) => {
  const existingLog = await prisma.reviewFraudLog.findUnique({
    where: { reviewId: payload.reviewId },
  });

  if (existingLog) {
    throw new AppError(
      status.CONFLICT,
      "Review fraud log already exists for this reviewId",
    );
  }

  const suspicionScore = payload.suspicionScore ?? 0;
  let fraudStatus = payload.status;
  if (!fraudStatus) {
    if (payload.sellerRelationshipFlag || suspicionScore >= 75) {
      fraudStatus = ReviewFraudStatus.REMOVED;
    } else if (suspicionScore >= 35) {
      fraudStatus = ReviewFraudStatus.FLAGGED;
    } else {
      fraudStatus = ReviewFraudStatus.CLEAN;
    }
  }

  return await prisma.reviewFraudLog.create({
    data: {
      reviewId: payload.reviewId,
      reviewerId: payload.reviewerId,
      productId: payload.productId,
      deviceId: payload.deviceId ?? null,
      ipAddress: payload.ipAddress ?? null,
      reviewerAccountAgeDays: payload.reviewerAccountAgeDays ?? null,
      hasVerifiedPurchase: payload.hasVerifiedPurchase ?? false,
      sellerRelationshipFlag: payload.sellerRelationshipFlag ?? false,
      suspicionScore,
      status: fraudStatus,
    },
    include: {
      review: true,
    },
  });
};

const updateReviewFraudLog = async (
  id: string,
  payload: IUpdateReviewFraudLogPayload,
) => {
  const log = await prisma.reviewFraudLog.findUnique({
    where: { id },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Review fraud log not found");
  }

  const hasVerifiedPurchase =
    payload.hasVerifiedPurchase !== undefined
      ? payload.hasVerifiedPurchase
      : log.hasVerifiedPurchase;

  const sellerRelationshipFlag =
    payload.sellerRelationshipFlag !== undefined
      ? payload.sellerRelationshipFlag
      : log.sellerRelationshipFlag;

  const suspicionScore =
    payload.suspicionScore !== undefined ? payload.suspicionScore : log.suspicionScore;

  let fraudStatus = payload.status ?? log.status;
  if (payload.suspicionScore !== undefined && payload.status === undefined) {
    if (sellerRelationshipFlag || suspicionScore >= 75) {
      fraudStatus = ReviewFraudStatus.REMOVED;
    } else if (suspicionScore >= 35) {
      fraudStatus = ReviewFraudStatus.FLAGGED;
    } else {
      fraudStatus = ReviewFraudStatus.CLEAN;
    }
  }

  return await prisma.reviewFraudLog.update({
    where: { id },
    data: {
      hasVerifiedPurchase,
      sellerRelationshipFlag,
      suspicionScore,
      status: fraudStatus,
    },
    include: {
      review: true,
    },
  });
};

const batchAnalyzeReviewFraud = async (payload?: IBatchAnalyzeReviewFraudPayload) => {
  let targetReviewIds: string[] = [];

  if (payload?.reviewIds && payload.reviewIds.length > 0) {
    targetReviewIds = payload.reviewIds;
  } else if (payload?.productId) {
    const reviews = await prisma.review.findMany({
      where: { productId: payload.productId },
      select: { id: true },
    });
    targetReviewIds = reviews.map((r) => r.id);
  } else {
    const reviews = await prisma.review.findMany({
      select: { id: true },
    });
    targetReviewIds = reviews.map((r) => r.id);
  }

  const results = [];
  for (const reviewId of targetReviewIds) {
    try {
      const analyzed = await analyzeReviewFraud(reviewId);
      results.push(analyzed);
    } catch {
      // Skip if individual analysis fails
    }
  }

  return {
    analyzedCount: results.length,
    logs: results,
  };
};

const deleteReviewFraudLog = async (id: string) => {
  const log = await prisma.reviewFraudLog.findUnique({
    where: { id },
  });

  if (!log) {
    throw new AppError(status.NOT_FOUND, "Review fraud log not found");
  }

  return await prisma.reviewFraudLog.delete({
    where: { id },
  });
};

const getFlaggedReviews = async (query: IQueryParams) => {
  const queryWithFlagged = {
    ...query,
    status: ReviewFraudStatus.FLAGGED,
  };

  const reviewFraudQuery = new QueryBuilder(
    prisma.reviewFraudLog,
    queryWithFlagged,
    {
      searchableFields: reviewFraudLogSearchableFields,
      filterableFields: reviewFraudLogFilterableFields,
    },
  )
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      review: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          vendorId: true,
        },
      },
    });

  return await reviewFraudQuery.execute();
};

export const ReviewFraudLogService = {
  analyzeReviewFraud,
  getReviewFraudLogByReviewId,
  getReviewFraudLogsByProductId,
  getAllReviewFraudLogs,
  getReviewFraudLogById,
  createReviewFraudLog,
  updateReviewFraudLog,
  batchAnalyzeReviewFraud,
  deleteReviewFraudLog,
  getFlaggedReviews,
};
