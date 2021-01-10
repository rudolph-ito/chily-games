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
import Konva from "konva";
import {
  getGameMessage,
  getRoundMessage,
} from "../../utils/yaniv/message-helpers";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IPosition {
  x: number;
  y: number;
}

interface ISize {
  width: number;
  height: number;
}

interface ICardDisplayInputs {
  cardSpacer: number;
  cardSize: ISize;
  padding: number;
  playerSize: ISize;
  playerOffset: IPosition;
}

interface IPlayerDisplayData {
  textPosition: IPosition;
  textWidth: number;
  borderPosition: IPosition;
  borderSize: ISize;
  cardPositions: ICardDisplayData[];
}

interface ICardDisplayData {
  size: ISize;
  rotation: number;
  position: IPosition;
  offset: IPosition;
}

interface IUserData {
  userId: number;
  positionIndex: number;
  cards: KonvaRect[];
  name: KonvaText;
  border: KonvaRect;
}

export interface ITableCallbacks {
  onPlay: (request: IGameActionRequest) => void;
  onViewScoreboard: () => void;
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
  private cardHeight: number;
  private cardWidth: number;
  private cardBackImage: HTMLImageElement;
  private users: Map<number, IUserData>;
  private currentUserId: number | null;
  private currentUserSelectedDiscards: ICard[] = [];
  private deckCard: KonvaRect;
  private discardedCards: KonvaRect[] = [];
  private messageText: KonvaText;
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
    this.cardHeight = min / 6;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {
    this.users = new Map<number, IUserData>();
    this.currentUserId = currentUserId ?? null;
    this.currentUserSelectedDiscards = [];
    this.cardsLayer.destroyChildren();
    const promises = [this.initializePlayers(game)];
    if (game.state === GameState.ROUND_ACTIVE) {
      promises.push(this.initializeDeck());
      promises.push(this.initializeDiscards(game.cardsOnTopOfDiscardPile));
    } else {
      this.initializeMessageText(game);
    }
    await Promise.all(promises);
    if (game.state === GameState.ROUND_ACTIVE) {
      this.updateActionTo(game.actionToUserId);
    }
    this.resize();
  }

