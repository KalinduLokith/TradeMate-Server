import { Request, Response } from "express";
import Strategy from "../models/Strategy";
import { StandardResponse } from "../dto/StandardResponse";
import { getClaimsFromToken } from "../utils/Jwt.utils";
import User from "../models/User";
import Trade from "../models/Trade";
import { Sequelize } from "sequelize";

// Create a new Strategy
export const createStrategy = async (
  req: Request,
  res: Response<StandardResponse<Strategy>>
) => {
  try {
    // console.log("Method createStrategy called");
    const strategyData = req.body;
    // console.log(strategyData);
    strategyData.userId = getClaimsFromToken(
      req.headers.authorization?.split(" ")[1] || ""
    ).id;

    // Validate that all required fields are provided
    const existingStrategy = await Strategy.findOne({
      where: {
        name: strategyData.name,
        userId: strategyData.userId,
        type: strategyData.type,
      },
    });

    if (existingStrategy) {
      return res.status(400).json({
        success: false,
        message: "Strategy with this name already exists for user.",
      });
    }

    const strategy = await Strategy.create(strategyData);
    return res.status(201).json({
      success: true,
      message: "Strategy created successfully.",
      data: strategy,
    });
  } catch (error) {
    console.error("Error creating strategy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
// Get all Strategies

export const getAllStrategiesByUser = async (
  req: Request,
  res: Response<StandardResponse<any[]>>
) => {
  try {
    // console.log("Method getAllStrategiesByUser called");

    const token: string | undefined = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token is missing.",
      });
    }

    const claims = getClaimsFromToken(token);
    if (!claims || !claims.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Invalid token.",
      });
    }

    const userId = claims.id;
    const strategies = await Strategy.findAll({ where: { userId } });

    // Fetch trades and calculate win rate concurrently
    const strategiesWithWinRate = await Promise.all(
      strategies.map(async (strategy) => {
        const trades = await Trade.findAll({
          where: { strategyId: strategy.id },
        });
        const totalTrades: number = trades.length;
        const winningTrades = trades.filter(
          (trade) => trade.status === "win"
        ).length;
        const winRate =
          totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        return {
          ...strategy.get(), // Convert to plain object
          winRate: parseFloat(winRate.toFixed(2)), // Ensure numeric type
          totalTrades,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Strategies retrieved successfully.",
      data: strategiesWithWinRate,
    });
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get a Strategy by ID
export const getStrategyById = async (
  req: Request,
  res: Response<StandardResponse<Strategy>>
) => {
  try {
    const { id } = req.params;
    const strategy = await Strategy.findByPk(id);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Strategy retrieved successfully.",
      data: strategy,
    });
  } catch (error) {
    console.error("Error fetching strategy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Update a Strategy by ID
export const updateStrategyById = async (
  req: Request,
  res: Response<StandardResponse<Strategy>>
) => {
  try {
    // console.log("Method updateStrategyById called");
    // console.log(req.body);
    const { id, userId } = req.body;
    const updatedData = req.body;

    // Validate that id and userId are provided
    if (!id || !userId) {
      return res.status(400).json({
        success: false,
        message: "Strategy ID and User ID are required.",
      });
    }

    // Check if the user exists in the database
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find the strategy by ID
    const strategy = await Strategy.findByPk(id);
    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found.",
      });
    }

    // Update the strategy
    await strategy.update(updatedData);

    // Respond with the updated strategy data
    return res.status(200).json({
      success: true,
      message: "Strategy updated successfully.",
      data: strategy,
    });
  } catch (error) {
    console.error("Error updating strategy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete a Strategy by ID
export const deleteStrategyById = async (
  req: Request,
  res: Response<StandardResponse<null>>
) => {
  try {
    const { id } = req.params;
    const strategy = await Strategy.findByPk(id);

    if (!strategy) {
      return res.status(404).json({
        success: false,
        message: "Strategy not found.",
      });
    }

    await strategy.destroy();
    return res.status(200).json({
      success: true,
      message: "Strategy deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Endpoint to get trades by strategy id
export const getAssociatedTrades = async (
  req: Request,
  res: Response<StandardResponse<any>>
) => {
  try {
    const { strategyId } = req.body;

    // Fetch trades associated with the given strategyId
    const trades = await Trade.findAll({
      where: {
        strategyId, // Query trades by strategyId
      },
    });

    if (!trades || trades.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No trades found for the given strategy ID.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trades fetched successfully.",
      data: trades,
    });
  } catch (error) {
    console.error("Error fetching trades by strategy ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Endpoint to get User's Trade Statistics
export const getStrategyTradeStats = async (
  req: Request,
  res: Response<StandardResponse<any>>
) => {
  try {
    // console.log("Method getUserTradeStats called");

    const userId = req.params.userId as unknown as number;
    const strategyId = req.params.id as string;

    const trades = await Trade.findAll({
      where: { userId },
    });

    // const generalStats = calculateGeneralStats(trades);
    // const monthlyProfits = calculateMonthlyStats(trades);
    // const totalStrategyCount = await getTotalStrategyCount(userId);
    // const highestWinTrade = await getHighestWinTradeProfit(userId);
    // const dailyPL = await calculateNetDailyPL(userId, new Date());
    // const averageHoldingPeriod = await getAverageHoldingPeriod(userId);
    // const highestLossTrade = await getHighestLossTradeProfit(userId);
    // const totalCurrencyPairsCount = await getTotalCurrencyPairsCount(userId);
    // const mostProfitableStrategy = await getMostProfitableStrategy(userId);
    const riskToRewardRatio = await getRiskToRewardRatio(userId, strategyId);

    const winLossRatio = await getWinLossRatio(userId, strategyId);
    // const tradeDuration = await getTradeDuration(userId);
    // const profitLoss = await getProfitLoss(userId);
    const averageProfitLoss = await getAverageProfitLoss(userId, strategyId);
    const drawDownRatio = await getDrawDownRatio(userId, strategyId);

    const data = {
      // totalTrades: generalStats.totalTrades,
      // winTrades: generalStats.winTrades,
      // lossTrades: generalStats.lossTrades,
      // winRate: generalStats.winRate.toFixed(2),
      // totalProfit: generalStats.totalProfit.toFixed(2),
      // totalStrategyCount,
      // monthlyProfits,
      // highestWinTrade,
      // dailyPL,
      // averageHoldingPeriod,
      // highestLossTrade,
      // totalCurrencyPairsCount,
      // mostProfitableStrategy,
      riskToRewardRatio,
      drawDownRatio,
      winLossRatio,
      // tradeDuration,
      // profitLoss,
      averageProfitLoss,
    };

    return res.status(200).json({
      success: true,
      message: "User trade statistics retrieved successfully.",
      data,
    });
  } catch (error) {
    console.error("Error fetching trade statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const getWinLossRatio = async (userId: number, strategyId: string) => {
  try {
    const trades = await Trade.findAll({
      where: { userId, strategyId },
      attributes: ["profit", "openDate"], // Include creation date to group by month
      raw: true,
    });

    console.log("trades", trades);
    if (!trades.length) return 0;

    const wins = trades.filter((trade) => trade.profit > 0).length;
    const losses = trades.filter((trade) => trade.profit <= 0).length;

    const totalTrades = wins + losses;
    const winLossRatio = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return winLossRatio.toFixed(2);
  } catch (error) {
    console.error("Error calculating win/loss ratio:", error);
    return null;
  }
};

const getRiskToRewardRatio = async (userId: number, strategyId: string) => {
  // Get sum of profit where status = "win"
  const winData = await Trade.findOne({
    where: { userId, strategyId, status: "win" },
    attributes: [
      [Sequelize.fn("SUM", Sequelize.col("profit")), "totalWinProfit"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "winCount"],
    ],
    raw: true,
  });

  // Get sum of profit where status = "loss"
  const lossData = await Trade.findOne({
    where: { userId, strategyId, status: "loss" },
    attributes: [
      [Sequelize.fn("SUM", Sequelize.col("profit")), "totalLossProfit"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "lossCount"],
    ],
    raw: true,
  });

  const totalWinProfit = parseFloat(winData?.totalWinProfit || "0");
  const winCount = parseInt(winData?.winCount || "0");
  const totalLossProfit = parseFloat(lossData?.totalLossProfit || "0");
  const lossCount = parseInt(lossData?.lossCount || "0");

  if (!winCount || !lossCount) return "0:0";

  if (winCount === 0) return "1:0"; // Prevent division by zero
  if (lossCount === 0) return "0:1"; // Prevent division by zero

  // Calculate averages
  const avgWin = totalWinProfit / winCount;
  const avgLoss = Math.abs(totalLossProfit / lossCount); // Ensure positive loss value

  // Risk-to-Reward Ratio = (avg loss per trade / avg win per trade) * 100
  return `${(avgLoss / avgWin).toFixed(2)}:1`;
};

const getAverageProfitLoss = async (userId: number, strategyId: string) => {
  const trades: any[] = await Trade.findAll({
    where: { userId, strategyId },
    attributes: [
      [Sequelize.fn("AVG", Sequelize.col("profit")), "averageProfitLoss"],
    ],
    raw: true,
  });

  return trades[0]?.averageProfitLoss || 0;
};

const getDrawDownRatio = async (userId: number, strategyId: string) => {
  try {
    const highestLossTrade = await Trade.findOne({
      where: { userId, strategyId },
      order: [["profit", "ASC"]], // Lowest profit (largest loss)
      attributes: ["profit", "openDate"],
      raw: true,
    });

    if (!highestLossTrade) return null; // No trades found

    const largestLoss = highestLossTrade.profit;
    const lossDate = highestLossTrade.openDate;

    const { totalProfitBeforeLoss } = (await Trade.findOne({
      where: {
        userId,
        strategyId,
        openDate: { lossDate },
      },
      attributes: [
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("profit")),
            0
          ),
          "totalProfitBeforeLoss",
        ],
      ],
      raw: true,
    })) || { totalProfitBeforeLoss: 0 };

    // If there’s no balance before loss, assume user's initial capital
    let accountBalanceBeforeLoss = totalProfitBeforeLoss;
    if (accountBalanceBeforeLoss === 0) {
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["initial_capital"],
        raw: true,
      });
      accountBalanceBeforeLoss = user?.initial_capital || 0;
    }

    if (accountBalanceBeforeLoss === 0) return null; // Prevent division by zero

    const drawdownRatio =
      (Math.abs(largestLoss) / accountBalanceBeforeLoss) * 100;

    return drawdownRatio;
  } catch (error) {
    console.error("Error calculating drawdown ratio:", error);
    return 0;
  }
};
