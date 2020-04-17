import chai from "chai";
import dirtyChai from "dirty-chai";
import { beforeEach } from "mocha";
import { sequelize } from "../src/database/models";
import { shouldSequelizeLog } from "../src/shared/utilities/env";

chai.use(dirtyChai);

export function resetDatabaseBeforeEach(): void {
  beforeEach(async () => {
    await sequelize.sync({
      force: true,
      match: /_test$/,
      logging: shouldSequelizeLog()
    });
  });
}
