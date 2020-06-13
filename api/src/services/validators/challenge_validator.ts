import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import {
  IChallengeOptions,
  IChallengeValidationErrors,
  ChallengePlayAs,
} from "../../shared/dtos/challenge";

const VALID_CHALLENGE_PLAY_AS: ChallengePlayAs[] = [
  ChallengePlayAs.ALABASTER,
  ChallengePlayAs.ONYX,
  ChallengePlayAs.RANDOM,
];

export function validateChallengeOptions(
  options: IChallengeOptions,
  variantExists: boolean,
  opponentUserExists: boolean
): IChallengeValidationErrors {
  const errors: IChallengeValidationErrors = {};
  if (doesNotHaveValue(options.variantId)) {
    errors.variantId = "Variant is required";
  } else if (!variantExists) {
    errors.variantId = `Variant does not exist with id: ${options.variantId}`;
  }
  if (doesNotHaveValue(options.creatorPlayAs)) {
    errors.creatorPlayAs = "Creator play as is required";
  } else if (!VALID_CHALLENGE_PLAY_AS.includes(options.creatorPlayAs)) {
    errors.creatorPlayAs = `Creator play as must be one of the following: ${VALID_CHALLENGE_PLAY_AS.join(
      ", "
    )}`;
  }
  if (doesHaveValue(options.opponentUserId) && !opponentUserExists) {
    errors.opponentUserId = `User does not exist with id ${options.opponentUserId}`;
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}
