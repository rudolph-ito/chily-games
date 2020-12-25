import { Vector2d } from "konva/types/types";
import { ICard } from "../../shared/dtos/yaniv/card";
import {
  GameState,
  IGame,
  IGameActionRequest,
  ILastAction,
  IPlayerState,
} from "../../shared/dtos/yaniv/game";
import {
  doesHaveValue,
  valueOrDefault,
} from "../../shared/utilities/value_checker";
import cardImages from "../../data/card_images";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import { Easings as KonvaEasings, Tween as KonvaTween } from "konva/lib/Tween";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IPosition {
  x: number;
  y: number;
}

interface ISizingData {
  width: number;
  height: number;
  offset: Vector2d;
}

interface IPlayerSizingData {
  cardSpacer: number;
  padding: number;
  maxSize: ISizingData;
  currentSize: ISizingData;
}

interface ICardPositionalData {
  rotation: number;
  position: IPosition;
  offset: Vector2d;
}

interface IUserData {
  userId: number;
  position: IPosition;
  cards: KonvaRect[];
  name: KonvaText;
  border: KonvaRect;
}

export function areCardsEqual(a: ICard, b: ICard): boolean {
  if (valueOrDefault(a.isJoker, false)) {
    return valueOrDefault(b.isJoker, false) && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

const CARD_BACK_DEFAULT_STROKE = 2;
const CARD_BACK_HOVER_STROKE = 5;
const CARD_FACE_DEFAULT_STROKE = 0;
const CARD_FACE_HOVER_STORKE = 5;
const CARD_FACE_SELECTED_STROKE = 3;

export class YanivTable {
  private readonly container: HTMLDivElement;
  private readonly stage: KonvaStage;
  private readonly cardsLayer: KonvaLayer;
  private playerOffset: number;
  private cardHeight: number;
  private cardWidth: number;
  private cardBackImage: HTMLImageElement;
  private users: Map<number, IUserData>;
  private currentUserId: number | null;
  private currentUserSelectedDiscards: ICard[] = [];
  private deckCard: KonvaRect;
  private discardedCards: KonvaRect[];
  private readonly onPlay: (request: IGameActionRequest) => void;

  constructor(
    options: ITableOptions,
    onPlay: (request: IGameActionRequest) => void
  ) {
    this.container = options.element;
    this.onPlay = onPlay;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.cardsLayer = new KonvaLayer();
    this.stage.add(this.cardsLayer);
    this.computeCardSize();
  }

  private currentUserClickCard(card: ICard): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    if (this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))) {
      this.currentUserSelectedDiscards = this.currentUserSelectedDiscards.filter(
        (x) => !areCardsEqual(x, card)
      );
    } else {
      this.currentUserSelectedDiscards.push(card);
    }
    const user = this.users.get(this.currentUserId);
    if (user == null) {
      throw new Error("User not found");
    }
    user.cards.forEach((rect) => {
      this.updateCardFaceStroke(rect, false);
    });
    this.cardsLayer.draw();
  }

  private computeCardSize(): void {
    const min = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.cardHeight = min / 7;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
    this.playerOffset = this.cardHeight * 1.3;
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {
    this.users = new Map<number, IUserData>();
    this.currentUserId = currentUserId ?? null;
    this.currentUserSelectedDiscards = [];
    this.cardsLayer.destroyChildren();
    const promises: Array<Promise<any>> = [];
    promises.push(this.initializePlayers(game));
    if (game.state === GameState.ROUND_ACTIVE) {
      promises.push(this.initializeDeck());
      promises.push(this.initializeDiscards(game.cardsOnTopOfDiscardPile));
    }
    await Promise.all(promises);
    if (game.state === GameState.ROUND_ACTIVE) {
      this.updateActionTo(game.actionToUserId);
    }
    this.cardsLayer.draw();
  }

  async updateStateWithUserAction(
    lastAction: ILastAction,
    newActionToUserId: number,
    cardPickedUpFromDeck?: ICard
  ): Promise<void> {
    const userData = this.users.get(lastAction.userId);
    if (userData == null) {
      throw new Error("User not found");
    }
    const rectsToDiscard: KonvaRect[] = [];
    let rectsToDestroy = this.discardedCards;
    for (let index = 0; index < lastAction.cardsDiscarded.length; index++) {
      const card = lastAction.cardsDiscarded[index];
      let rect: KonvaRect;
      if (lastAction.userId === this.currentUserId) {
        this.currentUserSelectedDiscards = [];
        rect = userData.cards.find((x) =>
          areCardsEqual(x.getAttr("yanivCard"), card)
        );
        this.updateCardFaceStroke(rect, false);
        userData.cards.splice(userData.cards.indexOf(rect), 1);
      } else {
        rect = userData.cards.shift();
        await this.updateRectWithCardFace(rect, card);
      }
      rect.zIndex(this.cardsLayer.children.length - 1);
      this.initializeDiscardEventHandlers(rect);
      rectsToDiscard.push(rect);
      const newPosition = this.getDiscardPosition(
        index,
        lastAction.cardsDiscarded.length
      );
      this.animateCardToPosition(rect, {
        position: newPosition,
        offset: { x: 0, y: 0 },
        rotation: 0,
      });
    }
    if (lastAction.cardPickedUp != null) {
      const { cardPickedUp } = lastAction;
      const cardRect = this.discardedCards.find((x) =>
        areCardsEqual(x.getAttr("yanivCard"), cardPickedUp)
      );
      this.removeCardEventHandlers(cardRect);
      rectsToDestroy = rectsToDestroy.filter((x) => x !== cardRect);
      userData.cards.push(cardRect);
      const positionalData = this.getCardPositionalData(
        userData,
        userData.cards.length - 1
      );
      let onFinish: (() => void) | null = null;
      if (lastAction.userId === this.currentUserId) {
        this.initializeCurrentUserCardEventHandlers(cardRect);
      } else {
        onFinish = async (): Promise<void> => {
          await this.updateRectWithCardBack(cardRect);
          this.cardsLayer.draw();
        };
      }
      this.animateCardToPosition(cardRect, positionalData, onFinish);
    } else {
      const cardRect = this.deckCard.clone();
      this.removeCardEventHandlers(cardRect);
      if (lastAction.userId === this.currentUserId) {
        if (cardPickedUpFromDeck == null) {
          throw new Error("cardPickedUpFromDeck unexpectedly null");
        }
        await this.updateRectWithCardFace(cardRect, cardPickedUpFromDeck);
        this.initializeCurrentUserCardEventHandlers(cardRect);
      }
      userData.cards.push(cardRect);
      this.cardsLayer.add(cardRect);
      const positionalData = this.getCardPositionalData(
        userData,
        userData.cards.length - 1
      );
      this.animateCardToPosition(cardRect, positionalData);
    }
    for (let index = 0; index < userData.cards.length - 1; index++) {
      const cardRect = userData.cards[index];
      const positionalData = this.getCardPositionalData(userData, index);
      this.animateCardToPosition(cardRect, positionalData);
    }
    this.updateActionTo(newActionToUserId);
    rectsToDestroy.forEach((x) => x.destroy());
    this.discardedCards = rectsToDiscard;
    this.cardsLayer.draw();
  }

  updateActionTo(actionToUserId: number): void {
    this.users.forEach((userData) => {
      userData.border.strokeWidth(0);
    });
    const userData = this.users.get(actionToUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    userData.border.strokeWidth(5);
  }

  async initializeDeck(): Promise<void> {
    const position: IPosition = {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2,
    };
    const cardBack = await this.loadCardBack();
    cardBack.x(position.x - this.cardWidth * 1.1);
    cardBack.y(position.y - this.cardHeight / 2);
    cardBack.on("mouseover", (event) => {
      const rect = event.target as KonvaRect;
      if (this.currentUserSelectedDiscards.length > 0) {
        rect.strokeWidth(CARD_BACK_HOVER_STROKE);
        this.cardsLayer.draw();
      }
    });
    cardBack.on("mouseout", (event) => {
      const rect = event.target as KonvaRect;
      rect.strokeWidth(CARD_BACK_DEFAULT_STROKE);
      this.cardsLayer.draw();
    });
    cardBack.on("click", () => {
      if (this.currentUserSelectedDiscards.length > 0) {
        this.onPlay({
          cardsDiscarded: this.currentUserSelectedDiscards,
        });
      }
    });
    this.deckCard = cardBack;
    this.cardsLayer.add(cardBack);
  }

  async initializeDiscards(cardsOnTopOfDiscardPile: ICard[]): Promise<void> {
    this.discardedCards = [];
    for (let index = 0; index < cardsOnTopOfDiscardPile.length; index++) {
      const card = cardsOnTopOfDiscardPile[index];
      const cardFront = await this.loadCardFace(card);
      cardFront.position(
        this.getDiscardPosition(index, cardsOnTopOfDiscardPile.length)
      );
      this.initializeDiscardEventHandlers(cardFront);
      this.discardedCards.push(cardFront);
      this.cardsLayer.add(cardFront);
    }
  }

  async initializePlayers(game: IGame): Promise<void> {
    let bottomIndex = 0;
    game.playerStates.forEach((playerState, index) => {
      if (playerState.userId === this.currentUserId) {
        bottomIndex = index;
      }
    });
    const tableXRadius = this.container.offsetWidth / 2 - this.playerOffset;
    const tableYRadius = this.container.offsetHeight / 2 - this.playerOffset;
    const promises: Array<Promise<any>> = [];
    for (let index = 0; index < game.playerStates.length; index++) {
      const positionIndex = (index - bottomIndex) % game.playerStates.length;
      const radians =
        (2 * Math.PI * positionIndex) / game.playerStates.length + Math.PI / 2;
      const x = (Math.cos(radians) + 1) * tableXRadius + this.playerOffset;
      const y = (Math.sin(radians) + 1) * tableYRadius + this.playerOffset;
      promises.push(
        this.initializePlayer(
          game.playerStates[index],
          { x, y },
          game.state === GameState.ROUND_COMPLETE ||
            game.state === GameState.COMPLETE
        )
      );
    }
    await Promise.all(promises);
  }

  private async initializePlayer(
    playerState: IPlayerState,
    position: IPosition,
    displayRoundScore: boolean
  ): Promise<void> {
    const {
      padding,
      currentSize: { width, offset },
      maxSize,
    } = this.getPlayerSizingData(playerState.userId, playerState.numberOfCards);
    const name = new KonvaText({
      align: "center",
      fontSize: 16,
      x: position.x - offset.x,
      y: position.y + padding - offset.y + this.cardHeight * 1.2,
      text: playerState.username,
      width,
    });
    this.cardsLayer.add(name);
    const border = new KonvaRect({
      height: maxSize.height,
      width: maxSize.width,
      x: position.x - maxSize.offset.x,
      y: position.y - maxSize.offset.y,
      stroke: "gray",
      strokeWidth: 0,
    });
    this.cardsLayer.add(border);
    const userData: IUserData = {
      userId: playerState.userId,
      position,
      cards: [],
      name,
      border,
    };
    if (playerState.userId === this.currentUserId) {
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const card = playerState.cards[index];
        const cardFace = await this.loadCardFace(card);
        this.initializeCurrentUserCardEventHandlers(cardFace);
        userData.cards.push(cardFace);
        this.cardsLayer.add(cardFace);
      }
    } else {
      const baseCardBack = await this.loadCardBack();
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const cardRect = displayRoundScore
          ? await this.loadCardFace(playerState.cards[index])
          : baseCardBack.clone();
        userData.cards.push(cardRect);
        this.cardsLayer.add(cardRect);
      }
    }
    this.updateUserCardPositions(userData);
    this.users.set(userData.userId, userData);
  }

  private updateUserCardPositions(userData: IUserData): void {
    for (let index = 0; index < userData.cards.length; index++) {
      const cardRect = userData.cards[index];
      const positionalData = this.getCardPositionalData(userData, index);
      cardRect.position(positionalData.position);
      cardRect.offset(positionalData.offset);
      cardRect.rotation(positionalData.rotation);
    }
  }

  private getPlayerSizingData(
    userId: number,
    numberOfCards: number
  ): IPlayerSizingData {
    const cardSpacer =
      this.cardWidth * (userId === this.currentUserId ? 1.2 : 0.5);
    const padding = userId === this.currentUserId ? 10 : 20;
    const currentWidth =
      this.cardWidth + (numberOfCards - 1) * cardSpacer + 2 * padding;
    const height = this.cardHeight * 1.2 + 16 + 2 * padding;
    const maxWidth = this.cardWidth + 4 * cardSpacer + 2 * padding;
    return {
      cardSpacer,
      padding,
      currentSize: {
        width: currentWidth,
        height,
        offset: {
          x: currentWidth / 2,
          y: height / 2,
        },
      },
      maxSize: {
        width: maxWidth,
        height,
        offset: {
          x: maxWidth / 2,
          y: height / 2,
        },
      },
    };
  }

  private getDiscardPosition(
    cardIndex: number,
    numberOfCards: number
  ): IPosition {
    const position: IPosition = {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2,
    };
    const partialCardHeight = this.cardHeight / 4;
    const initialCardY =
      position.y -
      this.cardHeight / 2 -
      (numberOfCards - 1) * 0.5 * partialCardHeight;
    return {
      x: position.x + this.cardWidth * 0.1,
      y: initialCardY + cardIndex * partialCardHeight,
    };
  }

  private getCardPositionalData(
    userData: IUserData,
    cardIndex: number
  ): ICardPositionalData {
    const { cardSpacer, padding, currentSize } = this.getPlayerSizingData(
      userData.userId,
      userData.cards.length
    );
    const position: IPosition = {
      x:
        userData.position.x +
        padding -
        currentSize.offset.x +
        cardIndex * cardSpacer,
      y: userData.position.y + padding - currentSize.offset.y,
    };
    const offset: Vector2d = {
      x: 0,
      y: 0,
    };
    let rotation = 0;
    if (userData.userId !== this.currentUserId) {
      position.x += this.cardWidth / 2;
      position.y += this.cardHeight / 2;
      offset.x = this.cardWidth / 2;
      offset.y = this.cardHeight / 2;

      const rotateStep = 10;
      let rotateStart = 0;
      if (userData.cards.length % 2 === 0) {
        rotateStart =
          ((-1 * userData.cards.length) / 2) * rotateStep + rotateStep / 2;
      } else {
        rotateStart = ((-1 * (userData.cards.length - 1)) / 2) * rotateStep;
      }
      rotation = rotateStart + rotateStep * cardIndex;

      const centerIndex = (userData.cards.length - 1) / 2;
      const drop =
        (Math.floor(Math.abs(centerIndex - cardIndex)) * this.cardHeight) / 20;
      position.y += drop;
    }
    return {
      position,
      offset,
      rotation,
    };
  }

  private updateCardFaceStroke(rect: KonvaRect, hover: boolean): void {
    if (hover) {
      rect.stroke("black");
      rect.strokeWidth(CARD_FACE_HOVER_STORKE);
      return;
    }
    const card = rect.getAttr("yanivCard");
    if (
      doesHaveValue(card) &&
      this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))
    ) {
      rect.stroke("blue");
      rect.strokeWidth(CARD_FACE_SELECTED_STROKE);
      return;
    }
    rect.stroke("black");
    rect.strokeWidth(CARD_FACE_DEFAULT_STROKE);
  }

  private initializeDiscardEventHandlers(rect: KonvaRect): void {
    this.removeCardEventHandlers(rect);
    rect.on("mouseover", (event) => {
      const rect = event.target as KonvaRect;
      if (this.currentUserSelectedDiscards.length > 0) {
        this.updateCardFaceStroke(rect, true);
        this.cardsLayer.draw();
      }
    });
    rect.on("mouseout", (event) => {
      const rect = event.target as KonvaRect;
      this.updateCardFaceStroke(rect, false);
      this.cardsLayer.draw();
    });
    rect.on("click", (event) => {
      const rect = event.target as KonvaRect;
      if (this.currentUserSelectedDiscards.length > 0) {
        this.onPlay({
          cardPickedUp: rect.getAttr("yanivCard"),
          cardsDiscarded: this.currentUserSelectedDiscards,
        });
      }
    });
  }

  private removeCardEventHandlers(rect: KonvaRect): void {
    rect.off("mouseover");
    rect.off("mouseout");
    rect.off("click");
  }

  private initializeCurrentUserCardEventHandlers(rect: KonvaRect): void {
    this.removeCardEventHandlers(rect);
    rect.on("mouseover", (event) => {
      const rect = event.target as KonvaRect;
      this.updateCardFaceStroke(rect, true);
      this.cardsLayer.draw();
    });
    rect.on("mouseout", (event) => {
      const rect = event.target as KonvaRect;
      this.updateCardFaceStroke(rect, false);
      this.cardsLayer.draw();
    });
    rect.on("click", (event) => {
      const rect = event.target as KonvaRect;
      this.currentUserClickCard(rect.getAttr("yanivCard"));
    });
  }

  private async loadCardFace(card: ICard): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardFace(rect, card);
    return rect;
  }

  private getCardImageBase64(card: ICard): string {
    if (valueOrDefault(card.isJoker, false)) {
      return cardImages.joker;
    }
    if (card.suit == null || card.rank == null) {
      throw new Error(
        `Card missing rank or suit when attempting to load image, card: ${JSON.stringify(
          card
        )}`
      );
    }
    return cardImages[`${card.suit.replace(/s$/, "")}_${card.rank}`];
  }

  private async loadCardBack(): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardBack(rect);
    return rect;
  }

  private async updateRectWithCardBack(rect: KonvaRect): Promise<void> {
    if (this.cardBackImage == null) {
      this.cardBackImage = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.src = `data:image/png;base64,${cardImages.back}`;
        image.onload = () => {
          resolve(image);
        };
      });
    }
    this.updateRectWithImage(rect, this.cardBackImage);
    rect.stroke("black");
    rect.strokeWidth(CARD_BACK_DEFAULT_STROKE);
  }

  private async updateRectWithCardFace(
    rect: KonvaRect,
    card: ICard
  ): Promise<void> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `data:image/png;base64,${this.getCardImageBase64(card)}`;
      image.onload = () => {
        rect.setAttr("yanivCard", card);
        this.updateRectWithImage(rect, image);
        rect.stroke("black");
        rect.strokeWidth(CARD_FACE_DEFAULT_STROKE);
        resolve();
      };
    });
  }

  private updateRectWithImage(rect: KonvaRect, image: HTMLImageElement): void {
    rect.fillPatternImage(image);
    rect.fillPatternRepeat("no-repeat");
    rect.fillPatternScale({
      x: this.cardWidth / image.width,
      y: this.cardHeight / image.height,
    });
  }

  private animateCardToPosition(
    rect: KonvaRect,
    positionalData: ICardPositionalData,
    onFinish: (() => void) | null = null
  ): void {
    const tween = new KonvaTween({
      node: rect,
      x: positionalData.position.x,
      y: positionalData.position.y,
      offsetX: positionalData.offset.x,
      offsetY: positionalData.offset.y,
      rotation: positionalData.rotation,
      duration: 1,
      easing: KonvaEasings.EaseInOut,
      onFinish,
    });
    tween.play();
  }
}
