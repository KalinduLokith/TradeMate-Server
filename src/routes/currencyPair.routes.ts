import { Router } from "express";
import {
  deleteCurrencyPairById,
  getCurrencyPairsById,
  getCurrencyPairsByUser,
  saveCurrencyPair,
} from "../controller/currency.controller";

const router = Router();

router.post("", saveCurrencyPair);
router.get("/user/currency-pairs", getCurrencyPairsByUser);
router.get("/:id", getCurrencyPairsById);
router.delete("/:id", deleteCurrencyPairById);

export default router;
