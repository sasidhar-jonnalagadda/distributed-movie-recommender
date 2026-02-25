import { BaseError } from "./BaseError";

/**
 * Error class for 404 Not Found scenarios.
 */
export class NotFoundError extends BaseError {
  constructor(message: string = "Resource not found") {
    super(message, 404, true);
    this.name = "NotFoundError";
  }
}
