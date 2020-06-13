import {
  doesHaveValue,
  doesNotHaveValue,
} from "../shared/utilities/value_checker";
import {
  IVariantDataService,
  VariantDataService,
} from "./data/variant_data_service";
import { IPaginatedResponse } from "../shared/dtos/search";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "./exceptions";
import {
  IChallengeOptions,
  ISearchChallengesRequest,
  IChallenge,
} from "../shared/dtos/challenge";
import {
  IChallengeDataService,
  ChallengeDataService,
} from "./data/challenge_data_service";
import { UserDataService, IUserDataService } from "./data/user_data_service";
import { validateChallengeOptions } from "./validators/challenge_validator";
import { IGame } from "../shared/dtos/game";

export interface IChallengeService {
  acceptChallenge: (userId: number, challengeId: number) => Promise<IGame>;
  createChallenge: (
    userId: number,
    options: IChallengeOptions
  ) => Promise<IChallenge>;
  declineChallenge: (userId: number, challengeId: number) => Promise<void>;
  deleteChallenge: (userId: number, challengeId: number) => Promise<void>;
  searchChallenges: (
    request: ISearchChallengesRequest
  ) => Promise<IPaginatedResponse<IChallenge>>;
}

export class ChallengeService implements IChallengeService {
  constructor(
    private readonly challengeDataService: IChallengeDataService = new ChallengeDataService(),
    private readonly variantDataService: IVariantDataService = new VariantDataService(),
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

  async createChallenge(
    userId: number,
    options: IChallengeOptions
  ): Promise<IChallenge> {
    const variantExists = doesHaveValue(options.variantId)
      ? await this.variantDataService.hasVariant(options.variantId)
      : false;
    const opponentUserExists = doesHaveValue(options.opponentUserId)
      ? await this.userDataService.hasUser(options.opponentUserId)
      : false;
    const validationErrors = validateChallengeOptions(
      options,
      variantExists,
      opponentUserExists
    );
    if (doesHaveValue(validationErrors)) {
      throw new ValidationError(validationErrors);
    }
    const challenge = await this.challengeDataService.createChallenge(
      options,
      userId
    );
    return challenge;
  }

  async searchChallenges(
    request: ISearchChallengesRequest
  ): Promise<IPaginatedResponse<IChallenge>> {
    // TODO validate request
    return await this.challengeDataService.searchChallenges(request);
  }

  async acceptChallenge(userId: number, challengeId: number): Promise<IGame> {
    const challenge = await this.challengeDataService.getChallenge(challengeId);
    if (challenge.creatorUserId === userId) {
      this.throwChallengeIdValidationError("Cannot accept your own challenge");
    } else if (
      doesHaveValue(challenge.opponentUserId) &&
      challenge.opponentUserId !== userId
    ) {
      this.throwChallengeIdValidationError(
        "Cannot accept challenge for other user"
      );
    }
    // build game
    return null;
  }

  async declineChallenge(userId: number, challengeId: number): Promise<void> {
    const challenge = await this.challengeDataService.getChallenge(challengeId);
    if (doesNotHaveValue(challenge)) {
      this.throwChallengeNotFoundError(challengeId);
    }
    if (doesNotHaveValue(challenge.opponentUserId)) {
      this.throwChallengeIdValidationError("Cannot decline open challenges");
    }
    if (challenge.opponentUserId !== userId) {
      this.throwChallengeIdValidationError(
        "Cannot decline challenge for other user"
      );
    }
    await this.challengeDataService.deleteChallenge(challengeId);
  }

  async deleteChallenge(userId: number, challengeId: number): Promise<void> {
    const challenge = await this.challengeDataService.getChallenge(challengeId);
    if (doesNotHaveValue(challenge)) {
      this.throwChallengeNotFoundError(challengeId);
    }
    if (challenge.creatorUserId !== userId) {
      throw new AuthorizationError(
        "Only the challenge creator can this challenge"
      );
    }
    await this.challengeDataService.deleteChallenge(challengeId);
  }

  private throwChallengeIdValidationError(message: string): void {
    throw new ValidationError({ challengeId: message });
  }

  private throwChallengeNotFoundError(challengeId: number): void {
    throw new NotFoundError(`Challenge does not exist with id: ${challengeId}`);
  }
}
