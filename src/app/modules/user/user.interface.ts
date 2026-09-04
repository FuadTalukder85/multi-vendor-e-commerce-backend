import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateMePayload {
  name?: string;
  phone?: string;
  image?: string;
}

export interface ICreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  phone?: string;
  tenantId?: string;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
}

export interface IUpdateUserPayload {
  name?: string;
  phone?: string;
  image?: string;
  role?: Role;
  status?: UserStatus;
  tenantId?: string;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  emailVerified?: boolean;
}

export interface IUpdateUserStatusPayload {
  status: UserStatus;
}
