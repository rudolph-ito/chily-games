import { ICard } from "../shared/dtos/card";
import cardImages from "../data/card_images";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Easings as KonvaEasings, Tween as KonvaTween } from "konva/lib/Tween";
import { valueOrDefault } from "../shared/utilities/value_checker";

export interface ITableOptions {
  element: HTMLDivElement;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ICardDisplayData {
  size: ISize;
  rotation: number;
  position: IPosition;
  offset: IPosition;
}

export function areCardsEqual(a: ICard, b: ICard): boolean {
  if (valueOrDefault(a.isJoker, false)) {
    return valueOrDefault(b.isJoker, false) && a.jokerNumber === b.jokerNumber;
  }
  return a.rank === b.rank && a.suit === b.suit;
}

export const CARD_BACK_DEFAULT_STROKE = 2;
export const CARD_FACE_DEFAULT_STROKE = 0;

export class BaseTable {
  protected readonly container: HTMLDivElement;
  protected readonly stage: KonvaStage;
  protected readonly cardsLayer: KonvaLayer;
  protected cardHeight: number;
  protected cardWidth: number;
  protected cardBackImage: HTMLImageElement;
  protected readonly onRearrangeCards: (cards: ICard[]) => void;

  constructor(
    options: ITableOptions,
    onRearrangeCards: (cards: ICard[]) => void
  ) {
    this.container = options.element;
    this.onRearrangeCards = onRearrangeCards;
    this.stage = new KonvaStage({
      container: this.container,
      height: this.container.offsetHeight,
      width: this.container.offsetWidth,
    });
    this.cardsLayer = new KonvaLayer();
    this.stage.add(this.cardsLayer);
    this.computeCardSize();
  }

  protected computeCardSize(): void {
    const min = Math.min(
      this.container.offsetHeight,
      this.container.offsetWidth
    );
    this.cardHeight = min / 6;
    this.cardWidth = (this.cardHeight * 2.5) / 3.5;
  }

  protected removeCardEventHandlers(rect: KonvaRect): void {
    rect.off("mouseover");
    rect.off("mouseout");
    rect.off("click");
    rect.off("tap");
  }

  protected async loadCardFace(card: ICard): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardFace(rect, card);
    return rect;
  }

  protected getCardImageBase64(card: ICard): string {
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

  protected async loadCardBack(): Promise<KonvaRect> {
    const rect = new KonvaRect();
    rect.height(this.cardHeight);
    rect.width(this.cardWidth);
    await this.updateRectWithCardBack(rect);
    return rect;
  }

  protected async updateRectWithCardBack(rect: KonvaRect): Promise<void> {
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

  protected async updateRectWithCardFace(
    rect: KonvaRect,
    card: ICard
  ): Promise<void> {
    return await new Promise((resolve) => {
      const image = new Image();
      image.src = `data:image/png;base64,${this.getCardImageBase64(card)}`;
      image.onload = () => {
        rect.setAttr("card", card);
        this.updateRectWithImage(rect, image);
        rect.stroke("black");
        rect.strokeWidth(CARD_FACE_DEFAULT_STROKE);
        resolve();
      };
    });
  }

  protected updateRectWithImage(
    rect: KonvaRect,
    image: HTMLImageElement
  ): void {
    rect.fillPatternImage(image);
    rect.fillPatternRepeat("no-repeat");
    rect.fillPatternScale({
      x: rect.width() / image.width,
      y: rect.height() / image.height,
    });
  }

  protected updateCardSizeAndPosition(
    rect: KonvaRect,
    displayData: ICardDisplayData,
    animate: "none" | "full" | "position_only",
    onFinish: (() => void) | undefined = undefined
  ): void {
    rect.size(displayData.size);

    const image = rect.fillPatternImage();
    if (image != null) {
      rect.fillPatternScale({
        x: displayData.size.width / image.width,
        y: displayData.size.height / image.height,
      });
    }

    if (animate === "full" || animate === "position_only") {
      if (animate === "position_only") {
        rect.rotation(displayData.rotation);
      }
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
