import { Chat, ISerializedChat, ISerializedChatMessage } from "src/database/models/chat";
import { ValidationError } from "../exceptions";

export interface IChatUpdateOptions {
  chatMessages: ISerializedChatMessage[];
}

export interface IChatDataService {
  create: (chatId: string) => Promise<ISerializedChat>;
  get: (chatId: string) => Promise<null | ISerializedChat>;
  exists: (chatId: string) => Promise<boolean>;
  update: (
    chatId: string,
    version: number,
    options: IChatUpdateOptions
  ) => Promise<ISerializedChat>;
}

export class ChatDataService implements IChatDataService {
  async create(
    chatId: string
  ): Promise<ISerializedChat> {
    const chat = Chat.build({
      chatId,
      messages: [],
      version: 1,
    });
    await chat.save();
    return chat.serialize();
  }

  async exists(chatId: string): Promise<boolean> {
    const count = await Chat.count({ where: { chatId } });
    return count === 1;
  }

  async get(chatId: string): Promise<null | ISerializedChat> {
    const chat = await Chat.findByPk(chatId);
    if (chat == null) {
      return null
    }
    return chat.serialize();
  }

  async update(
    chatId: string,
    version: number,
    options: IChatUpdateOptions
  ): Promise<ISerializedChat> {
    const updates: any = {};
    for (const [key, value] of Object.entries(options)) {
      updates[key] = value;
    }
    updates.version = version + 1;
    const result = await Chat.update(updates, {
      where: {
        chatId,
        version,
      },
      returning: true,
    });
    if (result[0] !== 1) {
      throw new ValidationError("Chat version out of date.");
    }
    return result[1][0].serialize();
  }
}
