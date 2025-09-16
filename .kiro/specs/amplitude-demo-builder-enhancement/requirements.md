# Amplitude Demo Builder Enhancement - Requirements Document

## Introduction

The Amplitude Demo Builder is a comprehensive system for creating professional, industry-specific Amplitude Analytics demonstrations with historical data backfill, realistic user journeys, and client branding. This enhancement spec documents the existing system's established patterns and standards to ensure any future modifications maintain the sophisticated architecture and Amplitude best practices already implemented.

## Requirements

### Requirement 1: Amplitude Standards Compliance

**User Story:** As a solutions engineer, I want all generated events to follow Amplitude's strict formatting requirements, so that demos are technically accurate and can be used for client training.

#### Acceptance Criteria

1. WHEN events are generated THEN the system SHALL use numeric session IDs (not strings) as required by Amplitude
2. WHEN event properties are created THEN the system SHALL sanitize property names to use only a-z, A-Z, 0-9, and underscore characters
3. WHEN event properties are created THEN the system SHALL limit property names to 255 characters maximum
4. WHEN event properties are created THEN the system SHALL limit string values to 1024 characters maximum
5. WHEN events contain revenue data THEN the system SHALL use the special `$revenue` property format required by Amplitude
6. WHEN events are sent THEN the system SHALL exclude reserved Amplitude properties (user_id, device_id, session_id, time, event_id, insert_id, event_type) from event_properties
7. WHEN simple arrays or nested objects are encountered THEN the system SHALL convert them to comma-separated strings or JSON strings respectively, EXCEPT for Amplitude-supported array formats like cart items or content arrays which SHALL be preserved as structured arrays
8. WHEN invalid numeric values (NaN, Infinity) are encountered THEN the system SHALL convert them to valid numbers or filter them out
9. WHEN events are tracked THEN the system SHALL include proper device_id, platform, and timestamp fields
10. WHEN user properties are set THEN the system SHALL use the identify() method separately from track() calls
11. WHEN cart or content arrays are needed THEN the system SHALL use Amplitude's supported array format with objects containing consistent property schemas (e.g., [{product_id, name, price, quantity}, {product_id, name, price, quantity}])
12. WHEN sending real-time events THEN the system SHALL use the Node.js SDK track() method
13. WHEN sending historical events THEN the system SHALL use direct HTTPS calls to the Batch API endpoint (api2.amplitude.com/batch) with proper authentication

### Requirement 2: Realistic User Journey Simulation

**User Story:** As a sales professional, I want the demo to show realistic user behavior patterns, so that prospects can relate to the data and see authentic user progression.

#### Acceptance Criteria

1. WHEN users are created THEN the system SHALL assign them to appropriate journey stages (visitor, prospect, customer, power_user)
2. WHEN events are generated THEN the system SHALL progress users through journey stages based on realistic conversion rates
3. WHEN session management occurs THEN the system SHALL create new sessions after 30 minutes of inactivity
4. WHEN user sessions are created THEN the system SHALL include realistic attributes (signup_date, days_since_signup, platform_preference)
5. WHEN events are generated THEN the system SHALL vary event frequency based on user engagement level
6. WHEN attribution data is created THEN the system SHALL include both initial (first-touch) and current (last-touch) UTM parameters
7. WHEN user progression occurs THEN the system SHALL update user properties to reflect their current journey stage
8. WHEN events are selected THEN the system SHALL choose event types appropriate to the user's current journey stage
9. WHEN revenue events are generated THEN the system SHALL make them more likely for users in later journey stages
10. WHEN user sessions exceed 200 active sessions THEN the system SHALL clean up oldest sessions to maintain performance

### Requirement 3: Industry-Specific Event Generation

**User Story:** As a consultant, I want events to be relevant to specific industries, so that demos resonate with prospects in their particular business vertical.

#### Acceptance Criteria

1. WHEN an industry configuration is loaded THEN the system SHALL generate events specific to that industry's business model
2. WHEN e-commerce events are generated THEN the system SHALL include product_id, price, quantity, cart_total, and payment_method properties, AND SHALL use Amplitude's cart analytics format for multi-item purchases with arrays of product objects
3. WHEN SaaS events are generated THEN the system SHALL include feature_name, dashboard_type, report_type, and subscription-related properties
4. WHEN hospitality events are generated THEN the system SHALL include booking_id, room_type, check_in_date, guest_count, and amenity usage properties
5. WHEN media events are generated THEN the system SHALL include content_id, genre, duration, completion_rate, and engagement properties
6. WHEN IoT events are generated THEN the system SHALL include device_id, sensor_type, automation_name, and energy_usage properties
7. WHEN FinTech events are generated THEN the system SHALL include transaction_id, account_type, investment_amount, and compliance properties
8. WHEN event properties are generated THEN the system SHALL use industry-appropriate terminology and realistic value ranges
9. WHEN products are referenced THEN the system SHALL use the products array from the industry configuration
10. WHEN attribution sources are used THEN the system SHALL use industry-appropriate marketing channels and campaigns

