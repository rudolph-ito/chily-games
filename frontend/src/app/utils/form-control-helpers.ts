import { FormControl } from "@angular/forms";

export function setError(control: FormControl, error?: string): void {
  if (error != null) {
    control.markAsTouched();
    control.setErrors({ invalid: error });
  }
}
