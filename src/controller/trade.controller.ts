import { Request, Response } from "express";
import Trade from "../models/Trade";
import { StandardResponse } from "../dto/StandardResponse";
import { getClaimsFromToken } from "../utils/Jwt.utils";
import Strategy from "../models/Strategy";
import { Op, Sequelize } from "sequelize";
import CurrencyPair from "../models/CurrencyPair";
import User from "../models/User";

// Create a Trade
export const saveTrade = async (
  req: Request,
  res: Response<StandardResponse<Trade>>
) => {
  try {
    let tradeData = req.body;
    tradeData.userId = getClaimsFromToken(
      req.headers.authorization?.split(" ")[1] || ""
    ).id;
    // console.log("tradeData", tradeData);

    tradeData = {
      ...tradeData,
      strategyId: tradeData.strategyId || null,
      profit: calculateProfit(
        tradeData.entryPrice,
        tradeData.exitPrice,
        tradeData.positionSize,
        tradeData.status,
        tradeData.type
      ),
    };

    const trade = await Trade.create(tradeData);
    return res.status(201).json({
      success: true,
      message: "Trade created successfully.",
    });
  } catch (error) {
    console.error("Error creating trade:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get all Trades by User
export const getAllTradesByUser = async (
  req: Request,
  res: Response<StandardResponse<Trade[]>>
) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1] || "";
    const claims = getClaimsFromToken(token);
    const userId = claims.id;

    const trades = await Trade.findAll({
      where: { userId },
      include: ["strategy", "currencyPair"], // Adjust associations as needed
    });

    // Format dates in the required "2025-02-08T10:30" format
    const formattedTrades = trades.map((trade) => {
      const openDate = trade.openDate ? new Date(trade.openDate) : null;
      const closeDate = trade.closeDate ? new Date(trade.closeDate) : null;

      return {
        ...trade.toJSON(), // Include all other trade fields
        openDate: openDate
          ? `${openDate.getFullYear()}-${String(openDate.getMonth() + 1).padStart(2, "0")}-${String(openDate.getDate()).padStart(2, "0")}T${String(openDate.getHours()).padStart(2, "0")}:${String(openDate.getMinutes()).padStart(2, "0")}`
          : null,
        closeDate: closeDate
          ? `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, "0")}-${String(closeDate.getDate()).padStart(2, "0")}T${String(closeDate.getHours()).padStart(2, "0")}:${String(closeDate.getMinutes()).padStart(2, "0")}`
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Trades retrieved successfully.",
      data: formattedTrades,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get a Trade by ID
export const getTradeById = async (
  req: Request,
  res: Response<StandardResponse<Trade>>
) => {
  try {
    const { id } = req.params;

    const trade = await Trade.findByPk(id, {
      include: ["strategy", "currencyPair"], // Adjust associations as needed
      //   order by id desc
      order: [
        ["id", "DESC"], // Ordering by ID in descending order
      ],
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trade retrieved successfully.",
      data: trade,
    });
  } catch (error) {
    console.error("Error fetching trade:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete a Trade by ID
export const deleteTradeById = async (
  req: Request,
  res: Response<StandardResponse<null>>
) => {
  try {
    // console.log("Method deleteTradeById called");
    const { id } = req.params;

    const trade = await Trade.findByPk(id);

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found.",
      });
    }

    await trade.destroy();

    return res.status(200).json({
      success: true,
      message: "Trade deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateTrade = async (
  req: Request<
    {
      id: string;
    },
    {},
    Partial<Trade>
  >,
  res: Response<StandardResponse<Trade>>
) => {
  try {
    // console.log("Method updateTrade called");
    const tradeId = req.params.id; // Trade ID from route parameters
    const userId = getClaimsFromToken(
      req.headers.authorization?.split(" ")[1] || ""
    ).id; // Extract the user ID from the token

    // Find the existing trade
    const trade = await Trade.findOne({
      where: {
        id: tradeId,
        userId: userId, // Ensure the trade belongs to the user
      },
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found or you do not have access to it.",
      });
    }

    // Extract fields from the request body
    const {
      openDate,
      closeDate,
      currencyPairId,
      strategyId,
      status,
      type,
      duration,
      entryPrice,
      exitPrice,
      positionSize,
      marketTrend,
      stopLossPrice,
      takeProfitPrice,
      transactionCost,
      reason,
      comment,
      categories,
    } = req.body;

    // Recalculate profit if necessary

    const updatedProfit =
      entryPrice && exitPrice && positionSize && status && type
        ? calculateProfit(entryPrice, exitPrice, positionSize, status, type)
        : trade.profit;

    // Update the trade
    const updatedTrade = await trade.update({
      openDate: openDate !== undefined ? openDate : trade.openDate,
      closeDate: closeDate !== undefined ? closeDate : trade.closeDate,
      currencyPairId:
        currencyPairId !== undefined ? currencyPairId : trade.currencyPairId,
      strategyId: strategyId !== undefined ? strategyId : trade.strategyId,
      status: status !== undefined ? status : trade.status,
      type: type !== undefined ? type : trade.type,
      duration: duration !== undefined ? duration : trade.duration,
      entryPrice: entryPrice !== undefined ? entryPrice : trade.entryPrice,
      exitPrice: exitPrice !== undefined ? exitPrice : trade.exitPrice,
      positionSize:
        positionSize !== undefined ? positionSize : trade.positionSize,
      marketTrend: marketTrend !== undefined ? marketTrend : trade.marketTrend,
      stopLossPrice:
        stopLossPrice !== undefined ? stopLossPrice : trade.stopLossPrice,
      takeProfitPrice:
        takeProfitPrice !== undefined ? takeProfitPrice : trade.takeProfitPrice,
      transactionCost:
        transactionCost !== undefined ? transactionCost : trade.transactionCost,
      reason: reason !== undefined ? reason : trade.reason,
      comment: comment !== undefined ? comment : trade.comment,
      categories: categories !== undefined ? categories : trade.categories,
      profit: updatedProfit,
    });

    return res.status(200).json({
      success: true,
      message: "Trade updated successfully.",
      data: updatedTrade,
    });
  } catch (error) {
    console.error("Error updating trade:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const calculateGeneralStats = (trades: Trade[]) => {
  const totalTrades = trades.length;
  const winTrades = trades.filter((trade) => trade.status === "win").length;
  const lossTrades = trades.filter((trade) => trade.status === "loss").length;
  const breakEvenTrades = trades.filter(
    (trade) => trade.status === "breakeven"
  ).length;

  const totalProfit = trades.reduce((sum, trade) => {
    const profit = trade.profit;
    return sum + (trade.status === "win" ? profit : -Math.abs(profit));
  }, 0);

  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  return {
    totalTrades,
    winTrades,
    lossTrades,
    breakEvenTrades,
    winRate,
    totalProfit,
  };
};

// Helper method to calculate monthly profits and losses
const calculateMonthlyStats = (trades: Trade[]) => {
  const monthlyStats: Record<string, { profit: number; loss: number }> = {};

  trades.forEach((trade) => {
    const tradeMonth = new Date(trade.closeDate).toISOString().slice(0, 7); // YYYY-MM
    const profit = trade.profit;

    if (!monthlyStats[tradeMonth]) {
      monthlyStats[tradeMonth] = { profit: 0, loss: 0 };
    }

    if (trade.status === "win") {
      monthlyStats[tradeMonth].profit += profit;
    } else {
      monthlyStats[tradeMonth].loss += Math.abs(profit);
    }
  });

  return Object.entries(monthlyStats).map(([month, stats]) => ({
    month,
    profit: stats.profit.toFixed(2),
    loss: stats.loss.toFixed(2),
  }));
};

// Helper method to get total strategy count
const getTotalStrategyCount = async (userId: number): Promise<number> => {
  try {
    const count = await Strategy.count({
      where: { userId },
    });
    return count;
  } catch (error) {
    console.error("Error fetching strategy count:", error);
    return 0;
  }
};

// Helper method to get the most profitable strategy
const getProfitableStrategy = async (
  userId: number
): Promise<{ strategyId: number; totalProfit: number } | null> => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      attributes: ["strategyId", "exitPrice", "entryPrice", "status"],
    });

    if (trades.length === 0) {
      return null;
    }

    const strategyProfits: Record<number, number> = {};

    trades.forEach((trade) => {
      const profit = trade.exitPrice - trade.entryPrice;
      const strategyId = trade.strategyId;

      if (!strategyProfits[strategyId]) {
        strategyProfits[strategyId] = 0;
      }

      if (trade.status === "win") {
        strategyProfits[strategyId] += profit;
      } else {
        strategyProfits[strategyId] -= Math.abs(profit);
      }
    });

    let mostProfitableStrategy: { strategyId: number; totalProfit: number } = {
      strategyId: 0,
      totalProfit: -Infinity,
    };

    Object.entries(strategyProfits).forEach(([strategyId, totalProfit]) => {
      if (totalProfit > mostProfitableStrategy.totalProfit) {
        mostProfitableStrategy = {
          strategyId: parseInt(strategyId),
          totalProfit,
        };
      }
    });

    return mostProfitableStrategy;
  } catch (error) {
    console.error("Error fetching profitable strategy:", error);
    return null;
  }
};

const getHighestWinTradeProfit = async (userId: number) => {
  const highestWinTrade = await Trade.findOne({
    where: {
      userId: userId,
    },
    order: [["profit", "DESC"]],
    attributes: ["profit"],
  });

  return highestWinTrade ? highestWinTrade.profit : 0;
};

// Helper method to get the highest loss trade profit
const getHighestLossTradeProfit = async (userId: number) => {
  const highestLossTrade = await Trade.findOne({
    where: {
      userId: userId,
    },
    order: [["profit", "ASC"]],
    attributes: ["profit"],
  });
  return highestLossTrade && highestLossTrade?.profit < 0
    ? highestLossTrade?.profit
    : 0;
};

//get strategy name with it
const getMostProfitableStrategy = async (userId: number) => {
  const result = await Trade.findOne({
    where: { userId },
    attributes: [
      "strategyId",
      [Sequelize.fn("SUM", Sequelize.col("profit")), "totalProfit"],
    ],
    include: [
      {
        model: Strategy,
        as: "strategy",
        attributes: ["name"], // Fetch strategy name
      },
    ],
    group: ["strategyId", "strategy.id", "strategy.name"],
    order: [[Sequelize.fn("SUM", Sequelize.col("profit")), "DESC"]],
  });
  return result ? result : null;
};

const getTotalCurrencyPairsCount = async (userId: number) => {
  return await CurrencyPair.count({
    where: { userId: userId },
  });
};

// Method to calculate net daily P&L
const calculateNetDailyPL = async (userId: number, date: Date) => {
  try {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const trades = await Trade.findAll({
      where: {
        userId: userId,
        openDate: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    let totalDailyProfits = 0;
    let totalDailyLosses = 0;

    trades.forEach((trade) => {
      if (trade.status === "win") {
        totalDailyProfits += trade.profit;
      } else if (trade.status === "loss") {
        totalDailyLosses += Math.abs(trade.profit);
      }
    });

    const netDailyPL = totalDailyProfits - totalDailyLosses;
    return netDailyPL;
  } catch (error) {
    console.error("Error calculating net daily P&L:", error);
    throw error;
  }
};

// Method to calculate Average Holding Period
const getAverageHoldingPeriod = async (userId: number) => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      attributes: ["id", "openDate", "closeDate"],
    });

    if (trades.length === 0) {
      return 0;
    }

    const totalHoldingPeriod = trades.reduce((sum, trade) => {
      const holdingPeriod =
        new Date(trade.closeDate).getTime() -
        new Date(trade.openDate).getTime();
      return sum + holdingPeriod;
    }, 0);

    const averageHoldingPeriod = totalHoldingPeriod / trades.length;
    const averageHoldingPeriodInMinutes = averageHoldingPeriod / (1000 * 60);

    return averageHoldingPeriodInMinutes;
  } catch (error) {
    console.error("Error calculating average holding period:", error);
    return 0;
  }
};

const getDrawDownRatio = async (userId: number) => {
  try {
    const highestLossTrade = await Trade.findOne({
      where: { userId },
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

const getRiskToRewardRatio = async (userId: number) => {
  // Get sum of profit where status = "win"
  const winData = await Trade.findOne({
    where: { userId, status: "win" },
    attributes: [
      [Sequelize.fn("SUM", Sequelize.col("profit")), "totalWinProfit"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "winCount"],
    ],
    raw: true,
  });

  // Get sum of profit where status = "loss"
  const lossData = await Trade.findOne({
    where: { userId, status: "loss" },
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

  if (winCount === 0 || lossCount === 0) return null; // Avoid division by zero

  // Calculate averages
  const avgWin = totalWinProfit / winCount;
  const avgLoss = Math.abs(totalLossProfit / lossCount); // Ensure positive loss value

  // Risk-to-Reward Ratio = (avg loss per trade / avg win per trade) * 100
  return (avgLoss / avgWin) * 100;
};
// Helper method to calculate the win/loss ratio for a user for each month
const getWinLossRatio = async (userId: number) => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      attributes: ["profit", "openDate"], // Include creation date to group by month
      raw: true,
    });

    if (!trades.length) return { winLossRatio: [] }; // No trades found

    const monthlyStats: { [key: string]: { wins: number; losses: number } } =
      {};

    trades.forEach((trade) => {
      const monthYear = new Date(trade.openDate).toISOString().slice(0, 7); // Format to YYYY-MM
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = { wins: 0, losses: 0 };
      }

      if (trade.profit > 0) {
        monthlyStats[monthYear].wins += 1;
      } else {
        monthlyStats[monthYear].losses += 1;
      }
    });

    const winLossRatio = Object.keys(monthlyStats).map((month) => {
      const { wins, losses } = monthlyStats[month];
      return {
        month,
        winLossRatio: (wins / (losses || 1)).toFixed(2),
      };
    });

    return { winLossRatio };
  } catch (error) {
    console.error("Error calculating win/loss ratio:", error);
    return { winLossRatio: [] };
  }
};

// Helper method to calculate average trade duration for a user for each month
const getTradeDuration = async (userId: number) => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      attributes: ["openDate", "closeDate"], // Include creation date for month grouping
      raw: true,
    });

    if (!trades.length) return { averageTradeDuration: [] }; // No trades found

    const monthlyStats: { [key: string]: number[] } = {};

    trades.forEach((trade) => {
      const monthYear = new Date(trade.openDate).toISOString().slice(0, 7); // Format to YYYY-MM
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = [];
      }

      if (trade.openDate && trade.closeDate) {
        const openDate = new Date(trade.openDate);
        const closeDate = new Date(trade.closeDate);
        const duration =
          (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24); // Duration in days
        monthlyStats[monthYear].push(duration);
      }
    });

    const averageTradeDuration = Object.keys(monthlyStats).map((month) => {
      const durations = monthlyStats[month];
      const averageDuration =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      return {
        month,
        averageTradeDuration: averageDuration.toFixed(2),
      };
    });

    return { averageTradeDuration };
  } catch (error) {
    console.error("Error calculating average trade duration:", error);
    return { averageTradeDuration: [] };
  }
};

