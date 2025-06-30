import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Trade extends Model {
  public id!: number;

  public openDate!: Date;
  public closeDate!: Date;

  public currencyPairId!: number; // Foreign key reference
  public strategyId!: number; // Foreign key reference
  public userId!: number; //

  public status!: "win" | "loss" | "breakeven";
  public type!: "buy" | "sell";

  public duration!: number; // Stored duration in milliseconds

  public entryPrice!: number;
  public exitPrice!: number;

  public positionSize!: number;
  public marketTrend!: string;

  public stopLossPrice!: number;
  public takeProfitPrice!: number;
  public transactionCost!: number;

  public reason!: string;
  public comment!: string;
  public profit!: number;

  public categories!: string[]; // Categories as an array of strings
  totalWinProfit!: string;
  winCount!: string;
  totalLossProfit!: string;
  lossCount!: string;
  totalProfitBeforeLoss!: number;
}

Trade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    openDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    closeDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    currencyPairId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "currency_pairs", // Replace with actual table name
        key: "id",
      },
    },
    strategyId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null values
      references: {
        model: "strategies",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("win", "loss", "breakeven"),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in milliseconds
      allowNull: false,
    },
    entryPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    exitPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    positionSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    marketTrend: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stopLossPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    takeProfitPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    transactionCost: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    categories: {
      type: DataTypes.STRING, // Stored as a comma-separated string
      allowNull: false,
      get() {
        const value = this.getDataValue("categories");
        return value ? value.split(",") : []; // Converts string to array
      },
      set(value: string[]) {
        this.setDataValue("categories", value.join(",")); // Converts array to string
      },
    },
    profit: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Trade",
    tableName: "trades",
    timestamps: true,
  }
);

export default Trade;
