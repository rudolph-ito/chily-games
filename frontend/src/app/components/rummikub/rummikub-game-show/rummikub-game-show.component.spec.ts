import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RummikubGameShowComponent } from "./rummikub-game-show.component";
import { AppModule } from "src/app/app.module";
import { RummikubGameService } from "src/app/services/rummikub/rummikub-game-service";
import { UserService } from "src/app/services/user.service";
import { ChatService } from "src/app/services/chat.service";
import { of } from "rxjs";
import { getMockGame } from "src/app/test/rummikub/mock-data";

describe("RummikubGameShowComponent", () => {
  let component: RummikubGameShowComponent;
  let fixture: ComponentFixture<RummikubGameShowComponent>;
  let mockGameService: Partial<RummikubGameService>;
  let mockUserService: Partial<UserService>;
  let mockChatService: Partial<ChatService>;

  beforeEach(() => {
    mockGameService = {
      get: () => of(getMockGame()),
    };
    mockUserService = {
      get: () => of({ userId: 1, username: "test", displayName: "test" }),
    };
    mockChatService = {
      get: () => of({ chatMessages: [] }),
    };
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        { provide: RummikubGameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: ChatService, useValue: mockChatService },
      ],
    });
    fixture = TestBed.createComponent(RummikubGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
