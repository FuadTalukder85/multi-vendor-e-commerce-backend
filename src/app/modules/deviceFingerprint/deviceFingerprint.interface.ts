export interface ICreateDeviceFingerprintPayload {
  deviceId: string;
  ipAddress: string;
  flagged?: boolean;
}

export interface IUpdateDeviceFingerprintPayload {
  ipAddress?: string;
  flagged?: boolean;
}

export interface ITrackDeviceFingerprintPayload {
  deviceId: string;
  ipAddress?: string;
  address?: string;
  phone?: string;
  paymentFingerprint?: string;
}

export interface IBatchFlagDevicesPayload {
  deviceIds: string[];
  flagged: boolean;
}
