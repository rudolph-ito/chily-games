import _ from 'lodash'
import { ISerializedChat } from "src/database/models/chat";
import { IChat, INewChatMessageEvent } from "src/shared/dtos/chat";
import { ChatDataService, IChatDataService } from "./data/chat_data_service";
import { IUserDataService, UserDataService } from "./data/user_data_service";
import { ValidationError } from "./exceptions";

export interface IAddMessageRequest {
  message: string;
}

export interface IChatService {
  addMessage: (chatId: string, userId: number, request: IAddMessageRequest) => Promise<INewChatMessageEvent>;
  get: (chatId: string) => Promise<IChat>
}

export class ChatService implements IChatService {
  constructor(
    private readonly chatDataService: IChatDataService = new ChatDataService(),
    private readonly userDataService: IUserDataService = new UserDataService(),
  ) {}

  async addMessage(chatId: string, userId: number, request: IAddMessageRequest): Promise<INewChatMessageEvent> {
    const message = request?.message ?? '';
    if (message == '') {
      throw new ValidationError("Message cannot be empty");
    }
    const chat = await this.findOrCreateChat(chatId);
    await this.chatDataService.update(chatId, chat.version, {
      chatMessages: chat.chatMessages.concat({userId, message})
    })
    const user = await this.userDataService.getUser(userId)
    return {
      chatMessage: {
        userId,
        displayName: user.displayName,
        message
      }
    }
  }

  async get(chatId: string): Promise<IChat> {
    const chat = await this.findOrCreateChat(chatId);
    return await this.loadFullChat(chat);
  }

  private async findOrCreateChat(chatId: string): Promise<ISerializedChat> {
    const chat = await this.chatDataService.get(chatId);
    if (chat == null) {
      return await this.chatDataService.create(chatId);
    }
    return chat;
  }

  private async loadFullChat(chat: ISerializedChat): Promise<IChat> {
    const userIds = new Set<number>();
    chat.chatMessages.forEach(c => userIds.add(c.userId))
    const users = await this.userDataService.getUsers(Array.from(userIds));
    const userIdToDisplayName = _.fromPairs(
      users.map((u) => [u.userId, u.displayName])
    );
    return {
      chatMessages: chat.chatMessages.map((x) => ({ ...x, displayName: userIdToDisplayName[x.userId]}))
    }
  }
}
