module.exports = {
  development: {
    username: "chily-user",
    password: "test",
    database: "chily_development",
    host: "localhost",
    dialect: "postgres",
  },
  test: {
    username: "chily-user",
    password: "test",
    database: "chily_test",
    host: "localhost",
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
