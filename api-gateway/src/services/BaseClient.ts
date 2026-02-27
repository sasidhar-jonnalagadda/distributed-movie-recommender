import axios, { AxiosInstance, AxiosError, CreateAxiosDefaults } from "axios";
import { logger } from "../utils/logger";
import { DependencyError } from "../errors";

/**
 * Base class for all external API clients.
 * Provides a standardized Axios instance with retries and logging.
 */
export abstract class BaseClient {
  protected readonly axiosInstance: AxiosInstance;
  protected readonly serviceName: string;

  constructor(serviceName: string, config: CreateAxiosDefaults) {
    this.serviceName = serviceName;
    this.axiosInstance = axios.create(config);

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request logging
    this.axiosInstance.interceptors.request.use((config) => {
      logger.debug(
        { 
          service: this.serviceName, 
          method: config.method?.toUpperCase(), 
          url: config.url 
        }, 
        "Outgoing request"
      );
      return config;
    });

    // Response logging and error transformation
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const responseData = error.response?.data as Record<string, unknown>;
        const errorMessage = (responseData?.status_message as string) || error.message || error.code || "Dependency failure";

        logger.error(
          {
            service: this.serviceName,
            status: error.response?.status,
            message: errorMessage,
            url: error.config?.url,
            details: responseData,
          },
          "Request failed"
        );

        // Transform into DependencyError for the global error handler
        throw new DependencyError(
          this.serviceName,
          errorMessage,
          error.response?.status || 502
        );
      }
    );
  }

  /**
   * Helper for retrying transient failures.
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 2
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && error instanceof DependencyError) {
        // Retry on 5xx or network errors (status >= 500 or undefined status)
        if (error.statusCode >= 500 || error.statusCode === 502) {
          logger.warn(
            { service: this.serviceName, retriesLeft: retries },
            "Retrying transient failure..."
          );
          return this.withRetry(fn, retries - 1);
        }
      }
      throw error;
    }
  }
}
