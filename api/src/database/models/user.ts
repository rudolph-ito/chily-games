import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { randomBytes, pbkdf2Sync } from "crypto";
import { IUser } from "../../shared/dtos/authentication";

export const PASSWORD_SALT_SIZE = 128;
export const PASSWORD_HASH_SIZE = 256;

export class User extends Model {
  public userId!: number;
  public username!: string;
  public displayName!: string;
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

  serialize(): IUser {
    return {
      userId: this.userId,
      username: this.username,
      displayName: this.displayName,
    };
  }

  static generatePasswordSalt(): string {
    return randomBytes(PASSWORD_SALT_SIZE).toString("hex");
  }

  static generatePasswordHash(password: string, salt: string): string {
    return pbkdf2Sync(
      password,
      salt,
      1000,
      PASSWORD_HASH_SIZE,
      "sha512"
    ).toString("hex");
  }
}
User.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(PASSWORD_HASH_SIZE * 2),
      allowNull: false,
    },
    passwordSalt: {
      type: DataTypes.STRING(PASSWORD_SALT_SIZE * 2),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize }
);

// Other fields
// Roles - admin / creator
// Requested creator (boolean)
