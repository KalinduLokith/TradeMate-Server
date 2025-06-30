import CurrencyPair from "./CurrencyPair";
import User from "./User";
import Strategy from "./Strategy";
import Trade from "./Trade";

export const configAssociations = () => {
  // User and CurrencyPair relationship
  User.hasMany(CurrencyPair, {
    foreignKey: "userId",
    as: "currencyPairs",
  });

  CurrencyPair.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // User and Strategy relationship
  User.hasMany(Strategy, {
    foreignKey: "userId",
    as: "strategies",
  });

  Strategy.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // User and Trade relationship
  User.hasMany(Trade, {
    foreignKey: "userId",
    as: "trades",
  });

  Trade.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  // Strategy and Trade relationship
  Strategy.hasMany(Trade, {
    foreignKey: "strategyId",
    as: "trades",
  });

  Trade.belongsTo(Strategy, {
    foreignKey: "strategyId",
    as: "strategy",
  });

  // CurrencyPair and Trade relationship
  CurrencyPair.hasMany(Trade, {
    foreignKey: "currencyPairId",
    as: "trades",
  });

  Trade.belongsTo(CurrencyPair, {
    foreignKey: "currencyPairId",
    as: "currencyPair",
  });
};
