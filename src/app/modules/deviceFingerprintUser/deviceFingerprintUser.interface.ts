export interface ILinkDeviceUserPayload {
  deviceFingerprintId?: string;
  deviceId?: string;
  userId?: string;
  address?: string;
  phone?: string;
  paymentFingerprint?: string;
}

export interface IUpdateDeviceUserPayload {
  address?: string;
  phone?: string;
  paymentFingerprint?: string;
}
