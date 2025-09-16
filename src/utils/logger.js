// Centralized logging utility for the Amplitude Demo Builder
// Provides structured logging with different levels and formatting

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    // Load configuration from file if available
    this.loadConfiguration();
    
    // Override with options
    this.logLevel = options.logLevel || this.config?.logLevel || process.env.LOG_LEVEL || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || this.config?.enableFile || false;
    this.logFile = options.logFile || this.config?.logFile || path.join(__dirname, '../../logs/demo-server.log');
    
    // Create logs directory if it doesn't exist
    if (this.enableFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    // Performance tracking
    this.performanceMetrics = new Map();
    this.requestCounts = new Map();

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[37m', // White
      reset: '\x1b[0m'
    };

    this.emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    };
  }

  loadConfiguration() {
    try {
      const configPath = path.join(__dirname, '../config/logging.json');
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      // Fallback to defaults if config loading fails
      this.config = {};
    }
  }

  // Filter sensitive information from logs
  sanitizeMetadata(meta) {
    if (!meta || typeof meta !== 'object') return meta;
    
    const sensitiveFields = this.config?.filters?.sensitiveFields || ['apiKey', 'password', 'token'];
    const sanitized = { ...meta };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (typeof sanitized[field] === 'string' && sanitized[field].length > 8) {
          sanitized[field] = sanitized[field].substring(0, 8) + '...';
        } else {
          sanitized[field] = '[REDACTED]';
        }
      }
    }
    
    return sanitized;
  }

  // Check if message should be filtered out
  shouldFilter(message) {
    const excludePatterns = this.config?.filters?.excludePatterns || [];
    return excludePatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    if (this.shouldFilter(message)) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const emoji = this.config?.format?.emoji !== false ? (this.emojis[level] || '') : '';
    const sanitizedMeta = this.sanitizeMetadata(meta);
    
    let formattedMessage = `${timestamp} [${level.toUpperCase()}] ${emoji} ${message}`;
    
    if (Object.keys(sanitizedMeta).length > 0) {
      formattedMessage += ` ${JSON.stringify(sanitizedMeta)}`;
    }
    
    return formattedMessage;
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    if (!formattedMessage) {
      return; // Message was filtered out
    }
    
    // Console output with colors
    if (this.enableConsole) {
      const coloredMessage = this.config?.format?.colors !== false ? 
        `${this.colors[level]}${formattedMessage}${this.colors.reset}` : 
        formattedMessage;
      console.log(coloredMessage);
    }
    
    // File output without colors
    if (this.enableFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error.message);
      }
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Specialized logging methods for demo server
  serverStart(port, config) {
    this.info(`🚀 ${config.company.name} Demo Server running on port ${port}`, {
      industry: config.company.industry,
      scenarios: Object.keys(config.scenarios)
    });
  }

  clientConnected(socketId) {
    this.debug(`🔌 Client connected: ${socketId}`);
  }

  clientDisconnected(socketId) {
    this.debug(`🔌 Client disconnected: ${socketId}`);
  }

  demoStarted(scenario, company) {
    this.info(`🎬 Starting ${company} demo - ${scenario} scenario`);
  }

  demoStopped() {
    this.info('⏹️ Demo stopped');
  }

  eventGenerated(eventType, userId, amplitudeStatus) {
    this.debug(`📊 Event generated: ${eventType} for user ${userId}`, {
      amplitude_success: amplitudeStatus?.success,
      amplitude_sent: amplitudeStatus?.sent
    });
  }

  userProgressed(userId, fromStage, toStage, eventType) {
    this.info(`👤 User ${userId} progressed: ${fromStage} → ${toStage} after ${eventType}`);
  }

  sessionTimeout(userId, timeoutMinutes) {
    this.debug(`🔄 Starting new session for user ${userId} (timeout: ${timeoutMinutes}min)`);
  }

  configurationLoaded(summary) {
    this.info('✅ Configuration loaded', summary);
  }

  configurationError(error) {
    this.error('❌ Failed to load configuration', { error: error.message });
  }

  amplitudeConnection(isConnected, apiKeyPresent) {
    this.info(`📊 Amplitude connected: ${isConnected}`, {
      api_key_present: apiKeyPresent
    });
  }

  apiRequest(method, path, statusCode) {
    // Track request counts
    const key = `${method} ${path}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    
    this.debug(`${method} ${path} - ${statusCode}`, {
      status_code: statusCode,
      request_count: this.requestCounts.get(key)
    });
  }

  // Performance monitoring methods
  startTimer(operation) {
    const startTime = process.hrtime.bigint();
    this.performanceMetrics.set(operation, { startTime, operation });
    this.debug(`⏱️ Started timer for: ${operation}`);
    
    return {
      end: () => this.endTimer(operation)
    };
  }

  endTimer(operation) {
    const metric = this.performanceMetrics.get(operation);
    if (!metric) {
      this.warn(`Timer not found for operation: ${operation}`);
      return;
    }

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - metric.startTime) / 1000000; // Convert to milliseconds
    
    this.performanceMetrics.delete(operation);
    
    this.debug(`⏱️ Completed: ${operation}`, {
      duration_ms: Math.round(duration * 100) / 100,
      operation
    });

    return duration;
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      active_timers: Array.from(this.performanceMetrics.keys()),
      request_counts: Object.fromEntries(this.requestCounts),
      memory_usage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  // Log performance statistics
  logPerformanceStats() {
    const stats = this.getPerformanceStats();
    this.info('📊 Performance Statistics', stats);
  }

  // Batch logging for high-frequency events
  batchLog(level, messages) {
    if (!Array.isArray(messages)) {
      return this.log(level, messages);
    }

    const batchMessage = `Batch of ${messages.length} ${level} messages`;
    const batchMeta = {
      batch_size: messages.length,
      messages: messages.slice(0, 5), // Include first 5 messages as sample
      truncated: messages.length > 5
    };

    this.log(level, batchMessage, batchMeta);
  }
}

// Create singleton instance
const logger = new Logger({
  logLevel: process.env.LOG_LEVEL || 'info',
  enableFile: process.env.ENABLE_FILE_LOGGING === 'true'
});

module.exports = { Logger, logger };