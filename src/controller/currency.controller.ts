import { Request, Response } from "express";
import CurrencyPair from "../models/CurrencyPair";
import User from "../models/User";
import { StandardResponse } from "../dto/StandardResponse";
import { getClaimsFromToken } from "../utils/Jwt.utils";

export const saveCurrencyPair = async (
  req: Request,
  res: Response<StandardResponse<CurrencyPair>>,
) => {
  try {
    const { from, to } = req.body;
    const userId = req.body.user.id;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: userId, from, to.",
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if currency pair already exists for the user
    const existingCurrencyPair = await CurrencyPair.findOne({
      where: {
        userId,
        from,
        to,
      },
    });

    if (existingCurrencyPair) {
      return res.status(409).json({
        success: false,
        message: "Currency pair already exists.",
      });
    }

    const currencyPair = await CurrencyPair.create({ userId, from, to });
    return res.status(201).json({
      success: true,
      message: "Currency pair saved successfully.",
      data: currencyPair,
    });
  } catch (error) {
    console.error("Error saving currency pair:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getCurrencyPairsByUser = async (   
  req: Request,
  res: Response<StandardResponse<CurrencyPair[]>>,
) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1] || "";
    const claims = getClaimsFromToken(token);
    const userId = claims.id;
    const currencyPairs = await CurrencyPair.findAll({
      where: { userId },
      attributes: ["id", "from", "to"],
    });

    return res.status(200).json({
      success: true,
      message: "Currency pairs retrieved successfully.",
      data: currencyPairs,
    });
  } catch (error) {
    console.error("Error retrieving currency pairs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getCurrencyPairsById = async (
  req: Request,
  res: Response<StandardResponse<CurrencyPair>>,
) => {
  try {
    const { id } = req.params;

    const currencyPair = await CurrencyPair.findByPk(id);
    if (!currencyPair) {
      return res.status(404).json({
        success: false,
        message: "Currency pair not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Currency pair retrieved successfully.",
      data: currencyPair,
    });
  } catch (error) {
    console.error("Error retrieving currency pair:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteCurrencyPairById = async (
  req: Request,
  res: Response<StandardResponse<null>>,
) => {
  try {
    const { id } = req.params;

    const currencyPair = await CurrencyPair.findByPk(id);
    if (!currencyPair) {
      return res.status(404).json({
        success: false,
        message: "Currency pair not found.",
      });
    }

    await currencyPair.destroy();
    return res.status(200).json({
      success: true,
      message: "Currency pair deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting currency pair:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
