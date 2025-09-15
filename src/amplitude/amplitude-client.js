// Main Amplitude Client - Simplified Implementation
// Professional-grade event tracking with UTM attribution and business analytics

const { track, identify, init, Identify } = require('@amplitude/analytics-node');
const path = require('path');

// Ensure environment variables are loaded
if (!process.env.AMPLITUDE_API_KEY) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

class AmplitudeClient {
  constructor() {
    this.apiKey = process.env.AMPLITUDE_API_KEY;
    this.isInitialized = false;
    this.eventQueue = [];

    if (this.apiKey) {
      try {
        console.log(`🔑 Initializing Amplitude with API key: ${this.apiKey.substring(0, 8)}...`);

        // The Amplitude SDK init() is global, so we need to make sure it's properly reinitialized
        init(this.apiKey, {
          // Force reinitialize by providing options
          flushIntervalMillis: 1000,
          flushQueueSize: 30
        });

        this.isInitialized = true;

        // Basic API key validation (Amplitude keys are typically 32 characters)
        if (this.apiKey.length < 20 || !this.apiKey.match(/^[a-f0-9]+$/i)) {
          console.log('⚠️ Warning: API key format looks suspicious, events may not reach Amplitude');
        }

        console.log('✅ Amplitude initialized successfully');
        console.log(`   API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(-4)}`);
        console.log(`   Key Length: ${this.apiKey.length} characters`);

      } catch (error) {
        console.error('❌ Failed to initialize Amplitude:', error.message);
        this.isInitialized = false;
      }
    } else {
      console.log('⚠️ Amplitude running in demo mode (no API key)');
    }
  }

