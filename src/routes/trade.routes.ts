import { Router } from "express";
import {
  deleteTradeById,
  getAllTradesByUser,
  getUserEquityCurve,
  getUserTradeStats,
  saveTrade,
  updateTrade,
} from "../controller/trade.controller";

const router = Router();

// post
router.post("/", saveTrade);

// get all
router.get("/user", getAllTradesByUser);

// delete
router.delete("/:id", deleteTradeById);

// update
router.put("/:id", updateTrade);

// stats
router.get("/users/trade-stats", getUserTradeStats);
router.get("/users/trade-stats/equity/:period", getUserEquityCurve);

export default router;
