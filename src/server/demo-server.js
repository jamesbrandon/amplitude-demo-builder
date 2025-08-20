// Configurable Amplitude Demo Server
// Industry-agnostic analytics demonstration platform

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { getConfigLoader } = require('./config-loader');
const { EventGenerator } = require('../generators/event-generator');

// Import Amplitude client from the original furbo demo (we'll adapt it)
const { getAmplitudeClient, createNewAmplitudeClient } = require('../amplitude/amplitude-client');

class ConfigurableDemoServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    this.port = process.env.DEMO_PORT || 3001;

    // Load configuration
    this.configLoader = getConfigLoader();
    this.loadConfiguration();

    // Initialize components
    this.amplitudeClient = getAmplitudeClient();
    this.eventGenerator = new EventGenerator();

    this.connectedClients = new Set();
    this.isRunning = false;
    this.simulationInterval = null;
    this.activeSessions = new Map();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();

    console.log(`🎯 ${this.config.company.name} Demo Server initialized`);
    console.log(`📊 Industry: ${this.config.company.industry}`);
    console.log(`🎨 Scenarios: ${Object.keys(this.config.scenarios).join(', ')}`);
  }

  loadConfiguration() {
    const industry = process.env.DEMO_INDUSTRY || process.env.CUSTOM_CONFIG_PATH;

    try {
      this.config = this.configLoader.loadConfig(industry);

      // Validate configuration
      const validation = this.configLoader.validateConfig();
      if (!validation.isValid) {
        console.warn('⚠️ Configuration validation warnings:');
        validation.errors.forEach(error => console.warn(`  - ${error}`));
      }

      const summary = this.configLoader.getConfigSummary();
      console.log('✅ Configuration loaded:', summary);

    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      console.log('📋 Using default configuration');
      this.config = this.configLoader.loadConfig(); // Load base config
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check with configuration info
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        company: this.config.company.name,
        industry: this.config.company.industry,
        amplitude_connected: this.amplitudeClient.isInitialized,
        connected_clients: this.connectedClients.size,
        demo_running: this.isRunning,
        configuration: this.configLoader.getConfigSummary()
      });
    });

    // Get current configuration
    this.app.get('/api/config', (req, res) => {
      res.json({
        company: this.config.company,
        branding: this.config.branding,
        scenarios: Object.keys(this.config.scenarios),
        userJourney: this.config.userJourney.stages.map(stage => ({
          name: stage.name,
          displayName: stage.displayName,
          duration: stage.duration
        }))
      });
    });

    // Get available industries
    this.app.get('/api/industries', (req, res) => {
      try {
        const industries = this.configLoader.listAvailableIndustries();
        const industriesWithDetails = industries.map(industry => {
          try {
            const config = this.configLoader.loadConfig(industry);
            return {
              id: industry,
              name: this.capitalizeIndustry(industry),
              company: config.company?.name || 'Unknown Company',
              description: config.company?.description || 'No description available',
              scenarios: Object.keys(config.scenarios || {}).length,
              products: config.products?.length || 0
            };
          } catch (error) {
            return {
              id: industry,
              name: this.capitalizeIndustry(industry),
              company: 'Unknown Company',
              description: 'Configuration error',
              scenarios: 0,
              products: 0
            };
          }
        });

        res.json({ industries: industriesWithDetails });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List available scenarios
    this.app.get('/api/scenarios', (req, res) => {
      try {
        const { industry } = req.query;
        let configToUse = this.config;

        // If industry specified, load that config temporarily
        if (industry && industry !== this.config.company?.industry) {
          try {
            configToUse = this.configLoader.loadConfig(industry);
          } catch (error) {
            console.warn(`Failed to load ${industry} config, using current config`);
          }
        }

        const scenarios = Object.entries(configToUse.scenarios).map(([key, scenario]) => ({
          id: key,
          name: scenario.name,
          description: scenario.description,
          weight: scenario.weight,
          events: scenario.events
        }));

        res.json({ scenarios });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Start demo simulation
    this.app.post('/api/demo/start', (req, res) => {
      const { scenario } = req.body;
      this.startDemo(scenario);
      res.json({
        success: true,
        scenario,
        company: this.config.company.name,
        industry: this.config.company.industry
      });
    });

    // Stop demo simulation
    this.app.post('/api/demo/stop', (req, res) => {
      this.stopDemo();
      res.json({ success: true });
    });

    // Apply setup configuration
    this.app.post('/api/setup/apply', (req, res) => {
      try {
        const { industry, apiKey } = req.body;

        console.log(`🔧 Applying setup: industry=${industry}, apiKey=${apiKey ? 'provided' : 'none'}`);

        // Update environment variable if API key provided
        if (apiKey) {
          process.env.AMPLITUDE_API_KEY = apiKey;
          console.log(`🔑 Updated Amplitude API key: ${apiKey.substring(0, 8)}...`);

          // Force create a new Amplitude client instance
          this.amplitudeClient = createNewAmplitudeClient();
        }

        // Reload configuration with new industry
        if (industry) {
          this.config = this.configLoader.reloadConfig(industry);
          this.eventGenerator.reloadConfig();
        }

        console.log(`🎯 Demo reconfigured for ${this.config.company.name} (${this.config.company.industry})`);
        console.log(`📊 Amplitude connected: ${this.amplitudeClient.isInitialized}`);

        // Broadcast updated status to all connected clients
        this.broadcast('demo-status', {
          isRunning: this.isRunning,
          amplitude_connected: this.amplitudeClient.isInitialized,
          company: this.config.company,
          industry: this.config.company.industry,
          scenarios: Object.keys(this.config.scenarios),
          stats: this.amplitudeClient.getStats()
        });

        res.json({
          success: true,
          message: 'Configuration applied successfully',
          company: this.config.company.name,
          industry: this.config.company.industry,
          amplitude_connected: this.amplitudeClient.isInitialized
        });
      } catch (error) {
        console.error('Setup application failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Trigger specific event
    this.app.post('/api/events/trigger', async (req, res) => {
      const { eventType, userId, properties } = req.body;

      try {
        // Generate user session if not provided
        const userSession = userId ?
          this.getOrCreateUserSession(userId) :
          this.getOrCreateUserSession();

        // Generate event properties using configuration
        const generatedProperties = this.eventGenerator.generateEventProperties(eventType, userSession);
        const finalProperties = { ...generatedProperties, ...properties };

        const event = await this.amplitudeClient.track(
          userSession.userId,
          eventType,
          finalProperties,
          {
            userProperties: userSession.userProperties, // Include user properties
            deviceId: userSession.deviceId,
            sessionId: userSession.sessionId, // Pass numeric session ID
            platform: userSession.platform
          }
        );

        // Broadcast to connected clients
        this.broadcast('event-triggered', {
          event_type: eventType,
          user_id: userSession.userId,
          company: this.config.company.name,
          timestamp: new Date().toISOString(),
          amplitude_status: event.amplitude_status
        });

        // Update stats immediately after event
        this.broadcast('demo-status', {
          isRunning: this.isRunning,
          amplitude_connected: this.amplitudeClient.isInitialized,
          company: this.config.company,
          industry: this.config.company.industry,
          scenarios: Object.keys(this.config.scenarios),
          stats: this.amplitudeClient.getStats(),
          connected_clients: this.connectedClients.size
        });

        res.json({
          success: true,
          event,
          amplitude_status: event.amplitude_status
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recent events
    this.app.get('/api/events/recent', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      const events = this.amplitudeClient.getRecentEvents(limit);
      res.json({ events });
    });

    // Get demo statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = this.amplitudeClient.getStats();
      res.json({
        ...stats,
        demo_running: this.isRunning,
        connected_clients: this.connectedClients.size,
        company: this.config.company.name,
        industry: this.config.company.industry,
        active_sessions: this.activeSessions.size
      });
    });

    // Test Amplitude connection
    this.app.post('/api/test-amplitude', async (req, res) => {
      try {
        console.log('🧪 Testing Amplitude connection...');

        const testEvent = await this.amplitudeClient.track(
          'test_user_' + Date.now(),
          'API Connection Test',
          {
            test_timestamp: new Date().toISOString(),
            source: 'connection_test'
          }
        );

        res.json({
          success: true,
          amplitude_connected: this.amplitudeClient.isInitialized,
          test_result: testEvent.amplitude_status
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get available industries
    this.app.get('/api/industries', (req, res) => {
      try {
        const industries = this.configLoader.listAvailableIndustries();
        const industriesWithDetails = industries.map(industry => {
          try {
            const config = this.configLoader.loadConfig(industry);
            return {
              id: industry,
              name: this.capitalizeIndustry(industry),
              company: config.company?.name || 'Unknown Company',
              description: config.company?.description || 'No description available',
              scenarios: Object.keys(config.scenarios || {}).length,
              products: config.products?.length || 0
            };
          } catch (error) {
            return {
              id: industry,
              name: this.capitalizeIndustry(industry),
              company: 'Unknown Company',
              description: 'Configuration error',
              scenarios: 0,
              products: 0
            };
          }
        });

        res.json({ industries: industriesWithDetails });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Apply setup configuration
    this.app.post('/api/setup/apply', (req, res) => {
      try {
        const { industry, apiKey } = req.body;

        // Update environment variable if API key provided
        if (apiKey) {
          process.env.AMPLITUDE_API_KEY = apiKey;
          console.log(`🔑 Updated Amplitude API key: ${apiKey.substring(0, 8)}...`);

          // Force create a new Amplitude client instance
          this.amplitudeClient = createNewAmplitudeClient();
        }

        // Reload configuration with new industry
        this.config = this.configLoader.reloadConfig(industry);
        this.eventGenerator.reloadConfig();

        console.log(`🎯 Demo reconfigured for ${this.config.company.name} (${industry})`);
        console.log(`📊 Amplitude connected: ${this.amplitudeClient.isInitialized}`);

        res.json({
          success: true,
          message: 'Configuration applied successfully',
          company: this.config.company.name,
          industry: this.config.company.industry,
          amplitude_connected: this.amplitudeClient.isInitialized
        });
      } catch (error) {
        console.error('Setup application failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Reload configuration (useful for development)
    this.app.post('/api/config/reload', (req, res) => {
      try {
        const { industry } = req.body;
        this.config = this.configLoader.reloadConfig(industry);
        this.eventGenerator.reloadConfig();

        res.json({
          success: true,
          message: 'Configuration reloaded',
          summary: this.configLoader.getConfigSummary()
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get demo statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = this.amplitudeClient.getStats();
      res.json({
        ...stats,
        demo_running: this.isRunning,
        connected_clients: this.connectedClients.size,
        company: this.config.company.name,
        industry: this.config.company.industry,
        active_sessions: this.activeSessions.size
      });
    });

    // Debug Amplitude connection
    this.app.post('/api/debug-amplitude', async (req, res) => {
      try {
        console.log('🔍 Debug Amplitude connection...');
        console.log(`   Environment API Key: ${process.env.AMPLITUDE_API_KEY ? process.env.AMPLITUDE_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
        console.log(`   Client initialized: ${this.amplitudeClient.isInitialized}`);
        console.log(`   Client API Key: ${this.amplitudeClient.apiKey ? this.amplitudeClient.apiKey.substring(0, 8) + '...' : 'NONE'}`);
        
        const testEvent = await this.amplitudeClient.track(
          'debug_user_' + Date.now(),
          'Debug Connection Test',
          {
            test_timestamp: new Date().toISOString(),
            source: 'debug_endpoint',
            environment_key_present: !!process.env.AMPLITUDE_API_KEY,
            client_key_present: !!this.amplitudeClient.apiKey
          }
        );
        
        console.log(`   Debug result: ${testEvent.amplitude_status.success ? 'SUCCESS' : 'FAILED'}`);
        
        res.json({
          success: true,
          environment_api_key: process.env.AMPLITUDE_API_KEY ? process.env.AMPLITUDE_API_KEY.substring(0, 8) + '...' : null,
          client_initialized: this.amplitudeClient.isInitialized,
          client_api_key: this.amplitudeClient.apiKey ? this.amplitudeClient.apiKey.substring(0, 8) + '...' : null,
          test_result: testEvent.amplitude_status
        });
      } catch (error) {
        console.error('Debug amplitude error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Serve main interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send current status and configuration
      socket.emit('demo-status', {
        isRunning: this.isRunning,
        amplitude_connected: this.amplitudeClient.isInitialized,
        company: this.config.company,
        industry: this.config.company.industry,
        scenarios: Object.keys(this.config.scenarios),
        stats: this.amplitudeClient.getStats()
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send current status and configuration
      socket.emit('demo-status', {
        isRunning: this.isRunning,
        amplitude_connected: this.amplitudeClient.isInitialized,
        company: this.config.company,
        industry: this.config.company.industry,
        scenarios: Object.keys(this.config.scenarios),
        stats: this.amplitudeClient.getStats()
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Start demo simulation
  startDemo(scenario = 'business') {
    if (this.isRunning) {
      console.log('⚠️ Demo already running');
      return;
    }

    // Validate scenario exists
    if (!this.config.scenarios[scenario]) {
      console.log(`⚠️ Unknown scenario: ${scenario}, using first available`);
      scenario = Object.keys(this.config.scenarios)[0];
    }

    console.log(`🎬 Starting ${this.config.company.name} demo - ${scenario} scenario`);
    this.isRunning = true;

    const interval = this.config.simulation?.eventInterval || 5000;

    // Start generating events
    this.simulationInterval = setInterval(async () => {
      await this.generateRandomEvent(scenario);
    }, interval);

    this.broadcast('demo-started', {
      scenario,
      company: this.config.company.name,
      industry: this.config.company.industry
    });
  }

  // Stop demo simulation
  stopDemo() {
    if (!this.isRunning) {
      console.log('⚠️ Demo not running');
      return;
    }

    console.log('⏹️ Stopping demo');
    this.isRunning = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.broadcast('demo-stopped', {});
  }

  // Generate realistic event based on configuration
  async generateRandomEvent(scenario) {
    try {
      // Get or create a user session
      const userSession = this.getOrCreateUserSession();

      // Select event type based on scenario configuration
      const scenarioConfig = this.config.scenarios[scenario];
      const eventType = this.selectEventType(scenarioConfig, userSession);

      // Generate event properties
      const properties = this.eventGenerator.generateEventProperties(eventType, userSession);

      // Track event
      const event = await this.amplitudeClient.track(
        userSession.userId,
        eventType,
        properties,
        {
          userProperties: userSession.userProperties,
          deviceId: userSession.deviceId,
          platform: userSession.platform
        }
      );

      // Update user session
      this.updateUserSession(userSession, eventType);

      // Broadcast to clients
      this.broadcast('live-event', {
        event_type: eventType,
        user_id: userSession.userId,
        session_id: userSession.sessionId,
        platform: userSession.platform,
        company: this.config.company.name,
        scenario: scenario,
        properties: Object.keys(properties),
        timestamp: new Date().toISOString(),
        amplitude_status: event.amplitude_status
      });

    } catch (error) {
      console.error('Error generating event:', error.message);
    }
  }

  // Select event type based on scenario and user journey
  selectEventType(scenarioConfig, userSession) {
    const events = scenarioConfig.events || [];

    if (events.length === 0) {
      return 'Generic Event';
    }

    // Simple random selection for now
    // Could be enhanced with user journey stage logic
    return events[Math.floor(Math.random() * events.length)];
  }

  // Get or create user session with rich context
  getOrCreateUserSession(userId = null) {
    if (!userId) {
      userId = this.generateUserId();
    }

    if (this.activeSessions.has(userId)) {
      const session = this.activeSessions.get(userId);
      
      // Check if we should start a new session (after 30 minutes of inactivity)
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes
      const timeSinceLastEvent = Date.now() - (session.lastEventTime || session.sessionStartTime);
      
      if (timeSinceLastEvent > sessionTimeout) {
        console.log(`🔄 Starting new session for user ${userId} (timeout: ${Math.round(timeSinceLastEvent/60000)}min)`);
        // Create new session for existing user
        const newSessionId = Date.now();
        session.sessionId = newSessionId;
        session.sessionStartTime = newSessionId;
        session.eventCount = 1;
        session.lastEventTime = newSessionId;
      } else {
        session.eventCount++;
        session.lastEventTime = Date.now();
      }
      
      session.lifetimeEventCount = (session.lifetimeEventCount || session.eventCount) + 1;
      return session;
    }

    // Create new user with realistic journey starting point
    const userStages = this.config.userJourney?.stages || [];
    const startingStage = userStages[0] || { name: 'visitor', displayName: 'Visitor' };
    
    // Generate realistic user attributes
    const signupDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // 0-180 days ago
    const daysSinceSignup = Math.floor((Date.now() - signupDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Generate attribution data for new users
    const attributionSources = this.config.attribution?.sources || [];
    const attribution = attributionSources.length > 0 ? 
      this.weightedRandom(attributionSources) : 
      { utm_source: 'organic', utm_medium: 'organic' };

    const platforms = ['web', 'mobile_app', 'desktop'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    const sessionStartTime = Date.now();
    const session = {
      userId: userId,
      sessionId: sessionStartTime, // Amplitude expects numeric timestamp
      deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
      platform: platform,
      sessionStartTime: sessionStartTime,
      lastEventTime: sessionStartTime,
      eventCount: 1,
      lifetimeEventCount: Math.floor(Math.random() * 50) + 1, // 1-50 lifetime events
      currentJourneyStep: startingStage.name,
      daysSinceSignup: daysSinceSignup,
      
      // Attribution data (first-touch)
      attributionData: {
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign || `${attribution.utm_source}_campaign`,
        initial_referrer: this.getInitialReferrer(attribution),
        acquisition_date: signupDate.toISOString().split('T')[0]
      },
      
      // Rich user properties for Amplitude identify calls
      userProperties: {
        // Journey & lifecycle
        journey_stage: startingStage.name,
        lifecycle_stage: this.getLifecycleStage(daysSinceSignup),
        days_since_signup: daysSinceSignup,
        signup_date: signupDate.toISOString().split('T')[0],
        
        // Attribution (first-touch)
        initial_utm_source: attribution.utm_source,
        initial_utm_medium: attribution.utm_medium,
        initial_utm_campaign: attribution.utm_campaign || `${attribution.utm_source}_campaign`,
        initial_referrer: this.getInitialReferrer(attribution),
        acquisition_channel: this.getAcquisitionChannel(attribution),
        
        // Demographics & behavior
        user_segment: this.getUserSegment(),
        platform_preference: platform,
        device_type: this.getDeviceType(platform),
        timezone: this.getTimezone(),
        country: this.getCountry(),
        
        // Business context
        company_demo: this.config.company.name,
        industry: this.config.company.industry,
        demo_user: true,
        
        // Engagement metrics
        total_sessions: Math.floor(Math.random() * 20) + 1,
        avg_session_duration: Math.floor(Math.random() * 600) + 120, // 2-12 minutes
        
        // Revenue context (for applicable industries)
        ...(this.config.company.industry === 'ecommerce' || this.config.company.industry === 'saas' ? {
          ltv_bucket: this.getLTVBucket({ daysSinceSignup }),
          purchase_intent: this.getPurchaseIntent(),
          price_sensitivity: this.getPriceSensitivity()
        } : {})
      }
    };

    this.activeSessions.set(userId, session);

    // Set initial user properties for new users (only once)
    this.amplitudeClient.identify(userId, session.userProperties);

    // Clean up old sessions (keep more for better journey continuity)
    if (this.activeSessions.size > 200) {
      const oldestKey = this.activeSessions.keys().next().value;
      this.activeSessions.delete(oldestKey);
    }

    return session;
  }

  // Enhanced user journey progression with realistic funnel logic
  updateUserJourney(userSession, eventType) {
    const stages = this.config.userJourney?.stages || [];
    const currentStageIndex = stages.findIndex(s => s.name === userSession.currentJourneyStep);

    // Journey progression based on event type and stage
    let progressionChance = 0;
    
    if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
      const currentStage = stages[currentStageIndex];
      const nextStage = stages[currentStageIndex + 1];
      
      // Higher progression chance for key conversion events
      if (this.isProgressionEvent(eventType, currentStage, nextStage)) {
        progressionChance = currentStage.conversionRate || 0.15;
      } else {
        progressionChance = (currentStage.conversionRate || 0.15) * 0.3; // Lower chance for non-key events
      }
      
      // Progress to next stage
      if (Math.random() < progressionChance) {
        console.log(`👤 User ${userSession.userId} progressed: ${currentStage.name} → ${nextStage.name}`);
        userSession.currentJourneyStep = nextStage.name;
        userSession.userProperties.journey_stage = nextStage.name;
        userSession.userProperties.lifecycle_stage = this.getLifecycleStage(userSession.daysSinceSignup);
        
        // Update user properties in Amplitude only when they change
        this.amplitudeClient.identify(userSession.userId, {
          journey_stage: nextStage.name,
          lifecycle_stage: userSession.userProperties.lifecycle_stage,
          stage_progression_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }

  // Select event based on user's journey stage and scenario
  selectEventForUserJourney(scenarioConfig, userSession) {
    const allEvents = scenarioConfig.events || [];
    
    if (allEvents.length === 0) {
      return 'Generic Event';
    }
    
    // Get stage-appropriate events
    const currentStage = this.config.userJourney?.stages?.find(s => s.name === userSession.currentJourneyStep);
    const stageEvents = currentStage?.events || [];
    
    // 70% chance to use stage-appropriate events, 30% chance for any scenario event
    const useStageEvents = stageEvents.length > 0 && Math.random() > 0.3;
    const eventPool = useStageEvents ? stageEvents : allEvents;
    
    return eventPool[Math.floor(Math.random() * eventPool.length)];
  }

  // Check if event should trigger journey progression
  isProgressionEvent(eventType, currentStage, nextStage) {
    const progressionEvents = {
      'visitor': ['User Signup', 'Account Created', 'Trial Started'],
      'trial_user': ['Subscription Purchased', 'Plan Upgraded', 'Feature Used'],
      'active_user': ['Purchase Completed', 'Subscription Renewed', 'Referral Made'],
      'customer': ['Upgrade Purchased', 'Add-on Purchased', 'VIP Program Joined']
    };
    
    const keyEvents = progressionEvents[currentStage.name] || [];
    return keyEvents.some(event => eventType.includes(event) || event.includes(eventType));
  }

  // Helper methods for context generation

  // Removed computed metrics - let Amplitude handle segmentation and scoring

  getLifecycleStage(daysSinceSignup) {
    if (daysSinceSignup <= 1) return 'new';
    if (daysSinceSignup <= 7) return 'activated';
    if (daysSinceSignup <= 30) return 'engaged';
    if (daysSinceSignup <= 90) return 'retained';
    return 'champion';
  }

  getUserSegment() {
    const segments = ['consumer', 'business', 'enterprise', 'startup'];
    return segments[Math.floor(Math.random() * segments.length)];
  }

  getTimezone() {
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];
    return timezones[Math.floor(Math.random() * timezones.length)];
  }

  getCountry() {
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  getInitialReferrer(attribution) {
    const referrers = {
      'google': 'https://google.com/search',
      'facebook': 'https://facebook.com',
      'linkedin': 'https://linkedin.com',
      'organic': 'direct'
    };
    return referrers[attribution.utm_source] || 'https://google.com';
  }

  getAcquisitionChannel(attribution) {
    const channels = {
      'google': 'paid_search',
      'facebook': 'social_media',
      'linkedin': 'social_media',
      'organic': 'organic_search',
      'email': 'email_marketing'
    };
    return channels[attribution.utm_source] || 'other';
  }

  getPurchaseIntent() {
    const intents = ['low', 'medium', 'high'];
    return intents[Math.floor(Math.random() * intents.length)];
  }

  getPriceSensitivity() {
    const sensitivities = ['low', 'medium', 'high'];
    return sensitivities[Math.floor(Math.random() * sensitivities.length)];
  }

  // Validate properties to prevent Amplitude errors
  validateProperties(properties) {
    const validated = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip null, undefined, or function values
      if (value === null || value === undefined || typeof value === 'function') {
        console.warn(`⚠️ Skipping invalid property: ${key} = ${value}`);
        continue;
      }
      
      // Convert arrays to strings
      if (Array.isArray(value)) {
        validated[key] = value.join(', ');
      } else {
        validated[key] = value;
      }
    }
    
    return validated;
  }

  // Weighted random selection utility
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

  // Generate unique user ID
  generateUserId() {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to capitalize industry names
  capitalizeIndustry(industry) {
    const industryNames = {
      'ecommerce': 'E-commerce',
      'saas': 'SaaS',
      'iot': 'IoT',
      'hospitality': 'Hospitality',
      'fintech': 'FinTech',
      'healthcare': 'Healthcare',
      'education': 'Education',
      'gaming': 'Gaming'
    };

    return industryNames[industry] || industry.charAt(0).toUpperCase() + industry.slice(1);
  }

  // Start demo simulation
  startDemo(scenario = 'business') {
    if (this.isRunning) {
      console.log('⚠️ Demo already running');
      return;
    }

    // Validate scenario exists
    if (!this.config.scenarios[scenario]) {
      console.log(`⚠️ Unknown scenario: ${scenario}, using first available`);
      scenario = Object.keys(this.config.scenarios)[0];
    }

    console.log(`🎬 Starting ${this.config.company.name} demo - ${scenario} scenario`);
    this.isRunning = true;

    const interval = this.config.simulation?.eventInterval || 5000;
    
    // Start generating events
    this.simulationInterval = setInterval(async () => {
      await this.generateRandomEvent(scenario);
    }, interval);

    this.broadcast('demo-started', { 
      scenario,
      company: this.config.company.name,
      industry: this.config.company.industry
    });
  }

  // Stop demo simulation
  stopDemo() {
    if (!this.isRunning) {
      console.log('⚠️ Demo not running');
      return;
    }

    console.log('⏹️ Stopping demo');
    this.isRunning = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.broadcast('demo-stopped', {});
  }

  // Generate realistic event based on configuration with user journey logic
  async generateRandomEvent(scenario) {
    try {
      // Decide whether to continue existing user journey or start new one
      const shouldContinueJourney = Math.random() > 0.3; // 70% chance to continue existing journey
      
      let userSession;
      if (shouldContinueJourney && this.activeSessions.size > 0) {
        // Continue existing user journey
        const existingSessions = Array.from(this.activeSessions.values());
        const activeSession = existingSessions[Math.floor(Math.random() * existingSessions.length)];
        userSession = this.getOrCreateUserSession(activeSession.userId);
      } else {
        // Start new user journey
        userSession = this.getOrCreateUserSession();
      }
      
      // Select event type based on user's current journey stage and scenario
      const scenarioConfig = this.config.scenarios[scenario];
      const eventType = this.selectEventForUserJourney(scenarioConfig, userSession);
      
      // Generate rich contextual properties
      const properties = this.eventGenerator.generateEventProperties(eventType, userSession);
      
      // Add only contextual properties specific to this event moment
      const enrichedProperties = {
        ...properties,
        
        // Current user journey context (business-specific state)
        user_journey_stage: userSession.currentJourneyStep,
        
        // Attribution context (only for new users to avoid redundancy)
        ...(userSession.eventCount <= 3 && userSession.attributionData ? userSession.attributionData : {})
      };
      
      // Track event with rich context including session ID
      const event = await this.amplitudeClient.track(
        userSession.userId,
        eventType,
        enrichedProperties,
        {
          userProperties: userSession.userProperties, // Include user properties like working demo
          deviceId: userSession.deviceId,
          sessionId: userSession.sessionId, // Pass numeric session ID
          platform: userSession.platform
        }
      );
      
      // Update user session and potentially progress journey
      this.updateUserJourney(userSession, eventType);
      
      // Broadcast to clients with journey context
      this.broadcast('live-event', {
        event_type: eventType,
        user_id: userSession.userId,
        session_id: userSession.sessionId,
        platform: userSession.platform,
        company: this.config.company.name,
        scenario: scenario,
        journey_stage: userSession.currentJourneyStep,
        session_events: userSession.eventCount,
        properties: Object.keys(enrichedProperties).slice(0, 8), // Show first 8 properties
        timestamp: new Date().toISOString(),
        amplitude_status: event.amplitude_status
      });

      // Update stats after live event (less frequent to avoid spam)
      if (Math.random() > 0.7) {
        this.broadcast('demo-status', {
          isRunning: this.isRunning,
          amplitude_connected: this.amplitudeClient.isInitialized,
          company: this.config.company,
          industry: this.config.company.industry,
          scenarios: Object.keys(this.config.scenarios),
          stats: this.amplitudeClient.getStats(),
          connected_clients: this.connectedClients.size
        });
      }
      
    } catch (error) {
      console.error('Error generating event:', error.message);
    }
  }

  // Select event type based on scenario and user journey
  selectEventType(scenarioConfig, userSession) {
    const events = scenarioConfig.events || [];
    
    if (events.length === 0) {
      return 'Generic Event';
    }
    
    // Simple random selection for now
    // Could be enhanced with user journey stage logic
    return events[Math.floor(Math.random() * events.length)];
  }

  // Get or create user session
  getOrCreateUserSession(userId = null) {
    if (!userId) {
      userId = this.generateUserId();
    }
    
    if (this.activeSessions.has(userId)) {
      const session = this.activeSessions.get(userId);
      session.eventCount++;
      return session;
    }
    
    // Create new user session based on configuration
    const userStages = this.config.userJourney?.stages || [];
    const randomStage = userStages[Math.floor(Math.random() * userStages.length)] || {
      name: 'active_user',
      displayName: 'Active User'
    };
    
    const session = {
      userId: userId,
      sessionId: `session_${userId}_${Date.now()}`,
      deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
      platform: ['web', 'mobile', 'desktop'][Math.floor(Math.random() * 3)],
      sessionStartTime: Date.now(),
      eventCount: 1,
      currentJourneyStep: randomStage.name,
      userProperties: {
        journey_stage: randomStage.name,
        company_demo: this.config.company.name,
        industry: this.config.company.industry,
        signup_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    this.activeSessions.set(userId, session);
    
    // Clean up old sessions
    if (this.activeSessions.size > 100) {
      const oldestKey = this.activeSessions.keys().next().value;
      this.activeSessions.delete(oldestKey);
    }
    
    return session;
  }

  // Update user session after event
  updateUserSession(userSession, eventType) {
    // Simple progression logic - could be enhanced
    const stages = this.config.userJourney?.stages || [];
    const currentStageIndex = stages.findIndex(s => s.name === userSession.currentJourneyStep);
    
    // Chance to progress to next stage
    if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
      const currentStage = stages[currentStageIndex];
      if (Math.random() < (currentStage.conversionRate || 0.1)) {
        const nextStage = stages[currentStageIndex + 1];
        userSession.currentJourneyStep = nextStage.name;
        userSession.userProperties.journey_stage = nextStage.name;
      }
    }
  }

  // Broadcast message to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Start periodic stats updates
  startStatsUpdates() {
    // Send stats updates every 5 seconds
    setInterval(() => {
      if (this.connectedClients.size > 0) {
        this.broadcast('demo-status', {
          isRunning: this.isRunning,
          amplitude_connected: this.amplitudeClient.isInitialized,
          company: this.config.company,
          industry: this.config.company.industry,
          scenarios: Object.keys(this.config.scenarios),
          stats: this.amplitudeClient.getStats(),
          connected_clients: this.connectedClients.size
        });
      }
    }, 5000);
  }

  // Start the server
  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 ${this.config.company.name} Demo Server running on port ${this.port}`);
      console.log(`🌐 Open http://localhost:${this.port} to view the demo`);
      console.log(`📊 Industry: ${this.config.company.industry}`);
      console.log(`🎯 Available scenarios: ${Object.keys(this.config.scenarios).join(', ')}`);
      
      // Start periodic stats updates
      this.startStatsUpdates();
    });
  }
}

// Start server if called directly
if (require.main === module) {
  const server = new ConfigurableDemoServer();
  server.start();
}

module.exports = { ConfigurableDemoServer };