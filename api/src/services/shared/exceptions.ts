export class ValidationError extends Error {
  public errors: any;

  constructor(errors: any) {
    super(`Validation errors: ${JSON.stringify(errors)}`);
    this.errors = errors;
  }
}

export class LoggedValidationError extends ValidationError {}

export class GameVersionOutOfDateError extends Error {}

export class AuthorizationError extends Error {}

export class NotFoundError extends Error {}

export function variantAuthorizationError(action: string): Error {
  return new AuthorizationError(`Only the variant creator can ${action}`);
}

export function variantNotFoundError(variantId: number): Error {
  return new NotFoundError(`Variant does not exist with id: ${variantId}`);
}

export function gameNotFoundError(gameId: number): Error {
  return new NotFoundError(`Game does not exist with id: ${gameId}`);
}