### Requirement 4: Historical Data Backfill Capabilities

**User Story:** As a solutions engineer, I want to generate months of historical data efficiently, so that demos show rich analytics with realistic data depth.

#### Acceptance Criteria

1. WHEN historical data generation is requested THEN the system SHALL use Amplitude's Batch API (/batch endpoint) exclusively for bulk uploads, NOT the real-time track API
2. WHEN batch events are created THEN the system SHALL format them with proper Unix timestamps in milliseconds
3. WHEN historical users are generated THEN the system SHALL create realistic signup dates distributed over the historical period
4. WHEN historical events are generated THEN the system SHALL progress users through journey stages over time
5. WHEN batch uploads are sent THEN the system SHALL respect Amplitude's 1000 event maximum per batch
6. WHEN historical attribution is generated THEN the system SHALL use weighted random selection from configured sources
7. WHEN historical events are timed THEN the system SHALL distribute them realistically throughout each day
8. WHEN batch API calls are made THEN the system SHALL handle errors gracefully and provide detailed logging
9. WHEN historical data generation completes THEN the system SHALL report total events, users, and days generated
10. WHEN demo mode is active THEN the system SHALL simulate batch operations without sending to Amplitude
11. WHEN real-time events are generated THEN the system SHALL use the track() API for immediate event sending
12. WHEN historical events are generated THEN the system SHALL format them for the Batch API with proper event structure (user_id, event_type, time as Unix timestamp, event_properties, user_properties)

### Requirement 5: Multi-Industry Configuration System

**User Story:** As a developer, I want a flexible configuration system that supports multiple industries, so that new verticals can be easily added without code changes.

#### Acceptance Criteria

1. WHEN industry configurations are loaded THEN the system SHALL merge them with base configuration using deep object merging
2. WHEN configuration validation occurs THEN the system SHALL verify required sections (company, scenarios, userJourney, products, attribution)
3. WHEN scenarios are defined THEN the system SHALL include event arrays, weights, names, and descriptions
4. WHEN user journey stages are configured THEN the system SHALL include conversion rates, duration, and stage-appropriate events
5. WHEN products are defined THEN the system SHALL include id, name, category, price, and currency fields
6. WHEN attribution sources are configured THEN the system SHALL include utm_source, utm_medium, utm_campaign, and weight properties
7. WHEN branding is specified THEN the system SHALL include primaryColor and secondaryColor for client customization
8. WHEN new industries are added THEN the system SHALL automatically detect them in the examples directory
9. WHEN configuration errors occur THEN the system SHALL provide detailed validation messages
10. WHEN configurations are reloaded THEN the system SHALL update all dependent components without restart

### Requirement 6: Real-Time Demo Interface

**User Story:** As a sales professional, I want a professional web interface that shows events in real-time, so that I can demonstrate Amplitude's capabilities during client meetings.

#### Acceptance Criteria

1. WHEN the demo starts THEN the system SHALL broadcast events to connected clients via WebSocket
2. WHEN events are generated THEN the system SHALL display them with event type, user ID, properties count, and timestamp
3. WHEN demo statistics are requested THEN the system SHALL show total events, unique users, connection status, and recent event types
4. WHEN multiple clients connect THEN the system SHALL maintain separate WebSocket connections for each
5. WHEN demo scenarios are selected THEN the system SHALL adjust event generation to match scenario weights
6. WHEN Amplitude connection status changes THEN the system SHALL update all connected clients immediately
7. WHEN events are sent to Amplitude THEN the system SHALL display success/failure status in real-time
8. WHEN demo is stopped THEN the system SHALL cease event generation and notify all clients
9. WHEN API endpoints are called THEN the system SHALL provide proper CORS headers for web interface access
10. WHEN health checks are performed THEN the system SHALL return comprehensive system status including configuration details

### Requirement 7: Client Demo Generation System

