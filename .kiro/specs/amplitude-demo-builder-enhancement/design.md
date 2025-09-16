# Amplitude Demo Builder Enhancement - Design Document

## Overview

The Amplitude Demo Builder is a sophisticated multi-layered system that generates professional, industry-specific analytics demonstrations. The architecture separates concerns between event generation, Amplitude integration, configuration management, and client interfaces while maintaining strict adherence to Amplitude's API requirements and best practices.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Demo Generator                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Interface │  │  CLI Interface  │  │ Generated Demos │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     Core Demo Server                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Express Server │  │ WebSocket Layer │  │  API Endpoints  │ │
│  │  (HTTP/HTTPS)   │  │  (Real-time)    │  │  (REST API)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Event Generator │  │ Session Manager │  │ Config Loader   │ │
│  │ (Industry Logic)│  │ (User Journeys) │  │ (Multi-Industry)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                   Amplitude Integration Layer                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Real-time Client│  │ Batch API Client│  │ Property Sanitizer│ │
│  │ (Node.js SDK)   │  │ (Historical)    │  │ (Validation)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Amplitude Analytics                       │
│                    (External Service)                          │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Amplitude Integration Layer

#### AmplitudeClient (Real-time Events)
**Purpose**: Handles live event tracking using Amplitude's Node.js SDK
**Key Responsibilities**:
- Property sanitization and validation
- UTM parameter extraction and attribution
- User identification and property management
- Error handling and retry logic
- Demo mode simulation

**Interface**:
```javascript
class AmplitudeClient {
  async track(userId, eventType, eventProperties, options)
  async identify(userId, userProperties)
  async identifyWithAttribution(userId, userProperties, utmParameters)
  sanitizeProperties(properties)
  extractUtmParameters(eventProperties)
  formatAttributionProperties(utmParameters)
  classifyMarketingChannel(utmParameters)
}
```

**Key Design Patterns**:
- **Singleton Pattern**: Single instance manages all real-time tracking
- **Property Sanitization**: Automatic cleaning of invalid characters, lengths, and types
- **Attribution Handling**: Dual tracking of initial and current UTM parameters
- **Error Resilience**: Graceful degradation when API calls fail

#### AmplitudeBatchClient (Historical Data)
**Purpose**: Handles bulk historical data upload using Amplitude's Batch API
**Key Responsibilities**:
- Historical user journey simulation
- Batch event formatting and chunking
- Realistic temporal distribution
- Progress tracking and error handling

**Interface**:
```javascript
class AmplitudeBatchClient {
  async generateHistoricalData(config, options)
  async generateDayEvents(date, usersCount, eventsPerUser, config, scenarios)
  async generateUserJourney(userId, dayStart, dayEnd, eventCount, config, scenarios)
  async sendBatch(events)
  createHistoricalUserSession(userId, date)
}
```

**Key Design Patterns**:
- **Batch Processing**: Chunks events into Amplitude's 1000-event limit
- **Temporal Simulation**: Realistic time distribution across historical periods
- **Journey Progression**: Users advance through stages over time
- **Memory Management**: Processes large datasets without memory overflow

### 2. Business Logic Layer

#### EventGenerator (Industry-Specific Logic)
**Purpose**: Generates realistic, industry-appropriate event properties
**Key Responsibilities**:
- Industry-specific event templates
- Realistic property value generation
- User context awareness
- Attribution integration

**Interface**:
```javascript
class EventGenerator {
  generateEventProperties(eventType, userSession)
  buildEventTemplates()
  getIndustrySpecificTemplates()
  getEcommerceTemplates()
  getSaasTemplates()
  getHospitalityTemplates()
  getMediaTemplates()
  getIotTemplates()
}
```

**Key Design Patterns**:
- **Template Method Pattern**: Base templates with industry-specific overrides
- **Strategy Pattern**: Different generation strategies per industry
- **Context Awareness**: Properties adapt to user journey stage and session history
- **Weighted Randomization**: Realistic distribution of property values