  // Sanitize properties for Amplitude compatibility
  sanitizeProperties(properties) {
    const sanitized = {};

    for (const [key, value] of Object.entries(properties)) {
      // Skip null, undefined, or empty values
      if (value === null || value === undefined || value === '') {
        continue;
      }

      // Skip reserved Amplitude properties that shouldn't be in event/user properties
      // But allow special Amplitude properties that start with $
      const reservedProperties = ['user_id', 'device_id', 'session_id', 'time', 'event_id', 'insert_id', 'event_type'];
      if (reservedProperties.includes(key.toLowerCase()) && !key.startsWith('$')) {
        console.log(`   ⚠️ Skipping reserved property: ${key}`);
        continue;
      }

      // Sanitize property name (keep original case but preserve Amplitude special properties)
      let sanitizedKey = key;

      // Preserve Amplitude special properties that start with $
      if (key.startsWith('$')) {
        // Keep special Amplitude properties as-is (like $revenue, $price, etc.)
        sanitizedKey = key.substring(0, 255);
      } else {
        // For regular properties, replace special chars with underscore
        sanitizedKey = key
          .replace(/[^a-zA-Z0-9_$]/g, '_') // Replace special chars with underscore, keep $ for Amplitude
          .substring(0, 255); // Amplitude has 255 char limit for property names
      }

      // Remove leading/trailing underscores and ensure it doesn't start with a number
      if (!sanitizedKey.startsWith('$')) {
        sanitizedKey = sanitizedKey.replace(/^_+|_+$/g, '');
        if (/^\d/.test(sanitizedKey)) {
          sanitizedKey = 'prop_' + sanitizedKey;
        }
      }

      // Skip if key becomes empty after sanitization
      if (!sanitizedKey) {
        console.log(`   ⚠️ Skipping property with invalid key: ${key}`);
        continue;
      }

      // Sanitize property value based on type
      let sanitizedValue = value;

      if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings (Amplitude doesn't support arrays)
        sanitizedValue = value.filter(v => v !== null && v !== undefined).join(', ');
        if (sanitizedValue.length > 1024) {
          sanitizedValue = sanitizedValue.substring(0, 1024);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Convert objects to JSON strings (Amplitude doesn't support nested objects)
        try {
          sanitizedValue = JSON.stringify(value);
          if (sanitizedValue.length > 1024) {
            sanitizedValue = sanitizedValue.substring(0, 1024);
          }
        } catch (error) {
          sanitizedValue = '[object]';
        }
      } else if (typeof value === 'string') {
        // Limit string length and ensure it's valid UTF-8
        sanitizedValue = value.substring(0, 1024);
        // Remove any control characters that might cause issues
        sanitizedValue = sanitizedValue.replace(/[\x00-\x1F\x7F]/g, '');
      } else if (typeof value === 'number') {
        // Ensure number is finite and not NaN
        if (!isFinite(value) || isNaN(value)) {
          console.log(`   ⚠️ Converting invalid number to 0 for property: ${key}`);
          sanitizedValue = 0;
        } else {
          sanitizedValue = value;
        }
      } else if (typeof value === 'boolean') {
        // Booleans are fine as-is
        sanitizedValue = value;
      } else {
        // Convert other types to strings
        sanitizedValue = String(value).substring(0, 1024);
        sanitizedValue = sanitizedValue.replace(/[\x00-\x1F\x7F]/g, '');
      }

      sanitized[sanitizedKey] = sanitizedValue;
    }

    return sanitized;
  }

  // Debug property validation issues
  debugPropertyIssues(properties, propertyType) {
    console.log(`   🔍 Debugging ${propertyType}:`);

    Object.entries(properties).forEach(([key, value]) => {
      const issues = [];

      // Check key issues
      if (key.length > 255) issues.push('key too long');
      if (!/^[a-zA-Z0-9_$]+$/.test(key)) issues.push('invalid key characters');

      // Check value issues
      if (value === null) issues.push('null value');
      if (value === undefined) issues.push('undefined value');
      if (typeof value === 'string' && value.length > 1024) issues.push('string too long');
      if (typeof value === 'number' && !isFinite(value)) issues.push('invalid number');
      if (Array.isArray(value)) issues.push('array not supported');
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) issues.push('nested object');

      if (issues.length > 0) {
        console.log(`     ❌ ${key}: ${typeof value} - ${issues.join(', ')}`);
      }
    });
  }

  // Track event with automatic context enrichment
  async track(userId, eventType, eventProperties = {}, options = {}) {
    // Extract UTM parameters from event properties if present
    const utmParameters = this.extractUtmParameters(eventProperties);

    // If this is a new user or session with UTM parameters, update user properties
    if (Object.keys(utmParameters).length > 0) {
      await this.identifyWithAttribution(userId, options.userProperties || {}, utmParameters);
    }

    // Sanitize event properties to ensure Amplitude compatibility
    const sanitizedEventProperties = this.sanitizeProperties({
      ...eventProperties,
      // Auto-add demo context (but avoid reserved properties)
      demo_mode: !this.isInitialized,
      event_timestamp: new Date().toISOString(),
      event_source: 'amplitude_demo_template'
    });

    // Sanitize user properties
    const sanitizedUserProperties = this.sanitizeProperties(options.userProperties || {});

    const enrichedEvent = {
      user_id: userId,
      event_type: eventType,
      event_properties: sanitizedEventProperties,
      user_properties: sanitizedUserProperties,
      device_id: options.deviceId || this.generateDeviceId(userId),
      platform: options.platform || 'web',
      time: Date.now()
    };

    let amplitudeStatus = {
      sent: false,
      success: false,
      error: null,
      timestamp: new Date().toISOString()
    };

    if (this.isInitialized) {
      try {
        console.log(`📊 🚀 Sending to Amplitude: ${eventType} for user ${userId}`);
        console.log(`   API Key: ${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NONE'}`);
        console.log(`   Event Properties: ${Object.keys(enrichedEvent.event_properties).length} fields`);
        console.log(`   Session ID: ${options.sessionId || 'none'}`);

        // Log property types for debugging
        const propertyTypes = {};
        Object.entries(enrichedEvent.event_properties).forEach(([key, value]) => {
          propertyTypes[key] = typeof value;
        });
        console.log(`   Property Types:`, propertyTypes);

        // Send to real Amplitude - the track function returns a Result object
        // Amplitude Node SDK expects: track(eventType, eventProperties, eventOptions)

        // Ensure session ID is numeric (Amplitude requirement)
        let numericSessionId = options.sessionId || Date.now();
        if (typeof numericSessionId === 'string') {
          // Extract timestamp from string format if needed
          const timestampMatch = numericSessionId.match(/_(\d+)$/);
          numericSessionId = timestampMatch ? parseInt(timestampMatch[1], 10) : Date.now();
        }

        const result = track(enrichedEvent.event_type, enrichedEvent.event_properties, {
          user_id: enrichedEvent.user_id,
          device_id: enrichedEvent.device_id,
          session_id: numericSessionId, // GUARANTEED to be numeric
          time: enrichedEvent.time,
          // User properties should be set separately via identify, not in track
          // But we can include them in the event options for this call
          user_properties: enrichedEvent.user_properties
        });

        console.log(`   SDK Result: ${result ? 'Returned object' : 'No result'}`);
        console.log(`   Has Promise: ${result && result.promise ? 'YES' : 'NO'}`);

        // The Amplitude Node SDK returns a Result object with a promise property
        if (result && result.promise) {
          // Wait for the actual API call to complete
          try {
            const apiResult = await result.promise;

            // Check if the API result indicates success or failure
            if (apiResult && apiResult.code === 200) {
              amplitudeStatus.sent = true;
              amplitudeStatus.success = true;
              amplitudeStatus.amplitude_response = 'Event successfully sent to Amplitude';
              console.log(`📊 ✅ Successfully sent to Amplitude: ${eventType} for user ${userId}`);
            } else if (apiResult && apiResult.code) {
              amplitudeStatus.sent = true;
              amplitudeStatus.success = false;
              amplitudeStatus.error = `API returned code ${apiResult.code}: ${apiResult.message || 'Unknown error'}`;
              console.log(`📊 ❌ Amplitude API error: ${eventType} for user ${userId} - Code ${apiResult.code}`);

              // Log detailed error info for debugging
              if (apiResult.code === 400) {
                console.log(`   🔍 Debugging 400 Error for: ${eventType}`);
                console.log(`   📝 Full API Response:`, JSON.stringify(apiResult, null, 2));
                console.log(`   📦 Event Payload Sent:`);
                console.log(`     Event Type: ${enrichedEvent.event_type}`);
                console.log(`     User ID: ${enrichedEvent.user_id}`);
                console.log(`     Device ID: ${enrichedEvent.device_id}`);
                console.log(`     Session ID: ${options.sessionId || Date.now()}`);
                console.log(`     Time: ${enrichedEvent.time}`);
                console.log(`   📊 Event Properties:`, JSON.stringify(enrichedEvent.event_properties, null, 2));
                console.log(`   👤 User Properties:`, JSON.stringify(enrichedEvent.user_properties, null, 2));

                // Check for common validation issues
                this.debugPropertyIssues(enrichedEvent.event_properties, 'Event Properties');
                this.debugPropertyIssues(enrichedEvent.user_properties, 'User Properties');

                // Check if there are specific error details in the response
                if (apiResult.error) {
                  console.log(`   ❌ Specific Error Details:`, apiResult.error);
                }
                if (apiResult.errors) {
                  console.log(`   ❌ Validation Errors:`, apiResult.errors);
                }
                if (apiResult.events_with_invalid_fields) {
                  console.log(`   ❌ Events with Invalid Fields:`, apiResult.events_with_invalid_fields);
                }
                if (apiResult.events_with_missing_fields) {
                  console.log(`   ❌ Events with Missing Fields:`, apiResult.events_with_missing_fields);
                }
              }
            } else {
              // No clear success/failure indication, assume success for now
              amplitudeStatus.sent = true;
              amplitudeStatus.success = true;
              amplitudeStatus.amplitude_response = 'Event sent to Amplitude (status unclear)';
              amplitudeStatus.api_result = apiResult;
              console.log(`📊 ⚠️ Event sent to Amplitude with unclear status: ${eventType} for user ${userId}`);
            }
          } catch (apiError) {
            amplitudeStatus.sent = true;
            amplitudeStatus.success = false;
            amplitudeStatus.error = `API Error: ${apiError.message}`;
            console.log(`📊 ❌ Amplitude API error: ${eventType} for user ${userId} - ${apiError.message}`);
          }
        } else {
          // Fallback if SDK behavior is different
          amplitudeStatus.sent = true;
          amplitudeStatus.success = true;
          amplitudeStatus.amplitude_response = 'Event queued for Amplitude';
          console.log(`📊 ✅ Event queued for Amplitude: ${eventType} for user ${userId}`);
        }

      } catch (error) {
        amplitudeStatus.sent = true;
        amplitudeStatus.success = false;
        amplitudeStatus.error = error.message;
        amplitudeStatus.error_details = {
          name: error.name,
          stack: error.stack?.split('\n')[0] // Just first line of stack
        };
        console.log(`📊 ❌ Failed to send to Amplitude: ${eventType} for user ${userId} - ${error.message}`);
      }
    } else {
      // Demo mode - just log
      amplitudeStatus.sent = false;
      amplitudeStatus.success = false;
      amplitudeStatus.error = 'Demo mode - not connected to Amplitude';
      console.log(`🎭 Demo Event: ${eventType}`, {
        user: userId,
        properties: Object.keys(eventProperties).length,
        hasAttribution: Object.keys(utmParameters).length > 0
      });
    }

    // Always add to queue for demo interface with Amplitude status
    const queuedEvent = {
      ...enrichedEvent,
      timestamp: new Date().toISOString(),
      amplitude_status: amplitudeStatus
    };

    this.eventQueue.push(queuedEvent);

    // Keep queue manageable
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift();
    }

    return queuedEvent;
  }

