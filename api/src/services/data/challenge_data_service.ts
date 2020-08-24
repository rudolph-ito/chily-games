import { Challenge } from "../../database/models";
import { IPaginatedResponse } from "../../shared/dtos/search";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import {
  IChallengeOptions,
  ISearchChallengesRequest,
} from "../../shared/dtos/challenge";
import { ISerializedChallenge } from "src/database/models/challenge";

export interface IChallengeDataService {
  createChallenge: (
    options: IChallengeOptions,
    userId: number
  ) => Promise<ISerializedChallenge>;
  deleteChallenge: (challengeId: number) => Promise<void>;
  getChallenge: (challengeId: number) => Promise<ISerializedChallenge>;
  searchChallenges: (
    request: ISearchChallengesRequest
  ) => Promise<IPaginatedResponse<ISerializedChallenge>>;
}

export class ChallengeDataService implements IChallengeDataService {
  async createChallenge(
    options: IChallengeOptions,
    userId: number
  ): Promise<ISerializedChallenge> {
    const challenge = Challenge.build({
      creatorUserId: userId,
      creatorPlayAs: options.creatorPlayAs,
      opponentUserId: options.opponentUserId,
      variantId: options.variantId,
    });
    await challenge.save();
    return challenge.serialize();
  }

  async deleteChallenge(challengeId: number): Promise<void> {
    await Challenge.destroy({ where: { challengeId } });
  }

  async getChallenge(challengeId: number): Promise<ISerializedChallenge> {
    const challenge = await Challenge.findByPk(challengeId);
    if (doesHaveValue(challenge)) {
      return challenge.serialize();
    }
    return null;
  }

  async searchChallenges(
    request: ISearchChallengesRequest
  ): Promise<IPaginatedResponse<ISerializedChallenge>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const result = await Challenge.findAndCountAll({
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      limit: request.pagination.pageSize,
    });
    return {
      data: result.rows.map((r: Challenge) => r.serialize()),
      total: result.count,
    };
  }
}
