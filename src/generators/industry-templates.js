// Industry-Specific Templates and Defaults for Client Demo Generator
// Provides intelligent defaults and options based on selected industry

const INDUSTRY_TEMPLATES = {
  'ecommerce': {
    displayName: 'E-commerce & Retail',
    description: 'Online stores, marketplaces, and retail platforms',
    businessModels: [
      { value: 'b2c', label: 'B2C (Direct to Consumer)', recommended: true },
      { value: 'marketplace', label: 'Marketplace (Multi-vendor)' },
      { value: 'b2b', label: 'B2B (Wholesale/Trade)' }
    ],
    revenueModels: [
      { value: 'product_sales', label: 'Product Sales', recommended: true },
      { value: 'commission', label: 'Commission (Marketplace)' },
      { value: 'subscription', label: 'Subscription Box' },
      { value: 'advertising', label: 'Advertising Revenue' }
    ],
    defaultEvents: [
      'Product Viewed',
      'Product Added to Cart',
      'Checkout Started',
      'Purchase Completed',
      'Product Reviewed'
    ],
    suggestedEvents: [
      'Search Performed',
      'Category Browsed',
      'Wishlist Added',
      'Promotion Clicked',
      'Email Opened',
      'Account Created',
      'Recommendation Clicked'
    ],
    demoObjectives: [
      'Product discovery and conversion funnel analysis',
      'Shopping cart abandonment insights',
      'Customer lifetime value tracking',
      'Marketing attribution and campaign performance',
      'Product recommendation effectiveness'
    ]
  },

  'media': {
    displayName: 'Media & Entertainment',
    description: 'Streaming services, content platforms, and entertainment apps',
    businessModels: [
      { value: 'subscription', label: 'Subscription Platform', recommended: true },
      { value: 'freemium', label: 'Freemium (Free + Premium)' },
      { value: 'advertising', label: 'Ad-Supported Content' },
      { value: 'marketplace', label: 'Content Marketplace' }
    ],
    revenueModels: [
      { value: 'subscription', label: 'Monthly/Annual Subscriptions', recommended: true },
      { value: 'advertising', label: 'Advertising Revenue' },
      { value: 'hybrid', label: 'Subscription + Advertising' },
      { value: 'pay_per_view', label: 'Pay-per-View/Rental' },
      { value: 'freemium', label: 'Freemium Upgrades' }
    ],
    defaultEvents: [
      'Video Started',
      'Video Completed',
      'Content Liked',
      'Subscription Purchased',
      'Search Performed'
    ],
    suggestedEvents: [
      'Content Shared',
      'Recommendation Clicked',
      'Playlist Created',
      'Content Added to Watchlist',
      'Comment Posted',
      'Content Rated',
      'Live Chat Participated',
      'Download Completed'
    ],
    demoObjectives: [
      'Content engagement and completion rates',
      'Subscription conversion and churn analysis',
      'Content recommendation performance',
      'User journey from discovery to subscription',
      'Binge-watching patterns and session analysis'
    ]
  },

  'saas': {
    displayName: 'SaaS & Software',
    description: 'Software-as-a-Service platforms and business tools',
    businessModels: [
      { value: 'b2b', label: 'B2B (Business Software)', recommended: true },
      { value: 'freemium', label: 'Freemium Model' },
      { value: 'enterprise', label: 'Enterprise Sales' },
      { value: 'b2c', label: 'B2C (Consumer Software)' }
    ],
    revenueModels: [
      { value: 'subscription', label: 'Monthly/Annual Subscriptions', recommended: true },
      { value: 'freemium', label: 'Freemium Upgrades' },
      { value: 'usage_based', label: 'Usage-Based Pricing' },
      { value: 'enterprise', label: 'Enterprise Licensing' }
    ],
    defaultEvents: [
      'Feature Used',
      'Dashboard Viewed',
      'Report Generated',
      'Trial Started',
      'Subscription Purchased'
    ],
    suggestedEvents: [
      'Account Created',
      'Data Source Connected',
      'Team Member Invited',
      'Integration Configured',
      'Export Completed',
      'API Called',
      'Support Ticket Created'
    ],
    demoObjectives: [
      'Feature adoption and usage patterns',
      'Trial to paid conversion optimization',
      'User onboarding effectiveness',
      'Team collaboration and sharing metrics',
      'Product-led growth insights'
    ]
  },

  'fintech': {
    displayName: 'FinTech & Financial Services',
    description: 'Digital banking, payments, and financial platforms',
    businessModels: [
      { value: 'b2c', label: 'B2C (Consumer Finance)', recommended: true },
      { value: 'b2b', label: 'B2B (Business Finance)' },
      { value: 'marketplace', label: 'Financial Marketplace' },
      { value: 'enterprise', label: 'Enterprise Solutions' }
    ],
    revenueModels: [
      { value: 'transaction_fees', label: 'Transaction Fees', recommended: true },
      { value: 'subscription', label: 'Monthly/Annual Plans' },
      { value: 'commission', label: 'Commission on Services' },
      { value: 'interest', label: 'Interest & Lending' }
    ],
    defaultEvents: [
      'Account Opened',
      'Transaction Completed',
      'Investment Made',
      'Loan Applied',
      'KYC Completed'
    ],
    suggestedEvents: [
      'Payment Sent',
      'Budget Created',
      'Credit Score Checked',
      'Card Activated',
      'Fraud Alert Triggered',
      'Goal Set',
      'Notification Received'
    ],
    demoObjectives: [
      'Transaction volume and revenue tracking',
      'User onboarding and KYC completion rates',
      'Financial product adoption',
      'Risk management and fraud detection',
      'Customer lifetime value in financial services'
    ]
  },

  'hospitality': {
    displayName: 'Travel & Hospitality',
    description: 'Hotels, travel booking, and hospitality services',
    businessModels: [
      { value: 'b2c', label: 'B2C (Direct Bookings)', recommended: true },
      { value: 'marketplace', label: 'Booking Platform' },
      { value: 'b2b', label: 'B2B (Corporate Travel)' },
      { value: 'commission', label: 'Commission-Based' }
    ],
    revenueModels: [
      { value: 'bookings', label: 'Booking Revenue', recommended: true },
      { value: 'commission', label: 'Commission from Partners' },
      { value: 'subscription', label: 'Membership Programs' },
      { value: 'service_fees', label: 'Service Fees' }
    ],
    defaultEvents: [
      'Room Search Performed',
      'Booking Completed',
      'Check-in Completed',
      'Amenity Used',
      'Review Submitted'
    ],
    suggestedEvents: [
      'Room Viewed',
      'Booking Started',
      'Payment Processed',
      'Mobile Key Used',
      'Room Service Ordered',
      'Spa Service Booked',
      'Loyalty Points Earned'
    ],
    demoObjectives: [
      'Booking conversion funnel optimization',
      'Guest experience and satisfaction tracking',
      'Revenue per guest and upselling opportunities',
      'Loyalty program effectiveness',
      'Operational efficiency metrics'
    ]
  },

  'iot': {
    displayName: 'IoT & Smart Devices',
    description: 'Internet of Things, smart home, and connected devices',
    businessModels: [
      { value: 'b2c', label: 'B2C (Consumer Devices)', recommended: true },
      { value: 'b2b', label: 'B2B (Enterprise IoT)' },
      { value: 'subscription', label: 'Device + Service' },
      { value: 'enterprise', label: 'Enterprise Solutions' }
    ],
    revenueModels: [
      { value: 'product_sales', label: 'Device Sales', recommended: true },
      { value: 'subscription', label: 'Service Subscriptions' },
      { value: 'usage_based', label: 'Usage-Based Pricing' },
      { value: 'data_monetization', label: 'Data Insights' }
    ],
    defaultEvents: [
      'Device Activated',
      'Sensor Data Received',
      'Automation Triggered',
      'Energy Saved',
      'Alert Generated'
    ],
    suggestedEvents: [
      'Device Connected',
      'Firmware Updated',
      'Schedule Created',
      'Remote Access Used',
      'Battery Low Warning',
      'Maintenance Required',
      'Usage Report Generated'
    ],
    demoObjectives: [
      'Device adoption and activation rates',
      'Usage patterns and optimization opportunities',
      'Predictive maintenance insights',
      'Energy efficiency and cost savings',
      'User engagement with smart features'
    ]
  },

  'healthcare': {
    displayName: 'Healthcare & Wellness',
    description: 'Digital health, telemedicine, and wellness platforms',
    businessModels: [
      { value: 'b2c', label: 'B2C (Patient Direct)', recommended: true },
      { value: 'b2b', label: 'B2B (Healthcare Providers)' },
      { value: 'subscription', label: 'Wellness Subscriptions' },
      { value: 'marketplace', label: 'Healthcare Marketplace' }
    ],
    revenueModels: [
      { value: 'subscription', label: 'Monthly/Annual Plans', recommended: true },
      { value: 'pay_per_service', label: 'Pay-per-Consultation' },
      { value: 'insurance', label: 'Insurance Billing' },
      { value: 'freemium', label: 'Freemium Health Tools' }
    ],
    defaultEvents: [
      'Appointment Booked',
      'Health Data Logged',
      'Medication Reminder',
      'Consultation Completed',
      'Goal Achieved'
    ],
    suggestedEvents: [
      'Symptom Checker Used',
      'Prescription Filled',
      'Wearable Data Synced',
      'Emergency Alert Sent',
      'Care Plan Updated',
      'Provider Rated',
      'Insurance Verified'
    ],
    demoObjectives: [
      'Patient engagement and adherence tracking',
      'Telehealth adoption and satisfaction',
      'Health outcome improvements',
      'Care coordination effectiveness',
      'Preventive care and wellness metrics'
    ]
  },

  'education': {
    displayName: 'Education & E-Learning',
    description: 'Online learning platforms, educational tools, and EdTech',
    businessModels: [
      { value: 'b2c', label: 'B2C (Individual Learners)', recommended: true },
      { value: 'b2b', label: 'B2B (Educational Institutions)' },
      { value: 'freemium', label: 'Freemium Courses' },
      { value: 'marketplace', label: 'Course Marketplace' }
    ],
    revenueModels: [
      { value: 'subscription', label: 'Monthly/Annual Access', recommended: true },
      { value: 'course_sales', label: 'Individual Course Sales' },
      { value: 'freemium', label: 'Freemium Upgrades' },
      { value: 'certification', label: 'Certification Fees' }
    ],
    defaultEvents: [
      'Course Started',
      'Lesson Completed',
      'Quiz Taken',
      'Certificate Earned',
      'Subscription Purchased'
    ],
    suggestedEvents: [
      'Video Watched',
      'Assignment Submitted',
      'Discussion Posted',
      'Progress Milestone',
      'Course Rated',
      'Study Group Joined',
      'Reminder Clicked'
    ],
    demoObjectives: [
      'Course completion and engagement rates',
      'Learning path optimization',
      'Student retention and success metrics',
      'Content effectiveness analysis',
      'Subscription conversion from free trials'
    ]
  },

  'gaming': {
    displayName: 'Gaming & Entertainment',
    description: 'Mobile games, gaming platforms, and interactive entertainment',
    businessModels: [
      { value: 'freemium', label: 'Freemium (Free-to-Play)', recommended: true },
      { value: 'b2c', label: 'B2C (Premium Games)' },
      { value: 'subscription', label: 'Gaming Subscriptions' },
      { value: 'advertising', label: 'Ad-Supported Games' }
    ],
    revenueModels: [
      { value: 'in_app_purchases', label: 'In-App Purchases', recommended: true },
      { value: 'advertising', label: 'Advertising Revenue' },
      { value: 'subscription', label: 'Premium Subscriptions' },
      { value: 'game_sales', label: 'Game Sales' }
    ],
    defaultEvents: [
      'Game Started',
      'Level Completed',
      'In-App Purchase',
      'Achievement Unlocked',
      'Social Share'
    ],
    suggestedEvents: [
      'Tutorial Completed',
      'Daily Login',
      'Power-Up Used',
      'Multiplayer Match',
      'Leaderboard Viewed',
      'Ad Watched',
      'Friend Invited'
    ],
    demoObjectives: [
      'Player engagement and retention metrics',
      'Monetization and in-app purchase analysis',
      'Level progression and difficulty balancing',
      'Social features and viral growth',
      'Ad revenue optimization'
    ]
  }
};

// Get industry template by key
function getIndustryTemplate(industryKey) {
  return INDUSTRY_TEMPLATES[industryKey] || null;
}

// Get all available industries
function getAllIndustries() {
  return Object.keys(INDUSTRY_TEMPLATES).map(key => ({
    value: key,
    ...INDUSTRY_TEMPLATES[key]
  }));
}

// Get recommended configuration for an industry
function getRecommendedConfig(industryKey) {
  const template = getIndustryTemplate(industryKey);
  if (!template) return null;

  const recommendedBusinessModel = template.businessModels.find(bm => bm.recommended);
  const recommendedRevenueModel = template.revenueModels.find(rm => rm.recommended);

  return {
    industry: industryKey,
    businessModel: recommendedBusinessModel?.value || template.businessModels[0]?.value,
    revenueModel: recommendedRevenueModel?.value || template.revenueModels[0]?.value,
    defaultEvents: template.defaultEvents,
    suggestedDemoObjective: template.demoObjectives[0]
  };
}

module.exports = {
  INDUSTRY_TEMPLATES,
  getIndustryTemplate,
  getAllIndustries,
  getRecommendedConfig
};