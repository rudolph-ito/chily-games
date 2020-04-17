module.exports = {
  development: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_development",
    host: process.env.POSTGRES_HOST,
    dialect: "postgres"
  },
  test: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_test",
    host: process.env.POSTGRES_HOST,
    dialect: "postgres"
  },
  production: {
    username: "cyvasse-user",
    password: process.env.POSTGRES_PASSWORD,
    database: "cyvasse_production",
    host: process.env.POSTGRES_HOST,
    dialect: "postgres"
  }
};
