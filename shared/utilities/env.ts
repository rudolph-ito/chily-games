export function shouldSequelizeLog(): boolean {
  return process.env.DEBUG_SEQUELIZE === "true";
}
