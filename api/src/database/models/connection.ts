import { Sequelize } from "sequelize";
import configMap from "../config";
import { valueOrDefault } from "../../shared/utilities/value_checker";
import { shouldSequelizeLog } from "../../shared/utilities/env";

function getSequelizeInstance(): Sequelize {
  const env: string = valueOrDefault(process.env.NODE_ENV, "development");
  if (!Object.keys(configMap).includes(env)) {
    throw new Error(`No database config for environment: ${env}`);
  }
  const config = configMap[env];
  if (config.use_env_variable != null) {
    const url = process.env[config.use_env_variable];
    if (url == null) {
      throw new Error(`Missing env variable: ${config.use_env_variable}`);
    }
    return new Sequelize(url, {
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
