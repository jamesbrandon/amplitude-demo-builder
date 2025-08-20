#!/usr/bin/env node

// Setup script for Amplitude Demo Template
// Helps users configure their demo environment

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class SetupWizard {
  constructor() {
    this.config = {};
  }

  async run() {
    console.log('🎯 Welcome to Amplitude Demo Template Setup!\n');
    
    try {
      await this.gatherBasicInfo();
      await this.selectIndustry();
      await this.configureAmplitude();
      await this.createEnvFile();
      await this.showNextSteps();
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    } finally {
      rl.close();
    }
  }

  async gatherBasicInfo() {
    console.log('📋 Basic Information');
    console.log('===================\n');
    
    this.config.companyName = await this.ask('Company name for demo: ');
    this.config.port = await this.ask('Server port (default 3001): ') || '3001';
  }

  async selectIndustry() {
    console.log('\n🏭 Industry Selection');
    console.log('====================\n');
    
    const industries = this.getAvailableIndustries();
    
    console.log('Available industry templates:');
    industries.forEach((industry, index) => {
      console.log(`${index + 1}. ${industry}`);
    });
    console.log(`${industries.length + 1}. custom (I'll provide my own config)`);
    
    const selection = await this.ask('\nSelect industry (1-' + (industries.length + 1) + '): ');
    const index = parseInt(selection) - 1;
    
    if (index >= 0 && index < industries.length) {
      this.config.industry = industries[index];
      console.log(`✅ Selected: ${this.config.industry}`);
    } else if (index === industries.length) {
      this.config.industry = 'custom';
      this.config.customConfigPath = await this.ask('Path to your custom config file: ');
      console.log('✅ Will use custom configuration');
    } else {
      throw new Error('Invalid selection');
    }
  }

  async configureAmplitude() {
    console.log('\n📊 Amplitude Configuration');
    console.log('==========================\n');
    
    console.log('You need an Amplitude API key to send real events.');
    console.log('Get one from: https://amplitude.com/');
    console.log('Or leave blank to run in demo mode (no real events sent).\n');
    
    this.config.amplitudeApiKey = await this.ask('Amplitude API key (optional): ');
    
    if (this.config.amplitudeApiKey) {
      console.log('✅ Will send real events to Amplitude');
    } else {
      console.log('⚠️ Will run in demo mode (events logged but not sent)');
    }
  }

  async createEnvFile() {
    console.log('\n📝 Creating Configuration');
    console.log('=========================\n');
    
    const envContent = this.generateEnvContent();
    const envPath = path.join(__dirname, '../.env');
    
    if (fs.existsSync(envPath)) {
      const overwrite = await this.ask('.env file exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('⚠️ Skipped .env file creation');
        return;
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file');
  }

  async showNextSteps() {
    console.log('\n🚀 Setup Complete!');
    console.log('==================\n');
    
    console.log('Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Start the demo: npm start');
    
    if (this.config.industry && this.config.industry !== 'custom') {
      console.log(`3. Or use industry shortcut: npm run demo:${this.config.industry}`);
    }
    
    console.log(`4. Open browser: http://localhost:${this.config.port}`);
    console.log('\nHappy demoing! 🎉');
  }

  generateEnvContent() {
    let content = '# Amplitude Demo Template Configuration\n\n';
    
    content += '# Amplitude Configuration\n';
    content += `AMPLITUDE_API_KEY=${this.config.amplitudeApiKey || ''}\n\n`;
    
    content += '# Server Configuration\n';
    content += `DEMO_PORT=${this.config.port}\n`;
    content += 'NODE_ENV=development\n\n';
    
    content += '# Demo Settings\n';
    content += `DEMO_INDUSTRY=${this.config.industry || 'saas'}\n`;
    content += 'DEFAULT_SCENARIO=business\n';
    content += 'EVENT_INTERVAL=5000\n';
    
    if (this.config.customConfigPath) {
      content += `\n# Custom Configuration\n`;
      content += `CUSTOM_CONFIG_PATH=${this.config.customConfigPath}\n`;
    }
    
    return content;
  }

  getAvailableIndustries() {
    const examplesDir = path.join(__dirname, '../examples');
    
    try {
      const files = fs.readdirSync(examplesDir);
      return files
        .filter(file => file.endsWith('-config.json'))
        .map(file => file.replace('-config.json', ''));
    } catch (error) {
      return ['saas', 'ecommerce', 'iot']; // Fallback
    }
  }

  ask(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run();
}

module.exports = { SetupWizard };