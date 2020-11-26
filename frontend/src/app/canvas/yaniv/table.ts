import Konva from "konva";
import { ICard } from "src/app/shared/dtos/yaniv/card";
import { IGame, IPlayerState } from "src/app/shared/dtos/yaniv/game";
import { doesHaveValue } from "src/app/shared/utilities/value_checker";

export interface ITableOptions {
  element: HTMLDivElement;
}

interface IPosition {
  x: number;
  y: number;
}

export class YanivTable {
  private readonly container: HTMLDivElement;
  private readonly stage: Konva.Stage;
  private readonly cardsLayer: Konva.Layer;
  private playerOffset: number;
  private cardHeight: number;
  private cardWidth: number;
  private cardBack: Konva.Rect;

  constructor(options: ITableOptions) {
    this.container = options.element;
    this.stage = new Konva.Stage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.cardsLayer = new Konva.Layer();
    this.stage.add(this.cardsLayer);
    this.computeCardSize();
  }

  private computeCardSize(): void {
    const min = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.cardHeight = min / 7;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
    this.playerOffset = this.cardHeight;
  }

  async refreshState(game: IGame, currentUserId: number): Promise<void> {
    this.cardsLayer.clear();
    await this.refreshPlayers(game.playerStates, currentUserId);
    await this.refreshDeckAndDiscard(game.cardsOnTopOfDiscardPile);
    this.cardsLayer.draw();
  }

  async refreshDeckAndDiscard(cardsOnTopOfDiscardPile: ICard[]): Promise<void> {
    const tableCenterX = this.container.offsetWidth / 2;
    const tableCenterY = this.container.offsetHeight / 2;
    const partialCardHeight = this.cardHeight / 6;
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
    group.add(cardBack);
    let nextCardY =
      2 * partialCardHeight -
      (cardsOnTopOfDiscardPile.length - 1) * 0.5 * partialCardHeight;
    for (const card of cardsOnTopOfDiscardPile) {
      const cardFront = await this.loadCardFace(card);
      cardFront.x(this.cardWidth * 1.2);
      cardFront.y(nextCardY);
      group.add(cardFront);
      nextCardY -= partialCardHeight;
    }
    group.offsetX(groupWidth / 2);
    group.offsetY(groupHeight / 2);
    this.cardsLayer.add(group);
  }

  async refreshPlayers(
    playerStates: IPlayerState[],
    userId: number
  ): Promise<void> {
    let bottomIndex = 0;
    playerStates.forEach((playerState, index) => {
      if (playerState.userId === userId) {
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
      console.log(positionIndex, x, y);
      const group = await this.addPlayer(playerStates[index], { x, y }, userId);
      this.cardsLayer.add(group);
    }
  }

  private async addPlayer(
    playerState: IPlayerState,
    position: IPosition,
    currentUserId: number
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
    group.add(name);
    if (playerState.userId == currentUserId) {
      let offset = 0;
      for (const card of playerState.cards) {
        const cardFace = await this.loadCardFace(card);
        cardFace.x(offset);
        group.add(cardFace);
        offset += this.cardWidth * 1.2;
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

  private async loadCardFace(card: ICard): Promise<Konva.Rect> {
    return await new Promise((resolve) => {
      const image = new Image();
      (image.src = `/assets/yaniv/${card.rank}_of_${card.suit}.svg`),
        (image.onload = () => {
          resolve(this.getCardRectangle(image, false));
        });
    });
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
