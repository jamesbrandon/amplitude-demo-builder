# Amplitude Event Format Reference

## Standard Event Structure

### Required Fields
- `event_type`: string - Name of the event (e.g., "Page Viewed", "Purchase Completed")
- `user_id`: string - Unique identifier for the user
- `device_id`: string - Unique identifier for the device
- `time`: number - Unix timestamp in milliseconds

### Optional Standard Fields
- `session_id`: **number** - Numeric session identifier (NOT string!)
- `platform`: string - Platform identifier (e.g., "web", "iOS", "Android")
- `event_properties`: object - Custom properties specific to the event
- `user_properties`: object - Properties to set on the user profile

### Reserved Property Names (DO NOT use in event_properties)
- `user_id`
- `device_id` 
- `session_id`
- `time`
- `event_id`
- `insert_id`
- `event_type`

### Special Amplitude Properties (allowed in event_properties)
- `$revenue`: number - Revenue amount for revenue events
- `$price`: number - Price of item
- `$quantity`: number - Quantity of items
- `$productId`: string - Product identifier
- `$revenueType`: string - Type of revenue (e.g., "purchase", "subscription")

## Property Value Constraints

### Property Names
- Max length: 255 characters
- Allowed characters: a-z, A-Z, 0-9, _ (underscore)
- Special properties can start with $ (e.g., $revenue)

### Property Values
- Strings: Max 1024 characters
- Numbers: Must be finite (no NaN, Infinity)
- Booleans: true/false
- Arrays: NOT supported (convert to comma-separated string)
- Objects: NOT supported (convert to JSON string)
- null/undefined: Will be filtered out

## Correct Event Examples

### Basic Event
```javascript
track("Page Viewed", {
  page_title: "Dashboard",
  page_url: "https://example.com/dashboard",
  referrer: "https://google.com"
}, {
  user_id: "user_123",
  device_id: "device_456", 
  session_id: 1734567890123, // NUMBER, not string!
  time: Date.now()
});
```

### Revenue Event
```javascript
track("Purchase Completed", {
  product_name: "Premium Plan",
  product_category: "subscription",
  currency: "USD",
  $revenue: 29.99,
  $quantity: 1,
  $productId: "premium_plan"
}, {
  user_id: "user_123",
  device_id: "device_456",
  session_id: 1734567890123, // NUMBER!
  time: Date.now()
});
```

## Common Validation Errors

### 400 Bad Request - Invalid field values
- Session ID as string instead of number
- Reserved properties in event_properties
- Invalid characters in property names
- String values too long (>1024 chars)
- Property names too long (>255 chars)
- NaN or Infinity in numeric values
- Arrays or nested objects in properties

### Best Practices
1. Only include contextual properties specific to the event
2. Let Amplitude handle behavioral metrics (session counts, etc.)
3. Use consistent naming conventions (snake_case recommended)
4. Validate all property values before sending
5. Use numeric session IDs consistently
6. Include attribution data only for new users
7. Keep event properties minimal and meaningful