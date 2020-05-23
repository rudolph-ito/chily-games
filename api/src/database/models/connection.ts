import { Sequelize } from "sequelize";
import configMap from "../config";
import { valueOrDefault } from "../../shared/utilities/value_checker";
import { shouldSequelizeLog } from "../../shared/utilities/env";

const env = valueOrDefault(process.env.NODE_ENV, "development");
if (!Object.keys(configMap).includes(env)) {
  throw new Error(`No database config for environment: ${env}`);
}

const config = configMap[env];

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    dialect: config.dialect,
    host: config.host,
    logging: shouldSequelizeLog(),
  }
);
