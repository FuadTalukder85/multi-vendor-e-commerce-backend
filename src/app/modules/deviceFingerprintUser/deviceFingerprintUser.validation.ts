import { z } from "zod";

const linkDeviceUserSchema = z
  .object({
    deviceFingerprintId: z.string().optional(),
    deviceId: z.string().optional(),
    userId: z.string().optional(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    paymentFingerprint: z.string().optional().nullable(),
  })
  .refine((data) => data.deviceFingerprintId || data.deviceId, {
    message: "Either deviceFingerprintId or deviceId must be provided",
    path: ["deviceFingerprintId"],
  });

const updateDeviceUserSchema = z.object({
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  paymentFingerprint: z.string().optional().nullable(),
});

export const DeviceFingerprintUserValidation = {
  linkDeviceUserSchema,
  updateDeviceUserSchema,
};