#### Session Manager (User Journey Simulation)
**Purpose**: Manages user sessions and journey progression
**Key Responsibilities**:
- Session lifecycle management
- Journey stage progression
- User property management
- Attribution tracking

**Design Patterns**:
- **State Machine**: Users progress through defined journey stages
- **Session Timeout**: Automatic new session creation after inactivity
- **Property Inheritance**: User properties persist across sessions
- **Conversion Funnel**: Realistic progression rates between stages

#### ConfigLoader (Multi-Industry Support)
**Purpose**: Loads and merges industry-specific configurations
**Key Responsibilities**:
- Configuration file management
- Deep object merging
- Validation and error handling
- Dynamic reloading

**Interface**:
```javascript
class ConfigLoader {
  loadConfig(industryOrPath)
  mergeConfigs(baseConfig, industryConfig)
  validateConfig(config)
  listAvailableIndustries()
  getConfigSummary()
  reloadConfig(industryOrPath)
}
```

**Key Design Patterns**:
- **Configuration Pattern**: Externalized industry-specific settings
- **Merge Strategy**: Deep merging with industry overrides
- **Validation**: Comprehensive configuration validation
- **Hot Reload**: Dynamic configuration updates without restart

### 3. Core Demo Server

#### Express Server (HTTP Layer)
**Purpose**: Provides REST API and serves web interface
**Key Endpoints**:
- `/health` - System status and configuration info
- `/api/config` - Current configuration details
- `/api/industries` - Available industry templates
- `/api/demo/start` - Begin event simulation
- `/api/demo/stop` - Stop event simulation
- `/api/events/trigger` - Manual event triggering
- `/api/stats` - Demo statistics
- `/api/generate-client-demo` - Create client-specific demos

**Design Patterns**:
- **RESTful API**: Standard HTTP methods and status codes
- **Middleware Chain**: CORS, JSON parsing, logging, error handling
- **Route Organization**: Logical grouping of related endpoints
- **Error Handling**: Consistent error response format

#### WebSocket Layer (Real-time Communication)
**Purpose**: Provides real-time updates to connected clients
**Key Events**:
- `demo-status` - Current demo state and statistics
- `live-event` - Real-time event notifications
- `demo-started` - Demo simulation started
- `demo-stopped` - Demo simulation stopped
- `event-triggered` - Manual event triggered

**Design Patterns**:
- **Observer Pattern**: Clients subscribe to real-time updates
- **Broadcast Pattern**: Events sent to all connected clients
- **Connection Management**: Automatic cleanup of disconnected clients
- **State Synchronization**: New clients receive current state

### 4. Client Demo Generator

#### Project Generation System
**Purpose**: Creates complete, branded demo applications for clients
**Key Components**:
- Project structure creation
- Configuration customization
- Branding application
- Deployment file generation

**Design Patterns**:
- **Template Pattern**: Base project structure with customization points
- **Builder Pattern**: Step-by-step demo project construction
- **Configuration Injection**: Client-specific settings integration
- **Asset Generation**: Custom branding and documentation

## Data Models

### User Session Model
```javascript
{
  userId: string,
  sessionId: number, // Unix timestamp
  deviceId: string,
  platform: string,
  sessionStartTime: number,
  lastEventTime: number,
  eventCount: number,
  lifetimeEventCount: number,
  currentJourneyStep: string,
  daysSinceSignup: number,
  attributionData: {
    utm_source: string,
    utm_medium: string,
    utm_campaign: string,
    initial_referrer: string,
    acquisition_date: string
  },
  userProperties: {
    journey_stage: string,
    lifecycle_stage: string,
    days_since_signup: number,
    signup_date: string,
    initial_utm_source: string,
    utm_source: string, // Current
    // ... additional properties
  }
}
```

### Event Model (Real-time)
```javascript
{
  user_id: string,
  event_type: string,
  event_properties: {
    // Industry-specific properties
    // No reserved Amplitude properties
    // Sanitized names and values
  },
  user_properties: {
    // User profile properties
  },
  device_id: string,
  session_id: number, // Numeric only
  platform: string,
  time: number // Unix timestamp
}
```

