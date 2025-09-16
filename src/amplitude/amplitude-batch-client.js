// Amplitude Batch API Client for Historical Data Backfills
// Uses Amplitude's Batch Event Upload API for efficient historical data generation

const https = require('https');
const path = require('path');

// Ensure environment variables are loaded
if (!process.env.AMPLITUDE_API_KEY) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

class AmplitudeBatchClient {
  constructor() {
    this.apiKey = process.env.AMPLITUDE_API_KEY;
    this.batchEndpoint = 'https://api2.amplitude.com/batch';
    this.maxBatchSize = 1000; // Amplitude's max batch size
    this.isInitialized = !!this.apiKey && this.apiKey !== 'your_amplitude_api_key_here';
    
    if (this.isInitialized) {
      console.log(`🔄 Batch API initialized with key: ${this.apiKey.substring(0, 8)}...`);
    } else {
      console.log('⚠️ Batch API running in demo mode (no API key)');
    }
  }

  // Generate historical events for a realistic user journey
  async generateHistoricalData(config, options = {}) {
    const {
      daysBack = 30,
      usersPerDay = 10,
      eventsPerUser = 15,
      industryType = 'saas',
      scenarios = ['business', 'marketing', 'product']
    } = options;

    console.log(`🔄 Generating ${daysBack} days of historical data...`);
    console.log(`   Users per day: ${usersPerDay}`);
    console.log(`   Events per user: ${eventsPerUser}`);
    console.log(`   Industry: ${industryType}`);

    const allEvents = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Generate events day by day
    for (let day = 0; day < daysBack; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      console.log(`📅 Generating data for ${currentDate.toDateString()}...`);
      
      const dayEvents = await this.generateDayEvents(
        currentDate, 
        usersPerDay, 
        eventsPerUser, 
        config, 
        scenarios
      );
      
      allEvents.push(...dayEvents);
      
      // Send in batches to avoid memory issues
      if (allEvents.length >= this.maxBatchSize) {
        await this.sendBatch(allEvents.splice(0, this.maxBatchSize));
      }
    }

    // Send remaining events
    if (allEvents.length > 0) {
      await this.sendBatch(allEvents);
    }

    console.log(`✅ Historical data generation complete!`);
    console.log(`🌐 Demo Portal: http://localhost:3001`);
    console.log(`🎬 Your demo is ready to use!`);
    return {
      totalEvents: daysBack * usersPerDay * eventsPerUser,
      daysGenerated: daysBack,
      usersGenerated: daysBack * usersPerDay
    };
  }

  // Generate events for a single day
  async generateDayEvents(date, usersCount, eventsPerUser, config, scenarios) {
    const events = [];
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Generate users for this day
    for (let userIndex = 0; userIndex < usersCount; userIndex++) {
      const userId = this.generateHistoricalUserId(date, userIndex);
      const userEvents = await this.generateUserJourney(
        userId, 
        dayStart, 
        dayEnd, 
        eventsPerUser, 
        config, 
        scenarios
      );
      events.push(...userEvents);
    }

    return events;
  }

  // Generate a realistic user journey with proper timing
  async generateUserJourney(userId, dayStart, dayEnd, eventCount, config, scenarios) {
    const events = [];
    const userSession = this.createHistoricalUserSession(userId, dayStart);
    
    // Determine user's journey stage progression
    const journeyStages = config.userJourney?.stages || [
      { name: 'visitor', events: ['Page Viewed', 'Content Consumed'] },
      { name: 'prospect', events: ['User Signup', 'Feature Used'] },
      { name: 'active_user', events: ['Feature Used', 'Goal Completed'] }
    ];

    let currentStage = 0;
    const sessionDuration = Math.random() * (dayEnd - dayStart); // Random session within the day
    const sessionStart = new Date(dayStart.getTime() + Math.random() * (dayEnd - dayStart - sessionDuration));

    // Generate events throughout the session
    for (let eventIndex = 0; eventIndex < eventCount; eventIndex++) {
      const eventTime = new Date(sessionStart.getTime() + (eventIndex / eventCount) * sessionDuration);
      
      // Possibly progress to next stage
      if (eventIndex > 0 && Math.random() < 0.3 && currentStage < journeyStages.length - 1) {
        currentStage++;
        userSession.userProperties.journey_stage = journeyStages[currentStage].name;
      }

      // Select event type based on current stage and scenario
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const eventType = this.selectHistoricalEventType(config, scenario, journeyStages[currentStage]);
      
      // Generate event properties
      const eventProperties = this.generateHistoricalEventProperties(
        eventType, 
        userSession, 
        config, 
        eventIndex === 0 // First event gets attribution
      );

      // Create the batch event
      const batchEvent = {
        user_id: userId,
        event_type: eventType,
        time: eventTime.getTime(), // Unix timestamp in milliseconds
        event_properties: eventProperties,
        user_properties: userSession.userProperties,
        device_id: userSession.deviceId,
        session_id: userSession.sessionId,
        platform: userSession.platform
      };

      events.push(batchEvent);
    }

    return events;
  }