// Helper method to calculate the total profit/loss for a user by each month
const getProfitLoss = async (userId: number) => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      attributes: ["profit", "openDate"], // Include creation date to group by month
      raw: true,
    });

    if (!trades.length) return { totalProfitLoss: [] }; // No trades found

    const monthlyStats: { [key: string]: number } = {};

    trades.forEach((trade) => {
      const monthYear = new Date(trade.openDate).toISOString().slice(0, 7); // Format to YYYY-MM
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = 0;
      }

      monthlyStats[monthYear] += trade.profit;
    });

    const totalProfitLoss = Object.keys(monthlyStats).map((month) => {
      return {
        month,
        totalProfitLoss: monthlyStats[month].toFixed(2),
      };
    });

    return { totalProfitLoss };
  } catch (error) {
    console.error("Error calculating total profit/loss:", error);
    return { totalProfitLoss: [] };
  }
};

// Endpoint to get User's Trade Statistics
export const getUserTradeStats = async (
  req: Request,
  res: Response<StandardResponse<any>>
) => {
  try {
    // console.log("Method getUserTradeStats called");
    const token: string = req.headers.authorization?.split(" ")[1] || "";
    const claims = getClaimsFromToken(token);
    const userId = claims.id;

    const trades = await Trade.findAll({
      where: { userId },
    });

    const generalStats = calculateGeneralStats(trades);
    const monthlyProfits = calculateMonthlyStats(trades);
    const totalStrategyCount = await getTotalStrategyCount(userId);
    const highestWinTrade = await getHighestWinTradeProfit(userId);
    const dailyPL = await calculateNetDailyPL(userId, new Date());
    const averageHoldingPeriod = await getAverageHoldingPeriod(userId);
    const highestLossTrade = await getHighestLossTradeProfit(userId);
    const totalCurrencyPairsCount = await getTotalCurrencyPairsCount(userId);
    const mostProfitableStrategy = await getMostProfitableStrategy(userId);
    const riskToRewardRatio = await getRiskToRewardRatio(userId);
    const drawDownRatio = await getDrawDownRatio(userId);

    const winLossRatio = await getWinLossRatio(userId);
    const tradeDuration = await getTradeDuration(userId);
    const profitLoss = await getProfitLoss(userId);

    const totalAlertsThisMonth = await getAlertCount(userId);

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["initial_capital"],
    });

    const initialBalance = user?.initial_capital || 0;

    const currentBalance = initialBalance + generalStats.totalProfit;

    const data = {
      totalTrades: generalStats.totalTrades,
      winTrades: generalStats.winTrades,
      lossTrades: generalStats.lossTrades,
      breakevenTrades: generalStats.breakEvenTrades,
      winRate: generalStats.winRate.toFixed(2),
      totalProfit: generalStats.totalProfit.toFixed(2),
      totalStrategyCount,
      monthlyProfits,
      highestWinTrade,
      dailyPL,
      averageHoldingPeriod,
      highestLossTrade,
      totalCurrencyPairsCount,
      mostProfitableStrategy,
      riskToRewardRatio,
      drawDownRatio,
      winLossRatio,
      tradeDuration,
      profitLoss,
      totalAlertsThisMonth,
      currentBalance,
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
// Helper method to calculate the equity curve for a userconst getEquityCurve = async (userId: number, initialBalance: number) => {
const getEquityCurve = async (userId: number, initialBalance: number) => {
  try {
    const trades = await Trade.findAll({
      where: { userId },
      order: [["openDate", "ASC"]],
      attributes: ["profit", "openDate"],
      raw: true,
    });

    if (!trades.length) return []; // No trades found

    // Initialize equity curve starting from the initial balance
    let equity = initialBalance;
    let equityCurve: { date: string; equity: number }[] = [
      { date: trades[0].openDate.toISOString(), equity },
    ];

    // Iterate over trades to calculate cumulative equity
    trades.forEach((trade) => {
      equity += trade.profit;
      equityCurve.push({ date: trade.openDate.toISOString(), equity });
    });

    return equityCurve;
  } catch (error) {
    console.error("Error fetching equity curve:", error);
    return null;
  }
};

const getMonthlyEquityCurve = async (
  userId: number,
  initialBalance: number
) => {
  const equityCurve = await getEquityCurve(userId, initialBalance);

  if (!equityCurve || equityCurve.length === 0) return [];

  // Group equity by month
  const monthlyEquity: { [key: string]: number } = {};

  equityCurve.forEach((point) => {
    const date = new Date(point.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!monthlyEquity[monthKey]) {
      monthlyEquity[monthKey] = point.equity;
    } else {
      monthlyEquity[monthKey] = point.equity;
    }
  });

  // Convert to array of objects
  const monthlyEquityCurve = Object.keys(monthlyEquity).map((month) => ({
    date: month,
    equity: monthlyEquity[month],
  }));

  return monthlyEquityCurve;
};

const getDailyEquityCurve = async (userId: number, initialBalance: number) => {
  const equityCurve = await getEquityCurve(userId, initialBalance);

  if (!equityCurve || equityCurve.length === 0) return [];

  // Group equity by day
  const dailyEquity: { [key: string]: number } = {};

  equityCurve.forEach((point) => {
    const date = new Date(point.date);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    ) {
      if (!dailyEquity[dayKey]) {
        dailyEquity[dayKey] = point.equity;
      } else {
        dailyEquity[dayKey] = point.equity;
      }
    }
  });

  // Convert to array of objects
  const dailyEquityCurve = Object.keys(dailyEquity).map((day) => ({
    date: day,
    equity: dailyEquity[day],
  }));

  return dailyEquityCurve;
};

