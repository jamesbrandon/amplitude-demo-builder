#!/usr/bin/env node

// Template Setup Script
// Prepares the Amplitude Demo Builder for use as a template

const fs = require('fs');
const path = require('path');

class TemplateSetup {
  constructor() {
    this.templateRoot = path.join(__dirname, '..');
  }

  async setupTemplate() {
    console.log('🎯 Setting up Amplitude Demo Builder Template\n');

    try {
      // Create necessary directories
      await this.createDirectories();
      
      // Setup environment template
      await this.setupEnvironment();
      
      // Create template documentation
      await this.createTemplateReadme();
      
      // Setup git ignore for generated projects
      await this.setupGitIgnore();
      
      // Create example client configs
      await this.createExampleConfigs();
      
      console.log('\n✅ Template setup complete!');
      console.log('\n🚀 You can now:');
      console.log('   1. Generate client demos: npm run create-client-demo');
      console.log('   2. Use web generator: npm start → http://localhost:3001/generator');
      console.log('   3. Customize existing configs in examples/ directory');
      console.log('\n📖 See docs/TEMPLATE_USAGE.md for detailed instructions');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async createDirectories() {
    const dirs = [
      'generated-demos',
      'docs/examples',
      'public/assets',
      'templates'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.templateRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async setupEnvironment() {
    const envTemplate = `# Amplitude Demo Builder Template Configuration

# Amplitude Configuration (Optional - can run in demo mode without)
AMPLITUDE_API_KEY=your_amplitude_api_key_here

# Server Configuration
DEMO_PORT=3001
NODE_ENV=development

# Template Settings
TEMPLATE_MODE=true
GENERATED_DEMOS_PATH=./generated-demos

# Demo Settings (defaults)
DEFAULT_INDUSTRY=saas
DEFAULT_SCENARIO=business
EVENT_INTERVAL=4000

# Optional: Custom branding
TEMPLATE_LOGO_URL=/assets/amplitude-logo.png
TEMPLATE_PRIMARY_COLOR=#2563eb
`;

    const envPath = path.join(this.templateRoot, '.env.template');
    fs.writeFileSync(envPath, envTemplate);
    console.log('📝 Created .env.template');

    // Create .env if it doesn't exist
    const actualEnvPath = path.join(this.templateRoot, '.env');
    if (!fs.existsSync(actualEnvPath)) {
      fs.writeFileSync(actualEnvPath, envTemplate);
      console.log('📝 Created .env file');
    }
  }

  async createTemplateReadme() {
    const templateReadme = `# Amplitude Demo Builder Template

Professional Amplitude analytics demonstration platform that generates client-specific demos.

## 🎯 What This Template Does

Creates realistic, industry-specific Amplitude demos with:
- ✅ Proper event structure following Amplitude best practices
- ✅ Realistic user journeys and conversion funnels  
- ✅ Industry-specific events and properties
- ✅ Revenue tracking with correct Amplitude formatting
- ✅ Attribution and UTM parameter handling
- ✅ Real-time demo interface with live statistics

## 🚀 Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Generate a Client Demo
\`\`\`bash
# Interactive CLI generator
npm run create-client-demo

# Or use the web interface
npm start
# Then visit http://localhost:3001/generator
\`\`\`

### 3. Run the Generated Demo
\`\`\`bash
cd client-name-amplitude-demo
npm install
npm start
\`\`\`

## 📋 Template Features

### Multiple Generation Methods
- **CLI Generator**: Interactive command-line tool
- **Web Generator**: User-friendly web interface  
- **Direct Config**: Modify existing industry templates

### Industry Templates
- E-commerce (product views, purchases, reviews)
- SaaS (feature usage, subscriptions, integrations)
- FinTech (transactions, accounts, compliance)
- Healthcare (appointments, treatments, outcomes)
- IoT (device data, automations, energy)
- Hospitality (bookings, check-ins, amenities)

### Professional Features
- Amplitude best practices compliance
- Realistic user progression and conversion rates
- Proper revenue event formatting
- Attribution tracking and UTM parameters
- Real-time WebSocket updates
- Docker deployment ready
- Professional UI with client branding

## 📖 Documentation

- **[Template Usage Guide](docs/TEMPLATE_USAGE.md)** - Complete usage instructions
- **[Event Format Reference](amplitude-event-format-reference.md)** - Amplitude best practices
- **[Industry Examples](examples/)** - Pre-built industry configurations

## 🎨 Customization

### For Sales Teams
- Use web generator for quick client demos
- Customize branding colors and logos
- Select relevant industry and events

### For Technical Teams  
- Modify event generators for specific properties
- Create custom industry templates
- Extend user journey configurations

### For Consultants
- Generate multiple client variations
- Include client-specific business logic
- Deploy demos to client environments

## 🔧 Advanced Usage

### Custom Event Properties
\`\`\`javascript
// Add to src/generators/event-generator.js
'Client Specific Event': (userSession, config) => ({
  client_tier: userSession.userProperties.tier,
  product_category: 'enterprise',
  custom_metric: Math.floor(Math.random() * 100),
  $revenue: 299.99 // Amplitude revenue property
})
\`\`\`

### Custom User Journeys
\`\`\`json
{
  "userJourney": {
    "stages": [
      {
        "name": "prospect",
        "displayName": "Qualified Lead",
        "conversionRate": 0.15,
        "events": ["Demo Requested", "Pricing Viewed"]
      }
    ]
  }
}
\`\`\`

## 🚀 Deployment

Generated demos include:
- Docker configuration
- Environment variable setup
- Health check endpoints
- Production logging

## 📊 Demo Best Practices

1. **Event Selection**: Choose 5-8 events that tell a story
2. **Industry Alignment**: Match client's actual business model
3. **Audience Focus**: Tailor complexity to audience level
4. **Data Realism**: Use realistic values and conversion rates
5. **Story Arc**: Structure demo to show business value

## 🤝 Support

- Check existing industry examples in \`examples/\`
- Review Amplitude best practices in documentation
- Customize event generators for specific needs
- Use Docker for consistent deployments

---

*Built for the Amplitude community to showcase analytics best practices*
`;

    fs.writeFileSync(path.join(this.templateRoot, 'TEMPLATE_README.md'), templateReadme);
    console.log('📝 Created TEMPLATE_README.md');
  }

  async setupGitIgnore() {
    const gitignoreAdditions = `
# Generated client demos
generated-demos/
*.zip

# Environment files
.env.local
.env.production

# Template specific
templates/temp/
`;

    const gitignorePath = path.join(this.templateRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const existing = fs.readFileSync(gitignorePath, 'utf8');
      if (!existing.includes('generated-demos/')) {
        fs.appendFileSync(gitignorePath, gitignoreAdditions);
        console.log('📝 Updated .gitignore');
      }
    } else {
      fs.writeFileSync(gitignorePath, gitignoreAdditions);
      console.log('📝 Created .gitignore');
    }
  }

  async createExampleConfigs() {
    // Create a fintech example since it's commonly requested
    const fintechConfig = {
      company: {
        name: "FinanceFlow",
        industry: "fintech",
        website: "https://financeflow.com",
        description: "Digital banking and financial services platform"
      },
      branding: {
        primaryColor: "#059669",
        secondaryColor: "#64748b"
      },
      scenarios: {
        banking: {
          name: "Digital Banking",
          description: "Core banking operations and transactions",
          weight: 0.4,
          events: [
            "Account Opened",
            "Transaction Completed", 
            "Transfer Initiated",
            "Bill Payment Made",
            "Balance Checked"
          ]
        },
        investments: {
          name: "Investment Platform",
          description: "Investment and trading activities",
          weight: 0.3,
          events: [
            "Portfolio Viewed",
            "Stock Purchased",
            "Investment Goal Set",
            "Market Research Accessed",
            "Dividend Received"
          ]
        },
        lending: {
          name: "Lending Services", 
          description: "Loan applications and credit services",
          weight: 0.3,
          events: [
            "Loan Application Started",
            "Credit Score Checked",
            "Loan Approved",
            "Payment Made",
            "Credit Limit Increased"
          ]
        }
      },
      userJourney: {
        stages: [
          {
            name: "prospect",
            displayName: "Prospect",
            duration: "0-1 sessions",
            conversionRate: 0.12,
            events: ["Landing Page Viewed", "Product Info Accessed", "Rate Calculator Used"]
          },
          {
            name: "applicant", 
            displayName: "Account Applicant",
            duration: "1-3 sessions",
            conversionRate: 0.35,
            events: ["Application Started", "Identity Verified", "Account Opened"]
          },
          {
            name: "active_customer",
            displayName: "Active Customer",
            duration: "1+ months",
            conversionRate: 0.75,
            events: ["Transaction Completed", "Service Used", "Feature Adopted"]
          },
          {
            name: "premium_customer",
            displayName: "Premium Customer", 
            duration: "6+ months",
            conversionRate: 0.90,
            events: ["Premium Service Used", "Investment Made", "Referral Made"]
          }
        ]
      },
      products: [
        {
          id: "checking_account",
          name: "Premium Checking",
          category: "banking",
          price: 15.99,
          currency: "USD"
        },
        {
          id: "investment_account",
          name: "Investment Account",
          category: "investments", 
          price: 0,
          currency: "USD"
        },
        {
          id: "personal_loan",
          name: "Personal Loan",
          category: "lending",
          price: 25000,
          currency: "USD"
        }
      ],
      attribution: {
        sources: [
          {
            utm_source: "google",
            utm_medium: "cpc",
            utm_campaign: "financial_services",
            weight: 0.30
          },
          {
            utm_source: "facebook",
            utm_medium: "social", 
            utm_campaign: "financial_literacy",
            weight: 0.20
          },
          {
            utm_source: "linkedin",
            utm_medium: "social",
            utm_campaign: "professional_banking",
            weight: 0.15
          },
          {
            utm_source: "referral",
            utm_medium: "referral",
            utm_campaign: "customer_referral",
            weight: 0.25
          },
          {
            utm_source: "organic",
            utm_medium: "organic", 
            utm_campaign: null,
            weight: 0.10
          }
        ]
      }
    };

    const fintechPath = path.join(this.templateRoot, 'examples', 'fintech-config.json');
    fs.writeFileSync(fintechPath, JSON.stringify(fintechConfig, null, 2));
    console.log('📝 Created fintech example config');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TemplateSetup();
  setup.setupTemplate().catch(console.error);
}

module.exports = { TemplateSetup };