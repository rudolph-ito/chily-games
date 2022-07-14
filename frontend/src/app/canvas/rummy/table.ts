import { Vector2d } from "konva/lib/types";
import { ICard } from "../../shared/dtos/card";
import { doesHaveValue } from "../../shared/utilities/value_checker";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Text as KonvaText } from "konva/lib/shapes/Text";
import Konva from "konva";
import {
  getGameMessage,
  getRoundMessage,
} from "../../utils/yaniv/message-helpers";
import {
  areCardsEqual,
  BaseTable,
  CARD_BACK_DEFAULT_STROKE,
  CARD_FACE_DEFAULT_STROKE,
  IPosition,
  ISize,
  ITableOptions,
} from "../base_table";
import { GameState, IDiscardEvent, IDiscardInput, IDiscardState, IGame, IMeldEvent, IMeldInput, IPickupEvent, IPickupInput, IPlayerState } from "src/app/shared/dtos/rummy/game";

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
  cards: Konva.Rect[];
  name: KonvaText;
  border: KonvaRect;
}

const CARD_BACK_HOVER_STROKE = 5;
const CARD_FACE_HOVER_STORKE = 5;
const CARD_FACE_SELECTED_STROKE = 3;

export class RummyTable extends BaseTable {
  private users: Map<number, IUserData>;
  private currentUserId: number | null;
  private currentUserSelectedDiscards: ICard[] = [];
  private deckCard: KonvaRect;
  private discardPiles: KonvaRect[][] = [];
  private messageText: KonvaText;
  private readonly onPickup: (request: IPickupInput) => void;
  private readonly onMeld: (request: IMeldInput) => void;
  private readonly onDiscard: (request: IDiscardInput) => void;


  constructor(
    options: ITableOptions,
    onPickup: (request: IPickupInput) => void,
    onMeld: (request: IMeldInput) => void,
    onDiscard: (request: IDiscardInput) => void,
    onRearrangeCards: (cards: ICard[]) => void
  ) {
    super(options, onRearrangeCards);
    this.onPickup = onPickup;
    this.onMeld = onMeld;
    this.onDiscard = onDiscard;
  }

  private currentUserClickCard(card: ICard): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    if (this.currentUserSelectedDiscards.some((x) => areCardsEqual(x, card))) {
      this.currentUserSelectedDiscards =
        this.currentUserSelectedDiscards.filter((x) => !areCardsEqual(x, card));
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

  private currentUserDragEndCard(draggedCardRect: Konva.Rect): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    const userData = this.users.get(this.currentUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    const index = userData.cards.findIndex((x) => x === draggedCardRect);
    const positionalData = this.getPlayerPositionData(
      userData,
      this.users.size
    );
    const cardRect = userData.cards[index];
    const cardPosition = positionalData.cardPositions[index];
    this.updateCardSizeAndPosition(cardRect, cardPosition, "none");
    const updatedCards: ICard[] = userData.cards.map((x) =>
      x.getAttr("yanivCard")
    );
    this.onRearrangeCards(updatedCards);
  }

  private currentUserDragMoveCard(draggedCardRect: Konva.Rect): void {
    if (this.currentUserId == null) {
      throw new Error("Current user required");
    }
    const userData = this.users.get(this.currentUserId);
    if (userData == null) {
      throw new Error("User not found");
    }
    const draggedCardOldIndex = userData.cards.findIndex(
      (x) => x === draggedCardRect
    );
    let draggedCardNewIndex = draggedCardOldIndex;
    for (let index = 0; index < userData.cards.length; index++) {
      const cardRect = userData.cards[index];
      if (cardRect !== draggedCardRect) {
        const cardCenter = draggedCardRect.x() + draggedCardRect.width() / 2;
        if (
          cardCenter > cardRect.x() &&
          cardCenter <= cardRect.x() + cardRect.width()
        ) {
          draggedCardNewIndex = index;
        }
      }
    }
    if (draggedCardOldIndex !== draggedCardNewIndex) {
      userData.cards.splice(
        draggedCardNewIndex,
        0,
        userData.cards.splice(draggedCardOldIndex, 1)[0]
      );
      const positionalData = this.getPlayerPositionData(
        userData,
        this.users.size
      );
      for (let index = 0; index < userData.cards.length; index++) {
        const cardRect = userData.cards[index];
        if (cardRect !== draggedCardRect) {
          const cardPosition = positionalData.cardPositions[index];
          this.updateCardSizeAndPosition(cardRect, cardPosition, "none");
        }
      }
    }
  }

  async initializeState(game: IGame, currentUserId?: number): Promise<void> {
    this.users = new Map<number, IUserData>();
    this.currentUserId = currentUserId ?? null;
    this.currentUserSelectedDiscards = [];
    this.cardsLayer.destroyChildren();
    const promises: Array<Promise<any>> = [];
    if (game.playerStates[0].numberOfCards !== 0) {
      promises.push(this.initializePlayers(game));
    }
    if (game.state === GameState.PICKUP || GameState.MELD_OR_DISCARD) {
      promises.push(this.initializeDeck());
      promises.push(this.initializeDiscards(game.discardState));
    } else {
      this.initializeMessageText(game);
    }
    await Promise.all(promises);
    if (game.state === GameState.PICKUP || GameState.MELD_OR_DISCARD) {
      this.updateActionTo(game.actionToUserId);
    }
    this.resize();
  }

  clear(): void {
    this.cardsLayer.destroyChildren();
    this.cardsLayer.draw();
  }

  private initializeMessageText(game: IGame): void {
    const roundMessage = ""; // TODO getRoundMessage(game);
    const gameMessage = ""; // TODO getGameMessage(game);
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

  async updateStateWithPickup(
    event: IPickupEvent,
    cardPickedUpFromDeck?: ICard
  ): Promise<void> {}

  async updateStateWithMeld(
    event: IMeldEvent
  ): Promise<void> {}

  async updateStateWithDiscard(
    event: IDiscardEvent
  ): Promise<void> {}

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
        "none"
      );
    }

