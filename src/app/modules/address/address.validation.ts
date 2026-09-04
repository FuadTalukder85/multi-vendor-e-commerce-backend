import { z } from "zod";

const createAddressSchema = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1, "Street cannot be empty").optional(),
  city: z.string().min(1, "City cannot be empty").optional(),
  zip: z.string().min(1, "ZIP code cannot be empty").optional(),
  country: z.string().min(1, "Country cannot be empty").optional(),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const AddressValidation = {
  createAddressSchema,
  updateAddressSchema,
};
