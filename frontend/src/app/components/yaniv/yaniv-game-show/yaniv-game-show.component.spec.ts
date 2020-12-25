import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppModule } from "src/app/app.module";
import { GameState, IGame, IPlayerState } from "src/app/shared/dtos/yaniv/game";
import { YanivGameShowComponent } from "./yaniv-game-show.component";

function buildTestGame(playerStates: IPlayerState[]): IGame {
  return {
    gameId: 1,
    hostUserId: 1,
    options: { playTo: 100 },
    playerStates,
    state: GameState.ROUND_ACTIVE,
    roundScores: [],
    actionToUserId: 1,
    cardsOnTopOfDiscardPile: [],
  };
}

describe("YanivGameShowComponent", () => {
  let component: YanivGameShowComponent;
  let fixture: ComponentFixture<YanivGameShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
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

  describe("getUniquePlayerShortName", () => {
    it("returns first letter if unique", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "Adam", numberOfCards: 0, cards: [] },
        { userId: 2, username: "John", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[0]);

      // assert
      expect(result).toEqual("A");
    });

    it("returns first two letter if unique", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "John", numberOfCards: 0, cards: [] },
        { userId: 2, username: "Jane", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[0]);

      // assert
      expect(result).toEqual("Jo");
    });

    it("returns first three letter if unique", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "Charlie", numberOfCards: 0, cards: [] },
        { userId: 2, username: "Chuck", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[0]);

      // assert
      expect(result).toEqual("Cha");
    });

    it("returns first unique three letter if possible", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "Chad", numberOfCards: 0, cards: [] },
        { userId: 2, username: "Charlie", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[0]);

      // assert
      expect(result).toEqual("Chd");
    });

    it("returns first three letters if is subset of other name", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "Char", numberOfCards: 0, cards: [] },
        { userId: 2, username: "Charlie", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[0]);

      // assert
      expect(result).toEqual("Cha");
    });

    it("returns other three letter combo if name is superset of other name", () => {
      // arrange
      const playerStates = [
        { userId: 1, username: "Char", numberOfCards: 0, cards: [] },
        { userId: 2, username: "Charlie", numberOfCards: 0, cards: [] },
      ];
      component.game = buildTestGame(playerStates);

      // act
      const result = component.getUniquePlayerShortName(playerStates[1]);

      // assert
      expect(result).toEqual("Chl");
    });
  });
});
