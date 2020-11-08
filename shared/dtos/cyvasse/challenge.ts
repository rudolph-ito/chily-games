import { IPaginationRequest } from "../search";

// Enums

export enum ChallengePlayAs {
  ALABASTER = "alabaster",
  ONYX = "onyx",
  RANDOM = "random",
}

// Primary Interfaces

export interface IChallengeOptions {
  variantId: number;
  creatorPlayAs: ChallengePlayAs;
  opponentUserId?: number;
}

export interface IChallenge extends IChallengeOptions {
  challengeId: number;
  creatorUserId: number;
}

export interface ISearchChallengesRequest {
  pagination: IPaginationRequest;
}

// Validation errors interfaces

export interface IChallengeValidationErrors {
  variantId?: string;
  creatorPlayAs?: string;
  opponentUserId?: string;
}