### Event Model (Batch)
```javascript
{
  user_id: string,
  event_type: string,
  time: number, // Unix timestamp in milliseconds
  event_properties: {
    // Industry-specific properties
    historical_data: true
  },
  user_properties: {
    // User profile properties
  },
  device_id: string,
  session_id: number,
  platform: string
}
```

### Industry Configuration Model
```javascript
{
  company: {
    name: string,
    industry: string,
    website: string,
    description: string
  },
  branding: {
    primaryColor: string,
    secondaryColor: string
  },
  scenarios: {
    [scenarioKey]: {
      name: string,
      description: string,
      weight: number,
      events: string[]
    }
  },
  userJourney: {
    stages: [{
      name: string,
      displayName: string,
      duration: string,
      conversionRate: number,
      events: string[]
    }]
  },
  products: [{
    id: string,
    name: string,
    category: string,
    price: number,
    currency: string
  }],
  attribution: {
    sources: [{
      utm_source: string,
      utm_medium: string,
      utm_campaign: string,
      weight: number
    }]
  }
}
```

## Error Handling

### Error Handling Strategy
1. **Graceful Degradation**: System continues operating when non-critical components fail
2. **Detailed Logging**: Comprehensive error information for debugging
3. **User Feedback**: Clear error messages in API responses
4. **Fallback Mechanisms**: Default configurations and demo mode when external services fail

### Error Categories
- **Configuration Errors**: Invalid or missing configuration files
- **Amplitude API Errors**: Network issues, authentication failures, validation errors
- **Property Validation Errors**: Invalid event or user properties
- **Session Management Errors**: User session corruption or timeout issues
- **File System Errors**: Missing files, permission issues
- **WebSocket Errors**: Connection failures, message delivery issues

### Error Recovery Patterns
- **Retry with Backoff**: Automatic retry for transient failures
- **Circuit Breaker**: Prevent cascading failures from external services
- **Fallback Values**: Default properties when generation fails
- **Demo Mode**: Continue operation without external dependencies

## Testing Strategy

### Unit Testing
- **Property Sanitization**: Validate all edge cases for property cleaning
- **Event Generation**: Verify industry-specific event templates
- **Configuration Loading**: Test merging and validation logic
- **Attribution Processing**: Verify UTM parameter handling

### Integration Testing
- **Amplitude API Integration**: Test both real-time and batch APIs
- **WebSocket Communication**: Verify real-time event broadcasting
- **Configuration System**: Test industry switching and validation
- **Session Management**: Verify user journey progression

### End-to-End Testing
- **Complete Demo Flows**: Test full demo scenarios from start to finish
- **Client Demo Generation**: Verify complete project creation
- **Historical Data Generation**: Test large-scale batch operations
- **Multi-Industry Support**: Verify all industry configurations

### Performance Testing
- **Concurrent Users**: Test multiple simultaneous demo sessions
- **Large Data Volumes**: Test historical data generation at scale
- **Memory Usage**: Verify no memory leaks during long-running demos
- **WebSocket Load**: Test many concurrent client connections

## Security Considerations

### API Key Management
- Environment variable storage
- Masked logging (show only first 8 characters)
- No API keys in configuration files
- Secure transmission to generated client demos

### Input Validation
- Property name sanitization
- Value type validation
- Configuration file validation
- User input sanitization in web interface

### Network Security
- HTTPS support for production deployments
- CORS configuration for web interface
- Rate limiting for API endpoints
- WebSocket connection limits

## Deployment Architecture

### Development Environment
- Local Node.js server
- File-based configuration
- Demo mode (no external API calls)
- Hot reload for configuration changes

### Production Environment
- Docker containerization
- Environment-based configuration
- Health check endpoints
- Logging and monitoring integration
- Load balancing support

### Client Demo Deployment
- Complete Node.js application
- Docker Compose configuration
- Environment variable templates
- Client-specific branding and configuration
- Production-ready setup instructions