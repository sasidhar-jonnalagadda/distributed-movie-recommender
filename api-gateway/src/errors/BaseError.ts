/**
 * Abstract base class for all application errors.
 */
export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly dependencyName?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    dependencyName?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.dependencyName = dependencyName;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
