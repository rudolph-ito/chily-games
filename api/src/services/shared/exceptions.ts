export class ValidationError extends Error {
  public errors: any;

  constructor(errors: any) {
    super(`Validation errors: ${JSON.stringify(errors)}`);
    this.errors = errors;
  }
}

export class AuthorizationError extends Error {}

export class NotFoundError extends Error {}

export function throwVariantAuthorizationError(action: string): void {
  throw new AuthorizationError(`Only the variant creator can ${action}`);
}

export function throwVariantNotFoundError(variantId: number): string {
  throw new NotFoundError(`Variant does not exist with id: ${variantId}`);
}

export function variantNotFoundError(variantId: number): string {
  throw new NotFoundError(`Variant does not exist with id: ${variantId}`);
}

export function throwGameNotFoundError(gameId: number): string {
  throw new NotFoundError(`Game does not exist with id: ${gameId}`);
}

export function gameNotFoundError(gameId: number): Error {
  return new NotFoundError(`Game does not exist with id: ${gameId}`);
}
