// Comprehensive error handling system for the Amplitude Demo Builder
// Provides centralized error handling, logging, and recovery mechanisms

const { logger } = require('./logger');

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Handle Amplitude API errors
  handleAmplitudeError(error, context = {}) {
    const errorKey = `amplitude_${error.code || 'unknown'}`;
    this.incrementErrorCount(errorKey);

    logger.error('Amplitude API error', {
      error: error.message,
      code: error.code,
      context,
      count: this.errorCounts.get(errorKey)
    });

    // Provide specific guidance based on error type
    if (error.code === 400) {
      logger.warn('Amplitude validation error - check event properties and user data');
      return { shouldRetry: false, fallback: 'log_locally' };
    } else if (error.code === 429) {
      logger.warn('Amplitude rate limit exceeded - implementing backoff');
      return { shouldRetry: true, delay: this.retryDelay * 2 };
    } else if (error.code >= 500) {
      logger.warn('Amplitude server error - will retry');
      return { shouldRetry: true, delay: this.retryDelay };
    }

    return { shouldRetry: false, fallback: 'continue' };
  }

  // Handle configuration loading errors
  handleConfigError(error, configPath) {
    logger.error('Configuration loading error', {
      error: error.message,
      configPath,
      stack: error.stack
    });

    // Provide fallback suggestions
    if (error.code === 'ENOENT') {
      logger.info('Configuration file not found - using default configuration');
      return { fallback: 'default_config' };
    } else if (error instanceof SyntaxError) {
      logger.error('Configuration file has invalid JSON syntax');
      return { fallback: 'default_config', requiresFix: true };
    }

    return { fallback: 'default_config' };
  }

  // Handle WebSocket connection errors
  handleWebSocketError(error, socketId) {
    logger.error('WebSocket error', {
      error: error.message,
      socketId,
      type: error.type
    });

    // WebSocket errors are usually not recoverable, just log and continue
    return { shouldRetry: false, action: 'disconnect_client' };
  }

  // Handle event generation errors
  handleEventGenerationError(error, eventType, userId) {
    const errorKey = `event_generation_${eventType}`;
    this.incrementErrorCount(errorKey);

    logger.error('Event generation error', {
      error: error.message,
      eventType,
      userId,
      count: this.errorCounts.get(errorKey)
    });

    // If we've had too many errors for this event type, disable it temporarily
    if (this.errorCounts.get(errorKey) > 5) {
      logger.warn(`Event type ${eventType} disabled due to repeated errors`);
      return { shouldRetry: false, action: 'disable_event_type' };
    }

    return { shouldRetry: true, fallback: 'generic_event' };
  }

  // Handle server startup errors
  handleServerError(error, port) {
    logger.error('Server startup error', {
      error: error.message,
      port,
      code: error.code
    });

    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use`);
      return { 
        shouldRetry: true, 
        action: 'try_different_port',
        suggestedPort: port + 1
      };
    } else if (error.code === 'EACCES') {
      logger.error(`Permission denied for port ${port}`);
      return {
        shouldRetry: true,
        action: 'try_different_port',
        suggestedPort: port + 1000
      };
    }

    return { shouldRetry: false, action: 'exit' };
  }

  // Generic error handler with retry logic
  async handleWithRetry(operation, context = {}, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        logger.warn(`Operation failed (attempt ${attempt}/${maxRetries})`, {
          error: error.message,
          context,
          attempt
        });

        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    logger.error('Operation failed after all retries', {
      error: lastError.message,
      context,
      maxRetries
    });
    
    throw lastError;
  }

  // Graceful degradation handler
  handleGracefulDegradation(feature, error, fallbackAction) {
    logger.warn(`Feature ${feature} degraded due to error`, {
      error: error.message,
      fallbackAction
    });

    // Log the degradation for monitoring
    this.incrementErrorCount(`degradation_${feature}`);
    
    return { 
      degraded: true, 
      feature, 
      fallbackAction,
      timestamp: new Date().toISOString()
    };
  }

  // Express error middleware
  expressErrorHandler() {
    return (error, req, res, next) => {
      logger.error('Express route error', {
        error: error.message,
        method: req.method,
        path: req.path,
        stack: error.stack
      });

      // Don't expose internal errors to clients
      const statusCode = error.statusCode || 500;
      const message = statusCode === 500 ? 'Internal server error' : error.message;

      res.status(statusCode).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
      });
    };
  }

  // Process-level error handlers
  setupProcessErrorHandlers() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      
      // Give time for logs to flush before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack
      });
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      // Implement graceful shutdown logic here
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      process.exit(0);
    });
  }

  // Utility methods
  incrementErrorCount(key) {
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  getErrorStats() {
    return Object.fromEntries(this.errorCounts);
  }

  resetErrorCounts() {
    this.errorCounts.clear();
    logger.info('Error counts reset');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = { ErrorHandler, errorHandler };