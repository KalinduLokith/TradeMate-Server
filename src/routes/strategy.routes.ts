import { Router } from "express";
import {
  createStrategy,
  deleteStrategyById,
  getAllStrategiesByUser,
  getAssociatedTrades,
  getStrategyById,
  getStrategyTradeStats,
  updateStrategyById,
} from "../controller/strategy.controller";

const router = Router();

// Create a new strategy
router.post("/", createStrategy);

// Get all strategies by userId
router.get("/user", getAllStrategiesByUser);

// Get all trades associated with a strategy
router.post("/trades-list", getAssociatedTrades);

// Get a single strategy by ID
router.get("/:id", getStrategyById);

// Update a strategy by ID
router.put("/:id", updateStrategyById);

// Delete a strategy by ID
router.delete("/:id", deleteStrategyById);

// Get strategy stats
router.get("/strategy-stats/:userId/:id", getStrategyTradeStats);

export default router;
