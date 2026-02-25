import { BaseError } from "./BaseError";

/**
 * Error class for 400 Bad Request / Validation scenarios.
 */
export class ValidationError extends BaseError {
  constructor(message: string = "Validation failed") {
    super(message, 400, true);
    this.name = "ValidationError";
  }
}
