import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  deviceFingerprintUserFilterableFields,
  deviceFingerprintUserSearchableFields,
} from "./deviceFingerprintUser.constant";
import {
  ILinkDeviceUserPayload,
  IUpdateDeviceUserPayload,
} from "./deviceFingerprintUser.interface";

const linkDeviceToUser = async (
  payload: ILinkDeviceUserPayload,
  currentUserId?: string,
  role?: Role,
) => {
  let targetDeviceId = payload.deviceFingerprintId;

  if (!targetDeviceId && payload.deviceId) {
    const foundDevice = await prisma.deviceFingerprint.findUnique({
      where: { deviceId: payload.deviceId },
    });

    if (!foundDevice) {
      throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
    }
    targetDeviceId = foundDevice.id;
  }

  if (!targetDeviceId) {
    throw new AppError(
      status.BAD_REQUEST,
      "Either valid deviceFingerprintId or deviceId is required",
    );
  }

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  const targetUserId = (isAdmin && payload.userId) ? payload.userId : currentUserId;

  if (!targetUserId) {
    throw new AppError(status.UNAUTHORIZED, "User context is required to link device");
  }

  // Ensure user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError(status.NOT_FOUND, "Target user not found");
  }

  return await prisma.deviceFingerprintUser.upsert({
    where: {
      deviceFingerprintId_userId: {
        deviceFingerprintId: targetDeviceId,
        userId: targetUserId,
      },
    },
    update: {
      address: payload.address ?? undefined,
      phone: payload.phone ?? undefined,
      paymentFingerprint: payload.paymentFingerprint ?? undefined,
      lastSeenAt: new Date(),
    },
    create: {
      deviceFingerprintId: targetDeviceId,
      userId: targetUserId,
      address: payload.address ?? null,
      phone: payload.phone ?? null,
      paymentFingerprint: payload.paymentFingerprint ?? null,
    },
    include: {
      device: true,
      user: {
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

const getMyDevices = async (userId: string) => {
  return await prisma.deviceFingerprintUser.findMany({
    where: { userId },
    include: {
      device: true,
    },
    orderBy: { lastSeenAt: "desc" },
  });
};

const getDevicesByUserId = async (targetUserId: string) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  return await prisma.deviceFingerprintUser.findMany({
    where: { userId: targetUserId },
    include: {
      device: true,
    },
    orderBy: { lastSeenAt: "desc" },
  });
};

const getUsersByDeviceFingerprintId = async (deviceFingerprintId: string) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { id: deviceFingerprintId },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  return await prisma.deviceFingerprintUser.findMany({
    where: { deviceFingerprintId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
        },
      },
    },
    orderBy: { lastSeenAt: "desc" },
  });
};

const getAllDeviceFingerprintUsers = async (query: IQueryParams) => {
  const deviceUserQuery = new QueryBuilder(prisma.deviceFingerprintUser, query, {
    searchableFields: deviceFingerprintUserSearchableFields,
    filterableFields: deviceFingerprintUserFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      device: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    });

  return await deviceUserQuery.execute();
};

const getDeviceFingerprintUserById = async (
  id: string,
  currentUserId?: string,
  role?: Role,
) => {
  const linkRecord = await prisma.deviceFingerprintUser.findUnique({
    where: { id },
    include: {
      device: true,
      user: {
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

  if (!linkRecord) {
    throw new AppError(status.NOT_FOUND, "Device-user link record not found");
  }

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!isAdmin && linkRecord.userId !== currentUserId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to device link record");
  }

  return linkRecord;
};

const updateDeviceFingerprintUser = async (
  id: string,
  payload: IUpdateDeviceUserPayload,
  currentUserId?: string,
  role?: Role,
) => {
  const linkRecord = await prisma.deviceFingerprintUser.findUnique({
    where: { id },
  });

  if (!linkRecord) {
    throw new AppError(status.NOT_FOUND, "Device-user link record not found");
  }

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!isAdmin && linkRecord.userId !== currentUserId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to device link record");
  }

  return await prisma.deviceFingerprintUser.update({
    where: { id },
    data: {
      address: payload.address !== undefined ? payload.address : linkRecord.address,
      phone: payload.phone !== undefined ? payload.phone : linkRecord.phone,
      paymentFingerprint:
        payload.paymentFingerprint !== undefined
          ? payload.paymentFingerprint
          : linkRecord.paymentFingerprint,
    },
    include: {
      device: true,
    },
  });
};

const unlinkDeviceFromUser = async (
  id: string,
  currentUserId?: string,
  role?: Role,
) => {
  const linkRecord = await prisma.deviceFingerprintUser.findUnique({
    where: { id },
  });

  if (!linkRecord) {
    throw new AppError(status.NOT_FOUND, "Device-user link record not found");
  }

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  if (!isAdmin && linkRecord.userId !== currentUserId) {
    throw new AppError(status.FORBIDDEN, "Forbidden access to device link record");
  }

  return await prisma.deviceFingerprintUser.delete({
    where: { id },
  });
};

export const DeviceFingerprintUserService = {
  linkDeviceToUser,
  getMyDevices,
  getDevicesByUserId,
  getUsersByDeviceFingerprintId,
  getAllDeviceFingerprintUsers,
  getDeviceFingerprintUserById,
  updateDeviceFingerprintUser,
  unlinkDeviceFromUser,
};