**User Story:** As a consultant, I want to generate complete, branded demo projects for clients, so that I can deliver professional demonstrations tailored to their specific needs.

#### Acceptance Criteria

1. WHEN client demos are generated THEN the system SHALL create complete Node.js applications with all dependencies
2. WHEN client branding is applied THEN the system SHALL customize colors, company names, and messaging throughout the interface
3. WHEN client configurations are created THEN the system SHALL merge client-specific settings with industry templates
4. WHEN demo projects are generated THEN the system SHALL include Docker deployment configurations
5. WHEN client APIs keys are provided THEN the system SHALL pre-configure Amplitude connections
6. WHEN historical data options are selected THEN the system SHALL include batch generation capabilities
7. WHEN deployment files are created THEN the system SHALL include environment variable templates
8. WHEN project documentation is generated THEN the system SHALL include client-specific setup instructions
9. WHEN web generator interface is used THEN the system SHALL provide form-based demo creation
10. WHEN CLI generator is used THEN the system SHALL provide interactive prompts for all configuration options

### Requirement 8: Attribution and UTM Tracking

**User Story:** As a marketing analyst, I want comprehensive attribution tracking with both first-touch and last-touch data, so that I can demonstrate proper marketing attribution analysis.

#### Acceptance Criteria

1. WHEN new users are created THEN the system SHALL set initial_utm_* properties for first-touch attribution
2. WHEN users return with new UTM parameters THEN the system SHALL update current utm_* properties for last-touch attribution
3. WHEN attribution data is processed THEN the system SHALL classify marketing channels (paid_search, social_media, email_marketing, etc.)
4. WHEN UTM parameters are extracted THEN the system SHALL include utm_source, utm_medium, utm_campaign, utm_content, and utm_term
5. WHEN referrer information is available THEN the system SHALL extract and store referring domains
6. WHEN attribution timestamps are set THEN the system SHALL include both initial_attribution_timestamp and current attribution_timestamp
7. WHEN marketing channels are classified THEN the system SHALL group them into categories (paid, organic, social, owned, referral, direct)
8. WHEN attribution sources are weighted THEN the system SHALL use realistic distribution based on industry configuration
9. WHEN first events include attribution THEN the system SHALL add UTM parameters to event properties for analysis
10. WHEN user properties are updated THEN the system SHALL maintain both historical and current attribution data

### Requirement 9: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can troubleshoot issues and ensure reliable demo performance.

#### Acceptance Criteria

1. WHEN Amplitude API calls fail THEN the system SHALL log detailed error information including status codes and response details
2. WHEN property validation fails THEN the system SHALL log specific validation issues and continue with sanitized data
3. WHEN configuration loading fails THEN the system SHALL fall back to base configuration and log warnings
4. WHEN WebSocket connections are lost THEN the system SHALL handle disconnections gracefully
5. WHEN batch API calls encounter errors THEN the system SHALL retry with exponential backoff
6. WHEN demo mode is active THEN the system SHALL clearly indicate when events are not being sent to Amplitude
7. WHEN invalid event properties are encountered THEN the system SHALL sanitize them and log the transformations
8. WHEN session management encounters issues THEN the system SHALL create new sessions and continue operation
9. WHEN file system operations fail THEN the system SHALL provide meaningful error messages
10. WHEN system health checks are performed THEN the system SHALL report all component statuses accurately

### Requirement 10: Performance and Scalability

**User Story:** As a system administrator, I want the demo system to perform well under load, so that it can handle multiple concurrent demos and large data volumes.

#### Acceptance Criteria

1. WHEN active sessions exceed 200 THEN the system SHALL automatically clean up oldest sessions
2. WHEN event queues grow large THEN the system SHALL maintain only the most recent 100 events for interface display
3. WHEN batch operations are performed THEN the system SHALL process events in chunks to avoid memory issues
4. WHEN multiple WebSocket clients connect THEN the system SHALL efficiently broadcast to all without performance degradation
5. WHEN configuration reloading occurs THEN the system SHALL update components without requiring full restart
6. WHEN event generation intervals are configured THEN the system SHALL respect timing constraints accurately
7. WHEN large historical datasets are generated THEN the system SHALL provide progress updates and memory management
8. WHEN concurrent demo sessions run THEN the system SHALL isolate user sessions and prevent data mixing
9. WHEN system resources are constrained THEN the system SHALL gracefully reduce event generation frequency
10. WHEN long-running demos execute THEN the system SHALL maintain stable memory usage and prevent leaks