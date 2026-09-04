import { Router } from "express";
import { AddressRoutes } from "../modules/address/address.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

router.use("/users", UserRoutes);
router.use("/addresses", AddressRoutes);

export const IndexRoutes = router;
