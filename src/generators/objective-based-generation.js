// Objective-Based Event Generation
// Adjusts event generation patterns based on demo objectives

const OBJECTIVE_PATTERNS = {
  // E-commerce objectives
  'product_discovery': {
    keywords: ['discovery', 'browse', 'search', 'recommendation'],
    eventWeights: {
      'Product Viewed': 2.0,
      'Search Performed': 1.8,
      'Category Browsed': 1.6,
      'Recommendation Clicked': 1.5,
      'Product Added to Cart': 0.8
    },
    scenarioWeights: {
      'shopping': 1.5,
      'marketing': 1.3,
      'engagement': 1.2
    }
  },
  
  'conversion_funnel': {
    keywords: ['conversion', 'funnel', 'checkout', 'purchase', 'cart'],
    eventWeights: {
      'Product Added to Cart': 1.8,
      'Checkout Started': 1.6,
      'Purchase Completed': 1.4,
      'Product Viewed': 1.2,
      'Wishlist Added': 0.9
    },
    scenarioWeights: {
      'shopping': 2.0,
      'marketing': 1.2
    }
  },
  
  'cart_abandonment': {
    keywords: ['abandonment', 'cart abandon', 'checkout abandon'],
    eventWeights: {
      'Product Added to Cart': 2.0,
      'Checkout Started': 1.8,
      'Purchase Completed': 0.6, // Lower completion rate
      'Product Viewed': 1.3,
      'Email Opened': 1.4 // Recovery emails
    },
    userJourneyModifications: {
      'increaseAbandonmentRate': true,
      'addRecoveryEvents': true
    }
  },
  
  'customer_lifetime_value': {
    keywords: ['lifetime value', 'ltv', 'repeat purchase', 'loyalty'],
    eventWeights: {
      'Purchase Completed': 1.6,
      'Account Created': 1.4,
      'Product Reviewed': 1.3,
      'Newsletter Subscribed': 1.2,
      'Loyalty Program Joined': 1.8
    },
    userJourneyModifications: {
      'increaseRepeatPurchases': true,
      'extendUserLifecycle': true
    }
  },
  
  // Media & Entertainment objectives
  'content_engagement': {
    keywords: ['engagement', 'watch time', 'completion', 'interaction'],
    eventWeights: {
      'Video Started': 1.8,
      'Video Completed': 1.6,
      'Content Liked': 1.4,
      'Content Shared': 1.3,
      'Comment Posted': 1.2
    },
    scenarioWeights: {
      'content_consumption': 2.0,
      'social_engagement': 1.5
    }
  },
  
  'subscription_conversion': {
    keywords: ['subscription', 'conversion', 'trial', 'upgrade', 'churn'],
    eventWeights: {
      'Trial Started': 1.8,
      'Subscription Purchased': 1.6,
      'Premium Content Accessed': 1.4,
      'Video Completed': 1.3,
      'Content Added to Watchlist': 1.2
    },
    userJourneyModifications: {
      'emphasizeTrialToSubscription': true,
      'trackChurnIndicators': true
    }
  },
  
  'recommendation_performance': {
    keywords: ['recommendation', 'personalization', 'algorithm', 'discovery'],
    eventWeights: {
      'Recommendation Clicked': 2.0,
      'Content Liked': 1.6,
      'Search Performed': 1.4,
      'Playlist Created': 1.3,
      'Content Shared': 1.2
    },
    additionalProperties: {
      'recommendation_algorithm': ['collaborative_filtering', 'content_based', 'hybrid'],
      'recommendation_confidence': [0.7, 0.8, 0.9, 0.95],
      'recommendation_position': [1, 2, 3, 4, 5]
    }
  },
  
  // SaaS objectives
  'feature_adoption': {
    keywords: ['feature adoption', 'usage patterns', 'activation'],
    eventWeights: {
      'Feature Used': 2.0,
      'Dashboard Viewed': 1.4,
      'Tutorial Completed': 1.6,
      'Integration Configured': 1.3,
      'Report Generated': 1.2
    },
    scenarioWeights: {
      'feature_usage': 2.0,
      'onboarding': 1.6
    }
  },
  
  'trial_conversion': {
    keywords: ['trial', 'conversion', 'upgrade', 'subscription'],
    eventWeights: {
      'Trial Started': 1.8,
      'Subscription Purchased': 1.6,
      'Feature Used': 1.4,
      'Team Member Invited': 1.3,
      'Usage Limit Reached': 1.5
    },
    userJourneyModifications: {
      'emphasizeTrialProgression': true,
      'trackConversionTriggers': true
    }
  },
  
  'user_onboarding': {
    keywords: ['onboarding', 'activation', 'first use', 'setup'],
    eventWeights: {
      'Account Created': 1.8,
      'Tutorial Completed': 1.6,
      'Data Source Connected': 1.5,
      'First Dashboard Created': 1.4,
      'Team Member Invited': 1.2
    },
    userJourneyModifications: {
      'emphasizeOnboardingFlow': true,
      'trackActivationMilestones': true
    }
  },
  
  // FinTech objectives
  'transaction_volume': {
    keywords: ['transaction', 'volume', 'revenue', 'payment'],
    eventWeights: {
      'Transaction Completed': 2.0,
      'Payment Sent': 1.6,
      'Account Opened': 1.4,
      'Card Activated': 1.3,
      'Investment Made': 1.5
    },
    additionalProperties: {
      'transaction_amount': [10, 25, 50, 100, 250, 500, 1000],
      'transaction_type': ['transfer', 'payment', 'investment', 'withdrawal']
    }
  },
  
  'risk_management': {
    keywords: ['risk', 'fraud', 'security', 'compliance'],
    eventWeights: {
      'Fraud Alert Triggered': 1.8,
      'KYC Completed': 1.6,
      'Security Check Passed': 1.4,
      'Suspicious Activity Detected': 1.3,
      'Account Verified': 1.2
    },
    additionalProperties: {
      'risk_score': [0.1, 0.2, 0.3, 0.8, 0.9],
      'fraud_probability': [0.05, 0.1, 0.15, 0.7, 0.85]
    }
  }
};

