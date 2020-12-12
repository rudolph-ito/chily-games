import {
  doesNotHaveValue,
  doesHaveValue,
} from "../../shared/utilities/value_checker";
import zxcvbn from "zxcvbn";
import {
  IRegisterRequest,
  IRegisterErrors,
  IUser,
} from "../../shared/dtos/authentication";
import { IUserDataService, UserDataService } from "./data/user_data_service";
import { ValidationError } from "./exceptions";

export class RegistrationService {
  constructor(
    private readonly userDataService: IUserDataService = new UserDataService()
  ) {}

  async validate(request: IRegisterRequest): Promise<IRegisterErrors | null> {
    const errors: IRegisterErrors = {};
    if (doesNotHaveValue(request.username) || request.username === "") {
      errors.username = "Username is required";
    } else if (
      await this.userDataService.hasUserWithUsername(request.username)
    ) {
      errors.username = `Username '${request.username}' is already taken`;
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

  async register(request: IRegisterRequest): Promise<IUser> {
    const errors = await this.validate(request);
    if (doesHaveValue(errors)) {
      throw new ValidationError(errors);
    }
    return await this.userDataService.createUser(request);
  }
}
