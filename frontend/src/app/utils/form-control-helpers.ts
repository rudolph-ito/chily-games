import { FormControl } from "@angular/forms";
import { doesHaveValue } from "../shared/utilities/value_checker";

export function setError(control: FormControl, error: string): void {
  if (doesHaveValue(error)) {
    control.markAsTouched();
    control.setErrors({ invalid: error });
  }
}