  // Create a historical user session with realistic attributes
  createHistoricalUserSession(userId, date) {
    const platforms = ['web', 'mobile_app', 'desktop'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    // Generate realistic signup date (could be before this session)
    const signupDate = new Date(date);
    signupDate.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Up to 90 days ago

    return {
      userId: userId,
      sessionId: date.getTime() + Math.floor(Math.random() * 86400000), // Unique session within the day
      deviceId: `device_${userId.split('_')[2]}_${Math.random().toString(36).substr(2, 6)}`,
      platform: platform,
      sessionStartTime: date.getTime(),
      
      userProperties: {
        // Journey stage (will be updated as user progresses)
        journey_stage: 'visitor',
        
        // User lifecycle
        signup_date: signupDate.toISOString().split('T')[0],
        days_since_signup: Math.floor((date - signupDate) / (24 * 60 * 60 * 1000)),
        
        // Attribution (for new users)
        ...(Math.random() < 0.7 ? this.generateHistoricalAttribution() : {}),
        
        // Demographics
        user_segment: this.getRandomUserSegment(),
        platform_preference: platform,
        device_type: this.getDeviceType(platform),
        country: this.getRandomCountry(),
        timezone: this.getRandomTimezone(),
        
        // Engagement metrics
        total_sessions: Math.floor(Math.random() * 20) + 1,
        avg_session_duration: Math.floor(Math.random() * 600) + 120,
        
        // Demo context
        demo_user: true,
        historical_data: true,
        generated_date: new Date().toISOString().split('T')[0]
      }
    };
  }

  // Generate historical attribution data
  generateHistoricalAttribution() {
    const sources = [
      { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'brand_search', weight: 0.3 },
      { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'lookalike', weight: 0.2 },
      { utm_source: 'linkedin', utm_medium: 'social', utm_campaign: 'b2b_targeting', weight: 0.15 },
      { utm_source: 'email', utm_medium: 'email', utm_campaign: 'newsletter', weight: 0.1 },
      { utm_source: 'organic', utm_medium: 'organic', utm_campaign: null, weight: 0.25 }
    ];

    const source = this.weightedRandom(sources);
    
    return {
      initial_utm_source: source.utm_source,
      initial_utm_medium: source.utm_medium,
      initial_utm_campaign: source.utm_campaign,
      initial_referrer: this.getInitialReferrer(source),
      acquisition_channel: this.getAcquisitionChannel(source)
    };
  }

  // Select event type based on scenario and user stage
  selectHistoricalEventType(config, scenario, journeyStage) {
    const scenarioConfig = config.scenarios?.[scenario];
    if (!scenarioConfig || !scenarioConfig.events) {
      return 'Page Viewed'; // Fallback
    }

    // Prefer stage-appropriate events if available
    const stageEvents = journeyStage?.events || [];
    const scenarioEvents = scenarioConfig.events;
    
    // 70% chance to use stage events, 30% scenario events
    const eventPool = stageEvents.length > 0 && Math.random() < 0.7 ? stageEvents : scenarioEvents;
    
    return eventPool[Math.floor(Math.random() * eventPool.length)];
  }

  // Generate event properties for historical events
  generateHistoricalEventProperties(eventType, userSession, config, includeAttribution = false) {
    const properties = {
      // Basic context
      historical_data: true,
      user_stage: userSession.userProperties.journey_stage,
      platform: userSession.platform,
      session_duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
    };

    // Add attribution for first events of new users
    if (includeAttribution && userSession.userProperties.initial_utm_source) {
      // Current/last-touch attribution (most useful for analysis)
      properties.utm_source = userSession.userProperties.initial_utm_source;
      properties.utm_medium = userSession.userProperties.initial_utm_medium;
      properties.utm_campaign = userSession.userProperties.initial_utm_campaign;
      properties.utm_content = userSession.userProperties.initial_utm_content;
      properties.utm_term = userSession.userProperties.initial_utm_term;
      properties.referrer = userSession.userProperties.initial_referrer;
      
      // Also include initial for comparison
      properties.initial_utm_source = userSession.userProperties.initial_utm_source;
      properties.initial_utm_medium = userSession.userProperties.initial_utm_medium;
      properties.initial_utm_campaign = userSession.userProperties.initial_utm_campaign;
    }

    // Add event-specific properties based on type
    if (eventType.toLowerCase().includes('purchase') || eventType.toLowerCase().includes('subscription')) {
      const amount = Math.floor(Math.random() * 500) + 50;
      properties.amount = amount;
      properties.currency = 'USD';
      properties.$revenue = amount; // Amplitude special property
      properties.payment_method = this.getRandomPaymentMethod();
    } else if (eventType.toLowerCase().includes('signup') || eventType.toLowerCase().includes('register')) {
      properties.signup_method = this.getRandomSignupMethod();
      properties.terms_accepted = true;
      properties.newsletter_opted_in = Math.random() > 0.6;
    } else if (eventType.toLowerCase().includes('page') || eventType.toLowerCase().includes('view')) {
      properties.page_title = this.getRandomPageTitle(config);
      properties.page_url = this.getRandomPageUrl(config);
      properties.time_on_page = Math.floor(Math.random() * 300) + 30;
    }

    return properties;
  }

  // Send batch of events to Amplitude
  async sendBatch(events) {
    if (!this.isInitialized) {
      console.log(`🎭 Demo batch: ${events.length} events (not sent to Amplitude)`);
      return { success: true, demo_mode: true };
    }

    const payload = {
      api_key: this.apiKey,
      events: events
    };

    console.log(`📤 Sending batch of ${events.length} events to Amplitude...`);

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api2.amplitude.com',
        port: 443,
        path: '/batch',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (res.statusCode === 200 && response.code === 200) {
              console.log(`✅ Batch sent successfully: ${events.length} events`);
              resolve({ 
                success: true, 
                events_ingested: response.events_ingested,
                payload_size_bytes: response.payload_size_bytes
              });
            } else {
              console.error(`❌ Batch failed: ${res.statusCode} - ${response.error || 'Unknown error'}`);
              resolve({ 
                success: false, 
                error: response.error,
                status_code: res.statusCode
              });
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse Amplitude response: ${parseError.message}`);
            resolve({ success: false, error: 'Invalid response format' });
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Network error sending batch: ${error.message}`);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  // Utility methods
  generateHistoricalUserId(date, index) {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `historical_user_${dateStr}_${index.toString().padStart(3, '0')}`;
  }

  weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) {
        return item;
      }
    }
    