  private initializeMessageText(game: IGame): void {
    const roundMessage = getRoundMessage(game);
    const gameMessage = getGameMessage(game);
    if (roundMessage !== "" || gameMessage !== "") {
      let fullText = roundMessage;
      if (gameMessage !== "") {
        fullText = `${fullText}\n\n${gameMessage}`;
      }
      this.messageText = new KonvaText({
        align: "center",
        verticalAlign: "middle",
        fontSize: 16,
        text: fullText,
        width: 200,
        height: this.cardHeight,
        x: this.container.offsetWidth / 2 - 100,
        y: this.container.offsetHeight / 2 - this.cardHeight / 2,
      });
      this.cardsLayer.add(this.messageText);
    }
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
    const rectsToDiscard: Konva.Rect[] = [];
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
      this.updateCardSizeAndPosition(
        rect,
        this.getDiscardPositionalData(index, lastAction.cardsDiscarded.length),
        true
      );
    }
    let onFinish: (() => void) | null = null;
    if (lastAction.cardPickedUp != null) {
      const { cardPickedUp } = lastAction;
      const cardRect = this.discardedCards.find((x) =>
        areCardsEqual(x.getAttr("yanivCard"), cardPickedUp)
      );
      this.removeCardEventHandlers(cardRect);
      rectsToDestroy = rectsToDestroy.filter((x) => x !== cardRect);
      userData.cards.push(cardRect);
      if (lastAction.userId === this.currentUserId) {
        this.initializeCurrentUserCardEventHandlers(cardRect);
      } else {
        onFinish = async (): Promise<void> => {
          await this.updateRectWithCardBack(cardRect);
          this.cardsLayer.draw();
        };
      }
    } else {
      const cardRect = this.deckCard.clone();
      cardRect.strokeWidth(CARD_BACK_DEFAULT_STROKE);
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
    }
    const positionalData = this.getPlayerPositionData(
      userData,
      this.users.size
    );
    for (let index = 0; index < userData.cards.length; index++) {
      const cardRect = userData.cards[index];
      const cardPosition = positionalData.cardPositions[index];
      const cardOnFinish =
        index === userData.cards.length - 1 ? onFinish : null;
      this.updateCardSizeAndPosition(
        cardRect,
        cardPosition,
        true,
        cardOnFinish
      );
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

  resize(): void {
    this.stage.size({
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.computeCardSize();

    if (this.messageText != null) {
      this.messageText.x(
        this.container.offsetWidth / 2 - this.messageText.width() / 2
      );
      this.messageText.y(
        this.container.offsetHeight / 2 - this.messageText.height() / 2
      );
    }

    if (this.deckCard != null) {
      this.updateCardSizeAndPosition(
        this.deckCard,
        this.getDeckPositionalData(),
        false
      );
    }
    for (let index = 0; index < this.discardedCards.length; index++) {
      this.updateCardSizeAndPosition(
        this.discardedCards[index],
        this.getDiscardPositionalData(index, this.discardedCards.length),
        false
      );
    }

    this.users.forEach((userData) => {
      const positionalData = this.getPlayerPositionData(
        userData,
        this.users.size
      );

      for (let index = 0; index < userData.cards.length; index++) {
        const cardRect = userData.cards[index];
        const cardPosition = positionalData.cardPositions[index];
        this.updateCardSizeAndPosition(cardRect, cardPosition, false);
      }

      userData.name.position(positionalData.textPosition);
      userData.name.width(positionalData.textWidth);
      userData.border.position(positionalData.borderPosition);
      userData.border.size(positionalData.borderSize);
    });

    this.cardsLayer.draw();
  }

  private getDeckPositionalData(): ICardDisplayData {
    return {
      size: {
        height: this.cardHeight,
        width: this.cardWidth,
      },
      position: {
        x: this.container.offsetWidth / 2 - this.cardWidth * 1.1,
        y: this.container.offsetHeight / 2 - this.cardHeight / 2,
      },
      offset: { x: 0, y: 0 },
      rotation: 0,
    };
  }

  async initializeDeck(): Promise<void> {
    const cardBack = await this.loadCardBack();
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
    const promises: Array<Promise<any>> = [];
    for (let index = 0; index < game.playerStates.length; index++) {
      const positionIndex =
        (index - bottomIndex + game.playerStates.length) %
        game.playerStates.length;
      promises.push(
        this.initializePlayer(
          game.playerStates[index],
          positionIndex,
          game.state === GameState.ROUND_COMPLETE ||
            game.state === GameState.COMPLETE
        )
      );
    }
    await Promise.all(promises);
  }

  private getPlayerPositionData(
    userData: IUserData,
    numberOfPlayers: number
  ): IPlayerDisplayData {
    const sizingData = this.getPlayerSizingData(userData.userId);

    const tableXRadius = this.container.offsetWidth / 2;
    let position = {
      x: tableXRadius,
      y: this.container.offsetHeight - sizingData.playerSize.height / 2,
    };
    if (userData.positionIndex !== 0) {
      const tableOffset = sizingData.cardSize.height;
      const tableXRadius = this.container.offsetWidth / 2 - tableOffset;
      const tableYRadius = this.container.offsetHeight - 2 * tableOffset;
      let radians = (Math.PI * userData.positionIndex) / numberOfPlayers;
      if (numberOfPlayers >= 6) {
        radians =
          (Math.PI * (userData.positionIndex - 1)) / (numberOfPlayers - 2);
      }
      radians += Math.PI;
      position = {
        x: (Math.cos(radians) + 1) * tableXRadius + tableOffset,
        y: (Math.sin(radians) + 1) * tableYRadius + tableOffset,
      };
    }

    const cardPositions = userData.cards.map((_, index) =>
      this.getCardPositionalData(userData, position, sizingData, index)
    );
    return {
      textPosition: {
        x: position.x - sizingData.playerOffset.x,
        y:
          position.y +
          sizingData.padding -
          sizingData.playerOffset.y +
          sizingData.cardSize.height * 1.2,
      },
      textWidth: sizingData.playerSize.width,
      borderPosition: {
        x: position.x - sizingData.playerOffset.x,
        y: position.y - sizingData.playerOffset.y,
      },
      borderSize: sizingData.playerSize,
      cardPositions,
    };
  }

  private async initializePlayer(
    playerState: IPlayerState,
    positionIndex: number,
    displayRoundScore: boolean
  ): Promise<void> {
    const name = new KonvaText({
      align: "center",
      fontSize: 16,
      text: playerState.displayName,
    });
    this.cardsLayer.add(name);
    const border = new KonvaRect({
      stroke: "gray",
      strokeWidth: 0,
    });
    this.cardsLayer.add(border);
    const userData: IUserData = {
      userId: playerState.userId,
      positionIndex,
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
    this.users.set(userData.userId, userData);
  }

  private getPlayerSizingData(userId: number): ICardDisplayInputs {
    const cardSize = { width: this.cardWidth, height: this.cardHeight };
    const cardSpacer =
      cardSize.width * (userId === this.currentUserId ? 1.2 : 0.33);
    const padding = userId === this.currentUserId ? 10 : 20;
    const height = cardSize.height * 1.2 + 16 + 2 * padding;
    const width = cardSize.width + 4 * cardSpacer + 2 * padding;
    return {
      cardSize,
      cardSpacer,
      padding,
      playerSize: {
        width,
        height,
      },
      playerOffset: {
        x: width / 2,
        y: height / 2,
      },
    };
  }

  private getDiscardPositionalData(
    cardIndex: number,
    numberOfCards: number
  ): ICardDisplayData {
    const center: IPosition = {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2,
    };
    const partialCardHeight = this.cardHeight / 4;
    const initialCardY =
      center.y -
      this.cardHeight / 2 -
      (numberOfCards - 1) * 0.5 * partialCardHeight;
    return {
      size: {
        height: this.cardHeight,
        width: this.cardWidth,
      },
      position: {
        x: center.x + this.cardWidth * 0.1,
        y: initialCardY + cardIndex * partialCardHeight,
      },
      offset: { x: 0, y: 0 },
      rotation: 0,
    };
  }

  private getCardPositionalData(
    userData: IUserData,
    playerPosition: IPosition,
    sizingData: ICardDisplayInputs,
    cardIndex: number
  ): ICardDisplayData {
    const size = sizingData.cardSize;
    const cardOffset =
      (size.width +
        (userData.cards.length - 1) * sizingData.cardSpacer +
        2 * sizingData.padding) /
      2;
    const position: IPosition = {
      x:
        playerPosition.x +
        sizingData.padding +
        cardIndex * sizingData.cardSpacer -
        cardOffset,
      y: playerPosition.y + sizingData.padding - sizingData.playerOffset.y,
    };
    const offset: Vector2d = {
      x: 0,
      y: 0,
    };
    let rotation = 0;

    if (userData.userId !== this.currentUserId) {
      position.x += size.width / 2;
      position.y += size.height / 2;
      offset.x = size.width / 2;
      offset.y = size.height / 2;

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
      size,
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
      x: rect.width() / image.width,
      y: rect.height() / image.height,
    });
  }

  private updateCardSizeAndPosition(
    rect: KonvaRect,
    displayData: ICardDisplayData,
    animate: boolean,
    onFinish: (() => void) | null = null
  ): void {
    rect.size(displayData.size);

    const image = rect.fillPatternImage();
    if (image != null) {
      rect.fillPatternScale({
        x: displayData.size.width / image.width,
        y: displayData.size.height / image.height,
      });
    }

    if (animate) {
      const tween = new KonvaTween({
        node: rect,
        duration: 1,
        easing: KonvaEasings.EaseInOut,
        onFinish,

        x: displayData.position.x,
        y: displayData.position.y,
        offsetX: displayData.offset.x,
        offsetY: displayData.offset.y,
        rotation: displayData.rotation,
      });
      tween.play();
    } else {
      rect.position(displayData.position);
      rect.offset(displayData.offset);
      rect.rotation(displayData.rotation);
    }
  }
}
