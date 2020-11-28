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
  private currentUserGroup: Konva.Group;
  private currentUserSelectedDiscards: ICard[] = [];
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
    this.currentUserGroup.children.each((node) => {
      const card = node.getAttr("yanivCard");
      if (doesHaveValue(card)) {
        this.updateCurrentUserCardStroke(node as Konva.Rect, false);
      }
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

  async refreshState(game: IGame, currentUserId: number): Promise<void> {
    this.currentUserGroup = null;
    this.currentUserSelectedDiscards = [];
    this.cardsLayer.destroyChildren();
    if (game.state == GameState.ROUND_ACTIVE) {
      await this.refreshPlayers(
        game.playerStates,
        game.actionToUserId,
        currentUserId,
        false
      );
      await this.refreshDeckAndDiscard(game.cardsOnTopOfDiscardPile);
    } else if (
      game.state == GameState.ROUND_COMPLETE ||
      game.state == GameState.COMPLETE
    ) {
      await this.refreshPlayers(
        game.playerStates,
        game.actionToUserId,
        currentUserId,
        true
      );
    }
    this.cardsLayer.draw();
  }

  async refreshDeckAndDiscard(cardsOnTopOfDiscardPile: ICard[]): Promise<void> {
    const tableCenterX = this.container.offsetWidth / 2;
    const tableCenterY = this.container.offsetHeight / 2;
    const partialCardHeight = this.cardHeight / 4;
    const groupWidth = this.cardWidth * 2.2;
    const groupHeight = this.cardHeight + partialCardHeight * 4;
    const group = new Konva.Group({
      x: tableCenterX,
      y: tableCenterY,
      height: groupHeight,
      width: groupWidth,
    });
    const cardBack = await this.loadCardBack();
    cardBack.x(0);
    cardBack.y(2 * partialCardHeight);
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
    group.add(cardBack);
    let nextCardY =
      2 * partialCardHeight -
      (cardsOnTopOfDiscardPile.length - 1) * 0.5 * partialCardHeight;
    for (const card of cardsOnTopOfDiscardPile) {
      const cardFront = await this.loadCardFace(card);
      cardFront.setAttr("yanivCard", card);
      cardFront.x(this.cardWidth * 1.2);
      cardFront.y(nextCardY);
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
      cardBack;
      group.add(cardFront);
      nextCardY += partialCardHeight;
    }
    group.offsetX(groupWidth / 2);
    group.offsetY(groupHeight / 2);
    this.cardsLayer.add(group);
  }

  async refreshPlayers(
    playerStates: IPlayerState[],
    actionToUserId: number,
    currentUserId: number,
    displayRoundScore: boolean
  ): Promise<void> {
    let bottomIndex = 0;
    playerStates.forEach((playerState, index) => {
      if (playerState.userId === currentUserId) {
        bottomIndex = index;
      }
    });
    const tableXRadius = this.container.offsetWidth / 2 - this.playerOffset;
    const tableYRadius = this.container.offsetHeight / 2 - this.playerOffset;
    for (let index = 0; index < playerStates.length; index++) {
      const positionIndex = (index - bottomIndex) % playerStates.length;
      const radians =
        (2 * Math.PI * positionIndex) / playerStates.length + Math.PI / 2;
      const x = (Math.cos(radians) + 1) * tableXRadius + this.playerOffset;
      const y = (Math.sin(radians) + 1) * tableYRadius + this.playerOffset;
      const group = await this.addPlayer(
        playerStates[index],
        { x, y },
        actionToUserId,
        currentUserId,
        displayRoundScore
      );
      this.cardsLayer.add(group);
    }
  }

  private async addPlayer(
    playerState: IPlayerState,
    position: IPosition,
    actionToUserId: number,
    currentUserId: number,
    displayRoundScore: boolean
  ): Promise<Konva.Group> {
    const group = new Konva.Group({
      x: position.x,
      y: position.y,
    });
    const groupWidth =
      playerState.userId == currentUserId
        ? this.cardWidth +
          (playerState.numberOfCards - 1) * this.cardWidth * 1.2
        : this.cardWidth +
          ((playerState.numberOfCards - 1) * this.cardWidth) / 2;
    const groupHeight = this.cardHeight * 1.2 + 16;
    const name = new Konva.Text({
      text: playerState.username,
      y: this.cardHeight * 1.2,
      height: groupHeight,
      width: groupWidth,
      align: "center",
      fontSize: 16,
    });
    if (actionToUserId == playerState.userId) {
      name.textDecoration("underline");
    }
    group.add(name);
    if (playerState.userId == currentUserId) {
      let offset = 0;
      for (const card of playerState.cards) {
        const cardFace = await this.loadCardFace(card);
        cardFace.x(offset);
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
        group.add(cardFace);
        offset += this.cardWidth * 1.2;
      }
      this.currentUserGroup = group;
    } else if (displayRoundScore) {
      let index = 0;
      for (const card of playerState.cards) {
        const cardFace = await this.loadCardFace(card);
        cardFace.x((index * this.cardWidth) / 2);
        this.rotateCard(cardFace, index, playerState.numberOfCards);
        group.add(cardFace);
        index++;
      }
    } else {
      const baseCardBack = await this.loadCardBack();
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const cardBack = baseCardBack.clone();
        cardBack.x((index * this.cardWidth) / 2);
        this.rotateCard(cardBack, index, playerState.numberOfCards);
        group.add(cardBack);
      }
    }
    group.offsetX(groupWidth / 2);
    group.offsetY(groupHeight / 2);
    return group;
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
      x: this.cardWidth / 2,
      y: this.cardHeight / 2,
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
