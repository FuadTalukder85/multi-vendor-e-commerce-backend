import status from "http-status";
import {
  PaymentStatus,
  ProductStatus,
  SubOrderStatus,
  PayoutStatus,
  VendorStatus,
} from "../../../generated/prisma/enums";
import { OrderModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { IRequestUser } from "../../types/request.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { orderFilterableFields, orderSearchableFields, standardOrderInclude } from "./order.constant";
import { ICreateOrderPayload, IUpdatePaymentStatusPayload } from "./order.interface";
import { CouponService } from "../coupon/coupon.service";
import { CouponUsageLogService } from "../couponUsageLog/couponUsageLog.service";

const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${randomPart}`;
};

const createOrder = async (user: IRequestUser, payload: ICreateOrderPayload) => {
  let orderItemsToProcess = payload.items;

  // 1. If selectedCartItemIds provided, resolve from user's CartItem database records
  if (payload.selectedCartItemIds && payload.selectedCartItemIds.length > 0) {
    const cartItems = await prisma.cartItem.findMany({
      where: {
        id: { in: payload.selectedCartItemIds },
        userId: user.userId,
      },
    });

    if (cartItems.length !== payload.selectedCartItemIds.length) {
      throw new AppError(
        status.BAD_REQUEST,
        "One or more selected cart items were not found or do not belong to your account",
      );
    }

    orderItemsToProcess = cartItems.map((ci) => ({
      productId: ci.productId,
      variantId: ci.variantId || undefined,
      quantity: ci.quantity,
    }));
  }

  if (!orderItemsToProcess || orderItemsToProcess.length === 0) {
    throw new AppError(status.BAD_REQUEST, "Order must contain at least one item");
  }

  // Validate shipping address if provided
  if (payload.shippingAddressId) {
    const address = await prisma.address.findFirst({
      where: {
        id: payload.shippingAddressId,
        userId: user.userId,
      },
    });

    if (!address) {
      throw new AppError(status.BAD_REQUEST, "Invalid shipping address provided");
    }
  }

  // Fetch unique product IDs from DB (never trust frontend prices or vendors)
  const productIds = Array.from(new Set(orderItemsToProcess.map((i) => i.productId)));
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      variants: true,
      vendor: {
        select: {
          id: true,
          status: true,
          commissionRate: true,
        },
      },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all items & compute prices
  interface IProcessedItem {
    productId: string;
    variantId?: string | null;
    name: string;
    price: number;
    quantity: number;
    vendorId: string;
  }

  const processedItems: IProcessedItem[] = [];

  for (const item of orderItemsToProcess) {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError(status.NOT_FOUND, `Product not found with id: ${item.productId}`);
    }

    if (product.status !== ProductStatus.ACTIVE) {
      throw new AppError(status.BAD_REQUEST, `Product "${product.title}" is currently not available for purchase`);
    }

    if (product.vendor.status !== VendorStatus.APPROVED) {
      throw new AppError(status.BAD_REQUEST, `Vendor for product "${product.title}" is currently not accepting orders`);
    }

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);

      if (!variant) {
        throw new AppError(status.NOT_FOUND, `Variant not found for product "${product.title}"`);
      }

      if (variant.stock < item.quantity) {
        throw new AppError(
          status.BAD_REQUEST,
          `Insufficient stock for "${product.title}" (${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`,
        );
      }

      processedItems.push({
        productId: product.id,
        variantId: variant.id,
        name: `${product.title} (${variant.sku})`,
        price: Number(variant.price),
        quantity: item.quantity,
        vendorId: product.vendorId,
      });
    } else {
      if (product.totalStock < item.quantity) {
        throw new AppError(
          status.BAD_REQUEST,
          `Insufficient stock for "${product.title}". Available: ${product.totalStock}, Requested: ${item.quantity}`,
        );
      }

      const activePrice = product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice);

      processedItems.push({
        productId: product.id,
        variantId: null,
        name: product.title,
        price: activePrice,
        quantity: item.quantity,
        vendorId: product.vendorId,
      });
    }
  }

  // Group items by vendor to calculate sub-orders
  const vendorGroupMap = new Map<string, IProcessedItem[]>();
  for (const item of processedItems) {
    const group = vendorGroupMap.get(item.vendorId) || [];
    group.push(item);
    vendorGroupMap.set(item.vendorId, group);
  }

  interface IVendorSubOrderData {
    vendorId: string;
    subtotal: number;
    commissionAmount: number;
    vendorEarning: number;
    items: IProcessedItem[];
  }

  const vendorSubOrders: IVendorSubOrderData[] = [];
  let totalOrderAmount = 0;

  for (const [vendorId, items] of vendorGroupMap.entries()) {
    const firstProduct = products.find((p) => p.vendorId === vendorId);
    const commissionRate = firstProduct?.vendor?.commissionRate ? Number(firstProduct.vendor.commissionRate) : 10;

    const subtotal = Number(items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0).toFixed(2));
    const commissionAmount = Number(((subtotal * commissionRate) / 100).toFixed(2));
    const vendorEarning = Number((subtotal - commissionAmount).toFixed(2));

    totalOrderAmount = Number((totalOrderAmount + subtotal).toFixed(2));

    vendorSubOrders.push({
      vendorId,
      subtotal,
      commissionAmount,
      vendorEarning,
      items,
    });
  }

  // Validate and calculate coupon discount if provided
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;

  if (payload.couponCode) {
    const couponValidation = await CouponService.validateAndApplyCoupon(
      {
        code: payload.couponCode,
        items: processedItems.map((item) => ({
          productId: item.productId,
          vendorId: item.vendorId,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: totalOrderAmount,
      },
      user.userId,
    );

    couponDiscount = couponValidation.discountAmount;
    appliedCouponCode = couponValidation.coupon.code;
    totalOrderAmount = Number(Math.max(0, totalOrderAmount - couponDiscount).toFixed(2));
  }

  const orderNumber = generateOrderNumber();

  // Execute database transaction: atomic stock decrement, create Order, SubOrders, OrderItems, CouponUsageLog, & clean up selected cart items
  return await prisma.$transaction(async (tx) => {
    // 1. Concurrency-safe atomic stock decrement
    for (const item of processedItems) {
      if (item.variantId) {
        const variantUpdate = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (variantUpdate.count === 0) {
          throw new AppError(
            status.BAD_REQUEST,
            `Insufficient stock for "${item.name}". Stock was changed or exhausted by another order.`,
          );
        }

        const productUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            totalStock: { gte: item.quantity },
          },
          data: {
            totalStock: { decrement: item.quantity },
          },
        });

        if (productUpdate.count === 0) {
          throw new AppError(
            status.BAD_REQUEST,
            `Insufficient total stock for product "${item.name}".`,
          );
        }
      } else {
        const productUpdate = await tx.product.updateMany({
          where: {
            id: item.productId,
            totalStock: { gte: item.quantity },
          },
          data: {
            totalStock: { decrement: item.quantity },
          },
        });

        if (productUpdate.count === 0) {
          throw new AppError(
            status.BAD_REQUEST,
            `Insufficient stock for product "${item.name}". Stock was changed or exhausted by another order.`,
          );
        }
      }
    }

    // 2. Create Order with nested SubOrders and OrderItems
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: user.userId,
        shippingAddressId: payload.shippingAddressId ?? null,
        totalAmount: totalOrderAmount,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: payload.paymentMethod ?? null,
        paymentIntentId: payload.paymentIntentId ?? null,
        couponCode: appliedCouponCode,
        couponDiscount: couponDiscount > 0 ? couponDiscount : null,
        subOrders: {
          create: vendorSubOrders.map((subOrder) => ({
            vendorId: subOrder.vendorId,
            subtotal: subOrder.subtotal,
            commissionAmount: subOrder.commissionAmount,
            vendorEarning: subOrder.vendorEarning,
            status: SubOrderStatus.PENDING,
            payoutStatus: PayoutStatus.UNPAID,
            items: {
              create: subOrder.items.map((it) => ({
                productId: it.productId,
                variantId: it.variantId,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
              })),
            },
          })),
        },
      },
      include: standardOrderInclude,
    });

    // 3. Record coupon usage log & atomically increment coupon usedCount
    if (appliedCouponCode) {
      await CouponUsageLogService.recordCouponUsage(
        {
          couponCode: appliedCouponCode,
          userId: user.userId,
          orderId: createdOrder.id,
          discountAmount: couponDiscount,
        },
        tx,
      );
    }

    // 4. Cart Cleanup: Remove ONLY the selected items from the user's cart (unselected remain untouched)
    if (payload.selectedCartItemIds && payload.selectedCartItemIds.length > 0) {
      await tx.cartItem.deleteMany({
        where: {
          id: { in: payload.selectedCartItemIds },
          userId: user.userId,
        },
      });
    }

    return createdOrder;
  });
};

const getMyOrders = async (userId: string, queryParams: IQueryParams) => {
  const orderQuery = new QueryBuilder<OrderModel>(prisma.order, queryParams, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields,
  })
    .where({ customerId: userId })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardOrderInclude);

  return await orderQuery.execute();
};

const getMyOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: userId,
    },
    include: standardOrderInclude,
  });

  if (!order) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  return order;
};

const cancelMyOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: userId,
    },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  // Check if any subOrder has already been shipped or delivered
  const nonCancellable = order.subOrders.some(
    (so) => so.status === SubOrderStatus.SHIPPED || so.status === SubOrderStatus.DELIVERED,
  );

  if (nonCancellable) {
    throw new AppError(
      status.BAD_REQUEST,
      "Order cannot be cancelled because one or more packages are already in transit or delivered",
    );
  }

  return await prisma.$transaction(async (tx) => {
    // Restore stock for all order items
    for (const subOrder of order.subOrders) {
      if (subOrder.status !== SubOrderStatus.CANCELLED) {
        for (const item of subOrder.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { totalStock: { increment: item.quantity } },
          });
        }
      }
    }

    // Cancel all subOrders
    await tx.subOrder.updateMany({
      where: { orderId: order.id },
      data: { status: SubOrderStatus.CANCELLED },
    });

    // Update order payment status to REFUNDED if was PAID, otherwise keep PENDING/FAILED
    const updatedPaymentStatus =
      order.paymentStatus === PaymentStatus.PAID ? PaymentStatus.REFUNDED : order.paymentStatus;

    return await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: updatedPaymentStatus,
      },
      include: standardOrderInclude,
    });
  });
};

const getAllOrdersAdmin = async (queryParams: IQueryParams) => {
  const orderQuery = new QueryBuilder<OrderModel>(prisma.order, queryParams, {
    searchableFields: orderSearchableFields,
    filterableFields: orderFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(standardOrderInclude);

  return await orderQuery.execute();
};

const getOrderByIdAdmin = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: standardOrderInclude,
  });

  if (!order) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  return order;
};

const updatePaymentStatusAdmin = async (orderId: string, payload: IUpdatePaymentStatusPayload) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError(status.NOT_FOUND, "Order not found");
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: payload.paymentStatus,
      paymentIntentId: payload.paymentIntentId ?? order.paymentIntentId,
    },
    include: standardOrderInclude,
  });
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updatePaymentStatusAdmin,
};
