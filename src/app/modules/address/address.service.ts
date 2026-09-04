import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { AddressModel } from "../../../generated/prisma/models";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { addressFilterableFields, addressSearchableFields } from "./address.constant";
import { ICreateAddressPayload, IUpdateAddressPayload } from "./address.interface";

const createAddress = async (userId: string, payload: ICreateAddressPayload) => {
  const existingCount = await prisma.address.count({
    where: { userId },
  });

  // If this is the user's first address, always make it the default
  const shouldBeDefault = existingCount === 0 ? true : Boolean(payload.isDefault);

  return await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const createdAddress = await tx.address.create({
      data: {
        userId,
        label: payload.label,
        street: payload.street,
        city: payload.city,
        zip: payload.zip,
        country: payload.country,
        phone: payload.phone,
        isDefault: shouldBeDefault,
      },
    });

    return createdAddress;
  });
};

const getMyAddresses = async (userId: string) => {
  return await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

const getAddressById = async (userId: string, addressId: string, userRole: Role) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found");
  }

  // Ownership check: only owner or admin can view
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && address.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "You do not have permission to view this address");
  }

  return address;
};

const updateAddress = async (userId: string, addressId: string, payload: IUpdateAddressPayload, userRole: Role) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found");
  }

  // Ownership check: only owner or admin can update
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && address.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "You do not have permission to update this address");
  }

  const targetUserId = address.userId;

  return await prisma.$transaction(async (tx) => {
    if (payload.isDefault === true) {
      await tx.address.updateMany({
        where: { userId: targetUserId },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await tx.address.update({
      where: { id: addressId },
      data: {
        ...(payload.label !== undefined && { label: payload.label }),
        ...(payload.street !== undefined && { street: payload.street }),
        ...(payload.city !== undefined && { city: payload.city }),
        ...(payload.zip !== undefined && { zip: payload.zip }),
        ...(payload.country !== undefined && { country: payload.country }),
        ...(payload.phone !== undefined && { phone: payload.phone }),
        ...(payload.isDefault !== undefined && { isDefault: payload.isDefault }),
      },
    });

    return updatedAddress;
  });
};

const setDefaultAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found or does not belong to you");
  }

  return await prisma.$transaction(async (tx) => {
    // Unset all user's addresses
    await tx.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set this address to default
    const updatedAddress = await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return updatedAddress;
  });
};

const deleteAddress = async (userId: string, addressId: string, userRole: Role) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address) {
    throw new AppError(status.NOT_FOUND, "Address not found");
  }

  // Ownership check: only owner or admin can delete
  if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && address.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "You do not have permission to delete this address");
  }

  const targetUserId = address.userId;

  return await prisma.$transaction(async (tx) => {
    const deletedAddress = await tx.address.delete({
      where: { id: addressId },
    });

    // If the deleted address was default, promote the newest remaining address to default
    if (address.isDefault) {
      const nextDefault = await tx.address.findFirst({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await tx.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return deletedAddress;
  });
};

const getAllAddresses = async (queryParams: IQueryParams) => {
  const addressQuery = new QueryBuilder<AddressModel>(prisma.address, queryParams, {
    searchableFields: addressSearchableFields,
    filterableFields: addressFilterableFields,
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    });

  return await addressQuery.execute();
};

export const AddressService = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getAllAddresses,
};
