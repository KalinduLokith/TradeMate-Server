import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Playbook extends Model {
  public id!: string;
  public name!: string;
  public type!: "Scalping" | "Swing Trading" | "Day Trading";
  public comment!: string;
  public description!: string;
  public marketType!: "Forex" | "Crypto" | "Stocks" | "Other";
  public marketCondition!: "Bullish" | "Bearish" | "Volatile" | "Sideways";
  public riskLevel!: "Low" | "Medium" | "High Risk";
  public timeFrame!: string;
  // public backtestData?: string; // path or data for back testing screenshots
  public winRate!: number;
  public totalTrades!: number;
  public lastModifiedDate!: Date;
  public userId!: number;
}

Playbook.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("Scalping", "Swing Trading", "Day Trading"),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    marketType: {
      type: DataTypes.ENUM("Forex", "Crypto", "Stocks", "Other"),
      allowNull: false,
    },
    marketCondition: {
      type: DataTypes.ENUM("Bullish", "Bearish", "Volatile", "Sideways"),
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.ENUM("Low", "Medium", "High Risk"),
      allowNull: false,
    },
    timeFrame: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    backtestData: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    winRate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalTrades: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastModifiedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Playbook",
    tableName: "playbooks",
    timestamps: true,
    updatedAt: "lastModifiedDate",
  },
);

export default Playbook;
