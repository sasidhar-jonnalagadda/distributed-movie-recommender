import { BaseError } from "./BaseError";

/**
 * Custom error class for failures in downstream microservices.
 * Maps to 502/503/504 errors for monitoring and clear API responses.
 */
export class DependencyError extends BaseError {
  constructor(dependencyName: string, message: string, statusCode: number = 502) {
    super(message, statusCode, true, dependencyName);
    this.name = "DependencyError";
  }
}
