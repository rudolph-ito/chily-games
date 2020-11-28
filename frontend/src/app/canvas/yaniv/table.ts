import Konva from "konva";
import { ICard } from "src/app/shared/dtos/yaniv/card";
import {
  GameState,
  IGame,
  IGameActionRequest,
  IPlayerState,
} from "src/app/shared/dtos/yaniv/game";
import { doesHaveValue } from "src/app/shared/utilities/value_checker";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IPosition {
  x: number;
  y: number;
}

interface IUserData {
  position: IPosition;
  cards: Konva.Rect[];
  name: Konva.Text;
}

export function areCardsEqual(a: ICard, b: ICard): boolean {
  if (a.isJoker) {
    return b.isJoker && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

export class YanivTable {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly cardsLayer: Konva.Layer;
  private playerOffset: number;
  private cardHeight: number;
  private cardWidth: number;
  private cardBack: Konva.Rect;
  private users: Map<number, IUserData>;
  private currentUserId: number;
  private currentUserSelectedDiscards: ICard[] = [];
  private deckCard: Konva.Rect;
  private discardedCards: Konva.Rect[];
  private readonly onPlay: (request: IGameActionRequest) => void;

  constructor(
    options: ITableOptions,
    onPlay: (request: IGameActionRequest) => void
  ) {
    this.container = options.element;
    this.onPlay = onPlay;
    this.stage = new Konva.Stage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.cardsLayer = new Konva.Layer();
    this.stage.add(this.cardsLayer);
    this.computeCardSize();
  }

  private currentUserClickCard(card: ICard) {
    if (this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))) {
      this.currentUserSelectedDiscards = this.currentUserSelectedDiscards.filter(
        (x) => !areCardsEqual(x, card)
      );
    } else {
      this.currentUserSelectedDiscards.push(card);
    }
    this.refreshCurrentUser();
    this.cardsLayer.draw();
  }

  private refreshCurrentUser(): void {
    this.users.get(this.currentUserId).cards.forEach((rect) => {
      this.updateCurrentUserCardStroke(rect, false);
    });
  }

  private computeCardSize(): void {
    const min = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.cardHeight = min / 7;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
    this.playerOffset = this.cardHeight * 1.25;
  }

  async initializeState(game: IGame, currentUserId: number): Promise<void> {
    this.users = new Map<number, IUserData>(); 
    this.currentUserId = currentUserId;
    this.currentUserSelectedDiscards = [];
    this.cardsLayer.destroyChildren();
    await this.initializePlayers(game, currentUserId);
    if (game.state == GameState.ROUND_ACTIVE) {
      await this.initializeDeck();
      await this.initializeDiscards(game.cardsOnTopOfDiscardPile);
    }
    this.cardsLayer.draw();
  }

  async initializeDeck(): Promise<void> {
    const position: IPosition =  {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2
    };
    const cardBack = await this.loadCardBack();
    cardBack.x(position.x - this.cardWidth * 1.1);
    cardBack.y(position.y - this.cardHeight / 2);
    cardBack.stroke("black");
    cardBack.on("mouseover", (event) => {
      const rect = event.target as Konva.Rect;
      if (this.currentUserSelectedDiscards.length > 0) {
        rect.strokeWidth(40);
        this.cardsLayer.draw();
      }
    });
    cardBack.on("mouseout", (event) => {
      const rect = event.target as Konva.Rect;
      rect.strokeWidth(2);
      this.cardsLayer.draw();
    });
    cardBack.on("click", () => {
      if (this.currentUserSelectedDiscards.length > 0) {
        this.onPlay({
          cardsDiscarded: this.currentUserSelectedDiscards,
        });
      }
    });
    this.deckCard = cardBack
    this.cardsLayer.add(cardBack);
  }

  async initializeDiscards(cardsOnTopOfDiscardPile: ICard[]): Promise<void> {
    this.discardedCards = [];
    for (let index = 0; index < cardsOnTopOfDiscardPile.length; index++) {
      const card = cardsOnTopOfDiscardPile[index]
      const cardFront = await this.loadCardFace(card);
      cardFront.setAttr("yanivCard", card);
      cardFront.position(this.getDiscardPositionAndOffset(index, cardsOnTopOfDiscardPile.length));
      cardFront.stroke("black");
      cardFront.strokeWidth(0);
      cardFront.on("mouseover", (event) => {
        const rect = event.target as Konva.Rect;
        if (this.currentUserSelectedDiscards.length > 0) {
          rect.strokeWidth(10);
          this.cardsLayer.draw();
        }
      });
      cardFront.on("mouseout", (event) => {
        const rect = event.target as Konva.Rect;
        rect.strokeWidth(0);
        this.cardsLayer.draw();
      });
      cardFront.on("click", (event) => {
        const rect = event.target as Konva.Rect;
        if (this.currentUserSelectedDiscards.length > 0) {
          this.onPlay({
            cardPickedUp: rect.getAttr("yanivCard"),
            cardsDiscarded: this.currentUserSelectedDiscards,
          });
        }
      });
      this.discardedCards.push(cardFront);
      this.cardsLayer.add(cardFront)
    }
  }

  async initializePlayers(
    game: IGame,
    currentUserId: number
  ): Promise<void> {
    let bottomIndex = 0;
    game.playerStates.forEach((playerState, index) => {
      if (playerState.userId === currentUserId) {
        bottomIndex = index;
      }
    });
    const tableXRadius = this.container.offsetWidth / 2 - this.playerOffset;
    const tableYRadius = this.container.offsetHeight / 2 - this.playerOffset;
    for (let index = 0; index < game.playerStates.length; index++) {
      const positionIndex = (index - bottomIndex) % game.playerStates.length;
      const radians =
        (2 * Math.PI * positionIndex) / game.playerStates.length + Math.PI / 2;
      const x = (Math.cos(radians) + 1) * tableXRadius + this.playerOffset;
      const y = (Math.sin(radians) + 1) * tableYRadius + this.playerOffset;
      const userData = await this.initializePlayer(
        game.playerStates[index],
        { x, y },
        currentUserId,
        game.state == GameState.ROUND_COMPLETE
      );
      this.users.set(game.playerStates[index].userId, userData)
    }
  }

  private async initializePlayer(
    playerState: IPlayerState,
    position: IPosition,
    currentUserId: number,
    displayRoundScore: boolean
  ): Promise<IUserData> {
    const cardSpacer = this.cardWidth * (playerState.userId == currentUserId ? 1.2 : 0.5)
    const groupWidth = this.cardWidth + (playerState.numberOfCards - 1) * cardSpacer
    const groupHeight = this.cardHeight * 1.2 + 16;
    const groupOffset = {
      x: groupWidth / 2,
      y: groupHeight / 2
    };
    const name = new Konva.Text({
      align: "center",
      fontSize: 16,
      x: position.x,
      y: position.y + this.cardHeight * 1.2,
      text: playerState.username,
      width: groupWidth,
    })
    name.offset(groupOffset);
    this.cardsLayer.add(name)
    const userData = {
      position,
      cards: [],
      name
    }
    if (playerState.userId == currentUserId) {
      let offset = 0;
      for (const card of playerState.cards) {
        const cardFace = await this.loadCardFace(card);
        cardFace.x(position.x - groupOffset.x + offset);
        cardFace.y(position.y - groupOffset.y)
        cardFace.setAttr("yanivCard", card);
        cardFace.on("mouseover", () => {
          this.updateCurrentUserCardStroke(cardFace, true);
          this.cardsLayer.draw();
        });
        cardFace.on("mouseout", () => {
          this.updateCurrentUserCardStroke(cardFace, false);
          this.cardsLayer.draw();
        });
        cardFace.on("click", () => {
          this.currentUserClickCard(cardFace.getAttr("yanivCard"));
        });
        userData.cards.push(cardFace);
        this.cardsLayer.add(cardFace);
        offset += this.cardWidth * 1.2;
      }
    } else if (displayRoundScore) {
      let index = 0;
      for (const card of playerState.cards) {
        const cardFace = await this.loadCardFace(card);
        cardFace.x(position.x - groupOffset.x + (index * this.cardWidth) / 2);
        cardFace.y(position.y - groupOffset.y)
        this.rotateCard(cardFace, index, playerState.numberOfCards);
        userData.cards.push(cardFace);
        this.cardsLayer.add(cardFace);
        index++;
      }
    } else {
      const baseCardBack = await this.loadCardBack();
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const cardBack = baseCardBack.clone();
        cardBack.x(position.x - groupOffset.x + (index * this.cardWidth) / 2);
        cardBack.y(position.y - groupOffset.y)
        this.rotateCard(cardBack, index, playerState.numberOfCards);
        userData.cards.push(cardBack);
        this.cardsLayer.add(cardBack);
      }
    }
    return userData;
  }

  private getDiscardPositionAndOffset(cardIndex: number, numberOfCards: number): IPosition {
    const position: IPosition =  {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2
    };
    const partialCardHeight = this.cardHeight / 4;
    let initialCardY =
      position.y - 2 * partialCardHeight +
      (numberOfCards - 1) * 0.5 * partialCardHeight
    return {
      x: position.x + this.cardWidth * 0.1,
      y: initialCardY + cardIndex * partialCardHeight
    }
  }

  private updateCurrentUserCardStroke(rect: Konva.Rect, hover: boolean) {
    if (hover) {
      rect.stroke("black");
      rect.strokeWidth(10);
      return;
    }
    const card = rect.getAttr("yanivCard");
    if (
      doesHaveValue(card) &&
      this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))
    ) {
      rect.stroke("blue");
      rect.strokeWidth(5);
      return;
    }
    rect.strokeWidth(0);
  }

  private async loadCardFace(card: ICard): Promise<Konva.Rect> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `/assets/yaniv/${this.getCardAssetPath(card)}`;
      image.onload = () => {
        resolve(this.getCardRectangle(image, false));
      };
    });
  }

  private getCardAssetPath(card: ICard): string {
    if (card.isJoker) {
      return "joker.svg";
    }
    return `${card.rank}_of_${card.suit}.svg`;
  }

  private async loadCardBack(): Promise<Konva.Rect> {
    if (doesHaveValue(this.cardBack)) {
      return this.cardBack.clone();
    }
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `/assets/yaniv/back.png`;
      image.onload = () => {
        this.cardBack = this.getCardRectangle(image, true);
        resolve(this.cardBack.clone());
      };
    });
  }

  private getCardRectangle(
    image: HTMLImageElement,
    includeBorder: boolean
  ): Konva.Rect {
    const rect = new Konva.Rect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    if (includeBorder) {
      rect.stroke("black");
      rect.strokeWidth(2);
    }
    rect.fillPatternImage(image);
    rect.fillPatternRepeat("no-repeat");
    rect.fillPatternScale({
      x: this.cardWidth / image.width,
      y: this.cardHeight / image.height,
    });
    return rect;
  }

  private rotateCard(
    cardRect: Konva.Rect,
    cardIndex: number,
    numberOfCards: number
  ): void {
    cardRect.x(cardRect.x() + this.cardWidth / 2);
    cardRect.y(cardRect.y() + this.cardHeight / 2);
    cardRect.offset({
      x: cardRect.offsetX() + this.cardWidth / 2,
      y: cardRect.offsetY() + this.cardHeight / 2,
    });

    const rotateStep = 10;
    let rotateStart = 0;
    if (numberOfCards % 2 == 0) {
      rotateStart = ((-1 * numberOfCards) / 2) * rotateStep + rotateStep / 2;
    } else {
      rotateStart = ((-1 * (numberOfCards - 1)) / 2) * rotateStep;
    }
    cardRect.rotation(rotateStart + rotateStep * cardIndex);

    const centerIndex = (numberOfCards - 1) / 2;
    const drop =
      (Math.floor(Math.abs(centerIndex - cardIndex)) * this.cardHeight) / 20;
    cardRect.y(cardRect.y() + drop);
  }
}
