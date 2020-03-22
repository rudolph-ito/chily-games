import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";
import { randomBytes, pbkdf2Sync } from "crypto";

export class User extends Model {
  public userId!: number;
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passwordSalt: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  { sequelize }
);

// Other fields
// Roles - admin / creator
// Requested creator (boolean)
