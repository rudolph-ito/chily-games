import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AppModule } from "src/app/app.module";
import { ChatService } from "src/app/services/chat.service";

import { ChatComponent } from "./chat.component";

describe("ChatComponent", () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockChatService: Partial<ChatService>;

  beforeEach(() => {
    mockChatService = {
      get: () => of({ chatMessages: [] }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    });
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
