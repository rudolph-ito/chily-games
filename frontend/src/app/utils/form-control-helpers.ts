import { UntypedFormControl } from "@angular/forms";

export function setError(control: UntypedFormControl, error?: string): void {
  if (error != null) {
    control.markAsTouched();
    control.setErrors({ invalid: error });
  }
}
