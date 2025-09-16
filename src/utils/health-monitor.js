// System health monitoring for the Amplitude Demo Builder
// Monitors system resources, external services, and application health

const { logger } = require('./logger');
const { demoMode } = require('./demo-mode');

class HealthMonitor {
  constructor() {
    this.healthChecks = new Map();
    this.healthHistory = [];
    this.alertThresholds = {
      memory: 0.9, // 90% memory usage
      cpu: 0.8,    // 80% CPU usage
      eventQueue: 1000, // Max events in queue
      errorRate: 0.1    // 10% error rate
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Register a health check
  registerHealthCheck(name, checkFunction, interval = 30000) {
    this.healthChecks.set(name, {
      name,
      checkFunction,
      interval,
      lastCheck: null,
      lastResult: null,
      consecutiveFailures: 0
    });
    
    logger.debug(`Health check registered: ${name}`);
  }

  // Start monitoring
  startMonitoring(interval = 30000) {
    if (this.isMonitoring) {
      logger.warn('Health monitoring already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('🏥 Health monitoring started');

    // Register default health checks
    this.registerDefaultHealthChecks();

    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, interval);

    // Run initial health check
    this.runHealthChecks();
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('🏥 Health monitoring stopped');
  }

  // Register default health checks
  registerDefaultHealthChecks() {
    // Memory usage check
    this.registerHealthCheck('memory', () => {
      const usage = process.memoryUsage();
      const totalMemory = usage.heapTotal + usage.external;
      const usedMemory = usage.heapUsed;
      const memoryUsage = usedMemory / totalMemory;

      return {
        healthy: memoryUsage < this.alertThresholds.memory,
        value: memoryUsage,
        details: {
          heap_used: Math.round(usage.heapUsed / 1024 / 1024),
          heap_total: Math.round(usage.heapTotal / 1024 / 1024),
          external: Math.round(usage.external / 1024 / 1024),
          usage_percent: Math.round(memoryUsage * 100)
        }
      };
    });

    // Amplitude connectivity check
    this.registerHealthCheck('amplitude', async () => {
      try {
        const health = await demoMode.checkServiceHealth();
        return {
          healthy: health.amplitude || demoMode.shouldUseDemoMode(),
          value: health.amplitude,
          details: {
            demo_mode: demoMode.shouldUseDemoMode(),
            api_key_present: !!process.env.AMPLITUDE_API_KEY
          }
        };
      } catch (error) {
        return {
          healthy: false,
          value: false,
          error: error.message
        };
      }
    });

    // Event processing check
    this.registerHealthCheck('event_processing', () => {
      // This would check event queue size, processing rate, etc.
      // For now, we'll simulate based on demo mode stats
      const stats = demoMode.getStatus();
      
      return {
        healthy: stats.fallback_events < this.alertThresholds.eventQueue,
        value: stats.fallback_events,
        details: {
          events_count: stats.fallback_events,
          unique_users: stats.unique_users,
          active_sessions: stats.active_sessions
        }
      };
    });

    // Disk space check (simplified)
    this.registerHealthCheck('disk_space', () => {
      // In a real implementation, this would check actual disk usage
      // For now, we'll simulate based on log file sizes
      return {
        healthy: true,
        value: 0.3, // 30% usage
        details: {
          usage_percent: 30,
          available_gb: 50
        }
      };
    });
  }

  // Run all health checks
  async runHealthChecks() {
    const results = {};
    const timestamp = new Date().toISOString();

    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check.checkFunction();
        
        check.lastCheck = timestamp;
        check.lastResult = result;

        if (!result.healthy) {
          check.consecutiveFailures++;
          logger.warn(`Health check failed: ${name}`, {
            consecutive_failures: check.consecutiveFailures,
            details: result.details,
            error: result.error
          });
        } else {
          check.consecutiveFailures = 0;
        }

        results[name] = {
          healthy: result.healthy,
          value: result.value,
          last_check: timestamp,
          consecutive_failures: check.consecutiveFailures,
          details: result.details
        };

      } catch (error) {
        check.consecutiveFailures++;
        logger.error(`Health check error: ${name}`, {
          error: error.message,
          consecutive_failures: check.consecutiveFailures
        });

        results[name] = {
          healthy: false,
          error: error.message,
          last_check: timestamp,
          consecutive_failures: check.consecutiveFailures
        };
      }
    }

    // Store health history
    this.healthHistory.push({
      timestamp,
      results
    });

    // Keep only last 100 health check results
    if (this.healthHistory.length > 100) {
      this.healthHistory = this.healthHistory.slice(-100);
    }

    // Check for critical issues
    this.checkCriticalIssues(results);

    return results;
  }

  // Check for critical issues that require immediate attention
  checkCriticalIssues(results) {
    const criticalIssues = [];

    for (const [name, result] of Object.entries(results)) {
      if (!result.healthy && result.consecutive_failures >= 3) {
        criticalIssues.push({
          check: name,
          failures: result.consecutive_failures,
          error: result.error
        });
      }
    }

    if (criticalIssues.length > 0) {
      logger.error('🚨 Critical health issues detected', {
        issues: criticalIssues,
        total_issues: criticalIssues.length
      });

      // In a production environment, this would trigger alerts
      this.triggerAlerts(criticalIssues);
    }
  }

  // Trigger alerts for critical issues
  triggerAlerts(issues) {
    // This would integrate with alerting systems like PagerDuty, Slack, etc.
    logger.error('🚨 ALERT: System health degraded', {
      critical_issues: issues.length,
      issues: issues.map(i => i.check)
    });
  }

  // Get current health status
  getHealthStatus() {
    const latest = this.healthHistory[this.healthHistory.length - 1];
    if (!latest) {
      return { status: 'unknown', message: 'No health checks run yet' };
    }

    const results = latest.results;
    const unhealthyChecks = Object.entries(results)
      .filter(([_, result]) => !result.healthy)
      .map(([name, _]) => name);

    let status = 'healthy';
    let message = 'All systems operational';

    if (unhealthyChecks.length > 0) {
      const criticalIssues = unhealthyChecks.filter(name => 
        results[name].consecutive_failures >= 3
      );

      if (criticalIssues.length > 0) {
        status = 'critical';
        message = `Critical issues: ${criticalIssues.join(', ')}`;
      } else {
        status = 'degraded';
        message = `Issues detected: ${unhealthyChecks.join(', ')}`;
      }
    }

    return {
      status,
      message,
      timestamp: latest.timestamp,
      checks: results,
      unhealthy_checks: unhealthyChecks,
      monitoring: this.isMonitoring
    };
  }

  // Get health history
  getHealthHistory(limit = 50) {
    return this.healthHistory.slice(-limit);
  }

  // Get health metrics for monitoring dashboards
  getHealthMetrics() {
    const latest = this.healthHistory[this.healthHistory.length - 1];
    if (!latest) {
      return {};
    }

    const metrics = {};
    for (const [name, result] of Object.entries(latest.results)) {
      metrics[`health_${name}`] = result.healthy ? 1 : 0;
      metrics[`health_${name}_value`] = result.value || 0;
      metrics[`health_${name}_failures`] = result.consecutive_failures || 0;
    }

    return metrics;
  }

  // Manual health check trigger
  async runHealthCheck(checkName) {
    const check = this.healthChecks.get(checkName);
    if (!check) {
      throw new Error(`Health check not found: ${checkName}`);
    }

    try {
      const result = await check.checkFunction();
      check.lastCheck = new Date().toISOString();
      check.lastResult = result;

      logger.info(`Manual health check completed: ${checkName}`, {
        healthy: result.healthy,
        details: result.details
      });

      return result;
    } catch (error) {
      logger.error(`Manual health check failed: ${checkName}`, {
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

module.exports = { HealthMonitor, healthMonitor };