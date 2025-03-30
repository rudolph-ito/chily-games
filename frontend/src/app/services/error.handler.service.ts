import { ErrorHandler, Injectable } from "@angular/core";
import { ErrorService } from "./error.service";

@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService implements ErrorHandler {
  constructor(private errorService: ErrorService) {}

  handleError(error: Error) {
    const message: any = {};
    for (const property of Object.getOwnPropertyNames(error)) {
      message[property] = error[property];
    }
    this.errorService.log(message).subscribe({
      next: () => {
        console.log("Successfully sent error to API", message);
      },
      error: (apiError) => {
        console.error("Failed to send error to to API", message);
        console.error(apiError);
      },
    });
  }
}
