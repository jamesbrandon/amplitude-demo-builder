#!/usr/bin/env node

// List available industry configurations

const { getConfigLoader } = require('../src/server/config-loader');

function listIndustries() {
  console.log('🏭 Available Industry Templates');
  console.log('===============================\n');
  
  const configLoader = getConfigLoader();
  const industries = configLoader.listAvailableIndustries();
  
  if (industries.length === 0) {
    console.log('No industry templates found in examples/ directory');
    return;
  }
  
  industries.forEach((industry, index) => {
    console.log(`${index + 1}. ${industry}`);
    
    try {
      const config = configLoader.loadConfig(industry);
      console.log(`   Company: ${config.company?.name || 'Unknown'}`);
      console.log(`   Scenarios: ${Object.keys(config.scenarios || {}).length}`);
      console.log(`   Products: ${config.products?.length || 0}`);
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error loading config: ${error.message}\n`);
    }
  });
  
  console.log('Usage:');
  console.log('  npm run demo:INDUSTRY_NAME');
  console.log('  or set DEMO_INDUSTRY=INDUSTRY_NAME in .env');
}

if (require.main === module) {
  listIndustries();
}

module.exports = { listIndustries };