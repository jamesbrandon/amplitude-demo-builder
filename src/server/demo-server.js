// Configurable Amplitude Demo Server
// Industry-agnostic analytics demonstration platform

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
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

    // Apply objective-based modifications if available
    if (this.config.demoObjectives) {
      this.eventGenerator.applyObjectiveModifications(this.config.demoObjectives);
    }

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

    // Generate client-specific demo
    this.app.post('/api/generate-client-demo', async (req, res) => {
      try {
        const { ClientDemoGenerator } = require('../../scripts/create-client-demo');
        const generator = new ClientDemoGenerator();

        const clientConfig = req.body;
        console.log(`🎯 Generating client demo for: ${clientConfig.clientName}`);

        // Generate the demo project
        const result = await generator.generateClientDemoFromConfig(clientConfig);

        res.json({
          success: true,
          message: 'Client demo generated successfully',
          projectName: result.projectName,
          projectPath: result.projectPath,
          downloadUrl: `/downloads/${result.projectName}.zip`
        });
      } catch (error) {
        console.error('Client demo generation failed:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Serve client generator interface
    this.app.get('/generator', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/client-generator.html'));
    });

    // Handle download requests (redirect to project folder)
    this.app.get('/downloads/:projectName', (req, res) => {
      const projectName = req.params.projectName.replace('.zip', '');
      const projectPath = path.join(process.cwd(), '..', projectName);

      if (fs.existsSync(projectPath)) {
        res.json({
          success: true,
          message: 'Project generated successfully!',
          projectName: projectName,
          projectPath: projectPath,
          instructions: [
            `cd ../${projectName}`,
            'npm install',
            'npm start',
            'Open http://localhost:3001'
          ]
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Project not found. Please generate it first.',
          projectName: projectName
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

    // Start generating events
    this.demoInterval = setInterval(() => {
      this.generateEvent(scenario);
    }, 3000); // Generate event every 3 seconds

    // Broadcast status update
    this.broadcast('demo-status', {
      isRunning: this.isRunning,
      amplitude_connected: this.amplitudeClient.isInitialized,
      company: this.config.company,
      industry: this.config.company.industry,
      scenarios: Object.keys(this.config.scenarios),
      stats: this.amplitudeClient.getStats()
    });
  }

  stopDemo() {
    if (!this.isRunning) {
      console.log('⚠️ Demo not running');
      return;
    }

    console.log('⏹️ Stopping demo');
    this.isRunning = false;

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    // Broadcast status update
    this.broadcast('demo-status', {
      isRunning: this.isRunning,
      amplitude_connected: this.amplitudeClient.isInitialized,
      company: this.config.company,
      industry: this.config.company.industry,
      scenarios: Object.keys(this.config.scenarios),
      stats: this.amplitudeClient.getStats()
    });
  }

  // Generate a single event
  async generateEvent(scenario = 'business') {
    try {
      // Decide whether to continue existing user journey or start new one
      const shouldContinueJourney = Math.random() > 0.15; // 85% chance to continue existing journey for more realistic sessions

      let userSession;
      if (shouldContinueJourney && this.activeSessions.size > 0) {
        // Continue existing user journey with industry-specific session patterns
        userSession = this.selectUserForContinuation();
      } else {
        // Start new user journey
        userSession = this.getOrCreateUserSession();
      }

      // Select event type based on user's current journey stage and scenario
      const scenarioConfig = this.config.scenarios[scenario];
      const eventType = this.selectEventForUserJourney(scenarioConfig, userSession, this.config.company?.industry);

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
          sessionId: userSession.sessionId,
          deviceId: userSession.deviceId,
          platform: userSession.platform
        }
      );

      // Update user session after event
      this.updateUserSession(userSession, eventType);

      // Broadcast event to connected clients
      this.broadcast('new-event', {
        eventType,
        userId: userSession.userId,
        properties: enrichedProperties,
        timestamp: new Date().toISOString(),
        amplitude_status: event.amplitude_status
      });

    } catch (error) {
      console.error('Error generating event:', error.message);
    }
  }

  // Select user for journey continuation with industry-specific patterns
  selectUserForContinuation() {
    const sessions = Array.from(this.activeSessions.values());
    
    // Industry-specific session continuation patterns
    const industryPatterns = {
      'e-commerce': {
        // E-commerce users often have shopping sessions with multiple events
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        continuationWeight: 0.9 // High chance to continue shopping
      },
      'media': {
        // Media users often binge-watch or have longer engagement sessions
        sessionTimeout: 60 * 60 * 1000, // 1 hour
        continuationWeight: 0.85
      },
      'saas': {
        // SaaS users have work-session patterns
        sessionTimeout: 45 * 60 * 1000, // 45 minutes
        continuationWeight: 0.75
      },
      'fintech': {
        // FinTech users have shorter, focused sessions
        sessionTimeout: 15 * 60 * 1000, // 15 minutes
        continuationWeight: 0.7
      },
      'default': {
        sessionTimeout: 20 * 60 * 1000, // 20 minutes
        continuationWeight: 0.8
      }
    };

    const pattern = industryPatterns[this.config.company?.industry] || industryPatterns.default;
    const sessionTimeout = pattern.sessionTimeout;
    
    // Filter active sessions (not timed out)
    const activeSessions = sessions.filter(session => {
      const timeSinceLastEvent = Date.now() - (session.lastEventTime || session.sessionStartTime);
      return timeSinceLastEvent < sessionTimeout;
    });

    if (activeSessions.length === 0) {
      return this.getOrCreateUserSession();
    }

    // Weight selection towards users with recent activity
    const weightedSessions = activeSessions.map(session => {
      const timeSinceLastEvent = Date.now() - (session.lastEventTime || session.sessionStartTime);
      const recencyWeight = Math.max(0.1, 1 - (timeSinceLastEvent / sessionTimeout));
      return { session, weight: recencyWeight * pattern.continuationWeight };
    });

    // Select based on weights
    const totalWeight = weightedSessions.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedSessions) {
      random -= item.weight;
      if (random <= 0) {
        return item.session;
      }
    }

    // Fallback to first session
    return weightedSessions[0].session;
  }

  // Get or create user session with attribution
  getOrCreateUserSession(userId = null) {
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    }

    let userSession = this.activeSessions.get(userId);
    
    if (userSession) {
      // Check if session has timed out
      const sessionTimeout = 20 * 60 * 1000; // 20 minutes
      const timeSinceLastEvent = Date.now() - (userSession.lastEventTime || userSession.sessionStartTime);
      
      if (timeSinceLastEvent > sessionTimeout) {
        console.log(`🔄 Starting new session for user ${userId} (timeout: ${Math.round(timeSinceLastEvent/60000)}min)`);
        // Create new session for existing user
        const newSessionId = Date.now();
        userSession.sessionId = newSessionId;
        userSession.sessionStartTime = Date.now();
        userSession.eventCount = 0;
        userSession.lastEventTime = null;
        
        // Keep user properties but reset session-specific data
        // Don't reset journey stage - users maintain progress across sessions
      }
      
      userSession.eventCount++;
      userSession.lastEventTime = Date.now();
      return userSession;
    }

    // Create new user with attribution data
    const attributionData = this.generateAttributionData();
    
    // Get user journey stages from config
    const userStages = this.config.userJourney?.stages || [
      { name: 'visitor', displayName: 'Visitor' },
      { name: 'active_user', displayName: 'Active User' }
    ];

    // New users start at first stage, or random stage for demo variety
    const randomStage = userStages[Math.floor(Math.random() * userStages.length)] || {
      name: 'active_user',
      displayName: 'Active User'
    };

    const session = {
      userId: userId,
      sessionId: Date.now(), // Numeric session ID as required by Amplitude
      deviceId: `device_${Math.random().toString(36).substr(2, 9)}`,
      platform: ['web', 'mobile', 'desktop'][Math.floor(Math.random() * 3)],
      sessionStartTime: Date.now(),
      eventCount: 1,
      currentJourneyStep: randomStage.name,
      attributionData: attributionData,
      userProperties: {
        journey_stage: randomStage.name,
        company_demo: this.config.company.name,
        industry: this.config.company.industry,
        signup_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        
        // A/B Testing Variants (Universal across all industries)
        ab_homepage_layout: ['control', 'variant_a', 'variant_b'][Math.floor(Math.random() * 3)],
        ab_checkout_flow: ['single_page', 'multi_step', 'express'][Math.floor(Math.random() * 3)],
        ab_cta_button: ['blue', 'green', 'orange'][Math.floor(Math.random() * 3)],
        ab_navigation_style: ['horizontal', 'sidebar', 'hamburger'][Math.floor(Math.random() * 3)],
        ab_onboarding_flow: ['guided_tour', 'progressive_disclosure', 'minimal'][Math.floor(Math.random() * 3)],
        
        // Feature Flags (Boolean - gradual rollout simulation)  
        ff_new_dashboard: Math.random() < 0.3, // 30% rollout
        ff_advanced_analytics: Math.random() < 0.3,
        ff_dark_mode: Math.random() < 0.3,
        ...attributionData
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

  // Generate realistic attribution data
  generateAttributionData() {
    const channels = ['organic', 'paid_search', 'social', 'email', 'direct', 'referral'];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    
    const attributionData = {
      initial_utm_source: channel,
      initial_utm_medium: channel === 'paid_search' ? 'cpc' : channel === 'social' ? 'social' : 'organic',
      initial_referrer: channel === 'referral' ? 'partner-site.com' : null,
      initial_landing_page: '/',
      acquisition_date: new Date().toISOString()
    };

    // Add campaign data for paid channels
    if (channel === 'paid_search') {
      attributionData.initial_utm_campaign = 'brand-keywords';
      attributionData.initial_utm_term = 'demo software';
    } else if (channel === 'social') {
      attributionData.initial_utm_campaign = 'social-engagement';
      attributionData.initial_utm_content = 'post-123';
    }

    return attributionData;
  }

  // Select event type based on user journey and scenario
  selectEventForUserJourney(scenarioConfig, userSession, industry) {
    if (!scenarioConfig || !scenarioConfig.events) {
      return 'page_view'; // Fallback
    }

    // Get events appropriate for user's current journey stage
    const userStage = userSession.currentJourneyStep;
    const stageEvents = scenarioConfig.events.filter(event => {
      // If event has journey stage requirements, check them
      if (event.journeyStages && event.journeyStages.length > 0) {
        return event.journeyStages.includes(userStage);
      }
      // If no stage requirements, event is available to all stages
      return true;
    });

    if (stageEvents.length === 0) {
      // Fallback to all events if no stage-specific events found
      return scenarioConfig.events[Math.floor(Math.random() * scenarioConfig.events.length)].name;
    }

    // Weight events by their probability (if specified)
    const weightedEvents = stageEvents.map(event => ({
      name: event.name,
      weight: event.probability || 1
    }));

    // Select event based on weights
    const totalWeight = weightedEvents.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const event of weightedEvents) {
      random -= event.weight;
      if (random <= 0) {
        return event.name;
      }
    }

    // Fallback
    return weightedEvents[0].name;
  }

  // Update user session after event
  updateUserSession(userSession, eventType) {
    // Track last event for sequencing
    userSession.lastEventType = eventType;
    userSession.lastEventTime = Date.now();

    // Simple progression logic - could be enhanced
    const stages = this.config.userJourney?.stages || [];
    const currentStageIndex = stages.findIndex(s => s.name === userSession.currentJourneyStep);

    // Chance to progress to next stage
    if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
      const currentStage = stages[currentStageIndex];
      const nextStage = stages[currentStageIndex + 1];
      
      // Calculate progression chance based on event type and stage
      let progressionChance = currentStage.conversionRate || 0.1;
      
      // Increase chance for key conversion events
      const conversionEvents = ['purchase', 'signup', 'subscribe', 'upgrade'];
      if (conversionEvents.some(ce => eventType.toLowerCase().includes(ce))) {
        progressionChance *= 3; // Triple the chance for conversion events
      }

      // Progress to next stage
      if (Math.random() < progressionChance) {
        console.log(`👤 User ${userSession.userId} progressed: ${currentStage.name} → ${nextStage.name}`);
        userSession.currentJourneyStep = nextStage.name;
        userSession.userProperties.journey_stage = nextStage.name;
      }
    }
  }

  // Utility method to capitalize industry names
  capitalizeIndustry(industry) {
    return industry.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
      console.log(`🌐 Demo Interface: http://localhost:${this.port}`);
      console.log(`🎯 Client Generator: http://localhost:${this.port}/generator`);
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