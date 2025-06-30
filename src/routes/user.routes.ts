import { Router } from "express";
import {
  getUserDetails,
  updateUserDetails,
} from "../controller/user.controller";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

router.get("/me", getUserDetails);
router.patch("", updateUserDetails);

export default router;
