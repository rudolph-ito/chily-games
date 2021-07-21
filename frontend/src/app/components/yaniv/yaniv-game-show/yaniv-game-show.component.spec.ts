import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AppModule } from "src/app/app.module";
import { ChatService } from "src/app/services/chat.service";
import { UserService } from "src/app/services/user.service";
import { YanivGameService } from "src/app/services/yaniv/yaniv-game.service";
import { GameState } from "src/app/shared/dtos/yaniv/game";
import { YanivGameShowComponent } from "./yaniv-game-show.component";

describe("YanivGameShowComponent", () => {
  let component: YanivGameShowComponent;
  let fixture: ComponentFixture<YanivGameShowComponent>;
  let mockGameService: Partial<YanivGameService>;
  let mockUserService: Partial<UserService>;
  let mockChatService: Partial<ChatService>;

  beforeEach(async () => {
    mockGameService = {
      get: () =>
        of({
          hostUserId: 1,
          options: { playTo: 100 },
          state: GameState.PLAYERS_JOINING,
          createdAt: "2021-01-30T00:00:00",
          updatedAt: "2021-01-30T00:00:00",
          roundScores: [],
          gameId: 1,
          playerStates: [],
          actionToUserId: 1,
          cardsOnTopOfDiscardPile: [],
        }),
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
        { provide: YanivGameService, useValue: mockGameService },
        { provide: UserService, useValue: mockUserService },
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(YanivGameShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
