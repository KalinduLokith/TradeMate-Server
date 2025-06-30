import { Router } from "express";

import dotenv from "dotenv";
import { login, register } from "../controller/auth.controller";

dotenv.config();

const router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
