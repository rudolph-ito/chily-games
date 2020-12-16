export function doesHaveValue(value: any): boolean {
  return !doesNotHaveValue(value);
}

export function doesNotHaveValue(value: any): boolean {
  return value == null || value == null;
}

export function valueOrDefault<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  if (doesHaveValue(value)) {
    return value as T;
  }
  return defaultValue;
}