  // Extract UTM parameters and referrer from event properties
  extractUtmParameters(eventProperties) {
    const utmParams = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

    utmKeys.forEach(key => {
      if (eventProperties[key]) {
        utmParams[key] = eventProperties[key];
      }
    });

    // Also capture referrer information
    if (eventProperties.referrer) {
      utmParams.referrer = eventProperties.referrer;
    }

    return utmParams;
  }

  // Removed shouldUpdateAttribution - simplified for demo purposes

  // Set user properties
  async identify(userId, userProperties) {
    const identifyEvent = {
      user_id: userId,
      user_properties: {
        ...userProperties,
        last_updated: new Date().toISOString(),
        demo_user: !this.isInitialized
      }
    };

    if (this.isInitialized) {
      try {
        const identifyObj = new Identify();
        Object.entries(identifyEvent.user_properties).forEach(([key, value]) => {
          identifyObj.set(key, value);
        });

        const result = identify(identifyObj, {
          user_id: identifyEvent.user_id
        });

        // Wait for the API call if there's a promise
        if (result && result.promise) {
          await result.promise;
        }

        console.log(`👤 ✅ Successfully identified user: ${userId}`);
      } catch (error) {
        console.log(`👤 ❌ Failed to identify user: ${userId} - ${error.message}`);
      }
    } else {
      console.log(`🎭 Demo Identify: ${userId}`, Object.keys(userProperties));
    }

    return identifyEvent;
  }