// Endpoint to get User's Monthly Equity Curve
export const getUserEquityCurve = async (
  req: Request,
  res: Response<StandardResponse<any>>
) => {
  try {
    const token: string = req.headers.authorization?.split(" ")[1] || "";
    const claims = getClaimsFromToken(token);
    const userId = claims.id;
    const period = req.params.period;

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["initial_capital"],
      raw: true,
    });

    const initialBalance = user?.initial_capital; // Example initial balance of $10,000

    const monthlyEquityCurve =
      period === "daily"
        ? await getDailyEquityCurve(userId, initialBalance || 0)
        : await getMonthlyEquityCurve(userId, initialBalance || 0);

    if (monthlyEquityCurve?.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trades found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Monthly equity curve retrieved successfully.",
      data: monthlyEquityCurve,
    });
  } catch (error) {
    console.error("Error fetching monthly equity curve:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

const calculateProfit = (
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  status: string,
  type: string
) => {
  if (type === "buy") {
    return status === "win"
      ? (exitPrice - entryPrice) * (positionSize / entryPrice)
      : status === "loss"
        ? (exitPrice - entryPrice) * (positionSize / entryPrice)
        : 0;
  } else {
    return status === "win"
      ? (entryPrice - exitPrice) * (positionSize / entryPrice)
      : status === "loss"
        ? (entryPrice - exitPrice) * (positionSize / entryPrice)
        : 0;
  }
};

const getAlertCount = async (userId: number) => {
  const fomo = await getNumberOfFOMOTrades(userId);
  const overTradeDays = await getThisMonthOverTradeDays(userId);
  const revengeTradeDays = await getThisMonthRevengeTradeDays(userId);

  return {
    fomo,
    overTradeDays,
    revengeTradeDays,
  };
};

const getNumberOfFOMOTrades = async (userId: number) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const trades = await Trade.findAll({
    where: {
      userId,
      strategyId: null,
      openDate: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      },
    },
  });

  return trades.length;
};

