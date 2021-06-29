import { Model, DataTypes } from "sequelize";
import { sequelize } from "./connection";

export interface ISerializedChatMessage {
  userId: number;
  message: string;
}

export interface ISerializedChat {
  chatId: string;
  version: number;
  chatMessages: ISerializedChatMessage[];
}

export class Chat extends Model {
  public chatId!: string;
  public chatMessages!: ISerializedChatMessage[];
  public version!: number;
  public createdAt!: Date;
  public updatedAt!: Date;

  serialize(): ISerializedChat {
    return {
      chatId: this.chatId,
      chatMessages: this.chatMessages,
      version: this.version,
    };
  }
}
Chat.init(
  {
    chatId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    chatMessages: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { sequelize }
);