    const numberOfPiles = this.discardPiles.length;
    for (let pileIndex = 0; pileIndex < this.discardPiles.length; pileIndex++) {
      const pile = this.discardPiles[pileIndex];
      for (let cardIndex = 0; cardIndex < pile.length; cardIndex++) {
        this.updateCardSizeAndPosition(
          pile[cardIndex],
          this.getDiscardPositionalData(pileIndex, cardIndex, numberOfPiles),
          "none"
        );
      }
    }

    this.users.forEach((userData) => {
      const positionalData = this.getPlayerPositionData(
        userData,
        this.users.size
      );

      for (let index = 0; index < userData.cards.length; index++) {
        const cardRect = userData.cards[index];
        const cardPosition = positionalData.cardPositions[index];
        this.updateCardSizeAndPosition(cardRect, cardPosition, "none");

        if (userData.userId === this.currentUserId) {
          cardRect.dragBoundFunc((pos: IPosition): IPosition => {
            const minX = positionalData.borderPosition.x;
            const maxX =
              minX + positionalData.borderSize.width - cardPosition.size.width;
            return {
              x: pos.x < minX ? minX : pos.x > maxX ? maxX : pos.x,
              y: cardPosition.position.y,
            };
          });
        }
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
    cardBack.on("click tap", () => {
      if (this.currentUserSelectedDiscards.length > 0) {
        // TODO
      }
    });
    this.deckCard = cardBack;
    this.cardsLayer.add(cardBack);
  }

  async initializeDiscards(discardState: IDiscardState): Promise<void> {
    this.discardPiles = [];
    for (let pileIndex = 0; pileIndex < discardState.piles.length; pileIndex++) {
      const pile = discardState.piles[pileIndex];
      this.discardPiles.push([]);
      for (let cardIndex = 0; cardIndex < pile.length; cardIndex++) {
        const card = pile[cardIndex];
        const cardFront = await this.loadCardFace(card);
        this.initializeDiscardEventHandlers(cardFront);
        this.discardPiles[pileIndex].push(cardFront);
        this.cardsLayer.add(cardFront);
      }
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
        const card = playerState.cardsInHand[index];
        const cardFace = await this.loadCardFace(card);
        this.initializeCurrentUserCardEventHandlers(cardFace);
        userData.cards.push(cardFace);
        this.cardsLayer.add(cardFace);
      }
    } else {
      const baseCardBack = await this.loadCardBack();
      for (let index = 0; index < playerState.numberOfCards; index++) {
        const cardRect = displayRoundScore
          ? await this.loadCardFace(playerState.cardsInHand[index])
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
    pileIndex: number,
    cardIndex: number,
    numberOfPiles: number,
  ): ICardDisplayData {
    const center: IPosition = {
      x: this.container.offsetWidth / 2,
      y: this.container.offsetHeight / 2,
    };
    const partialCardWidth = this.cardWidth / 4;
    const initialCardX = center.x - this.cardWidth * 2.1;
    const discardPileOffset = this.cardHeight * 1.1
    const initialCardY =
      center.y -
      this.cardHeight / 2 -
      (numberOfPiles - 1) * discardPileOffset;
    return {
      size: {
        height: this.cardHeight,
        width: this.cardWidth,
      },
      position: {
        x: initialCardX + cardIndex * partialCardWidth,
        y: initialCardY + pileIndex * discardPileOffset,
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
    rect.on("click tap", (event) => {
      // TODO
    });
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
    rect.on("click tap", (event) => {
      const rect = event.target as KonvaRect;
      this.currentUserClickCard(rect.getAttr("yanivCard"));
    });
    rect.draggable(true);
    rect.on("dragstart", () => {
      rect.moveToTop();
      this.cardsLayer.draw();
    });
    rect.on("dragmove", () => {
      this.currentUserDragMoveCard(rect);
    });
    rect.on("dragend", () => {
      this.currentUserDragEndCard(rect);
    });
  }
}
