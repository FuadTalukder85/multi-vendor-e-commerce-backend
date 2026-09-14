import status from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { IQueryParams } from "../../types/query.types";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  deviceFingerprintFilterableFields,
  deviceFingerprintSearchableFields,
} from "./deviceFingerprint.constant";
import {
  IBatchFlagDevicesPayload,
  ICreateDeviceFingerprintPayload,
  ITrackDeviceFingerprintPayload,
  IUpdateDeviceFingerprintPayload,
} from "./deviceFingerprint.interface";

const trackDeviceFingerprint = async (
  userId: string | undefined,
  payload: ITrackDeviceFingerprintPayload,
  headerIp: string,
) => {
  const ipAddress = payload.ipAddress || headerIp || "0.0.0.0";

  return await prisma.$transaction(async (tx) => {
    const device = await tx.deviceFingerprint.upsert({
      where: { deviceId: payload.deviceId },
      update: {
        ipAddress,
        lastSeenAt: new Date(),
      },
      create: {
        deviceId: payload.deviceId,
        ipAddress,
      },
    });

    let linkedUserRecord = null;

    if (userId) {
      linkedUserRecord = await tx.deviceFingerprintUser.upsert({
        where: {
          deviceFingerprintId_userId: {
            deviceFingerprintId: device.id,
            userId,
          },
        },
        update: {
          address: payload.address ?? undefined,
          phone: payload.phone ?? undefined,
          paymentFingerprint: payload.paymentFingerprint ?? undefined,
          lastSeenAt: new Date(),
        },
        create: {
          deviceFingerprintId: device.id,
          userId,
          address: payload.address ?? null,
          phone: payload.phone ?? null,
          paymentFingerprint: payload.paymentFingerprint ?? null,
        },
      });
    }

    return {
      device,
      linkedUserRecord,
    };
  });
};

const getAllDeviceFingerprints = async (query: IQueryParams) => {
  const deviceQuery = new QueryBuilder(prisma.deviceFingerprint, query, {
    searchableFields: deviceFingerprintSearchableFields,
    filterableFields: deviceFingerprintFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      linkedUsers: {
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
      },
    });

  return await deviceQuery.execute();
};

const getDeviceFingerprintById = async (id: string) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { id },
    include: {
      linkedUsers: {
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
      },
    },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  return device;
};

const getDeviceFingerprintByDeviceId = async (deviceId: string) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { deviceId },
    include: {
      linkedUsers: {
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
      },
    },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  return device;
};

const createDeviceFingerprint = async (payload: ICreateDeviceFingerprintPayload) => {
  const existingDevice = await prisma.deviceFingerprint.findUnique({
    where: { deviceId: payload.deviceId },
  });

  if (existingDevice) {
    throw new AppError(
      status.CONFLICT,
      "Device fingerprint already exists with this deviceId",
    );
  }

  return await prisma.deviceFingerprint.create({
    data: {
      deviceId: payload.deviceId,
      ipAddress: payload.ipAddress,
      flagged: payload.flagged ?? false,
    },
  });
};

const updateDeviceFingerprint = async (
  id: string,
  payload: IUpdateDeviceFingerprintPayload,
) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { id },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  return await prisma.deviceFingerprint.update({
    where: { id },
    data: {
      ipAddress: payload.ipAddress ?? device.ipAddress,
      flagged: payload.flagged !== undefined ? payload.flagged : device.flagged,
    },
  });
};

const toggleFlagDeviceFingerprint = async (id: string, flagged?: boolean) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { id },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  const targetFlagStatus = flagged !== undefined ? flagged : !device.flagged;

  return await prisma.deviceFingerprint.update({
    where: { id },
    data: {
      flagged: targetFlagStatus,
    },
  });
};

const batchFlagDevices = async (payload: IBatchFlagDevicesPayload) => {
  const result = await prisma.deviceFingerprint.updateMany({
    where: {
      deviceId: {
        in: payload.deviceIds,
      },
    },
    data: {
      flagged: payload.flagged,
    },
  });

  return result;
};

const deleteDeviceFingerprint = async (id: string) => {
  const device = await prisma.deviceFingerprint.findUnique({
    where: { id },
  });

  if (!device) {
    throw new AppError(status.NOT_FOUND, "Device fingerprint not found");
  }

  return await prisma.deviceFingerprint.delete({
    where: { id },
  });
};

const getSuspiciousDeviceFingerprints = async (query: IQueryParams) => {
  const deviceQuery = new QueryBuilder(prisma.deviceFingerprint, query, {
    searchableFields: deviceFingerprintSearchableFields,
    filterableFields: deviceFingerprintFilterableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      linkedUsers: {
        include: {
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
      },
    });

  // Inject condition: either flagged or has more than 1 linked user
  const result = await deviceQuery.execute();

  return result;
};

export const DeviceFingerprintService = {
  trackDeviceFingerprint,
  getAllDeviceFingerprints,
  getDeviceFingerprintById,
  getDeviceFingerprintByDeviceId,
  createDeviceFingerprint,
  updateDeviceFingerprint,
  toggleFlagDeviceFingerprint,
  batchFlagDevices,
  deleteDeviceFingerprint,
  getSuspiciousDeviceFingerprints,
};