const getThisMonthOverTradeDays = async (userId: number) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const trades = await Trade.findAll({
    where: {
      userId,
      openDate: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      },
    },
  });

  const tradeDays: Record<string, number> = {};

  trades.forEach((trade) => {
    const tradeDate = new Date(trade.openDate).toISOString().slice(0, 10); // Format to YYYY-MM-DD
    if (!tradeDays[tradeDate]) {
      tradeDays[tradeDate] = 0;
    }
    tradeDays[tradeDate]++;
  });

  const overTradeDays = Object.values(tradeDays).filter((count) => count > 3);

  return overTradeDays.length;
};

const getThisMonthRevengeTradeDays = async (userId: number) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const endOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );

  const trades = await Trade.findAll({
    where: {
      userId,
      openDate: {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      },
    },
  });

  const tradeDays: Record<string, number> = {};

  trades.forEach((trade) => {
    const tradeDate = new Date(trade.openDate).toISOString().slice(0, 10); // Format to YYYY-MM-DD
    if (!tradeDays[tradeDate]) {
      tradeDays[tradeDate] = 0;
    }
    if (trade.status === "loss") {
      tradeDays[tradeDate]++;
    }
  });

  const revengeTradeDays = Object.values(tradeDays).filter(
    (count) => count > 3
  );

  return revengeTradeDays.length;
};
