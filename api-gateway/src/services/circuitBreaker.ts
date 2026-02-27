import CircuitBreaker from "opossum";
import { logger } from "../utils/logger";

/**
 * Creates a standard Circuit Breaker instance for an asynchronous function.
 * 
 * @param fn The function to protect.
 * @param options configuration options.
 * @returns An Opossum CircuitBreaker instance.
 */
export function createCircuitBreaker<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options?: {
    name?: string;
    fallback?: (...args: Args) => T | Promise<T>;
  }
) {
  const name = options?.name || "circuit-breaker";

  const breaker = new CircuitBreaker(fn, {
    timeout: 5000, // Max time to wait for a request
    errorThresholdPercentage: 50, // Open if 50% of requests fail
    resetTimeout: 30000, // Wait 30s before trying again
    volumeThreshold: 5, // Minimum number of requests before triggering thresholds
    rollingCountTimeout: 60000, // Window for calculating stats
  });

  breaker.on("open", () => {
    logger.warn({ breaker: name }, "Circuit OPENED — requests will use fallback");
  });

  breaker.on("halfOpen", () => {
    logger.info({ breaker: name }, "Circuit HALF-OPEN — probing with next request");
  });

  breaker.on("close", () => {
    logger.info({ breaker: name }, "Circuit CLOSED — normal operation resumed");
  });

  if (options?.fallback) {
    breaker.fallback(options.fallback);
  }

  return breaker;
}
