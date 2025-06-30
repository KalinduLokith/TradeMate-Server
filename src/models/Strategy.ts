import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Strategy extends Model {
  public id!: number;
  public name!: string;
  public type!:
    | "Scalping"
    | "Swing Trading"
    | "Day Trading"
    | "Range Trading"
    | "Position Trading";
  public comment?: string;
  public description!: string;
  public marketType!: string[]; // Array of market types in the app, stored as a comma-separated string in the DB
  public marketCondition!: string[];
  public riskLevel!: "Low" | "Medium" | "High";
  public timeFrame!:
    | "1 Minute"
    | "5 Minutes"
    | "15 Minutes"
    | "1 Hour"
    | "4 Hours"
    | "Daily";
  public winRate!: number;
  public totalTrades!: number;
  public lastModifiedDate!: Date;
  public userId!: number;
  public starRate!: number;
}

Strategy.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "Scalping",
        "Swing Trading",
        "Day Trading",
        "Range Trading",
        "Position Trading",
      ),
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    marketType: {
      type: DataTypes.STRING, // Stored as a comma-separated string
      allowNull: false,
      get() {
        const value = this.getDataValue("marketType");
        return value ? value.split(",") : []; // Converts string to array
      },
      set(value: string[]) {
        this.setDataValue("marketType", value.join(",")); // Converts array to string
      },
    },
    marketCondition: {
      type: DataTypes.STRING, // Stored as a comma-separated string
      allowNull: false,
      get() {
        const value = this.getDataValue("marketCondition");
        return value ? value.split(",") : []; // Converts string to array
      },
      set(value: string[]) {
        this.setDataValue("marketCondition", value.join(",")); // Converts array to string
      },
    },
    riskLevel: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
    },
    winRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    totalTrades: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    lastModifiedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    starRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    modelName: "Strategy",
    tableName: "strategies",
    timestamps: true,
    updatedAt: "lastModifiedDate",
  },
);

export default Strategy;
