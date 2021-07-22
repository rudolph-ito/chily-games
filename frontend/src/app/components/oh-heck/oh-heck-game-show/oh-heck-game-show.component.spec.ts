import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AppModule } from "src/app/app.module";
import { ChatService } from "src/app/services/chat.service";
import { OhHeckGameService } from "src/app/services/oh-heck/oh-heck-game-service";
import { UserService } from "src/app/services/user.service";
import { getMockGame } from "src/app/test/oh-heck/mock-data";

import { OhHeckGameShowComponent } from "./oh-heck-game-show.component";

describe("OhHeckGameShowComponent", () => {
  let component: OhHeckGameShowComponent;
  let fixture: ComponentFixture<OhHeckGameShowComponent>;
  let mockGameService: Partial<OhHeckGameService>;
  let mockUserService: Partial<UserService>;
  let mockChatService: Partial<ChatService>;

  beforeEach(async () => {
    mockGameService = {
      get: () => of(getMockGame()),
    };
    mockUserService = {
      get: () => of({ userId: 1, username: "test", displayName: "test" }),
    };
    mockChatService = {
      get: () => of({ chatMessages: [] }),
    };

    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: OhHeckGameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OhHeckGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
