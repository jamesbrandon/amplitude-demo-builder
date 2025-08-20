// Configurable Event Generator for Amplitude Demo Template
// Generates realistic events based on industry configuration

const { getConfigLoader } = require('../server/config-loader');

class EventGenerator {
  constructor() {
    this.configLoader = getConfigLoader();
    this.config = null;
    this.eventTemplates = new Map();
    this.initializeTemplates();
  }

  // Initialize event templates based on configuration
  initializeTemplates() {
    this.config = this.configLoader.getConfig();
    this.buildEventTemplates();
  }

  // Build event property templates for each event type
  buildEventTemplates() {
    // Generic templates that work across industries
    const genericTemplates = {
      'Page Viewed': (userSession, config) => ({
        page_title: this.getPageTitle(userSession, config),
        page_url: this.getPageUrl(userSession, config),
        page_path: this.getPagePath(userSession, config),
        referrer: userSession.eventCount === 1 ? this.getReferrer(config) : null,
        ...this.getUtmProperties(userSession, config)
      }),

      'User Signup': (userSession, config) => ({
        signup_method: this.getSignupMethod(config),
        account_type: this.getAccountType(userSession, config),
        referral_code: Math.random() > 0.8 ? this.getReferralCode() : null,
        terms_accepted: true,
        newsletter_opted_in: Math.random() > 0.6,
        ...this.getUtmProperties(userSession, config)
      }),

      'Feature Used': (userSession, config) => ({
        feature_name: this.getFeatureName(userSession, config),
        feature_category: this.getFeatureCategory(userSession, config),
        usage_count: Math.floor(Math.random() * 10) + 1,
        session_duration: Math.floor(Math.random() * 300) + 60,
        is_first_use: Math.random() > 0.7
      }),

      'Subscription Purchased': (userSession, config) => {
        const product = this.getSubscriptionProduct(userSession, config);
        const billingCycle = this.getBillingCycle(product);
        const basePrice = product.price;
        const discount = Math.random() > 0.7 ? 0.2 : 0;
        const finalPrice = basePrice * (1 - discount);

        return {
          product_id: product.id,
          product_name: product.name,
          plan_type: product.category,
          price: basePrice,
          final_price: finalPrice,
          discount_percent: discount * 100,
          billing_cycle: billingCycle,
          currency: product.currency || 'USD',
          revenue: finalPrice,
          $revenue: finalPrice, // Amplitude special property
          payment_method: this.getPaymentMethod(),
          is_trial: userSession.userProperties.journey_stage === 'trial_user',
          previous_plan: this.getPreviousPlan(userSession),
          ...this.getUtmProperties(userSession, config)
        };
      },

      'Product Purchased': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        const quantity = Math.floor(Math.random() * 3) + 1;
        const totalAmount = product.price * quantity;
        const discount = Math.random() > 0.8 ? 0.15 : 0;
        const finalAmount = totalAmount * (1 - discount);

        return {
          product_id: product.id,
          product_name: product.name,
          product_category: product.category,
          price: product.price,
          quantity: quantity,
          total_amount: totalAmount,
          final_amount: finalAmount,
          discount_amount: totalAmount - finalAmount,
          currency: product.currency || 'USD',
          revenue: finalAmount,
          $revenue: finalAmount,
          payment_method: this.getPaymentMethod(),
          is_gift: Math.random() > 0.9,
          ...this.getUtmProperties(userSession, config)
        };
      }
    };

    // Industry-specific templates
    const industryTemplates = this.getIndustrySpecificTemplates();

