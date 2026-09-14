import { z } from "zod";

const createDeviceFingerprintSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  ipAddress: z.string().min(1, "ipAddress is required"),
  flagged: z.boolean().optional(),
});

const updateDeviceFingerprintSchema = z.object({
  ipAddress: z.string().optional(),
  flagged: z.boolean().optional(),
});

const trackDeviceFingerprintSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  ipAddress: z.string().optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  paymentFingerprint: z.string().optional().nullable(),
});

const batchFlagSchema = z.object({
  deviceIds: z.array(z.string()).min(1, "deviceIds array must contain at least one ID"),
  flagged: z.boolean({ message: "flagged status is required" }),
});

export const DeviceFingerprintValidation = {
  createDeviceFingerprintSchema,
  updateDeviceFingerprintSchema,
  trackDeviceFingerprintSchema,
  batchFlagSchema,
};
