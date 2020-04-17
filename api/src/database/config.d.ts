import { Dialect } from "sequelize/types";

export interface IConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  dialect: Dialect;
}

export interface IConfigMap {
  [key: string]: IConfig;
}

declare const configMap: IConfigMap;

export default configMap;