  // Enhanced identify with UTM parameter capture
  async identifyWithAttribution(userId, userProperties, utmParameters = {}) {
    // Extract and format UTM parameters for user properties
    const attributionProperties = this.formatAttributionProperties(utmParameters);

    const enhancedUserProperties = {
      ...userProperties,
      ...attributionProperties,
      last_updated: new Date().toISOString(),
      demo_user: !this.isInitialized
    };

    return await this.identify(userId, enhancedUserProperties);
  }

  // Format UTM parameters as user properties with standard naming conventions
  formatAttributionProperties(utmParameters) {
    const attribution = {};

    // Both initial (first-touch) and current (last-touch) attribution
    if (utmParameters.utm_source) {
      attribution['initial_utm_source'] = utmParameters.utm_source; // First-touch
      attribution['utm_source'] = utmParameters.utm_source; // Current/last-touch
    }

    if (utmParameters.utm_medium) {
      attribution['initial_utm_medium'] = utmParameters.utm_medium; // First-touch
      attribution['utm_medium'] = utmParameters.utm_medium; // Current/last-touch
    }

    if (utmParameters.utm_campaign) {
      attribution['initial_utm_campaign'] = utmParameters.utm_campaign; // First-touch
      attribution['utm_campaign'] = utmParameters.utm_campaign; // Current/last-touch
    }

    if (utmParameters.utm_content) {
      attribution['initial_utm_content'] = utmParameters.utm_content; // First-touch
      attribution['utm_content'] = utmParameters.utm_content; // Current/last-touch
    }

    if (utmParameters.utm_term) {
      attribution['initial_utm_term'] = utmParameters.utm_term; // First-touch
      attribution['utm_term'] = utmParameters.utm_term; // Current/last-touch
    }

    // Add referrer information if available
    if (utmParameters.referrer) {
      attribution['initial_referrer'] = utmParameters.referrer;
      attribution['referrer'] = utmParameters.referrer; // Current referrer
      attribution['initial_referring_domain'] = this.extractDomain(utmParameters.referrer);
      attribution['referring_domain'] = this.extractDomain(utmParameters.referrer);
    }

    // Add attribution metadata using standard naming
    if (Object.keys(attribution).length > 0) {
      attribution['initial_attribution_timestamp'] = new Date().toISOString();
      attribution['attribution_timestamp'] = new Date().toISOString();

      // Generate marketing channel classification using standard names
      const channel = this.classifyMarketingChannel(utmParameters);
      attribution['initial_channel'] = channel;
      attribution['channel'] = channel; // Current channel
      attribution['initial_channel_group'] = this.getChannelCategory(channel);
      attribution['channel_group'] = this.getChannelCategory(channel);
    }

    return attribution;
  }