    // Merge templates
    this.eventTemplates = new Map([
      ...Object.entries(genericTemplates),
      ...Object.entries(industryTemplates)
    ]);
  }

  // Get industry-specific event templates
  getIndustrySpecificTemplates() {
    const industry = this.config.company?.industry;
    
    switch (industry) {
      case 'ecommerce':
        return this.getEcommerceTemplates();
      case 'saas':
        return this.getSaasTemplates();
      case 'iot':
        return this.getIotTemplates();
      case 'hospitality':
        return this.getHospitalityTemplates();
      default:
        return {};
    }
  }

  // E-commerce specific templates
  getEcommerceTemplates() {
    return {
      'Product Added to Cart': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        return {
          product_id: product.id,
          product_name: product.name,
          product_category: product.category,
          price: product.price,
          quantity: Math.floor(Math.random() * 3) + 1,
          cart_total: Math.floor(Math.random() * 500) + 50,
          cart_item_count: Math.floor(Math.random() * 5) + 1,
          size: this.getProductSize(),
          color: this.getProductColor(),
          is_sale_item: Math.random() > 0.7
        };
      },

      'Checkout Started': (userSession, config) => ({
        cart_value: Math.floor(Math.random() * 500) + 50,
        item_count: Math.floor(Math.random() * 5) + 1,
        shipping_method: this.getShippingMethod(),
        payment_method: this.getPaymentMethod(),
        coupon_code: Math.random() > 0.8 ? this.getCouponCode() : null,
        is_guest_checkout: Math.random() > 0.6
      }),

      'Search Performed': (userSession, config) => ({
        search_query: this.getSearchQuery(config),
        search_category: this.getSearchCategory(config),
        results_count: Math.floor(Math.random() * 100) + 1,
        filters_applied: Math.random() > 0.5,
        sort_order: this.getSortOrder()
      }),

      'Product Reviewed': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        return {
          product_id: product.id,
          product_name: product.name,
          product_category: product.category,
          rating: Math.floor(Math.random() * 5) + 1, // 1-5 stars
          review_length: Math.floor(Math.random() * 500) + 50, // 50-550 characters
          has_photos: Math.random() > 0.7,
          verified_purchase: Math.random() > 0.2, // 80% verified
          days_after_purchase: Math.floor(Math.random() * 30) + 1,
          helpful_votes: Math.floor(Math.random() * 10),
          review_sentiment: this.getReviewSentiment()
        };
      },

      'Category Browsed': (userSession, config) => ({
        category_name: this.getProductCategory(config),
        products_viewed: Math.floor(Math.random() * 20) + 1,
        time_spent_seconds: Math.floor(Math.random() * 300) + 30,
        filters_used: Math.random() > 0.6,
        sort_applied: Math.random() > 0.5,
        subcategory_clicked: Math.random() > 0.4
      }),

      'Promotion Clicked': (userSession, config) => ({
        promotion_id: `promo_${Math.random().toString(36).substr(2, 6)}`,
        promotion_name: this.getPromotionName(),
        promotion_type: this.getPromotionType(),
        discount_percent: Math.floor(Math.random() * 50) + 10, // 10-60% off
        placement: this.getPromotionPlacement(),
        campaign_id: `campaign_${Math.random().toString(36).substr(2, 6)}`
      }),

      'Email Opened': (userSession, config) => ({
        email_campaign: this.getEmailCampaign(),
        email_type: this.getEmailType(),
        subject_line: this.getEmailSubject(),
        send_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        open_time: new Date().toISOString(),
        device_type: userSession.platform === 'mobile_app' ? 'mobile' : 'desktop'
      }),

      'Wishlist Added': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        return {
          product_id: product.id,
          product_name: product.name,
          product_category: product.category,
          price: product.price,
          wishlist_size: Math.floor(Math.random() * 20) + 1,
          added_from_page: this.getAddedFromPage(),
          is_sale_item: Math.random() > 0.7
        };
      },

      'Size Guide Viewed': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        return {
          product_id: product.id,
          product_category: product.category,
          guide_type: 'size_chart',
          time_viewed_seconds: Math.floor(Math.random() * 120) + 10,
          size_selected: this.getProductSize()
        };
      },

      'Recommendation Clicked': (userSession, config) => {
        const product = this.getProduct(userSession, config);
        return {
          product_id: product.id,
          product_name: product.name,
          recommendation_type: this.getRecommendationType(),
          recommendation_position: Math.floor(Math.random() * 10) + 1,
          algorithm_version: 'v2.1',
          confidence_score: Math.round((Math.random() * 0.4 + 0.6) * 100) / 100 // 0.6-1.0
        };
      },

      'Account Created': (userSession, config) => ({
        signup_method: this.getSignupMethod(config),
        email_verified: Math.random() > 0.2, // 80% verify email
        newsletter_opted_in: Math.random() > 0.4, // 60% opt in
        referral_code_used: Math.random() > 0.9 ? this.getReferralCode() : null,
        account_type: 'individual',
        signup_source: this.getSignupSource()
      }),

      'Newsletter Subscribed': (userSession, config) => ({
        subscription_type: 'marketing_emails',
        frequency_preference: this.getEmailFrequency(),
        categories_selected: this.getNewsletterCategories(),
        signup_incentive: this.getSignupIncentive(),
        double_opt_in: Math.random() > 0.3 // 70% double opt-in
      })
    };
  }

  // SaaS specific templates
  getSaasTemplates() {
    return {
      'Dashboard Viewed': (userSession, config) => ({
        dashboard_name: this.getDashboardName(config),
        dashboard_type: this.getDashboardType(),
        widgets_count: Math.floor(Math.random() * 10) + 3,
        load_time: Math.floor(Math.random() * 3000) + 500,
        is_custom_dashboard: Math.random() > 0.7,
        shared_with_team: Math.random() > 0.6
      }),

      'Report Generated': (userSession, config) => ({
        report_type: this.getReportType(config),
        data_range: this.getDateRange(),
        export_format: this.getExportFormat(),
        row_count: Math.floor(Math.random() * 10000) + 100,
        generation_time: Math.floor(Math.random() * 30) + 5,
        is_scheduled: Math.random() > 0.8
      }),

      'API Called': (userSession, config) => ({
        endpoint: this.getApiEndpoint(config),
        method: this.getHttpMethod(),
        response_time: Math.floor(Math.random() * 1000) + 50,
        status_code: Math.random() > 0.95 ? 500 : 200,
        data_size: Math.floor(Math.random() * 1000000) + 1000,
        rate_limit_remaining: Math.floor(Math.random() * 1000) + 100
      })
    };
  }

  // IoT specific templates
  getIotTemplates() {
    return {
      'Device Activated': (userSession, config) => ({
        device_id: this.getDeviceId(userSession),
        device_type: this.getDeviceType(config),
        device_model: this.getDeviceModel(config),
        activation_method: this.getActivationMethod(),
        battery_level: Math.floor(Math.random() * 100),
        signal_strength: Math.floor(Math.random() * 100) + 1,
        firmware_version: this.getFirmwareVersion()
      }),

      'Automation Triggered': (userSession, config) => ({
        automation_name: this.getAutomationName(config),
        trigger_type: this.getTriggerType(),
        devices_affected: Math.floor(Math.random() * 5) + 1,
        execution_time: Math.floor(Math.random() * 5000) + 100,
        success: Math.random() > 0.05,
        energy_saved: Math.floor(Math.random() * 100) + 10
      }),

      'Sensor Data Received': (userSession, config) => ({
        sensor_type: this.getSensorType(config),
        sensor_value: Math.floor(Math.random() * 100) + 1,
        unit: this.getSensorUnit(),
        threshold_exceeded: Math.random() > 0.9,
        location: this.getDeviceLocation(),
        timestamp: new Date().toISOString()
      })
    };
  }

  // Generate event properties for a specific event type
  generateEventProperties(eventType, userSession) {
    const template = this.eventTemplates.get(eventType);
    
    if (template) {
      return template(userSession, this.config);
    }

    // Fallback for unknown event types (avoid reserved properties)
    return {
      event_category: this.getEventCategory(eventType),
      user_stage: userSession.userProperties.journey_stage,
      platform: userSession.platform
    };
  }

  // Helper methods for generating realistic data
  getPageTitle(userSession, config) {
    const titles = {
      ecommerce: ['Product Catalog', 'Shopping Cart', 'Checkout', 'Account Settings', 'Order History'],
      saas: ['Dashboard', 'Analytics', 'Settings', 'Team Management', 'Billing'],
      iot: ['Device Control', 'Automation Rules', 'Energy Monitor', 'Security Center', 'Settings']
    };
    
    const industryTitles = titles[config.company?.industry] || titles.saas;
    return `${industryTitles[Math.floor(Math.random() * industryTitles.length)]} - ${config.company?.name}`;
  }

  getPageUrl(userSession, config) {
    const baseDomain = config.company?.website || 'https://example.com';
    const path = this.getPagePath(userSession, config);
    return `${baseDomain}${path}`;
  }

  getPagePath(userSession, config) {
    const paths = {
      ecommerce: ['/products', '/cart', '/checkout', '/account', '/orders'],
      saas: ['/dashboard', '/analytics', '/settings', '/team', '/billing'],
      iot: ['/devices', '/automations', '/energy', '/security', '/settings']
    };
    
    const industryPaths = paths[config.company?.industry] || paths.saas;
    return industryPaths[Math.floor(Math.random() * industryPaths.length)];
  }

  getReferrer(config) {
    const referrers = ['https://google.com', 'https://facebook.com', 'https://linkedin.com', 'direct'];
    return referrers[Math.floor(Math.random() * referrers.length)];
  }

  getUtmProperties(userSession, config) {
    if (userSession.eventCount > 1 || Math.random() > 0.3) {
      return {}; // Only add UTM for some first events
    }

    const sources = config.attribution?.sources || [];
    if (sources.length === 0) return {};

    const source = this.weightedRandom(sources);
    const utm = {
      utm_source: source.utm_source,
      utm_medium: source.utm_medium
    };

    if (source.utm_campaign) {
      utm.utm_campaign = source.utm_campaign;
    }

    return utm;
  }

  getSignupMethod(config) {
    const methods = ['email', 'google', 'facebook', 'linkedin', 'github'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getAccountType(userSession, config) {
    const types = ['individual', 'business', 'enterprise'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getReferralCode() {
    return `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getFeatureName(userSession, config) {
    const features = {
      ecommerce: ['Product Search', 'Wishlist', 'Size Guide', 'Reviews', 'Recommendations'],
      saas: ['Data Export', 'Custom Dashboard', 'Team Collaboration', 'API Access', 'Advanced Analytics'],
      iot: ['Voice Control', 'Scheduling', 'Energy Monitoring', 'Security Alerts', 'Remote Access']
    };
    
    const industryFeatures = features[config.company?.industry] || features.saas;
    return industryFeatures[Math.floor(Math.random() * industryFeatures.length)];
  }

  getFeatureCategory(userSession, config) {
    const categories = {
      ecommerce: ['discovery', 'personalization', 'checkout', 'account'],
      saas: ['analytics', 'collaboration', 'integration', 'administration'],
      iot: ['control', 'automation', 'monitoring', 'security']
    };
    
    const industryCategories = categories[config.company?.industry] || categories.saas;
    return industryCategories[Math.floor(Math.random() * industryCategories.length)];
  }

  getSubscriptionProduct(userSession, config) {
    const subscriptions = config.products?.filter(p => p.category === 'subscription') || [];
    return subscriptions.length > 0 ? subscriptions[Math.floor(Math.random() * subscriptions.length)] : {
      id: 'basic_plan',
      name: 'Basic Plan',
      price: 29.99,
      currency: 'USD'
    };
  }

  getProduct(userSession, config) {
    const products = config.products || [];
    return products.length > 0 ? products[Math.floor(Math.random() * products.length)] : {
      id: 'sample_product',
      name: 'Sample Product',
      category: 'general',
      price: 99.99,
      currency: 'USD'
    };
  }

  getBillingCycle(product) {
    const cycles = product.billingCycles || ['monthly', 'yearly'];
    return cycles[Math.floor(Math.random() * cycles.length)];
  }

  getPaymentMethod() {
    const methods = ['credit_card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getPreviousPlan(userSession) {
    const plans = ['free', 'basic', 'premium'];
    return plans[Math.floor(Math.random() * plans.length)];
  }

  // Utility method for weighted random selection
  weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= (item.weight || 1);
      if (random <= 0) {
        return item;
      }
    }
    
    return items[0]; // Fallback
  }

  // Hospitality specific templates
  getHospitalityTemplates() {
    return {
      'Room Search Performed': (userSession, config) => ({
        check_in_date: this.getFutureDate(1, 30),
        check_out_date: this.getFutureDate(2, 35),
        guests_count: Math.floor(Math.random() * 4) + 1,
        rooms_count: Math.floor(Math.random() * 2) + 1,
        room_type_preference: this.getRoomType(),
        price_range_min: Math.floor(Math.random() * 200) + 100,
        price_range_max: Math.floor(Math.random() * 300) + 300,
        location_filter: this.getLocationFilter(),
        amenities_filter: this.getAmenitiesFilter(),
        search_results_count: Math.floor(Math.random() * 50) + 10
      }),

      'Room Viewed': (userSession, config) => {
        const room = this.getAccommodationProduct(userSession, config);
        return {
          room_id: room.id,
          room_name: room.name,
          room_type: room.category,
          nightly_rate: room.price,
          total_price: room.price * (Math.floor(Math.random() * 5) + 1),
          availability: Math.random() > 0.1,
          view_duration: Math.floor(Math.random() * 300) + 30,
          images_viewed: Math.floor(Math.random() * 8) + 1,
          amenities_viewed: Math.random() > 0.6,
          reviews_viewed: Math.random() > 0.7,
          floor_plan_viewed: Math.random() > 0.4
        };
      },

      'Booking Started': (userSession, config) => {
        const room = this.getAccommodationProduct(userSession, config);
        const nights = Math.floor(Math.random() * 7) + 1;
        return {
          room_id: room.id,
          room_type: room.category,
          check_in_date: this.getFutureDate(1, 30),
          check_out_date: this.getFutureDate(2, 37),
          nights_count: nights,
          guests_count: Math.floor(Math.random() * 4) + 1,
          rooms_count: Math.floor(Math.random() * 2) + 1,
          base_rate: room.price,
          total_amount: room.price * nights,
          booking_channel: this.getBookingChannel(),
          promo_code: Math.random() > 0.8 ? this.getPromoCode() : null,
          special_requests: Math.random() > 0.6
        };
      },

      'Booking Completed': (userSession, config) => {
        const room = this.getAccommodationProduct(userSession, config);
        const nights = Math.floor(Math.random() * 7) + 1;
        const baseAmount = room.price * nights;
        const taxes = baseAmount * 0.12;
        const fees = Math.floor(Math.random() * 50) + 25;
        const totalAmount = baseAmount + taxes + fees;
        
        return {
          booking_id: this.generateBookingId(),
          room_id: room.id,
          room_type: room.category,
          check_in_date: this.getFutureDate(1, 30),
          check_out_date: this.getFutureDate(2, 37),
          nights_count: nights,
          guests_count: Math.floor(Math.random() * 4) + 1,
          rooms_count: Math.floor(Math.random() * 2) + 1,
          base_amount: baseAmount,
          taxes_amount: taxes,
          fees_amount: fees,
          total_amount: totalAmount,
          revenue: totalAmount,
          $revenue: totalAmount,
          currency: room.currency || 'USD',
          payment_method: this.getPaymentMethod(),
          booking_channel: this.getBookingChannel(),
          is_direct_booking: Math.random() > 0.6,
          loyalty_member: userSession.userProperties.journey_stage !== 'prospect',
          confirmation_number: this.generateConfirmationNumber(),
          ...this.getUtmProperties(userSession, config)
        };
      },

      'Check-in Completed': (userSession, config) => ({
        booking_id: this.generateBookingId(),
        room_number: this.getRoomNumber(),
        check_in_method: this.getCheckInMethod(),
        check_in_time: new Date().toISOString(),
        early_check_in: Math.random() > 0.8,
        mobile_check_in: Math.random() > 0.4,
        digital_key_issued: Math.random() > 0.6,
        welcome_amenity: Math.random() > 0.7,
        room_upgrade: Math.random() > 0.85,
        special_occasion: this.getSpecialOccasion(),
        guest_preferences_noted: Math.random() > 0.5
      }),

      'Amenity Used': (userSession, config) => {
        const amenity = this.getAmenityType();
        return {
          amenity_type: amenity.type,
          amenity_name: amenity.name,
          usage_duration: Math.floor(Math.random() * 180) + 15,
          time_of_day: this.getTimeOfDay(),
          guest_satisfaction: Math.floor(Math.random() * 3) + 3, // 3-5 rating
          additional_services: Math.random() > 0.6,
          cost: amenity.cost || 0,
          is_complimentary: amenity.cost === 0,
          location: amenity.location
        };
      },

      'Room Service Ordered': (userSession, config) => {
        const items = Math.floor(Math.random() * 4) + 1;
        const itemCost = Math.floor(Math.random() * 80) + 20;
        const deliveryFee = 8.99;
        const tip = Math.floor(Math.random() * 15) + 5;
        const total = itemCost + deliveryFee + tip;
        
        return {
          order_id: this.generateOrderId(),
          items_count: items,
          order_value: itemCost,
          delivery_fee: deliveryFee,
          tip_amount: tip,
          total_amount: total,
          revenue: total,
          $revenue: total,
          currency: 'USD',
          meal_type: this.getMealType(),
          dietary_restrictions: Math.random() > 0.8,
          delivery_time_requested: this.getDeliveryTime(),
          special_instructions: Math.random() > 0.6,
          payment_method: 'room_charge'
        };
      },

      'Spa Service Booked': (userSession, config) => {
        const service = this.getSpaService();
        return {
          service_id: service.id,
          service_name: service.name,
          service_category: service.category,
          duration_minutes: service.duration,
          price: service.price,
          revenue: service.price,
          $revenue: service.price,
          currency: 'USD',
          appointment_date: this.getFutureDate(0, 7),
          therapist_preference: Math.random() > 0.7,
          package_booking: Math.random() > 0.6,
          add_on_services: Math.random() > 0.5,
          first_time_spa_guest: userSession.userProperties.journey_stage === 'booker'
        };
      },

      'Restaurant Reservation Made': (userSession, config) => ({
        restaurant_name: this.getRestaurantName(),
        reservation_date: this.getFutureDate(0, 14),
        reservation_time: this.getDiningTime(),
        party_size: Math.floor(Math.random() * 6) + 1,
        seating_preference: this.getSeatingPreference(),
        special_occasion: this.getSpecialOccasion(),
        dietary_restrictions: Math.random() > 0.8,
        wine_pairing_interest: Math.random() > 0.6,
        advance_booking_days: Math.floor(Math.random() * 14)
      }),

      'Mobile App Opened': (userSession, config) => ({
        app_version: '3.2.1',
        platform: userSession.platform,
        session_start_time: new Date().toISOString(),
        push_notification_enabled: Math.random() > 0.3,
        location_services_enabled: Math.random() > 0.7,
        biometric_login: Math.random() > 0.5,
        on_property: Math.random() > 0.4,
        previous_session_duration: Math.floor(Math.random() * 600) + 60
      }),

      'Digital Key Used': (userSession, config) => ({
        room_number: this.getRoomNumber(),
        access_type: this.getAccessType(),
        access_time: new Date().toISOString(),
        success: Math.random() > 0.05,
        attempt_count: Math.random() > 0.9 ? 2 : 1,
        bluetooth_connection: Math.random() > 0.8,
        battery_level: Math.floor(Math.random() * 100),
        door_type: this.getDoorType()
      }),

      'Guest Survey Completed': (userSession, config) => ({
        survey_type: this.getSurveyType(),
        overall_satisfaction: Math.floor(Math.random() * 3) + 3, // 3-5 rating
        room_satisfaction: Math.floor(Math.random() * 3) + 3,
        service_satisfaction: Math.floor(Math.random() * 3) + 3,
        amenities_satisfaction: Math.floor(Math.random() * 3) + 3,
        likelihood_to_recommend: Math.floor(Math.random() * 6) + 5, // 5-10 NPS
        completion_time: Math.floor(Math.random() * 300) + 120,
        feedback_provided: Math.random() > 0.6,
        incentive_offered: Math.random() > 0.5
      }),

      'Loyalty Program Joined': (userSession, config) => ({
        program_tier: 'Silver',
        signup_method: this.getLoyaltySignupMethod(),
        welcome_bonus_points: 500,
        email_opt_in: Math.random() > 0.2,
        sms_opt_in: Math.random() > 0.6,
        birthday_provided: Math.random() > 0.8,
        preferences_set: Math.random() > 0.7,
        referral_source: Math.random() > 0.3 ? this.getReferralSource() : null
      }),

      'Points Earned': (userSession, config) => {
        const basePoints = Math.floor(Math.random() * 500) + 100;
        const bonusMultiplier = Math.random() > 0.8 ? 2 : 1;
        const totalPoints = basePoints * bonusMultiplier;
        
        return {
          points_earned: totalPoints,
          base_points: basePoints,
          bonus_points: totalPoints - basePoints,
          earning_activity: this.getPointsEarningActivity(),
          tier_status: this.getLoyaltyTier(userSession),
          points_balance: Math.floor(Math.random() * 5000) + totalPoints,
          tier_progress: Math.floor(Math.random() * 100)
        };
      },

      'Check-out Completed': (userSession, config) => {
        const incidentals = Math.floor(Math.random() * 200);
        return {
          booking_id: this.generateBookingId(),
          room_number: this.getRoomNumber(),
          check_out_time: new Date().toISOString(),
          late_check_out: Math.random() > 0.8,
          express_check_out: Math.random() > 0.6,
          incidental_charges: incidentals,
          final_bill_amount: Math.floor(Math.random() * 1000) + 200 + incidentals,
          payment_method: this.getPaymentMethod(),
          receipt_method: this.getReceiptMethod(),
          satisfaction_rating: Math.floor(Math.random() * 3) + 3,
          return_intent: Math.random() > 0.3
        };
      },

      'Direct Booking Made': (userSession, config) => {
        const room = this.getAccommodationProduct(userSession, config);
        const nights = Math.floor(Math.random() * 7) + 1;
        const baseAmount = room.price * nights;
        const loyaltyDiscount = Math.random() > 0.6 ? baseAmount * 0.1 : 0; // 10% loyalty discount
        const totalAmount = baseAmount - loyaltyDiscount;
        
        return {
          booking_id: this.generateBookingId(),
          room_id: room.id,
          room_type: room.category,
          check_in_date: this.getFutureDate(7, 60),
          check_out_date: this.getFutureDate(8, 67),
          nights_count: nights,
          guests_count: Math.floor(Math.random() * 4) + 1,
          base_amount: baseAmount,
          loyalty_discount: loyaltyDiscount,
          total_amount: totalAmount,
          revenue: totalAmount,
          $revenue: totalAmount,
          currency: room.currency || 'USD',
          booking_channel: 'direct_website',
          is_repeat_guest: true,
          loyalty_member: true,
          loyalty_tier: this.getLoyaltyTier(userSession),
          advance_booking_days: Math.floor(Math.random() * 60) + 7,
          room_upgrade_offered: Math.random() > 0.7,
          special_requests: Math.random() > 0.5
        };
      },

      'Elite Status Achieved': (userSession, config) => ({
        previous_tier: this.getPreviousLoyaltyTier(userSession),
        new_tier: 'Elite',
        qualification_period: 'annual',
        nights_stayed: Math.floor(Math.random() * 20) + 50, // 50-70 nights
        points_earned: Math.floor(Math.random() * 50000) + 100000, // 100k-150k points
        revenue_generated: Math.floor(Math.random() * 20000) + 25000, // $25k-45k
        benefits_unlocked: this.getEliteBenefits(),
        achievement_date: new Date().toISOString().split('T')[0],
        congratulations_sent: true,
        welcome_package_eligible: true
      }),

      'Referral Made': (userSession, config) => ({
        referral_code: this.generateReferralCode(),
        referral_method: this.getReferralMethod(),
        referred_guest_email: `guest${Math.random().toString(36).substr(2, 6)}@example.com`,
        referral_incentive: this.getReferralIncentive(),
        referral_value: Math.floor(Math.random() * 200) + 100, // $100-300 credit
        campaign_source: 'loyalty_program',
        sharing_platform: this.getSharingPlatform()
      }),

      'Corporate Account Created': (userSession, config) => ({
        company_name: this.getCompanyName(),
        company_size: this.getCompanySize(),
        industry: this.getCompanyIndustry(),
        account_type: 'corporate',
        negotiated_rates: true,
        credit_limit: Math.floor(Math.random() * 50000) + 10000, // $10k-60k
        payment_terms: this.getPaymentTerms(),
        dedicated_manager: Math.random() > 0.5,
        volume_commitment: Math.floor(Math.random() * 100) + 50 // 50-150 nights/year
      })
    };
  }

  // Hospitality-specific helper methods
  getFutureDate(minDays, maxDays) {
    const days = Math.floor(Math.random() * (maxDays - minDays)) + minDays;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  getRoomType() {
    const types = ['standard', 'deluxe', 'suite', 'villa', 'penthouse'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getLocationFilter() {
    const filters = ['ocean_view', 'city_view', 'garden_view', 'pool_view', 'mountain_view'];
    return filters[Math.floor(Math.random() * filters.length)];
  }

  getAmenitiesFilter() {
    const amenities = ['spa', 'fitness', 'pool', 'restaurant', 'business_center', 'pet_friendly'];
    const selectedAmenities = amenities.slice(0, Math.floor(Math.random() * 3) + 1);
    return selectedAmenities.join(', '); // Return as comma-separated string, not array
  }

  getAccommodationProduct(userSession, config) {
    const accommodations = config.products?.filter(p => p.category === 'accommodation') || [];
    return accommodations.length > 0 ? accommodations[Math.floor(Math.random() * accommodations.length)] : {
      id: 'standard_room',
      name: 'Standard Room',
      category: 'accommodation',
      price: 199.99,
      currency: 'USD'
    };
  }

  getBookingChannel() {
    const channels = ['direct_website', 'mobile_app', 'phone', 'booking_com', 'expedia', 'walk_in'];
    return channels[Math.floor(Math.random() * channels.length)];
  }

  getPromoCode() {
    const codes = ['SAVE20', 'WEEKEND', 'LOYALTY', 'EARLY_BIRD', 'LAST_MINUTE'];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  generateBookingId() {
    return `BK${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateConfirmationNumber() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  generateOrderId() {
    return `RS${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getRoomNumber() {
    const floor = Math.floor(Math.random() * 20) + 1;
    const room = Math.floor(Math.random() * 50) + 1;
    return `${floor}${room.toString().padStart(2, '0')}`;
  }

  getCheckInMethod() {
    const methods = ['front_desk', 'mobile_app', 'kiosk', 'concierge'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getSpecialOccasion() {
    if (Math.random() > 0.7) {
      const occasions = ['birthday', 'anniversary', 'honeymoon', 'business_trip', 'vacation'];
      return occasions[Math.floor(Math.random() * occasions.length)];
    }
    return null;
  }

  getAmenityType() {
    const amenities = [
      { type: 'pool', name: 'Swimming Pool', cost: 0, location: 'pool_deck' },
      { type: 'fitness', name: 'Fitness Center', cost: 0, location: 'level_2' },
      { type: 'spa', name: 'Spa & Wellness', cost: 150, location: 'spa_level' },
      { type: 'business', name: 'Business Center', cost: 0, location: 'lobby' },
      { type: 'concierge', name: 'Concierge Service', cost: 0, location: 'lobby' },
      { type: 'valet', name: 'Valet Parking', cost: 35, location: 'entrance' }
    ];
    return amenities[Math.floor(Math.random() * amenities.length)];
  }

  getTimeOfDay() {
    const times = ['morning', 'afternoon', 'evening', 'night'];
    return times[Math.floor(Math.random() * times.length)];
  }

  getMealType() {
    const meals = ['breakfast', 'lunch', 'dinner', 'snack', 'late_night'];
    return meals[Math.floor(Math.random() * meals.length)];
  }

  getDeliveryTime() {
    const minutes = [15, 30, 45, 60];
    return `${minutes[Math.floor(Math.random() * minutes.length)]} minutes`;
  }

  getSpaService() {
    const services = [
      { id: 'massage_60', name: 'Swedish Massage', category: 'massage', duration: 60, price: 150 },
      { id: 'facial_90', name: 'Rejuvenating Facial', category: 'facial', duration: 90, price: 120 },
      { id: 'couples_massage', name: 'Couples Massage', category: 'massage', duration: 90, price: 300 },
      { id: 'body_wrap', name: 'Detox Body Wrap', category: 'body_treatment', duration: 75, price: 180 }
    ];
    return services[Math.floor(Math.random() * services.length)];
  }

  getRestaurantName() {
    const restaurants = ['Ocean Breeze Grill', 'Sunset Terrace', 'The Garden Bistro', 'Rooftop Lounge', 'Poolside Cafe'];
    return restaurants[Math.floor(Math.random() * restaurants.length)];
  }

  getDiningTime() {
    const times = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
    return times[Math.floor(Math.random() * times.length)];
  }

  getSeatingPreference() {
    const preferences = ['window', 'patio', 'booth', 'bar', 'private_dining'];
    return preferences[Math.floor(Math.random() * preferences.length)];
  }

  getAccessType() {
    const types = ['room_entry', 'elevator', 'amenity_access', 'parking_garage'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getDoorType() {
    const types = ['room_door', 'elevator', 'amenity_door', 'garage_gate'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getSurveyType() {
    const types = ['post_stay', 'mid_stay', 'pre_arrival', 'service_specific'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getLoyaltySignupMethod() {
    const methods = ['mobile_app', 'website', 'front_desk', 'email_invitation'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getReferralSource() {
    const sources = ['friend', 'family', 'colleague', 'social_media', 'review_site'];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  getPointsEarningActivity() {
    const activities = ['room_stay', 'dining', 'spa_service', 'bonus_promotion', 'referral'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  getLoyaltyTier(userSession) {
    const tiers = ['Silver', 'Gold', 'Platinum', 'Diamond'];
    const stageIndex = ['prospect', 'booker', 'guest', 'repeat_guest', 'vip_guest'].indexOf(userSession.currentJourneyStep);
    return tiers[Math.min(stageIndex, tiers.length - 1)] || 'Silver';
  }

  getReceiptMethod() {
    const methods = ['email', 'sms', 'printed', 'mobile_app'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getPreviousLoyaltyTier(userSession) {
    const tiers = ['Silver', 'Gold', 'Platinum'];
    return tiers[Math.floor(Math.random() * tiers.length)];
  }

  getEliteBenefits() {
    const benefits = ['room_upgrades', 'late_checkout', 'lounge_access', 'priority_reservations', 'bonus_points'];
    return benefits.slice(0, Math.floor(Math.random() * 3) + 2).join(', ');
  }

  generateReferralCode() {
    return `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  getReferralMethod() {
    const methods = ['email', 'social_media', 'word_of_mouth', 'mobile_app'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getReferralIncentive() {
    const incentives = ['account_credit', 'free_night', 'room_upgrade', 'dining_credit'];
    return incentives[Math.floor(Math.random() * incentives.length)];
  }

  getSharingPlatform() {
    const platforms = ['facebook', 'twitter', 'linkedin', 'email', 'whatsapp'];
    return platforms[Math.floor(Math.random() * platforms.length)];
  }

  getCompanyName() {
    const companies = ['TechCorp Inc', 'Global Solutions Ltd', 'Innovation Partners', 'Business Dynamics', 'Enterprise Systems'];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  getCompanySize() {
    const sizes = ['small', 'medium', 'large', 'enterprise'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getCompanyIndustry() {
    const industries = ['technology', 'finance', 'healthcare', 'manufacturing', 'consulting'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  getPaymentTerms() {
    const terms = ['net_30', 'net_60', 'prepaid', 'credit_card'];
    return terms[Math.floor(Math.random() * terms.length)];
  }

  // E-commerce helper methods
  getProductSize() {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getProductColor() {
    const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Navy', 'Brown'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getShippingMethod() {
    const methods = ['standard', 'express', 'overnight', 'pickup'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  getCouponCode() {
    const codes = ['SAVE10', 'WELCOME20', 'FREESHIP', 'NEWUSER', 'HOLIDAY25'];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  getSearchQuery(config) {
    const queries = {
      ecommerce: ['summer dress', 'running shoes', 'laptop bag', 'wireless headphones'],
      saas: ['analytics dashboard', 'data export', 'user management', 'api integration'],
      iot: ['smart thermostat', 'security camera', 'door lock', 'lighting control'],
      hospitality: ['ocean view room', 'spa package', 'airport transfer', 'restaurant reservation']
    };
    
    const industryQueries = queries[config.company?.industry] || queries.ecommerce;
    return industryQueries[Math.floor(Math.random() * industryQueries.length)];
  }

  getSearchCategory(config) {
    const categories = {
      ecommerce: ['clothing', 'electronics', 'accessories', 'shoes'],
      saas: ['features', 'integrations', 'reports', 'settings'],
      iot: ['security', 'climate', 'lighting', 'entertainment'],
      hospitality: ['rooms', 'amenities', 'dining', 'activities']
    };
    
    const industryCategories = categories[config.company?.industry] || categories.ecommerce;
    return industryCategories[Math.floor(Math.random() * industryCategories.length)];
  }

  getSortOrder() {
    const orders = ['price_low_high', 'price_high_low', 'newest', 'popularity', 'rating'];
    return orders[Math.floor(Math.random() * orders.length)];
  }

  getReviewSentiment() {
    const sentiments = ['positive', 'neutral', 'negative'];
    const weights = [0.6, 0.3, 0.1]; // 60% positive, 30% neutral, 10% negative
    const random = Math.random();
    
    if (random < weights[0]) return sentiments[0];
    if (random < weights[0] + weights[1]) return sentiments[1];
    return sentiments[2];
  }

  getProductCategory(config) {
    const categories = ['dresses', 'shoes', 'accessories', 'tops', 'bottoms', 'outerwear'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  getPromotionName() {
    const names = ['Summer Sale', 'Flash Deal', 'Weekend Special', 'New Arrival Discount', 'Clearance Event'];
    return names[Math.floor(Math.random() * names.length)];
  }

  getPromotionType() {
    const types = ['percentage_off', 'fixed_amount', 'buy_one_get_one', 'free_shipping'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getPromotionPlacement() {
    const placements = ['homepage_banner', 'product_page', 'cart_page', 'email', 'popup'];
    return placements[Math.floor(Math.random() * placements.length)];
  }

  getEmailCampaign() {
    const campaigns = ['weekly_newsletter', 'abandoned_cart', 'new_arrivals', 'sale_announcement', 'welcome_series'];
    return campaigns[Math.floor(Math.random() * campaigns.length)];
  }

  getEmailType() {
    const types = ['promotional', 'transactional', 'newsletter', 'abandoned_cart', 'welcome'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getEmailSubject() {
    const subjects = ['Your cart is waiting', 'New arrivals just for you', 'Limited time offer', 'Welcome to StyleHub', 'Weekly fashion update'];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  getAddedFromPage() {
    const pages = ['product_page', 'category_page', 'search_results', 'recommendations', 'homepage'];
    return pages[Math.floor(Math.random() * pages.length)];
  }

  getRecommendationType() {
    const types = ['similar_products', 'frequently_bought_together', 'recently_viewed', 'trending', 'personalized'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getSignupSource() {
    const sources = ['homepage', 'checkout', 'product_page', 'email_signup', 'social_media'];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  getEmailFrequency() {
    const frequencies = ['daily', 'weekly', 'bi_weekly', 'monthly'];
    return frequencies[Math.floor(Math.random() * frequencies.length)];
  }

  getNewsletterCategories() {
    const categories = ['new_arrivals', 'sales', 'style_tips', 'exclusive_offers'];
    const selected = categories.filter(() => Math.random() > 0.5);
    return selected.length > 0 ? selected.join(', ') : 'new_arrivals';
  }

  getSignupIncentive() {
    const incentives = ['10_percent_off', 'free_shipping', 'exclusive_access', 'style_guide', 'none'];
    return incentives[Math.floor(Math.random() * incentives.length)];
  }

  // SaaS helper methods
  getDashboardName(config) {
    const names = ['Analytics Overview', 'Sales Performance', 'User Engagement', 'Revenue Metrics', 'Custom Dashboard'];
    return names[Math.floor(Math.random() * names.length)];
  }

  getDashboardType() {
    const types = ['overview', 'detailed', 'custom', 'template'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getReportType(config) {
    const types = ['user_activity', 'revenue_summary', 'engagement_metrics', 'conversion_funnel', 'custom_report'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getDateRange() {
    const ranges = ['last_7_days', 'last_30_days', 'last_90_days', 'custom_range'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  getExportFormat() {
    const formats = ['csv', 'xlsx', 'pdf', 'json'];
    return formats[Math.floor(Math.random() * formats.length)];
  }

  getApiEndpoint(config) {
    const endpoints = ['/api/users', '/api/analytics', '/api/reports', '/api/integrations', '/api/settings'];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  getHttpMethod() {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  // Additional helper methods
  getEventCategory(eventType) {
    if (eventType.includes('Purchase') || eventType.includes('Revenue') || eventType.includes('Booking Completed')) return 'monetization';
    if (eventType.includes('Page') || eventType.includes('View') || eventType.includes('Room Viewed')) return 'engagement';
    if (eventType.includes('Sign') || eventType.includes('Account') || eventType.includes('Check-in')) return 'authentication';
    if (eventType.includes('Amenity') || eventType.includes('Service') || eventType.includes('Room Service')) return 'service_usage';
    return 'interaction';
  }

  // Reload configuration
  reloadConfig() {
    this.initializeTemplates();
  }
}

module.exports = { EventGenerator };