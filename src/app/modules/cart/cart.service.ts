import status from "http-status";
import { ProductStatus, VendorStatus } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  IAddToCartPayload,
  ICartIdentification,
  IGroupedCartItem,
  IGroupedCartResponse,
  IGroupedCartVendor,
  IMergeCartResult,
  IUpdateCartItemPayload,
} from "./cart.interface";

const getOwnerWhereClause = (identification: ICartIdentification) => {
  if (identification.userId) {
    return { userId: identification.userId };
  }
  if (identification.sessionId) {
    return { sessionId: identification.sessionId, userId: null };
  }
  throw new AppError(status.BAD_REQUEST, "Either authenticated user or guest sessionId is required");
};

const addToCart = async (
  identification: ICartIdentification,
  payload: IAddToCartPayload,
) => {
  const { productId, variantId, quantity = 1 } = payload;

  if (quantity < 1) {
    throw new AppError(status.BAD_REQUEST, "Quantity must be at least 1");
  }

  // 1. Validate Product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
      vendor: {
        select: {
          id: true,
          status: true,
          storeName: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError(status.NOT_FOUND, "Product not found");
  }

  if (product.status !== ProductStatus.ACTIVE) {
    throw new AppError(status.BAD_REQUEST, `Product "${product.title}" is currently not available`);
  }

  if (product.vendor.status !== VendorStatus.APPROVED) {
    throw new AppError(status.BAD_REQUEST, `Vendor for "${product.title}" is not active`);
  }

  // 2. Validate Variant (if provided) & determine priceSnapshot
  let priceSnapshot: number;
  let availableStock: number;

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new AppError(status.NOT_FOUND, "Selected product variant was not found");
    }
    priceSnapshot = Number(variant.price);
    availableStock = variant.stock;
  } else {
    priceSnapshot = product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice);
    availableStock = product.totalStock;
  }

  if (availableStock < quantity) {
    throw new AppError(
      status.BAD_REQUEST,
      `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
    );
  }

  const ownerWhere = getOwnerWhereClause(identification);

  // 3. Check if this product/variant is already in the owner's cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      ...ownerWhere,
      productId,
      variantId: variantId || null,
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > availableStock) {
      throw new AppError(
        status.BAD_REQUEST,
        `Cannot add ${quantity} more. Stock limit reached (Available: ${availableStock}, Already in cart: ${existingItem.quantity})`,
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        priceSnapshot, // update snapshot to latest active price
        savedForLater: false, // moving back to active cart if it was saved for later
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                storeName: true,
                storeSlug: true,
                storeLogo: true,
              },
            },
          },
        },
        variant: true,
      },
    });

    return updated;
  }

  // 4. Create new cart item
  const created = await prisma.cartItem.create({
    data: {
      userId: identification.userId ?? null,
      sessionId: identification.userId ? null : (identification.sessionId ?? null),
      productId,
      variantId: variantId || null,
      vendorId: product.vendorId,
      quantity,
      priceSnapshot,
      savedForLater: false,
    },
    include: {
      product: {
        include: {
          vendor: {
            select: {
              id: true,
              storeName: true,
              storeSlug: true,
              storeLogo: true,
            },
          },
        },
      },
      variant: true,
    },
  });

  return created;
};

const getGroupedCart = async (
  identification: ICartIdentification,
): Promise<IGroupedCartResponse> => {
  const ownerWhere = getOwnerWhereClause(identification);

  const cartItems = await prisma.cartItem.findMany({
    where: ownerWhere,
    include: {
      product: {
        include: {
          variants: true,
          vendor: {
            select: {
              id: true,
              storeName: true,
              storeSlug: true,
              storeLogo: true,
              status: true,
            },
          },
        },
      },
      variant: true,
    },
    orderBy: { addedAt: "desc" },
  });

  const activeItems: IGroupedCartItem[] = [];
  const savedForLater: IGroupedCartItem[] = [];

  let hasPriceChanges = false;
  let hasOutOfStockItems = false;
  let hasUnavailableItems = false;

  for (const item of cartItems) {
    const product = item.product;
    const variant = item.variant;

    let isUnavailable = false;
    let unavailabilityReason: string | undefined;

    if (!product || product.status !== ProductStatus.ACTIVE) {
      isUnavailable = true;
      unavailabilityReason = "Product is currently inactive or removed";
    } else if (product.vendor?.status !== VendorStatus.APPROVED) {
      isUnavailable = true;
      unavailabilityReason = "Vendor is currently inactive";
    } else if (item.variantId && !variant) {
      isUnavailable = true;
      unavailabilityReason = "Product variant is no longer available";
    }

    let currentPrice = Number(item.priceSnapshot);
    let availableStock = 0;

    if (!isUnavailable && product) {
      if (variant) {
        currentPrice = Number(variant.price);
        availableStock = variant.stock;
      } else {
        currentPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice);
        availableStock = product.totalStock;
      }
    }

    const priceSnapshotNum = Number(item.priceSnapshot);
    const isPriceChanged = !isUnavailable && Math.abs(currentPrice - priceSnapshotNum) > 0.001;
    const isOutOfStock = !isUnavailable && (availableStock <= 0 || availableStock < item.quantity);

    if (isPriceChanged && !item.savedForLater) hasPriceChanges = true;
    if (isOutOfStock && !item.savedForLater) hasOutOfStockItems = true;
    if (isUnavailable && !item.savedForLater) hasUnavailableItems = true;

    const formattedItem: IGroupedCartItem = {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      vendorId: item.vendorId,
      title: product?.title || "Unavailable Product",
      slug: product?.slug || "",
      image: variant?.image || product?.images?.[0] || null,
      variantSku: variant?.sku || null,
      variantAttributes: (variant?.attributes as Record<string, unknown>) || null,
      quantity: item.quantity,
      priceSnapshot: priceSnapshotNum,
      currentPrice,
      availableStock,
      savedForLater: item.savedForLater,
      isPriceChanged,
      isOutOfStock,
      isUnavailable,
      unavailabilityReason,
      itemSubtotal: Number((currentPrice * item.quantity).toFixed(2)),
      addedAt: item.addedAt,
      updatedAt: item.updatedAt,
    };

    if (item.savedForLater) {
      savedForLater.push(formattedItem);
    } else {
      activeItems.push(formattedItem);
    }
  }

  // Group active items by vendor
  const vendorMap = new Map<string, IGroupedCartVendor>();

  for (const item of activeItems) {
    const rawCartItem = cartItems.find((c) => c.id === item.id);
    const vendorInfo = rawCartItem?.product?.vendor;

    if (!vendorMap.has(item.vendorId)) {
      vendorMap.set(item.vendorId, {
        vendorId: item.vendorId,
        storeName: vendorInfo?.storeName || "Unknown Vendor",
        storeSlug: vendorInfo?.storeSlug || "",
        storeLogo: vendorInfo?.storeLogo || null,
        items: [],
        subtotal: 0,
        itemCount: 0,
        hasIssues: false,
      });
    }

    const group = vendorMap.get(item.vendorId)!;
    group.items.push(item);
    group.subtotal = Number((group.subtotal + item.itemSubtotal).toFixed(2));
    group.itemCount += item.quantity;
    if (item.isOutOfStock || item.isUnavailable) {
      group.hasIssues = true;
    }
  }

  const vendorGroups = Array.from(vendorMap.values());
  const activeSubtotal = Number(
    vendorGroups.reduce((acc, v) => acc + v.subtotal, 0).toFixed(2),
  );
  const totalActiveQuantity = activeItems.reduce((acc, it) => acc + it.quantity, 0);

  return {
    vendorGroups,
    savedForLater,
    summary: {
      totalActiveItems: activeItems.length,
      totalActiveQuantity,
      totalSavedForLaterCount: savedForLater.length,
      subtotal: activeSubtotal,
      hasPriceChanges,
      hasOutOfStockItems,
      hasUnavailableItems,
      canCheckout: !hasOutOfStockItems && !hasUnavailableItems && activeItems.length > 0,
    },
  };
};

const updateCartItem = async (
  identification: ICartIdentification,
  cartItemId: string,
  payload: IUpdateCartItemPayload,
) => {
  const ownerWhere = getOwnerWhereClause(identification);

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      ...ownerWhere,
    },
    include: {
      product: {
        include: {
          variants: true,
        },
      },
      variant: true,
    },
  });

  if (!cartItem) {
    throw new AppError(status.NOT_FOUND, "Cart item not found or unauthorized");
  }

  // If quantity is explicitly 0, remove item
  if (payload.quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
    return { deleted: true, id: cartItemId };
  }

  if (payload.quantity !== undefined && payload.quantity > 0) {
    // Validate stock
    const availableStock = cartItem.variant
      ? cartItem.variant.stock
      : cartItem.product.totalStock;

    if (payload.quantity > availableStock) {
      throw new AppError(
        status.BAD_REQUEST,
        `Cannot update quantity to ${payload.quantity}. Only ${availableStock} in stock.`,
      );
    }
  }

  const updated = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: {
      quantity: payload.quantity !== undefined ? payload.quantity : undefined,
      savedForLater: payload.savedForLater !== undefined ? payload.savedForLater : undefined,
    },
    include: {
      product: true,
      variant: true,
    },
  });

  return updated;
};

const removeCartItem = async (
  identification: ICartIdentification,
  cartItemId: string,
) => {
  const ownerWhere = getOwnerWhereClause(identification);

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      ...ownerWhere,
    },
  });

  if (!cartItem) {
    throw new AppError(status.NOT_FOUND, "Cart item not found or unauthorized");
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return { id: cartItemId, message: "Item removed from cart successfully" };
};

const clearCart = async (identification: ICartIdentification) => {
  const ownerWhere = getOwnerWhereClause(identification);

  const deleted = await prisma.cartItem.deleteMany({
    where: ownerWhere,
  });

  return { count: deleted.count, message: "Cart cleared successfully" };
};

const mergeGuestCartOnLogin = async (
  userId: string,
  sessionId: string,
): Promise<IMergeCartResult> => {
  if (!sessionId) {
    return { mergedCount: 0, cleanedGuestCount: 0, activeItemsCount: 0 };
  }

  // 1. Find all guest cart items
  const guestCartItems = await prisma.cartItem.findMany({
    where: {
      sessionId,
      userId: null,
    },
    include: {
      product: {
        include: {
          variants: true,
          vendor: true,
        },
      },
      variant: true,
    },
  });

  if (guestCartItems.length === 0) {
    const userItemCount = await prisma.cartItem.count({ where: { userId } });
    return { mergedCount: 0, cleanedGuestCount: 0, activeItemsCount: userItemCount };
  }

  // 2. Fetch existing user cart items
  const userCartItems = await prisma.cartItem.findMany({
    where: { userId },
  });

  let mergedCount = 0;
  let cleanedGuestCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const guestItem of guestCartItems) {
      cleanedGuestCount++;

      // Skip inactive/unavailable products or missing variants
      const isProductActive = guestItem.product && guestItem.product.status === ProductStatus.ACTIVE;
      const isVendorActive = guestItem.product?.vendor?.status === VendorStatus.APPROVED;
      const isVariantValid = !guestItem.variantId || guestItem.variant !== null;

      if (!isProductActive || !isVendorActive || !isVariantValid) {
        // Delete invalid guest item
        await tx.cartItem.delete({ where: { id: guestItem.id } });
        continue;
      }

      // Check available stock
      const availableStock = guestItem.variant
        ? guestItem.variant.stock
        : guestItem.product.totalStock;

      if (availableStock <= 0) {
        await tx.cartItem.delete({ where: { id: guestItem.id } });
        continue;
      }

      // Check if user already has this (productId, variantId)
      const existingUserItem = userCartItems.find(
        (u) =>
          u.productId === guestItem.productId &&
          (u.variantId || null) === (guestItem.variantId || null),
      );

      if (existingUserItem) {
        // Merge quantity (capped at availableStock)
        const combinedQuantity = Math.min(
          existingUserItem.quantity + guestItem.quantity,
          availableStock,
        );

        // Update latest priceSnapshot
        const currentPrice = guestItem.variant
          ? Number(guestItem.variant.price)
          : guestItem.product.discountPrice
            ? Number(guestItem.product.discountPrice)
            : Number(guestItem.product.basePrice);

        await tx.cartItem.update({
          where: { id: existingUserItem.id },
          data: {
            quantity: combinedQuantity,
            priceSnapshot: currentPrice,
            savedForLater: false,
          },
        });

        // Delete guest item
        await tx.cartItem.delete({ where: { id: guestItem.id } });
        mergedCount++;
      } else {
        // Transfer guest cart item to user
        const cappedQuantity = Math.min(guestItem.quantity, availableStock);
        const currentPrice = guestItem.variant
          ? Number(guestItem.variant.price)
          : guestItem.product.discountPrice
            ? Number(guestItem.product.discountPrice)
            : Number(guestItem.product.basePrice);

        await tx.cartItem.update({
          where: { id: guestItem.id },
          data: {
            userId,
            sessionId: null,
            quantity: cappedQuantity,
            priceSnapshot: currentPrice,
          },
        });
        mergedCount++;
      }
    }

    // Safety sweep: remove any remaining rows tied to this sessionId
    await tx.cartItem.deleteMany({
      where: { sessionId },
    });
  });

  const activeItemsCount = await prisma.cartItem.count({ where: { userId } });

  return {
    mergedCount,
    cleanedGuestCount,
    activeItemsCount,
  };
};

export const CartService = {
  addToCart,
  getGroupedCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  mergeGuestCartOnLogin,
};
