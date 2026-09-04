import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { AddressController } from "./address.controller";
import { AddressValidation } from "./address.validation";

const router = Router();

// Current user address operations
router.post("/", checkAuth(), validateRequest(AddressValidation.createAddressSchema), AddressController.createAddress);
router.get("/my-addresses", checkAuth(), AddressController.getMyAddresses);

// Admin address listing
router.get("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AddressController.getAllAddresses);

// Specific address operations
router.get("/:id", checkAuth(), AddressController.getAddressById);
router.patch(
  "/:id",
  checkAuth(),
  validateRequest(AddressValidation.updateAddressSchema),
  AddressController.updateAddress,
);
router.patch("/:id/set-default", checkAuth(), AddressController.setDefaultAddress);
router.delete("/:id", checkAuth(), AddressController.deleteAddress);

export const AddressRoutes = router;
