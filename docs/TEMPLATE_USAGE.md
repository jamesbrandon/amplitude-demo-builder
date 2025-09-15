# Using Amplitude Demo Builder as a Template

This guide explains how to use your Amplitude Demo Builder as a template for creating client-specific demos.

## 🎯 Overview

Your Amplitude Demo Builder can be used in three ways:

1. **Direct Configuration** - Modify existing industry configs for quick demos
2. **CLI Generator** - Create new client-specific projects via command line
3. **Web Generator** - Use the web interface to generate custom demos

## 🚀 Method 1: Direct Configuration (Fastest)

For quick client demos, modify existing configurations:

### Step 1: Copy an Industry Config
```bash
cp examples/saas-config.json examples/client-name-config.json
```

### Step 2: Customize the Config
Edit the new config file:
```json
{
  "company": {
    "name": "Client Company Name",
    "industry": "their_industry",
    "website": "https://clientwebsite.com",
    "description": "Custom description for client"
  },
  "scenarios": {
    "client_specific": {
      "name": "Client's Key Journey",
      "events": ["Client Event 1", "Client Event 2", "Purchase Completed"]
    }
  }
}
```

### Step 3: Run with Custom Config
```bash
CUSTOM_CONFIG_PATH=./examples/client-name-config.json npm start
```

## 🛠️ Method 2: CLI Generator (Most Flexible)

Generate a complete new project for the client:

### Step 1: Run the Generator
```bash
npm run create-client-demo
```

### Step 2: Follow the Prompts
- Client/Company name
- Industry selection
- Business model
- Key events to track
- Demo objectives

### Step 3: Deploy the Generated Project
```bash
cd client-name-amplitude-demo
npm install
npm start
```

## 🌐 Method 3: Web Generator (Most User-Friendly)

Use the web interface for non-technical users:

### Step 1: Start the Template Server
```bash
npm start
```

### Step 2: Open the Generator
Navigate to `http://localhost:3001/generator`

### Step 3: Fill Out the Form
- Client information
- Demo configuration
- Key events
- Branding options

### Step 4: Generate & Download
Click "Generate Client Demo" to create and download the project.

## 📋 Best Practices for Client Demos

### 1. Event Selection
Choose 5-8 key events that showcase:
- **User acquisition** (signup, onboarding)
- **Core value delivery** (key feature usage)
- **Revenue generation** (purchase, subscription)
- **Retention** (return visits, engagement)

### 2. Industry Alignment
Ensure events and properties match the client's business:
- **E-commerce**: Product views, cart actions, purchases
- **SaaS**: Feature usage, integrations, upgrades
- **FinTech**: Transactions, account actions, compliance
- **Healthcare**: Appointments, treatments, outcomes

### 3. Audience Customization
Tailor the demo based on who's watching:
- **Executives**: Focus on business metrics, ROI
- **Marketing**: Attribution, campaign performance
- **Product**: Feature adoption, user journeys
- **Technical**: Implementation details, data quality

### 4. Demo Flow
Structure your demo to tell a story:
1. **Setup** (2 min): Show the demo environment
2. **Data Generation** (5 min): Start events, explain what's happening
3. **Analysis** (15-20 min): Show insights in Amplitude
4. **Q&A** (5-10 min): Address specific questions

## 🎨 Customization Options

### Branding
- Update `public/assets/` with client logos
- Modify colors in configuration files
- Customize the web interface styling

### Events & Properties
- Add industry-specific event properties
- Include client's actual product names
- Use realistic data ranges and values

### User Journeys
- Model the client's actual user flow
- Set realistic conversion rates
- Include their specific lifecycle stages

### Attribution Sources
- Match their actual marketing channels
- Use their UTM parameter conventions
- Include their specific campaign types

## 📊 Event Structure Best Practices

### Required Properties
Always include these Amplitude best practices:
```javascript
{
  event_type: "Event Name",
  user_id: "unique_user_id",
  device_id: "unique_device_id", 
  session_id: 1234567890123, // Numeric timestamp
  time: Date.now(),
  event_properties: {
    // Event-specific properties only
    // NO user_id, session_id, etc.
  },
  user_properties: {
    // User profile properties
  }
}
```

### Revenue Events
For purchase/subscription events:
```javascript
event_properties: {
  product_id: "product_123",
  product_name: "Premium Plan",
  price: 99.99,
  currency: "USD",
  $revenue: 99.99, // Amplitude special property
  $quantity: 1,
  payment_method: "credit_card"
}
```

### Attribution Properties
Include for new users only:
```javascript
event_properties: {
  utm_source: "google",
  utm_medium: "cpc", 
  utm_campaign: "brand_search",
  referrer: "https://google.com"
}
```

## 🚀 Deployment Options

### Local Development
```bash
npm start
# Demo runs on http://localhost:3001
```

### Docker Deployment
```bash
docker-compose up -d
# Includes environment variables for production
```

### Cloud Deployment
The generated projects include:
- Dockerfile for containerization
- Environment variable configuration
- Health check endpoints
- Production-ready logging

## 🔧 Advanced Customization

### Custom Event Generators
Create industry-specific event property generators:

```javascript
// src/generators/client-event-generator.js
class ClientEventGenerator extends EventGenerator {
  getIndustrySpecificTemplates() {
    return {
      'Client Specific Event': (userSession, config) => ({
        // Custom properties for this client
        client_tier: userSession.userProperties.tier,
        product_category: this.getClientProductCategory(),
        custom_metric: Math.floor(Math.random() * 100)
      })
    };
  }
}
```

### Custom User Journeys
Define client-specific user progression:

```json
{
  "userJourney": {
    "stages": [
      {
        "name": "prospect",
        "displayName": "Qualified Lead",
        "conversionRate": 0.15,
        "events": ["Demo Requested", "Pricing Viewed"]
      },
      {
        "name": "trial",
        "displayName": "Trial User", 
        "conversionRate": 0.25,
        "events": ["Feature Used", "Integration Connected"]
      }
    ]
  }
}
```

## 📈 Demo Success Metrics

Track these to improve your demos:
- **Engagement**: Time spent in demo, questions asked
- **Conversion**: Follow-up meetings scheduled
- **Feedback**: Client satisfaction scores
- **Technical**: Demo performance, error rates

## 🤝 Sharing & Collaboration

### With Clients
- Send them the generated project
- Include setup instructions
- Provide demo recording/screenshots

### With Team
- Version control the configurations
- Document client-specific customizations
- Share successful demo patterns

---

*This template system helps you create professional, client-specific Amplitude demos that showcase real business value and drive meaningful conversations about analytics implementation.*