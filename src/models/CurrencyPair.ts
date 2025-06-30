import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class CurrencyPair extends Model {
  public id!: number;
  public from!: string;
  public to!: string;
  public userId!: number;
}

CurrencyPair.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
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
    modelName: "CurrencyPair",
    tableName: "currency_pairs",
    timestamps: false,
  },
);

export default CurrencyPair;
