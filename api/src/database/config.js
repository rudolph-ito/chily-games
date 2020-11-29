module.exports = {
  development: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_development",
    host: "localhost",
    dialect: "postgres",
  },
  test: {
    username: "cyvasse-user",
    password: "test",
    database: "cyvasse_test",
    host: "localhost",
    dialect: "postgres",
  },
  production: {
    use_env_variable: "DATABASE_URL"
  },
};
