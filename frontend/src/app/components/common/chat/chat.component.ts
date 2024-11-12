import {
  Component,
  ElementRef,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { UntypedFormControl } from "@angular/forms";
import { WrappedSocket } from "src/app/modules/socket.io/socket.io.service";
import { ChatService } from "src/app/services/chat.service";
import { IUser } from "src/app/shared/dtos/authentication";
import { IChatMessage, INewChatMessageEvent } from "src/app/shared/dtos/chat";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit {
  open: boolean = false;
  messageControl: UntypedFormControl = new UntypedFormControl("");
  chatMessages: IChatMessage[] = [];
  messagesListHeightAtLastAutoscroll: number;
  unreadMessageCount: number = 0;

  @Input("user") user: IUser | null;
  @Input("chatId") chatId: string;

  @ViewChild("messagesList") private readonly messagesList: ElementRef;

  constructor(
    private readonly chatService: ChatService,
    private readonly socket: WrappedSocket
  ) {}

  ngOnInit(): void {
    this.loadChatsAndSubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes.chatId.isFirstChange() &&
      changes.chatId.previousValue !== changes.chatId.currentValue
    ) {
      this.socket.emit("chat-leave", changes.chatId.previousValue);
      this.loadChatsAndSubscribe();
    }
  }

  ngOnDestroy(): void {
    this.socket.emit("chat-leave", this.chatId);
  }

  loadChatsAndSubscribe(): void {
    this.chatService
      .get(this.chatId)
      .subscribe((chat) => (this.chatMessages = chat.chatMessages));
    this.socket.emit("chat-join", this.chatId);
    this.socket
      .fromEvent("new-message")
      .subscribe((event: INewChatMessageEvent) => {
        if (!this.open) {
          this.unreadMessageCount += 1;
        }
        this.chatMessages.push(event.chatMessage);
        this.scrollMessageListToBottom();
      });
  }

  isCurrentUser(userId: number): boolean {
    return this.user?.userId === userId;
  }

  addMessage(): void {
    if (this.messageControl.value === "") {
      return;
    }
    this.chatService
      .addMessage(this.chatId, this.messageControl.value)
      .subscribe(() => {
        this.messageControl.setValue("");
      });
  }

  ngAfterViewChecked(): void {
    this.scrollMessageListToBottom();
  }

  scrollMessageListToBottom(): void {
    if (
      this.messagesList != null &&
      this.messagesListHeightAtLastAutoscroll !==
        this.messagesList.nativeElement.scrollHeight
    ) {
      this.messagesList.nativeElement.scrollTop =
        this.messagesList.nativeElement.scrollHeight;
      this.messagesListHeightAtLastAutoscroll =
        this.messagesList.nativeElement.scrollHeight;
    }
  }

  toggleOpen(): void {
    this.open = !this.open;
    if (this.open) {
      this.unreadMessageCount = 0;
    }
  }

  getMatBadge(): number {
    return this.unreadMessageCount;
  }

  getMatBadgeHidden(): boolean {
    return this.unreadMessageCount === 0;
  }
}
