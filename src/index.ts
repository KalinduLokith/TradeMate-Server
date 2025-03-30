import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mysql from "mysql2/promise";
import sequelize from "./config/db";
import { configAssociations } from "./models/Associations";
import authRoutes from "./routes/auth.routes";
import currencyPairRoutes from "./routes/currencyPair.routes";
import { authMiddleware } from "./middleware/authMiddleware";
import userRoutes from "./routes/user.routes";
import strategyRoutes from "./routes/strategy.routes";
import tradeRoutes from "./routes/trade.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

async function startServer() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``,
    );
    console.log(`Database ${process.env.DB_NAME} created successfully.`);
    await connection.end();

    await sequelize.authenticate();
    console.log("Database connection established.");

    configAssociations();

    await sequelize.sync({ alter: true, logging: console.log });
    console.log("Models synchronized successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server initialization error:", error);
  }
}

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/currencies", authMiddleware, currencyPairRoutes);
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/trades", tradeRoutes);

startServer();
