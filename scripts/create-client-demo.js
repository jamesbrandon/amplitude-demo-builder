#!/usr/bin/env node

// Client Demo Generator
// Creates a new client-specific demo app from the template

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ClientDemoGenerator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async generateClientDemo() {
    console.log('🎯 Amplitude Client Demo Generator\n');
    
    // Collect client information
    const clientInfo = await this.collectClientInfo();
    
    // Generate project structure
    const projectPath = await this.createProjectStructure(clientInfo);
    
    // Generate client-specific configuration (merge with industry template)
    await this.generateClientConfig(clientInfo, projectPath);
    
    // Generate custom event templates
    await this.generateEventTemplates(clientInfo, projectPath);
    
    // Generate deployment files
    await this.generateDeploymentFiles(clientInfo, projectPath);
    
    // Generate README
    await this.generateClientReadme(clientInfo, projectPath);
    
    console.log(`\n✅ Client demo created successfully!`);
    console.log(`📁 Project location: ${projectPath}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   cd ${path.basename(projectPath)}`);
    console.log(`   npm install`);
    console.log(`   npm start`);
    
    this.rl.close();
  }

  // Programmatic generation method for web interface
  async generateClientDemoFromConfig(clientConfig) {
    console.log(`🎯 Generating client demo for: ${clientConfig.clientName}`);
    
    // Convert web form data to internal format
    const clientInfo = {
      clientName: clientConfig.clientName,
      projectName: clientConfig.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-amplitude-demo',
      industry: clientConfig.industry,
      businessModel: clientConfig.businessModel,
      primaryEvents: clientConfig.primaryEvents,
      revenueModel: clientConfig.revenueModel,
      demoGoals: clientConfig.demoGoals,
      audienceLevel: clientConfig.audienceLevel,
      demoLength: clientConfig.demoLength,
      primaryColor: clientConfig.primaryColor,
      eventInterval: clientConfig.eventInterval,
      customProperties: clientConfig.customProperties,
      // Amplitude configuration
      amplitudeApiKey: clientConfig.amplitudeApiKey,
      amplitudeProjectName: clientConfig.amplitudeProjectName,
      amplitudeEnvironment: clientConfig.amplitudeEnvironment,
      // Backfill configuration
      enableBackfill: clientConfig.enableBackfill,
      backfillDays: clientConfig.backfillDays,
      usersPerDay: clientConfig.usersPerDay,
      eventsPerUser: clientConfig.eventsPerUser,
      backfillMode: clientConfig.backfillMode
    };
    
    // Generate project structure
    const projectPath = await this.createProjectStructure(clientInfo);
    
    // Generate all components
    await this.generateClientConfig(clientInfo, projectPath);
    await this.generateEventTemplates(clientInfo, projectPath);
    await this.generateDeploymentFiles(clientInfo, projectPath);
    await this.generateClientReadme(clientInfo, projectPath);
    await this.generateWebInterface(clientInfo, projectPath);
    
    // Create package.json for the new project
    await this.generatePackageJson(clientInfo, projectPath);
    
    console.log(`✅ Client demo generated: ${projectPath}`);
    
    return {
      projectName: clientInfo.projectName,
      projectPath: projectPath,
      clientName: clientInfo.clientName
    };
  }

  async collectClientInfo() {
    const { getIndustryTemplate, getAllIndustries, getRecommendedConfig } = require('../src/generators/industry-templates');
    const info = {};
    
    info.clientName = await this.ask('Client/Company name: ');
    info.projectName = info.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-amplitude-demo';
    
    // Show industry options with descriptions
    console.log('\n🏭 Available Industries:');
    const industries = getAllIndustries();
    industries.forEach((industry, index) => {
      console.log(`${index + 1}. ${industry.displayName} - ${industry.description}`);
    });
    console.log(`${industries.length + 1}. Custom Industry`);
    
    const industryChoice = await this.ask(`\nSelect industry (1-${industries.length + 1}): `);
    const industryIndex = parseInt(industryChoice) - 1;
    
    if (industryIndex >= 0 && industryIndex < industries.length) {
      info.industry = industries[industryIndex].value;
      const template = getIndustryTemplate(info.industry);
      
      console.log(`\n✅ Selected: ${template.displayName}`);
      console.log(`📝 ${template.description}`);
      
      // Show recommended configuration
      const recommended = getRecommendedConfig(info.industry);
      console.log(`\n💡 Recommended configuration for ${template.displayName}:`);
      console.log(`   Business Model: ${template.businessModels.find(bm => bm.value === recommended.businessModel)?.label}`);
      console.log(`   Revenue Model: ${template.revenueModels.find(rm => rm.value === recommended.revenueModel)?.label}`);
      console.log(`   Default Events: ${recommended.defaultEvents.join(', ')}`);
      
      const useRecommended = await this.askChoice('\nUse recommended configuration?', ['yes', 'no']);
      
      if (useRecommended === 'yes') {
        info.businessModel = recommended.businessModel;
        info.revenueModel = recommended.revenueModel;
        info.primaryEvents = recommended.defaultEvents.join(', ');
        console.log('✅ Using recommended configuration');
      } else {
        // Manual selection with industry-specific options
        console.log('\n📋 Business Model Options:');
        template.businessModels.forEach((model, index) => {
          console.log(`${index + 1}. ${model.label}${model.recommended ? ' (Recommended)' : ''}`);
        });
        const bmChoice = await this.ask(`Select business model (1-${template.businessModels.length}): `);
        const bmIndex = parseInt(bmChoice) - 1;
        info.businessModel = template.businessModels[bmIndex]?.value || template.businessModels[0].value;
        
        console.log('\n💰 Revenue Model Options:');
        template.revenueModels.forEach((model, index) => {
          console.log(`${index + 1}. ${model.label}${model.recommended ? ' (Recommended)' : ''}`);
        });
        const rmChoice = await this.ask(`Select revenue model (1-${template.revenueModels.length}): `);
        const rmIndex = parseInt(rmChoice) - 1;
        info.revenueModel = template.revenueModels[rmIndex]?.value || template.revenueModels[0].value;
        
        console.log('\n📊 Suggested Events:');
        console.log(`Default: ${template.defaultEvents.join(', ')}`);
        console.log(`Additional: ${template.suggestedEvents.join(', ')}`);
        const useDefaultEvents = await this.askChoice('Use default events?', ['yes', 'custom']);
        
        if (useDefaultEvents === 'yes') {
          info.primaryEvents = template.defaultEvents.join(', ');
        } else {
          info.primaryEvents = await this.ask('Key events to track (comma-separated): ');
        }
      }
      
    } else if (industryIndex === industries.length) {
      info.industry = 'custom';
      info.customIndustry = await this.ask('Custom industry description: ');
      
      // Fallback to generic options for custom industry
      info.businessModel = await this.askChoice('Business model:', [
        'b2c', 'b2b', 'marketplace', 'subscription', 'freemium', 'enterprise'
      ]);
      
      info.primaryEvents = await this.ask('Key events to track (comma-separated): ');
      info.revenueModel = await this.askChoice('Revenue model:', [
        'subscription', 'one_time_purchase', 'advertising', 'commission', 'freemium'
      ]);
    } else {
      console.log('Invalid selection, using SaaS as default');
      info.industry = 'saas';
      const recommended = getRecommendedConfig('saas');
      info.businessModel = recommended.businessModel;
      info.revenueModel = recommended.revenueModel;
      info.primaryEvents = recommended.defaultEvents.join(', ');
    }
    
    // Demo objectives with industry-specific suggestions
    if (info.industry !== 'custom') {
      const template = getIndustryTemplate(info.industry);
      if (template) {
        console.log('\n🎯 Common demo objectives for your industry:');
        template.demoObjectives.forEach((objective, index) => {
          console.log(`${index + 1}. ${objective}`);
        });
        const useObjective = await this.askChoice('Use a suggested objective?', ['yes', 'custom']);
        
        if (useObjective === 'yes') {
          const objChoice = await this.ask(`Select objective (1-${template.demoObjectives.length}): `);
          const objIndex = parseInt(objChoice) - 1;
          info.demoGoals = template.demoObjectives[objIndex] || template.demoObjectives[0];
        } else {
          info.demoGoals = await this.ask('Demo objectives (what to showcase): ');
        }
      } else {
        info.demoGoals = await this.ask('Demo objectives (what to showcase): ');
      }
    } else {
      info.demoGoals = await this.ask('Demo objectives (what to showcase): ');
    }
    info.audienceLevel = await this.askChoice('Audience technical level:', [
      'executive', 'marketing', 'product', 'technical', 'mixed'
    ]);
    
    // Amplitude configuration
    console.log('\n📊 Amplitude Configuration (Optional)');
    info.amplitudeApiKey = await this.ask('Amplitude API Key (leave blank for demo mode): ');
    if (info.amplitudeApiKey) {
      info.amplitudeProjectName = await this.ask('Amplitude Project Name: ');
      info.amplitudeEnvironment = await this.askChoice('Environment:', [
        'development', 'staging', 'production'
      ]);
    } else {
      info.amplitudeProjectName = `${info.clientName} Demo Project`;
      info.amplitudeEnvironment = 'demo';
    }

    // Demo type configuration
    console.log('\n🎯 Demo Configuration');
    console.log('Choose the type of demo you want to create:');
    console.log('1. 📊 Analytics Demo (Recommended) - Historical data + real-time events');
    console.log('2. 🎬 Live Presentation Only - Real-time events only');
    console.log('3. 📈 Data Analysis Focus - Extensive historical data');
    console.log('4. ⚙️ Custom Configuration - Manual setup');
    
    const demoTypeChoice = await this.ask('Select demo type (1-4): ');
    const demoTypeIndex = parseInt(demoTypeChoice) - 1;
    
    const demoTypes = ['analytics_demo', 'live_presentation', 'data_analysis', 'custom'];
    info.demoType = demoTypes[demoTypeIndex] || 'analytics_demo';
    
    // Configure based on demo type
    switch (info.demoType) {
      case 'analytics_demo':
        console.log('✅ Analytics Demo: Perfect for client meetings with rich historical data and live events');
        info.enableBackfill = true;
        info.backfillDays = 60;
        info.usersPerDay = 20;
        info.eventsPerUser = 15;
        info.backfillMode = 'immediate';
        info.eventInterval = 4000;
        info.enableRealTime = true;
        break;
        
      case 'live_presentation':
        console.log('✅ Live Presentation: Real-time events only, perfect for live demos');
        info.enableBackfill = false;
        info.eventInterval = 3000;
        info.enableRealTime = true;
        break;
        
      case 'data_analysis':
        console.log('✅ Data Analysis: Extensive historical data for deep analytics');
        info.enableBackfill = true;
        info.backfillDays = 90;
        info.usersPerDay = 30;
        info.eventsPerUser = 20;
        info.backfillMode = 'immediate';
        info.eventInterval = 8000;
        info.enableRealTime = true;
        break;
        
      case 'custom':
        console.log('✅ Custom Configuration: Manual setup');
        // Historical data backfill
        console.log('\n📈 Historical Data Configuration');
        const enableBackfill = await this.askChoice('Generate historical data?', ['yes', 'no']);
        info.enableBackfill = enableBackfill === 'yes';
        break;
        
      default:
        info.enableBackfill = true;
        info.eventInterval = 4000;
        info.enableRealTime = true;
    }
    
    // Only ask detailed questions for custom configuration
    if (info.demoType === 'custom' && info.enableBackfill) {
      if (!info.amplitudeApiKey) {
        console.log('⚠️ Warning: Historical data requires an Amplitude API key');
      }
      
      info.backfillDays = parseInt(await this.askChoice('Days of history:', ['14', '30', '60', '90']));
      info.usersPerDay = parseInt(await this.ask('Users per day (5-50): ')) || 15;
      info.eventsPerUser = parseInt(await this.ask('Events per user (5-30): ')) || 12;
      info.backfillMode = await this.askChoice('When to generate:', [
        'immediate', 'on_start', 'manual'
      ]);
    }
    
    // Show configuration summary
    if (info.enableBackfill) {
      const totalEvents = info.backfillDays * info.usersPerDay * info.eventsPerUser;
      console.log(`📊 Historical data: ${info.backfillDays} days, ${totalEvents.toLocaleString()} events`);
    }
    
    if (info.enableRealTime !== false) {
      console.log(`🎬 Real-time events: Every ${info.eventInterval || 4000}ms`);
    }
    
    return info;
  }

  async createProjectStructure(clientInfo) {
    const projectPath = path.join(process.cwd(), '..', clientInfo.projectName);
    
    // Create directory structure
    const dirs = [
      '',
      'src/amplitude',
      'src/generators', 
      'src/server',
      'config',
      'public',
      'public/assets',
      'scripts',
      'docs'
    ];
    
    for (const dir of dirs) {
      const fullPath = path.join(projectPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
    
    // Copy core template files
    await this.copyTemplateFiles(projectPath);
    
    // Generate custom server file
    await this.generateCustomServer(clientInfo, projectPath);
    
    return projectPath;
  }

  async copyTemplateFiles(projectPath) {
    const templatePath = process.cwd();
    
    // Files to copy directly
    const filesToCopy = [
      'src/amplitude/amplitude-client.js',
      'src/amplitude/amplitude-client-v2.js',
      'src/amplitude/amplitude-batch-client.js',
      'src/generators/event-generator.js',
      'src/generators/objective-based-generation.js',
      'src/generators/industry-templates.js',
      'src/server/config-loader.js',
      'config/demo-config.json',
      'package.json',
      '.gitignore',
      'LICENSE'
    ];
    
    for (const file of filesToCopy) {
      const sourcePath = path.join(templatePath, file);
      const destPath = path.join(projectPath, file);
      
      if (fs.existsSync(sourcePath)) {
        const content = fs.readFileSync(sourcePath, 'utf8');
        
        // Create directory if it doesn't exist
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.writeFileSync(destPath, content);
      }
    }
  }

  async generateClientConfig(clientInfo, projectPath) {
    // Load industry template if available
    this.industryTemplate = {};
    try {
      const industryConfigPath = path.join(__dirname, `../examples/${clientInfo.industry}-config.json`);
      if (fs.existsSync(industryConfigPath)) {
        const industryContent = fs.readFileSync(industryConfigPath, 'utf8');
        this.industryTemplate = JSON.parse(industryContent);
        console.log(`📋 Loaded ${clientInfo.industry} industry template`);
      }
    } catch (error) {
      console.log(`⚠️ Could not load industry template: ${error.message}`);
    }

    const config = {
      company: {
        name: clientInfo.clientName,
        industry: clientInfo.industry === 'custom' ? clientInfo.customIndustry : clientInfo.industry,
        businessModel: clientInfo.businessModel,
        website: `https://${clientInfo.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        description: `${clientInfo.clientName} - Amplitude Analytics Demo`
      },
      
      branding: {
        primaryColor: this.getIndustryColor(clientInfo.industry),
        secondaryColor: "#64748b",
        clientLogo: "/assets/client-logo.png"
      },
      
      amplitude: {
        apiKey: clientInfo.amplitudeApiKey || null,
        projectName: clientInfo.amplitudeProjectName || `${clientInfo.clientName} Demo Project`,
        environment: clientInfo.amplitudeEnvironment || 'demo',
        configured: !!clientInfo.amplitudeApiKey
      },

      historicalData: {
        enabled: !!clientInfo.enableBackfill,
        daysBack: clientInfo.backfillDays || 30,
        usersPerDay: clientInfo.usersPerDay || 15,
        eventsPerUser: clientInfo.eventsPerUser || 12,
        mode: clientInfo.backfillMode || 'immediate',
        estimatedEvents: (clientInfo.backfillDays || 30) * (clientInfo.usersPerDay || 15) * (clientInfo.eventsPerUser || 12)
      },
      
      demoContext: {
        objectives: clientInfo.demoGoals,
        audienceLevel: clientInfo.audienceLevel,
        keyMetrics: this.getKeyMetrics(clientInfo.industry, clientInfo.businessModel),
        demoScenarios: this.getDemoScenarios(clientInfo)
      },
      
      scenarios: this.generateScenarios(clientInfo),
      userJourney: this.generateUserJourney(clientInfo),
      products: this.generateProducts(clientInfo),
      attribution: this.generateAttribution(clientInfo),
      
      // Demo objectives for event generation optimization
      demoObjectives: clientInfo.demoGoals,
      
      simulation: {
        eventInterval: clientInfo.eventInterval || 4000,
        userSessionDuration: 1800000,
        maxConcurrentUsers: 30,
        eventVariation: 0.25
      },

      // Merge industry-specific content (like contentLibrary for media)
      ...(industryTemplate.contentLibrary && { contentLibrary: industryTemplate.contentLibrary }),
      
      // Use industry-specific configurations (methods now handle this internally)
      scenarios: this.generateScenarios(clientInfo),
      userJourney: this.generateUserJourney(clientInfo),
      products: this.generateProducts(clientInfo),
      attribution: this.generateAttribution(clientInfo)
    };
    
    const configPath = path.join(projectPath, 'config', 'client-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return config;
  }

  generateScenarios(clientInfo) {
    // Try to use industry-specific scenarios from loaded template
    if (this.industryTemplate && this.industryTemplate.scenarios) {
      console.log(`📋 Using ${clientInfo.industry} industry scenarios`);
      return this.industryTemplate.scenarios;
    }
    
    // Fallback to generic scenarios only if no industry template available
    console.log(`⚠️ No industry template found, using generic scenarios`);
    const events = clientInfo.primaryEvents.split(',').map(e => e.trim());
    
    const scenarios = {
      core_business: {
        name: "Core Business Flow",
        description: `Primary ${clientInfo.clientName} user journey`,
        weight: 0.5,
        events: events.slice(0, Math.min(5, events.length))
      },
      
      acquisition: {
        name: "User Acquisition",
        description: "New user onboarding and activation",
        weight: 0.3,
        events: ["Page Viewed", "User Signup", "Onboarding Started", "First Action Completed"]
      },
      
      retention: {
        name: "User Retention",
        description: "Engagement and retention activities", 
        weight: 0.2,
        events: ["Feature Used", "Content Consumed", "Settings Updated", "Help Accessed"]
      }
    };
    
    // Add revenue scenario if applicable
    if (clientInfo.revenueModel !== 'advertising') {
      scenarios.revenue = {
        name: "Revenue Events",
        description: "Purchase and monetization flow",
        weight: 0.15,
        events: this.getRevenueEvents(clientInfo.revenueModel)
      };
    }
    
    return scenarios;
  }

  generateUserJourney(clientInfo) {
    // Try to use industry-specific user journey from loaded template
    if (this.industryTemplate && this.industryTemplate.userJourney) {
      console.log(`📋 Using ${clientInfo.industry} industry user journey`);
      return this.industryTemplate.userJourney;
    }
    
    // Fallback to generic stages only if no industry template available
    console.log(`⚠️ No industry template found, using generic user journey`);
    const stages = [
      {
        name: "visitor",
        displayName: "Anonymous Visitor", 
        duration: "0-1 sessions",
        conversionRate: 0.12,
        events: ["Page Viewed", "Content Viewed", "CTA Clicked"]
      },
      {
        name: "prospect",
        displayName: "Interested Prospect",
        duration: "1-3 sessions", 
        conversionRate: 0.25,
        events: ["User Signup", "Demo Requested", "Content Downloaded"]
      },
      {
        name: "active_user",
        displayName: "Active User",
        duration: "1+ weeks",
        conversionRate: 0.60,
        events: ["Feature Used", "Goal Completed", "Value Realized"]
      }
    ];
    
    // Add business-model specific stages
    if (clientInfo.businessModel === 'subscription' || clientInfo.businessModel === 'freemium') {
      stages.push({
        name: "paying_customer",
        displayName: "Paying Customer", 
        duration: "1+ months",
        conversionRate: 0.85,
        events: ["Subscription Purchased", "Advanced Feature Used", "Renewal Completed"]
      });
    }
    
    return { stages };
  }

  generateProducts(clientInfo) {
    // Try to use industry-specific products from loaded template
    if (this.industryTemplate && this.industryTemplate.products) {
      console.log(`📋 Using ${clientInfo.industry} industry products`);
      return this.industryTemplate.products;
    }
    
    // Fallback to generic products
    console.log(`⚠️ No industry template found, using generic products`);
    const products = [];
    
    if (clientInfo.revenueModel === 'subscription') {
      products.push(
        {
          id: "basic_plan",
          name: "Basic Plan",
          category: "subscription",
          price: 29.99,
          currency: "USD"
        },
        {
          id: "pro_plan", 
          name: "Professional Plan",
          category: "subscription",
          price: 99.99,
          currency: "USD"
        }
      );
    } else if (clientInfo.industry === 'ecommerce') {
      products.push(
        {
          id: "product_001",
          name: "Featured Product",
          category: "merchandise",
          price: 49.99,
          currency: "USD"
        }
      );
    }
    
    return products;
  }

  generateAttribution(clientInfo) {
    // Try to use industry-specific attribution from loaded template
    if (this.industryTemplate && this.industryTemplate.attribution) {
      console.log(`📋 Using ${clientInfo.industry} industry attribution`);
      return this.industryTemplate.attribution;
    }
    
    // Fallback to generic attribution
    console.log(`⚠️ No industry template found, using generic attribution`);
    const sources = [
      {
        utm_source: "google",
        utm_medium: "cpc", 
        utm_campaign: "brand_search",
        weight: 0.25
      },
      {
        utm_source: "organic",
        utm_medium: "organic",
        utm_campaign: null,
        weight: 0.30
      }
    ];
    
    // Add industry-specific sources
    if (clientInfo.businessModel === 'b2b') {
      sources.push({
        utm_source: "linkedin",
        utm_medium: "social",
        utm_campaign: "b2b_targeting", 
        weight: 0.20
      });
    } else {
      sources.push({
        utm_source: "facebook",
        utm_medium: "social",
        utm_campaign: "lookalike_audience",
        weight: 0.20
      });
    }
    
    return { sources };
  }

  async generateEventTemplates(clientInfo, projectPath) {
    const events = clientInfo.primaryEvents.split(',').map(e => e.trim());
    
    const templateContent = `// ${clientInfo.clientName} Event Generator
// Custom event templates for client-specific demo

const { EventGenerator } = require('../../src/generators/event-generator');

class ${this.toPascalCase(clientInfo.clientName)}EventGenerator extends EventGenerator {
  
  getIndustrySpecificTemplates() {
    return {
${events.map(event => this.generateEventTemplate(event, clientInfo)).join(',\n\n')}
    };
  }
  
  // Client-specific helper methods
  ${this.generateHelperMethods(clientInfo)}
}

module.exports = { ${this.toPascalCase(clientInfo.clientName)}EventGenerator };
`;
    
    const templatePath = path.join(projectPath, 'src', 'generators', 'client-event-generator.js');
    fs.writeFileSync(templatePath, templateContent);
  }

  generateEventTemplate(eventName, clientInfo) {
    const methodName = eventName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    return `      '${eventName}': (userSession, config) => ({
        // Event-specific properties for ${eventName}
        event_category: '${this.getEventCategory(eventName)}',
        user_stage: userSession.userProperties.journey_stage,
        platform: userSession.platform,
        
        // Add ${clientInfo.clientName}-specific properties here
        client_context: '${clientInfo.clientName.toLowerCase()}',
        business_model: '${clientInfo.businessModel}',
        
        // Example properties (customize based on event)
        ${this.getExampleProperties(eventName, clientInfo)}
      })`;
  }

  getExampleProperties(eventName, clientInfo) {
    if (eventName.toLowerCase().includes('purchase') || eventName.toLowerCase().includes('buy')) {
      return `amount: Math.floor(Math.random() * 200) + 50,
        currency: 'USD',
        $revenue: Math.floor(Math.random() * 200) + 50`;
    } else if (eventName.toLowerCase().includes('signup') || eventName.toLowerCase().includes('register')) {
      return `signup_method: 'email',
        terms_accepted: true,
        newsletter_opted_in: Math.random() > 0.6`;
    } else {
      return `action_value: Math.floor(Math.random() * 100) + 1,
        session_duration: Math.floor(Math.random() * 300) + 60`;
    }
  }

  async generateDeploymentFiles(clientInfo, projectPath) {
    // Generate environment file
    const envFile = `# ${clientInfo.clientName} - Amplitude Demo Configuration

# Amplitude Configuration
AMPLITUDE_API_KEY=${clientInfo.amplitudeApiKey || 'your_amplitude_api_key_here'}
AMPLITUDE_PROJECT_NAME=${clientInfo.amplitudeProjectName || clientInfo.clientName + ' Demo Project'}
AMPLITUDE_ENVIRONMENT=${clientInfo.amplitudeEnvironment || 'demo'}

# Server Configuration  
DEMO_PORT=3001
NODE_ENV=production

# Demo Settings
DEMO_INDUSTRY=${clientInfo.industry}
DEFAULT_SCENARIO=core_business
EVENT_INTERVAL=${clientInfo.eventInterval || 4000}

# Client Branding
CLIENT_NAME=${clientInfo.clientName}
PRIMARY_COLOR=${clientInfo.primaryColor || '#2563eb'}

# Demo Context
DEMO_OBJECTIVES=${clientInfo.demoGoals}
AUDIENCE_LEVEL=${clientInfo.audienceLevel}
`;

    fs.writeFileSync(path.join(projectPath, '.env'), envFile);
    fs.writeFileSync(path.join(projectPath, '.env.example'), envFile.replace(clientInfo.amplitudeApiKey || 'your_amplitude_api_key_here', 'your_amplitude_api_key_here'));

    // Generate Docker files for easy deployment
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV DEMO_PORT=3001

CMD ["npm", "start"]
`;

    const dockerCompose = `version: '3.8'

services:
  ${clientInfo.projectName}:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DEMO_PORT=3001
      - AMPLITUDE_API_KEY=\${AMPLITUDE_API_KEY}
      - AMPLITUDE_PROJECT_NAME=\${AMPLITUDE_PROJECT_NAME}
      - AMPLITUDE_ENVIRONMENT=\${AMPLITUDE_ENVIRONMENT}
      - CLIENT_NAME=${clientInfo.clientName}
      - PRIMARY_COLOR=${clientInfo.primaryColor || '#2563eb'}
    restart: unless-stopped
    volumes:
      - ./.env:/app/.env:ro
`;

    fs.writeFileSync(path.join(projectPath, 'Dockerfile'), dockerfile);
    fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
  }

  async generateClientReadme(clientInfo, projectPath) {
    const readme = `# ${clientInfo.clientName} - Amplitude Demo

Custom Amplitude analytics demonstration for ${clientInfo.clientName}.

## Demo Objectives

${clientInfo.demoGoals}

## Key Features

- **Industry**: ${clientInfo.industry}
- **Business Model**: ${clientInfo.businessModel}
- **Revenue Model**: ${clientInfo.revenueModel}
- **Target Audience**: ${clientInfo.audienceLevel}
${clientInfo.enableBackfill ? `- **Historical Data**: ${clientInfo.backfillDays} days of backfilled events (${(clientInfo.backfillDays * clientInfo.usersPerDay * clientInfo.eventsPerUser).toLocaleString()} events)` : ''}

## Quick Start

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure Amplitude** (Choose one option)
   
   **Option A: Use Pre-configured API Key**
   ${clientInfo.amplitudeApiKey ? `✅ Already configured with API key: ${clientInfo.amplitudeApiKey.substring(0, 8)}...` : '⚠️ No API key provided - running in demo mode'}
   
   **Option B: Update API Key**
   Edit \`.env\` file and update:
   \`\`\`
   AMPLITUDE_API_KEY=your_actual_api_key_here
   AMPLITUDE_PROJECT_NAME=${clientInfo.amplitudeProjectName}
   AMPLITUDE_ENVIRONMENT=${clientInfo.amplitudeEnvironment}
   \`\`\`
   
   **Option C: Demo Mode**
   Leave API key blank to run without sending real events to Amplitude

3. **Start the demo**
   \`\`\`bash
   npm start
   \`\`\`

4. **Open browser**
   Navigate to \`http://localhost:3001\`
   
5. **Verify Amplitude Connection**
   - Click "🧪 Test Amplitude" in the demo interface
   - Check your Amplitude project for incoming events

## Key Events Tracked

${clientInfo.primaryEvents.split(',').map(e => `- ${e.trim()}`).join('\n')}

## Customization

### Adding New Events
Edit \`src/generators/client-event-generator.js\` to add ${clientInfo.clientName}-specific events.

### Modifying User Journey
Update \`config/client-config.json\` to adjust user progression stages.

### Branding
Replace \`public/assets/client-logo.png\` with ${clientInfo.clientName}'s logo.

## Deployment

### Docker
\`\`\`bash
docker-compose up -d
\`\`\`

### Manual
\`\`\`bash
npm run start
\`\`\`

---

*Generated by Amplitude Demo Template Generator*
`;

    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
  }

  async generateWebInterface(clientInfo, projectPath) {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clientInfo.clientName} - Amplitude Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, ${clientInfo.primaryColor || '#2563eb'}, #1d4ed8);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: ${clientInfo.primaryColor || '#2563eb'};
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5rem;
        }
        .content {
            padding: 40px;
        }
        .demo-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
        }
        .btn {
            background: ${clientInfo.primaryColor || '#2563eb'};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        }
        .btn:hover {
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: ${clientInfo.primaryColor || '#2563eb'};
        }
        .events-log {
            background: #1f2937;
            color: #e5e7eb;
            padding: 20px;
            border-radius: 8px;
            height: 300px;
            overflow-y: auto;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${clientInfo.clientName}</h1>
            <p>Amplitude Analytics Demo - ${clientInfo.industry} Industry</p>
        </div>
        
        <div class="content">
            <div class="demo-section">
                <h2>Demo Configuration</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <h4>📊 Amplitude Setup</h4>
                        <p><strong>Project:</strong> ${clientInfo.amplitudeProjectName}</p>
                        <p><strong>Environment:</strong> ${clientInfo.amplitudeEnvironment}</p>
                        <p><strong>API Key:</strong> ${clientInfo.amplitudeApiKey ? '✅ Configured' : '⚠️ Demo Mode'}</p>
                    </div>
                    <div>
                        <h4>🎯 Demo Details</h4>
                        <p><strong>Industry:</strong> ${clientInfo.industry}</p>
                        <p><strong>Business Model:</strong> ${clientInfo.businessModel}</p>
                        <p><strong>Audience:</strong> ${clientInfo.audienceLevel}</p>
                    </div>
                </div>
                
                <h3>Demo Objectives</h3>
                <p>${clientInfo.demoGoals}</p>
                
                <h3>Key Events Being Tracked:</h3>
                <ul>
                    ${clientInfo.primaryEvents.split(',').map(e => `<li>${e.trim()}</li>`).join('')}
                </ul>
            </div>

            <div class="demo-section">
                <h2>Demo Controls</h2>
                <button class="btn" onclick="startDemo()">🚀 Start Demo</button>
                <button class="btn" onclick="stopDemo()">⏹️ Stop Demo</button>
                <button class="btn" onclick="triggerEvent()">⚡ Trigger Event</button>
                <button class="btn" onclick="testAmplitude()">🧪 Test Amplitude</button>
                ${clientInfo.enableBackfill ? '<button class="btn" onclick="generateHistoricalData()" id="backfillBtn">📈 Generate Historical Data</button>' : ''}
            </div>

            <div class="demo-section">
                <h2>Live Statistics</h2>
                <div class="stats" id="stats">
                    <div class="stat-card">
                        <div class="stat-number" id="totalEvents">0</div>
                        <div>Total Events</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="activeUsers">0</div>
                        <div>Active Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="revenue">$0</div>
                        <div>Revenue</div>
                    </div>
                </div>
            </div>

            <div class="demo-section">
                <h2>Live Events</h2>
                <div class="events-log" id="eventsLog">
                    Waiting for events...
                </div>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let isRunning = false;

        // Connect to WebSocket
        socket.on('connect', () => {
            console.log('Connected to demo server');
        });

        socket.on('demo-status', (data) => {
            updateStats(data.stats);
        });

        socket.on('live-event', (event) => {
            logEvent(event);
        });

        function startDemo() {
            fetch('/api/demo/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: 'core_business' })
            }).then(() => {
                isRunning = true;
                logMessage('✅ Demo started');
            });
        }

        function stopDemo() {
            fetch('/api/demo/stop', { method: 'POST' })
            .then(() => {
                isRunning = false;
                logMessage('⏹️ Demo stopped');
            });
        }

        function triggerEvent() {
            const events = [${clientInfo.primaryEvents.split(',').map(e => `"${e.trim()}"`).join(', ')}];
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            
            fetch('/api/events/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventType: randomEvent })
            }).then(() => {
                logMessage(\`⚡ Triggered: \${randomEvent}\`);
            });
        }

        function testAmplitude() {
            fetch('/api/test-amplitude', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    logMessage('🧪 Amplitude connection: SUCCESS');
                    logMessage(\`   Project: ${clientInfo.amplitudeProjectName}\`);
                    logMessage(\`   Environment: ${clientInfo.amplitudeEnvironment}\`);
                } else {
                    logMessage('❌ Amplitude connection: FAILED');
                    logMessage('   Check API key configuration in .env file');
                }
            });
        }

        ${clientInfo.enableBackfill ? `
        function generateHistoricalData() {
            const btn = document.getElementById('backfillBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Generating...';
            
            logMessage('🔄 Starting historical data generation...');
            logMessage(\`   Days: ${clientInfo.backfillDays}\`);
            logMessage(\`   Users per day: ${clientInfo.usersPerDay}\`);
            logMessage(\`   Events per user: ${clientInfo.eventsPerUser}\`);
            logMessage(\`   Estimated total: ${(clientInfo.backfillDays * clientInfo.usersPerDay * clientInfo.eventsPerUser).toLocaleString()} events\`);
            
            fetch('/api/backfill/generate', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    logMessage('✅ Historical data generation complete!');
                    logMessage(\`   Total events: \${data.totalEvents?.toLocaleString() || 'Unknown'}\`);
                    logMessage(\`   Users generated: \${data.usersGenerated?.toLocaleString() || 'Unknown'}\`);
                    logMessage(\`   Days generated: \${data.daysGenerated || 'Unknown'}\`);
                } else {
                    logMessage('❌ Historical data generation failed');
                    logMessage(\`   Error: \${data.error || 'Unknown error'}\`);
                }
                
                btn.disabled = false;
                btn.textContent = '📈 Generate Historical Data';
            })
            .catch(error => {
                logMessage('❌ Network error during historical data generation');
                logMessage(\`   Error: \${error.message}\`);
                btn.disabled = false;
                btn.textContent = '📈 Generate Historical Data';
            });
        }` : ''}

        function updateStats(stats) {
            if (stats) {
                document.getElementById('totalEvents').textContent = stats.total_events || 0;
                document.getElementById('activeUsers').textContent = stats.unique_users || 0;
                document.getElementById('revenue').textContent = '$' + (stats.total_revenue || 0).toFixed(2);
            }
        }

        function logEvent(event) {
            const log = document.getElementById('eventsLog');
            const timestamp = new Date().toLocaleTimeString();
            const message = \`[\${timestamp}] \${event.event_type} - User: \${event.user_id}\`;
            log.innerHTML += message + '\\n';
            log.scrollTop = log.scrollHeight;
        }

        function logMessage(message) {
            const log = document.getElementById('eventsLog');
            const timestamp = new Date().toLocaleTimeString();
            log.innerHTML += \`[\${timestamp}] \${message}\\n\`;
            log.scrollTop = log.scrollHeight;
        }

        // Load initial stats
        fetch('/api/stats')
        .then(response => response.json())
        .then(updateStats);
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(projectPath, 'public', 'index.html'), indexHtml);
  }

  async generatePackageJson(clientInfo, projectPath) {
    const packageJson = {
      name: clientInfo.projectName,
      version: "1.0.0",
      description: `Custom Amplitude analytics demonstration for ${clientInfo.clientName}`,
      main: "src/server/demo-server.js",
      scripts: {
        start: "node src/server/demo-server.js",
        dev: "nodemon src/server/demo-server.js",
        test: "echo \"No tests specified\" && exit 0"
      },
      keywords: [
        "amplitude",
        "analytics", 
        "demo",
        clientInfo.industry,
        clientInfo.clientName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      ],
      author: {
        name: "Amplitude Demo Generator",
        email: "demo@amplitude.com"
      },
      license: "MIT",
      dependencies: {
        "@amplitude/analytics-node": "^1.3.5",
        "cors": "^2.8.5",
        "dotenv": "^16.6.1",
        "express": "^4.21.2",
        "socket.io": "^4.8.1",
        "uuid": "^9.0.1"
      },
      devDependencies: {
        "nodemon": "^3.0.2"
      },
      engines: {
        node: ">=16.0.0",
        npm: ">=8.0.0"
      }
    };

    fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  async generateCustomServer(clientInfo, projectPath) {
    const serverContent = `// ${clientInfo.clientName} - Custom Amplitude Demo Server
// Auto-generated with client-specific configuration

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { getConfigLoader } = require('./config-loader');
const { EventGenerator } = require('../generators/event-generator');
const { getAmplitudeClient, createNewAmplitudeClient } = require('../amplitude/amplitude-client');
const { AmplitudeBatchClient } = require('../amplitude/amplitude-batch-client');

class ${this.toPascalCase(clientInfo.clientName)}DemoServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });

    this.port = process.env.DEMO_PORT || 3001;
    this.clientName = process.env.CLIENT_NAME || '${clientInfo.clientName}';
    
    // Load client-specific configuration
    this.configLoader = getConfigLoader();
    this.loadConfiguration();

    // Initialize Amplitude with client API key
    this.initializeAmplitude();

    // Initialize components
    this.eventGenerator = new EventGenerator();
    this.batchClient = new AmplitudeBatchClient();
    
    // Apply objective-based modifications
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

    console.log(\`🎯 \${this.clientName} Demo Server initialized\`);
    console.log(\`📊 Industry: \${this.config.company.industry}\`);
    console.log(\`🎨 Scenarios: \${Object.keys(this.config.scenarios).join(', ')}\`);
  }

  initializeAmplitude() {
    const apiKey = process.env.AMPLITUDE_API_KEY;
    const projectName = process.env.AMPLITUDE_PROJECT_NAME || '${clientInfo.amplitudeProjectName}';
    const environment = process.env.AMPLITUDE_ENVIRONMENT || '${clientInfo.amplitudeEnvironment}';
    
    if (apiKey && apiKey !== 'your_amplitude_api_key_here') {
      console.log(\`🔑 Initializing Amplitude for \${projectName} (\${environment})\`);
      console.log(\`   API Key: \${apiKey.substring(0, 8)}...\`);
      this.amplitudeClient = createNewAmplitudeClient();
    } else {
      console.log('⚠️ Running in demo mode - no Amplitude API key configured');
      this.amplitudeClient = getAmplitudeClient();
    }
  }

  loadConfiguration() {
    try {
      // Load the client-specific configuration using the config loader
      this.config = this.configLoader.loadConfig('./config/client-config.json');
      console.log(\`✅ Loaded \${this.clientName} configuration\`);
    } catch (error) {
      console.error('❌ Failed to load client configuration:', error.message);
      // Fallback to base config
      this.config = this.configLoader.loadConfig();
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(\`\${req.method} \${req.path}\`);
      next();
    });
  }

  setupRoutes() {
    // Health check with client info
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        client: this.clientName,
        company: this.config.company.name,
        industry: this.config.company.industry,
        amplitude_configured: !!process.env.AMPLITUDE_API_KEY && process.env.AMPLITUDE_API_KEY !== 'your_amplitude_api_key_here',
        amplitude_project: process.env.AMPLITUDE_PROJECT_NAME,
        amplitude_environment: process.env.AMPLITUDE_ENVIRONMENT,
        connected_clients: this.connectedClients.size,
        demo_running: this.isRunning
      });
    });

    // Client-specific configuration endpoint
    this.app.get('/api/config', (req, res) => {
      res.json({
        client: this.clientName,
        company: this.config.company,
        branding: this.config.branding,
        amplitude: this.config.amplitude,
        scenarios: Object.keys(this.config.scenarios),
        demoContext: this.config.demoContext
      });
    });

    // Test Amplitude connection
    this.app.post('/api/test-amplitude', async (req, res) => {
      try {
        console.log(\`🧪 Testing Amplitude connection for \${this.clientName}...\`);
        
        const testEvent = await this.amplitudeClient.track(
          'test_user_' + Date.now(),
          'Demo Connection Test',
          {
            client_name: this.clientName,
            test_timestamp: new Date().toISOString(),
            source: 'connection_test',
            project_name: process.env.AMPLITUDE_PROJECT_NAME,
            environment: process.env.AMPLITUDE_ENVIRONMENT
          }
        );

        res.json({
          success: true,
          client: this.clientName,
          amplitude_configured: this.amplitudeClient.isInitialized,
          project_name: process.env.AMPLITUDE_PROJECT_NAME,
          environment: process.env.AMPLITUDE_ENVIRONMENT,
          test_result: testEvent.amplitude_status
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          client: this.clientName
        });
      }
    });

    // Start demo with client-specific events
    this.app.post('/api/demo/start', (req, res) => {
      const { scenario } = req.body;
      this.startDemo(scenario || 'core_business');
      res.json({
        success: true,
        client: this.clientName,
        scenario,
        company: this.config.company.name,
        industry: this.config.company.industry
      });
    });

    // Stop demo
    this.app.post('/api/demo/stop', (req, res) => {
      this.stopDemo();
      res.json({ success: true, client: this.clientName });
    });

    // Trigger specific event
    this.app.post('/api/events/trigger', async (req, res) => {
      const { eventType, userId, properties } = req.body;

      try {
        const userSession = userId ?
          this.getOrCreateUserSession(userId) :
          this.getOrCreateUserSession();

        const generatedProperties = this.eventGenerator.generateEventProperties(eventType, userSession);
        const finalProperties = { 
          ...generatedProperties, 
          ...properties,
          client_name: this.clientName,
          demo_source: 'manual_trigger'
        };

        const event = await this.amplitudeClient.track(
          userSession.userId,
          eventType,
          finalProperties,
          {
            userProperties: userSession.userProperties,
            deviceId: userSession.deviceId,
            sessionId: userSession.sessionId,
            platform: userSession.platform
          }
        );

        this.broadcast('event-triggered', {
          event_type: eventType,
          user_id: userSession.userId,
          client: this.clientName,
          timestamp: new Date().toISOString(),
          amplitude_status: event.amplitude_status
        });

        res.json({
          success: true,
          client: this.clientName,
          event,
          amplitude_status: event.amplitude_status
        });
      } catch (error) {
        res.status(500).json({ error: error.message, client: this.clientName });
      }
    });

    // Generate historical data
    this.app.post('/api/backfill/generate', async (req, res) => {
      try {
        console.log(\`🔄 Starting historical data generation for \${this.clientName}...\`);
        
        const backfillConfig = this.config.historicalData || {};
        const options = {
          daysBack: backfillConfig.daysBack || 30,
          usersPerDay: backfillConfig.usersPerDay || 15,
          eventsPerUser: backfillConfig.eventsPerUser || 12,
          industryType: this.config.company.industry,
          scenarios: Object.keys(this.config.scenarios)
        };

        const result = await this.batchClient.generateHistoricalData(this.config, options);
        
        console.log(\`✅ Historical data generation complete for \${this.clientName}\`);
        console.log(\`🌐 Demo Portal: http://localhost:3001\`);
        console.log(\`🎬 Your \${this.clientName} demo is ready!\`);
        
        res.json({
          success: true,
          client: this.clientName,
          ...result,
          message: 'Historical data generated successfully'
        });
      } catch (error) {
        console.error(\`❌ Historical data generation failed for \${this.clientName}:\`, error);
        res.status(500).json({
          success: false,
          client: this.clientName,
          error: error.message
        });
      }
    });

    // Get backfill status
    this.app.get('/api/backfill/status', (req, res) => {
      const backfillConfig = this.config.historicalData || {};
      res.json({
        client: this.clientName,
        enabled: backfillConfig.enabled || false,
        configured: !!this.batchClient.isInitialized,
        settings: backfillConfig
      });
    });

    // Get demo statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = this.amplitudeClient.getStats();
      res.json({
        ...stats,
        client: this.clientName,
        demo_running: this.isRunning,
        connected_clients: this.connectedClients.size,
        company: this.config.company.name,
        industry: this.config.company.industry,
        active_sessions: this.activeSessions.size,
        historical_data: this.config.historicalData
      });
    });

    // Serve main interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(\`🔌 Client connected: \${socket.id}\`);
      this.connectedClients.add(socket.id);

      socket.emit('demo-status', {
        client: this.clientName,
        isRunning: this.isRunning,
        amplitude_configured: this.amplitudeClient.isInitialized,
        company: this.config.company,
        industry: this.config.company.industry,
        scenarios: Object.keys(this.config.scenarios),
        stats: this.amplitudeClient.getStats()
      });

      socket.on('disconnect', () => {
        console.log(\`🔌 Client disconnected: \${socket.id}\`);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  // Demo control methods (simplified versions)
  startDemo(scenario = 'core_business') {
    if (this.isRunning) return;
    
    console.log(\`🎬 Starting \${this.clientName} demo - \${scenario} scenario\`);
    this.isRunning = true;

    const interval = this.config.simulation?.eventInterval || 4000;
    this.simulationInterval = setInterval(async () => {
      await this.generateRandomEvent(scenario);
    }, interval);

    this.broadcast('demo-started', {
      client: this.clientName,
      scenario,
      company: this.config.company.name
    });
  }

  stopDemo() {
    if (!this.isRunning) return;
    
    console.log(\`⏹️ Stopping \${this.clientName} demo\`);
    this.isRunning = false;

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    this.broadcast('demo-stopped', { client: this.clientName });
  }

  async generateRandomEvent(scenario) {
    try {
      const userSession = this.getOrCreateUserSession();
      const scenarioConfig = this.config.scenarios[scenario];
      const eventType = this.selectEventType(scenarioConfig, userSession);
      
      const properties = this.eventGenerator.generateEventProperties(eventType, userSession);
      properties.client_name = this.clientName;
      properties.demo_source = 'auto_generation';

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

      this.broadcast('live-event', {
        event_type: eventType,
        user_id: userSession.userId,
        client: this.clientName,
        scenario: scenario,
        timestamp: new Date().toISOString(),
        amplitude_status: event.amplitude_status
      });

    } catch (error) {
      console.error('Error generating event:', error.message);
    }
  }

  // Utility methods
  selectEventType(scenarioConfig, userSession) {
    const events = scenarioConfig.events || [];
    return events.length > 0 ? events[Math.floor(Math.random() * events.length)] : 'Generic Event';
  }

  getOrCreateUserSession(userId = null) {
    if (!userId) {
      userId = \`user_\${Math.random().toString(36).substr(2, 9)}\`;
    }

    if (this.activeSessions.has(userId)) {
      return this.activeSessions.get(userId);
    }

    const session = {
      userId: userId,
      sessionId: Date.now(),
      deviceId: \`device_\${Math.random().toString(36).substr(2, 9)}\`,
      platform: 'web',
      sessionStartTime: Date.now(),
      eventCount: 1,
      userProperties: {
        client_demo: this.clientName,
        demo_user: true,
        journey_stage: 'active_user'
      }
    };

    this.activeSessions.set(userId, session);
    return session;
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }

  async start() {
    this.server.listen(this.port, async () => {
      console.log(\`🚀 \${this.clientName} Demo Server running on port \${this.port}\`);
      console.log(\`🌐 Open http://localhost:\${this.port} to view the demo\`);
      console.log(\`📊 Amplitude Project: \${process.env.AMPLITUDE_PROJECT_NAME || 'Demo Mode'}\`);
      console.log(\`🎯 Available scenarios: \${Object.keys(this.config.scenarios).join(', ')}\`);
      
      // Auto-generate historical data if configured
      const backfillConfig = this.config.historicalData || {};
      if (backfillConfig.enabled && backfillConfig.mode === 'immediate' && this.batchClient.isInitialized) {
        console.log(\`📈 Auto-generating historical data for \${this.clientName}...\`);
        try {
          const options = {
            daysBack: backfillConfig.daysBack || 30,
            usersPerDay: backfillConfig.usersPerDay || 15,
            eventsPerUser: backfillConfig.eventsPerUser || 12,
            industryType: this.config.company.industry,
            scenarios: Object.keys(this.config.scenarios)
          };
          
          await this.batchClient.generateHistoricalData(this.config, options);
          console.log(\`✅ Historical data generation complete for \${this.clientName}\`);
          console.log(\`🌐 Demo Portal: http://localhost:3001\`);
          console.log(\`🎬 Your \${this.clientName} demo is ready!\`);
        } catch (error) {
          console.error(\`❌ Auto-backfill failed for \${this.clientName}:\`, error.message);
        }
      }
    });
  }
}

// Start the server
const server = new ${this.toPascalCase(clientInfo.clientName)}DemoServer();
server.start();

module.exports = { ${this.toPascalCase(clientInfo.clientName)}DemoServer };
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'server', 'demo-server.js'), serverContent);
  }

  // Utility methods
  async ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async askChoice(question, choices) {
    console.log(question);
    choices.forEach((choice, i) => console.log(`  ${i + 1}. ${choice}`));
    
    const answer = await this.ask('Choose (1-' + choices.length + '): ');
    const index = parseInt(answer) - 1;
    
    return choices[index] || choices[0];
  }

  toPascalCase(str) {
    return str.replace(/[^a-zA-Z0-9]/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
  }

  getIndustryColor(industry) {
    const colors = {
      ecommerce: '#ec4899',
      saas: '#2563eb', 
      fintech: '#059669',
      healthcare: '#dc2626',
      education: '#7c3aed',
      media: '#ea580c',
      gaming: '#9333ea',
      travel: '#0891b2',
      'real-estate': '#16a34a'
    };
    return colors[industry] || '#2563eb';
  }

  getKeyMetrics(industry, businessModel) {
    const metrics = {
      ecommerce: ['Conversion Rate', 'Average Order Value', 'Cart Abandonment'],
      saas: ['Monthly Active Users', 'Feature Adoption', 'Churn Rate'],
      fintech: ['Transaction Volume', 'User Acquisition Cost', 'Retention Rate']
    };
    return metrics[industry] || metrics.saas;
  }

  getDemoScenarios(clientInfo) {
    return [
      `${clientInfo.clientName} user acquisition flow`,
      `Feature adoption and engagement patterns`,
      `Revenue attribution and conversion tracking`
    ];
  }

  getRevenueEvents(revenueModel) {
    const events = {
      subscription: ['Subscription Purchased', 'Plan Upgraded', 'Renewal Completed'],
      'one-time-purchase': ['Purchase Completed', 'Upsell Purchased', 'Refund Processed'],
      freemium: ['Premium Upgrade', 'Feature Unlocked', 'Trial Started']
    };
    return events[revenueModel] || events.subscription;
  }

  getEventCategory(eventName) {
    if (eventName.toLowerCase().includes('purchase') || eventName.toLowerCase().includes('buy')) {
      return 'revenue';
    } else if (eventName.toLowerCase().includes('signup') || eventName.toLowerCase().includes('register')) {
      return 'acquisition';
    } else if (eventName.toLowerCase().includes('view') || eventName.toLowerCase().includes('page')) {
      return 'engagement';
    }
    return 'interaction';
  }

  generateHelperMethods(clientInfo) {
    return `getClientSpecificProperty() {
    // Add ${clientInfo.clientName}-specific helper methods here
    return 'custom_value';
  }
  
  getBusinessContext() {
    return {
      client: '${clientInfo.clientName}',
      industry: '${clientInfo.industry}',
      model: '${clientInfo.businessModel}'
    };
  }`;
  }
}

// Run the generator
if (require.main === module) {
  const generator = new ClientDemoGenerator();
  generator.generateClientDemo().catch(console.error);
}

module.exports = { ClientDemoGenerator };