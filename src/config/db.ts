import { configDotenv } from "dotenv";
import { Sequelize } from "sequelize";

configDotenv();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {  //ORM(Object relational mapping)
  dialect: "mysql",
  logging: false,
});

export default sequelize;
