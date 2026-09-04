export interface ICreateAddressPayload {
  label?: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export interface IUpdateAddressPayload {
  label?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}
