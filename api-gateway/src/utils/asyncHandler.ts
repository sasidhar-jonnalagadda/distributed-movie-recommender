import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Higher-order function to wrap asynchronous Express route handlers.
 * Ensures that any errors are passed to the next() function for global handling.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
