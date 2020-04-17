import { User } from "../database/models";
import {
  doesNotHaveValue,
  doesHaveValue
} from "../shared/utilities/value_checker";
import zxcvbn from "zxcvbn";
import {
  IRegisterRequest,
  IRegisterErrors,
  IRegisterResponse
} from "../shared/dtos/authentication";

function validate(request: IRegisterRequest): IRegisterErrors {
  const errors: IRegisterErrors = {};
  if (doesNotHaveValue(request.username) || request.username === "") {
    errors.username = "Username is required";
  }
  if (doesNotHaveValue(request.password) || request.password === "") {
    errors.password = "Password is required";
  } else {
    const result = zxcvbn(request.password, [request.username]);
    if (result.score < 3) {
      errors.password =
        "Password is not strong enough: " +
        (result.feedback.warning !== ""
          ? result.feedback.warning
          : result.feedback.suggestions.join(", "));
    }
  }
  if (request.password !== request.passwordConfirmation) {
    errors.passwordConfirmation =
      "Password confirmation does not match password";
  }
  if (Object.keys(errors).length > 0) {
    return errors;
  }
  return null;
}

export async function register(
  request: IRegisterRequest
): Promise<IRegisterResponse> {
  const errors = validate(request);
  if (doesHaveValue(errors)) {
    return { errors };
  }
  const user = User.build({ username: request.username });
  user.setPassword(request.password);
  await user.save();
  return { user: user.serialize() };
}
