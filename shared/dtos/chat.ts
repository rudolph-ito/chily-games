export interface IChatMessage {
  userId: number;
  displayName: string;
  message: string;
}

export interface IChat {
  chatMessages: IChatMessage[];
}

export interface INewChatMessageEvent {
  chatMessage: IChatMessage;
}