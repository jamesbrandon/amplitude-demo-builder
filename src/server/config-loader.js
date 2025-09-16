// Configuration Loader for Amplitude Demo Template
// Handles loading and merging of industry-specific configurations

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.baseConfigPath = path.join(__dirname, '../../config/demo-config.json');
    this.examplesDir = path.join(__dirname, '../../examples');
    this.loadedConfig = null;
  }

  // Load configuration with optional industry override
  loadConfig(industryOrPath = null) {
    try {
      // Load base configuration
      const baseConfig = this.loadJsonFile(this.baseConfigPath);
      
      if (!industryOrPath) {
        this.loadedConfig = baseConfig;
        return baseConfig;
      }

      // Determine if it's an industry name or custom path
      let industryConfigPath;
      if (industryOrPath.includes('/') || industryOrPath.includes('\\')) {
        // Custom path provided
        industryConfigPath = path.resolve(industryOrPath);
      } else {
        // Industry name provided
        industryConfigPath = path.join(this.examplesDir, `${industryOrPath}-config.json`);
      }

      // Load and merge industry-specific configuration
      if (fs.existsSync(industryConfigPath)) {
        const industryConfig = this.loadJsonFile(industryConfigPath);
        this.loadedConfig = this.mergeConfigs(baseConfig, industryConfig);
        console.log(`✅ Loaded ${industryOrPath} industry configuration`);
      } else {
        console.log(`⚠️ Industry config not found: ${industryConfigPath}, using base config`);
        this.loadedConfig = baseConfig;
      }

      return this.loadedConfig;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      throw error;
    }
  }

  // Get current loaded configuration
  getConfig() {
    if (!this.loadedConfig) {
      return this.loadConfig();
    }
    return this.loadedConfig;
  }

  // Load JSON file with error handling
  loadJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load ${filePath}: ${error.message}`);
    }
  }

  // Deep merge two configuration objects
  mergeConfigs(baseConfig, industryConfig) {
    const merged = JSON.parse(JSON.stringify(baseConfig)); // Deep clone

    for (const key in industryConfig) {
      if (industryConfig.hasOwnProperty(key)) {
        // Special handling for scenarios - replace entirely instead of merging
        if (key === 'scenarios') {
          merged[key] = industryConfig[key];
        } else if (typeof industryConfig[key] === 'object' && !Array.isArray(industryConfig[key])) {
          // Recursively merge objects
          merged[key] = this.mergeObjects(merged[key] || {}, industryConfig[key]);
        } else {
          // Replace arrays and primitives
          merged[key] = industryConfig[key];
        }
      }
    }

    return merged;
  }

  // Helper method for deep object merging
  mergeObjects(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
          result[key] = this.mergeObjects(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  // List available industry configurations
  listAvailableIndustries() {
    try {
      const files = fs.readdirSync(this.examplesDir);
      const industries = files
        .filter(file => file.endsWith('-config.json'))
        .map(file => file.replace('-config.json', ''));
      
      return industries;
    } catch (error) {
      console.error('Failed to list industries:', error.message);
      return [];
    }
  }

  // Validate configuration structure
  validateConfig(config = null) {
    const configToValidate = config || this.getConfig();
    const errors = [];

    // Required top-level sections
    const requiredSections = ['company', 'scenarios', 'userJourney', 'products', 'attribution'];
    
    for (const section of requiredSections) {
      if (!configToValidate[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    }

    // Validate company info
    if (configToValidate.company) {
      const requiredCompanyFields = ['name', 'industry'];
      for (const field of requiredCompanyFields) {
        if (!configToValidate.company[field]) {
          errors.push(`Missing company.${field}`);
        }
      }
    }

    // Validate scenarios
    if (configToValidate.scenarios) {
      for (const [scenarioKey, scenario] of Object.entries(configToValidate.scenarios)) {
        if (!scenario.events || !Array.isArray(scenario.events)) {
          errors.push(`Scenario ${scenarioKey} missing events array`);
        }
        if (typeof scenario.weight !== 'number') {
          errors.push(`Scenario ${scenarioKey} missing or invalid weight`);
        }
      }
    }

    // Validate user journey stages
    if (configToValidate.userJourney && configToValidate.userJourney.stages) {
      for (const stage of configToValidate.userJourney.stages) {
        if (!stage.name || !stage.displayName) {
          errors.push('User journey stage missing name or displayName');
        }
        if (typeof stage.conversionRate !== 'number') {
          errors.push(`Stage ${stage.name} missing or invalid conversionRate`);
        }
      }
    }

    // Validate products
    if (configToValidate.products && Array.isArray(configToValidate.products)) {
      for (const product of configToValidate.products) {
        if (!product.id || !product.name || typeof product.price !== 'number') {
          errors.push(`Product missing required fields: id, name, price`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get configuration summary for logging
  getConfigSummary() {
    const config = this.getConfig();
    
    return {
      company: config.company?.name || 'Unknown',
      industry: config.company?.industry || 'Unknown',
      scenarios: Object.keys(config.scenarios || {}).length,
      userStages: config.userJourney?.stages?.length || 0,
      products: config.products?.length || 0,
      attributionSources: config.attribution?.sources?.length || 0
    };
  }

  // Reload configuration (useful for development)
  reloadConfig(industryOrPath = null) {
    this.loadedConfig = null;
    return this.loadConfig(industryOrPath);
  }
}

// Export singleton instance
let configLoader = null;

const getConfigLoader = () => {
  if (!configLoader) {
    configLoader = new ConfigLoader();
  }
  return configLoader;
};

module.exports = {
  ConfigLoader,
  getConfigLoader
};