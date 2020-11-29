import { CyvasseChallenge } from "../../../database/models";
import { IPaginatedResponse } from "../../../shared/dtos/search";
import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../../shared/utilities/value_checker";
import {
  IChallengeOptions,
  IChallenge,
  ISearchChallengesRequest,
} from "../../../shared/dtos/cyvasse/challenge";

export interface ICyvasseChallengeDataService {
  createChallenge: (
    options: IChallengeOptions,
    userId: number
  ) => Promise<IChallenge>;
  deleteChallenge: (challengeId: number) => Promise<void>;
  getChallenge: (challengeId: number) => Promise<IChallenge>;
  searchChallenges: (
    request: ISearchChallengesRequest
  ) => Promise<IPaginatedResponse<IChallenge>>;
}

export class CyvasseChallengeDataService
  implements ICyvasseChallengeDataService {
  async createChallenge(
    options: IChallengeOptions,
    userId: number
  ): Promise<IChallenge> {
    const challenge = CyvasseChallenge.build({
      creatorUserId: userId,
      creatorPlayAs: options.creatorPlayAs,
      opponentUserId: options.opponentUserId,
      variantId: options.variantId,
    });
    await challenge.save();
    return challenge.serialize();
  }

  async deleteChallenge(challengeId: number): Promise<void> {
    await CyvasseChallenge.destroy({ where: { challengeId } });
  }

  async getChallenge(challengeId: number): Promise<IChallenge> {
    const challenge = await CyvasseChallenge.findByPk(challengeId);
    if (doesHaveValue(challenge)) {
      return challenge.serialize();
    }
    return null;
  }

  async searchChallenges(
    request: ISearchChallengesRequest
  ): Promise<IPaginatedResponse<IChallenge>> {
    if (doesNotHaveValue(request.pagination)) {
      request.pagination = { pageIndex: 0, pageSize: 100 };
    }
    const result = await CyvasseChallenge.findAndCountAll({
      offset: request.pagination.pageIndex * request.pagination.pageSize,
      limit: request.pagination.pageSize,
    });
    return {
      data: result.rows.map((r: CyvasseChallenge) => r.serialize()),
      total: result.count,
    };
  }
}
