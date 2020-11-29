import { Sequelize } from "sequelize";
import configMap from "../config";
import {
  doesHaveValue,
  valueOrDefault,
} from "../../shared/utilities/value_checker";
import { shouldSequelizeLog } from "../../shared/utilities/env";

function getSequelizeInstance(): Sequelize {
  const env = valueOrDefault(process.env.NODE_ENV, "development");
  if (!Object.keys(configMap).includes(env)) {
    throw new Error(`No database config for environment: ${env}`);
  }
  const config = configMap[env];
  if (doesHaveValue(config.use_env_variable)) {
    return new Sequelize(process.env[config.use_env_variable], {
      dialect: config.dialect,
      logging: shouldSequelizeLog(),
    });
  }
  return new Sequelize(config.database, config.username, config.password, {
    dialect: config.dialect,
    host: config.host,
    logging: shouldSequelizeLog(),
  });
}

export const sequelize = getSequelizeInstance();
