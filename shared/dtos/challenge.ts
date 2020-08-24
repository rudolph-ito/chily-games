import { IPaginationRequest } from "./search";
import { IUser } from "./authentication";

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

export interface IChallenge {
  variantId: number;
  creatorPlayAs: ChallengePlayAs;
  opponentUser: IUser;
  challengeId: number;
  creatorUser: IUser;
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
