import { BaseError } from "./BaseError";

/**
 * Error class for 401 Unauthorized / Authentication scenarios.
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = "Missing or invalid authentication") {
    super(message, 401, true);
    this.name = "AuthenticationError";
  }
}
