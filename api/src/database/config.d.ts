import { Dialect } from "sequelize/types";

export interface IConfig {
  use_env_variable: string;
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: Dialect;
  dialectOptions?: object;
}

export interface IConfigMap {
  [key: string]: IConfig;
}

declare const configMap: IConfigMap;

export default configMap;
