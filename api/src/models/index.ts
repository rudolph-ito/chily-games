import { Sequelize } from "sequelize";

const username = process.env.POSTGRES_USERNAME;
const password = process.env.POSTGRES_PASSWORD;
const database = process.env.POSTGRES_DATABASE;
const host = process.env.POSTGRES_HOST;

const uri = `postgres://${username}:${password}@${host}:5432/${database}`;

export const sequelize = new Sequelize(uri);