  // Extract domain from URL
  extractDomain(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/^https?:\/\/([^\/]+)/);
      return match ? match[1] : url;
    }
  }

  // Classify marketing channel based on UTM parameters
  classifyMarketingChannel(utmParameters) {
    const { utm_source, utm_medium, utm_campaign } = utmParameters;

    // Paid search
    if (utm_medium === 'cpc' || utm_medium === 'ppc' ||
      (utm_source && ['google', 'bing', 'yahoo'].includes(utm_source.toLowerCase()) && utm_medium === 'paid')) {
      return 'paid_search';
    }

    // Organic search
    if (utm_medium === 'organic' ||
      (utm_source && ['google', 'bing', 'yahoo', 'duckduckgo'].includes(utm_source.toLowerCase()) && !utm_medium)) {
      return 'organic_search';
    }

    // Social media
    if (utm_medium === 'social' ||
      (utm_source && ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'].includes(utm_source.toLowerCase()))) {
      return 'social_media';
    }

    // Email marketing
    if (utm_medium === 'email' || utm_source === 'newsletter' || utm_source === 'email') {
      return 'email_marketing';
    }

    // Display advertising
    if (utm_medium === 'display' || utm_medium === 'banner' || utm_medium === 'cpm') {
      return 'display_advertising';
    }

    // Affiliate/referral
    if (utm_medium === 'affiliate' || utm_medium === 'referral' ||
      (utm_source && ['affiliate', 'partner'].some(term => utm_source.toLowerCase().includes(term)))) {
      return 'affiliate_referral';
    }

    // Video advertising
    if (utm_medium === 'video' ||
      (utm_source && ['youtube', 'vimeo', 'tiktok'].includes(utm_source.toLowerCase()) && utm_medium !== 'social')) {
      return 'video_advertising';
    }

    // Direct/other
    if (!utm_source && !utm_medium) {
      return 'direct';
    }

    return 'other';
  }

  // Get channel category for grouping
  getChannelCategory(marketingChannel) {
    const categoryMap = {
      'paid_search': 'paid',
      'display_advertising': 'paid',
      'video_advertising': 'paid',
      'social_media': 'social',
      'organic_search': 'organic',
      'email_marketing': 'owned',
      'affiliate_referral': 'referral',
      'direct': 'direct',
      'other': 'other'
    };

    return categoryMap[marketingChannel] || 'other';
  }

  // Helper methods
  generateSessionId(userId) {
    return Date.now(); // Return numeric timestamp, not string
  }

  generateDeviceId(userId) {
    return `device_${userId}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRecentEventTypes() {
    const recent = this.eventQueue.slice(-10);
    const types = recent.map(e => e.event_type);
    return [...new Set(types)];
  }

  getUniqueUserCount() {
    const users = this.eventQueue.map(e => e.user_id);
    return new Set(users).size;
  }

  // Get recent events for demo interface
  getRecentEvents(limit = 20) {
    return this.eventQueue.slice(-limit).reverse();
  }

  // Get demo statistics
  getStats() {
    return {
      totalEvents: this.eventQueue.length,
      isConnected: this.isInitialized,
      recentEventTypes: this.getRecentEventTypes(),
      uniqueUsers: this.getUniqueUserCount()
    };
  }
}

// Export singleton instance
let amplitudeClient = null;

const getAmplitudeClient = () => {
  if (!amplitudeClient) {
    amplitudeClient = new AmplitudeClient();
  }
  return amplitudeClient;
};

// Force create new instance (for dynamic reconfiguration)
const createNewAmplitudeClient = () => {
  amplitudeClient = new AmplitudeClient();
  return amplitudeClient;
};

module.exports = {
  AmplitudeClient,
  getAmplitudeClient,
  createNewAmplitudeClient
};