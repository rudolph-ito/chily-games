import { ISerializedChallenge } from "src/database/models/challenge";
import { ISerializedGame } from "src/database/models/game";
import { IUser } from "../../shared/dtos/authentication";
import { IChallenge } from "../../shared/dtos/challenge";
import { IGame } from "../../shared/dtos/game";
import { doesHaveValue } from "../../shared/utilities/value_checker";

export function addGameUserData(
  serializedGame: ISerializedGame,
  userMap: Map<number, IUser>
): IGame {
  return {
    gameId: serializedGame.gameId,
    variantId: serializedGame.variantId,
    action: serializedGame.action,
    actionTo: serializedGame.actionTo,
    alabasterUser: userMap.get(serializedGame.alabasterUserId),
    onyxUser: userMap.get(serializedGame.onyxUserId),
    alabasterSetupCoordinateMap: serializedGame.alabasterSetupCoordinateMap,
    onyxSetupCoordinateMap: serializedGame.onyxSetupCoordinateMap,
    currentCoordinateMap: serializedGame.currentCoordinateMap,
    plies: serializedGame.plies,
  };
}

export function addChallengeUserData(
  serializedChallenge: ISerializedChallenge,
  userMap: Map<number, IUser>
): IChallenge {
  let opponentUser = null;
  if (doesHaveValue(serializedChallenge.opponentUserId)) {
    opponentUser = userMap.get(serializedChallenge.opponentUserId);
  }
  return {
    challengeId: serializedChallenge.challengeId,
    variantId: serializedChallenge.variantId,
    creatorPlayAs: serializedChallenge.creatorPlayAs,
    creatorUser: userMap.get(serializedChallenge.creatorUserId),
    opponentUser,
  };
}