    return items[0];
  }

  getRandomUserSegment() {
    const segments = ['enterprise', 'smb', 'startup', 'individual'];
    return segments[Math.floor(Math.random() * segments.length)];
  }

  getDeviceType(platform) {
    const types = {
      web: 'desktop',
      mobile_app: 'mobile',
      desktop: 'desktop'
    };
    return types[platform] || 'desktop';
  }

  getRandomCountry() {
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'BR'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  getRandomTimezone() {
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo'];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  getInitialReferrer(source) {
    const referrers = {
      google: 'https://google.com',
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
      email: 'direct',
      organic: 'https://google.com'
    };
    return referrers[source.utm_source] || 'direct';
  }

  getAcquisitionChannel(source) {
    if (source.utm_medium === 'cpc') return 'paid_search';
    if (source.utm_medium === 'social') return 'social_media';
    if (source.utm_medium === 'email') return 'email_marketing';
    if (source.utm_medium === 'organic') return 'organic_search';
    return 'other';
  }

  getRandomPaymentMethod() {
    const methods = ['credit_card', 'paypal', 'bank_transfer', 'apple_pay'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getRandomSignupMethod() {
    const methods = ['email', 'google', 'facebook', 'linkedin'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getRandomPageTitle(config) {
    const titles = ['Dashboard', 'Analytics', 'Settings', 'Profile', 'Billing', 'Reports'];
    const companyName = config?.company?.name || 'Demo Company';
    const title = titles[Math.floor(Math.random() * titles.length)];
    return `${title} - ${companyName}`;
  }

  getRandomPageUrl(config) {
    const paths = ['/dashboard', '/analytics', '/settings', '/profile', '/billing', '/reports'];
    const domain = config?.company?.website || 'https://example.com';
    const path = paths[Math.floor(Math.random() * paths.length)];
    return `${domain}${path}`;
  }
}

module.exports = { AmplitudeBatchClient };