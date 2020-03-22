module.exports = {
  development: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_development",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: "cyvasse-user",
    password: process.env.POSTGRES_PASSWORD,
    database: "cyvasse_production",
    host: "127.0.0.1",
    dialect: "postgres"
  }
};
