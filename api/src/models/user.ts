import { STRING, Model } from "sequelize";
import { sequelize } from "./";
import { randomBytes, pbkdf2Sync } from "crypto";

class User extends Model {
  public email!: string;
  private passwordSalt!: string;
  private passwordHash!: string;

  setPassword(password: string): void {
    this.passwordSalt = User.generatePasswordSalt();
    this.passwordHash = User.generatePasswordHash(password, this.passwordSalt);
  }

  isPasswordValid(password: string): boolean {
    const passwordHash = User.generatePasswordHash(password, this.passwordSalt);
    return passwordHash === this.passwordHash;
  }

  static generatePasswordSalt(): string {
    return randomBytes(128).toString("hex");
  }

  static generatePasswordHash(password: string, salt: string): string {
    return pbkdf2Sync(password, salt, 1000, 128, "sha512").toString("hex");
  }
}
User.init(
  {
    email: STRING,
    passwordHash: STRING,
    passwordSalt: STRING
  },
  { sequelize, modelName: "user" }
);