// Analyze objectives text and return matching patterns
function analyzeObjectives(objectivesText) {
  if (!objectivesText) return [];
  
  const text = objectivesText.toLowerCase();
  const matchedPatterns = [];
  
  for (const [patternName, pattern] of Object.entries(OBJECTIVE_PATTERNS)) {
    const keywordMatches = pattern.keywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    if (keywordMatches.length > 0) {
      matchedPatterns.push({
        name: patternName,
        pattern: pattern,
        matchedKeywords: keywordMatches,
        confidence: keywordMatches.length / pattern.keywords.length
      });
    }
  }
  
  // Sort by confidence (most relevant first)
  return matchedPatterns.sort((a, b) => b.confidence - a.confidence);
}

// Apply objective-based modifications to event generation
function applyObjectiveModifications(config, objectives) {
  const matchedPatterns = analyzeObjectives(objectives);
  
  if (matchedPatterns.length === 0) {
    return config; // No modifications needed
  }
  
  console.log(`🎯 Applying objective-based modifications for: ${matchedPatterns.map(p => p.name).join(', ')}`);
  
  const modifiedConfig = JSON.parse(JSON.stringify(config)); // Deep clone
  
  // Apply event weight modifications
  for (const match of matchedPatterns) {
    const pattern = match.pattern;
    
    // Modify scenario weights
    if (pattern.scenarioWeights && modifiedConfig.scenarios) {
      for (const [scenarioName, weight] of Object.entries(pattern.scenarioWeights)) {
        if (modifiedConfig.scenarios[scenarioName]) {
          modifiedConfig.scenarios[scenarioName].weight = 
            (modifiedConfig.scenarios[scenarioName].weight || 1.0) * weight;
        }
      }
    }
    
    // Store event weights for use during generation
    if (pattern.eventWeights) {
      if (!modifiedConfig.objectiveEventWeights) {
        modifiedConfig.objectiveEventWeights = {};
      }
      
      for (const [eventName, weight] of Object.entries(pattern.eventWeights)) {
        modifiedConfig.objectiveEventWeights[eventName] = 
          (modifiedConfig.objectiveEventWeights[eventName] || 1.0) * weight;
      }
    }
    
    // Store additional properties for events
    if (pattern.additionalProperties) {
      if (!modifiedConfig.objectiveProperties) {
        modifiedConfig.objectiveProperties = {};
      }
      
      Object.assign(modifiedConfig.objectiveProperties, pattern.additionalProperties);
    }
    
    // Store user journey modifications
    if (pattern.userJourneyModifications) {
      if (!modifiedConfig.objectiveJourneyMods) {
        modifiedConfig.objectiveJourneyMods = {};
      }
      
      Object.assign(modifiedConfig.objectiveJourneyMods, pattern.userJourneyModifications);
    }
  }
  
  return modifiedConfig;
}

// Get weighted event selection based on objectives
function getObjectiveWeightedEvent(events, objectiveEventWeights = {}) {
  if (!events || events.length === 0) return null;
  
  // Create weighted array
  const weightedEvents = [];
  
  for (const event of events) {
    const weight = objectiveEventWeights[event] || 1.0;
    const normalizedWeight = Math.max(0.1, weight); // Minimum weight of 0.1
    
    // Add event multiple times based on weight
    const repetitions = Math.ceil(normalizedWeight * 10);
    for (let i = 0; i < repetitions; i++) {
      weightedEvents.push(event);
    }
  }
  
  // Random selection from weighted array
  return weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
}

// Add objective-specific properties to events
function addObjectiveProperties(eventType, baseProperties, objectiveProperties = {}) {
  const enhancedProperties = { ...baseProperties };
  
  // Add properties based on event type and objectives
  for (const [propertyName, possibleValues] of Object.entries(objectiveProperties)) {
    // Only add if relevant to this event type
    if (isPropertyRelevantToEvent(eventType, propertyName)) {
      if (Array.isArray(possibleValues)) {
        enhancedProperties[propertyName] = possibleValues[Math.floor(Math.random() * possibleValues.length)];
      } else {
        enhancedProperties[propertyName] = possibleValues;
      }
    }
  }
  
  return enhancedProperties;
}

// Check if a property is relevant to an event type
function isPropertyRelevantToEvent(eventType, propertyName) {
  const relevanceMap = {
    'recommendation_algorithm': ['Recommendation Clicked', 'Content Liked', 'Product Viewed'],
    'recommendation_confidence': ['Recommendation Clicked'],
    'recommendation_position': ['Recommendation Clicked'],
    'transaction_amount': ['Transaction Completed', 'Payment Sent', 'Purchase Completed'],
    'transaction_type': ['Transaction Completed', 'Payment Sent'],
    'risk_score': ['Fraud Alert Triggered', 'KYC Completed', 'Security Check Passed'],
    'fraud_probability': ['Fraud Alert Triggered', 'Suspicious Activity Detected']
  };
  
  const relevantEvents = relevanceMap[propertyName];
  return !relevantEvents || relevantEvents.includes(eventType);
}

module.exports = {
  analyzeObjectives,
  applyObjectiveModifications,
  getObjectiveWeightedEvent,
  addObjectiveProperties,
  OBJECTIVE_PATTERNS
};