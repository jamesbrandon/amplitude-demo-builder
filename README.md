# Amplitude Demo Template

A comprehensive, industry-agnostic analytics demonstration platform for Amplitude. Generate realistic user events across multiple industries with proper attribution, user journeys, and business context.

## ✨ Features

- **🏭 Multi-Industry Support**: E-commerce, SaaS, IoT, Hospitality, and more
- **🎯 Realistic User Journeys**: Progressive user stages with contextual events  
- **📊 Attribution Tracking**: UTM parameters and marketing channel attribution
- **💰 Revenue Events**: Proper revenue tracking with Amplitude's special properties
- **📈 Real-time Dashboard**: Live event streaming and statistics
- **⚙️ Web-based Setup**: No configuration files needed - set up via browser
- **🎨 Professional Events**: Rich, contextual properties for each event type

## 🚀 Quick Start

1. **Install and Run**
   ```bash
   git clone <repository>
   cd amplitude-demo-template
   npm install
   npm start
   ```

2. **Open Browser**
   Navigate to `http://localhost:3010` and follow the setup wizard

3. **Configure via Web UI**
   - Choose your industry (E-commerce, SaaS, IoT, Hospitality)
   - Enter your Amplitude API key (or leave blank for demo mode)
   - Start generating realistic events!

## 🎯 No Configuration Required

The demo is designed to work out-of-the-box:
- **Demo Mode**: Works without an Amplitude API key for testing
- **Web Setup**: Configure everything through the browser interface
- **Industry Templates**: Pre-built configurations for common industries
- **Instant Start**: Generate events immediately after setup

## 📊 Event Types by Industry

### 🛒 E-commerce
- Product Added to Cart, Checkout Started, Purchase Completed
- Product Reviewed, Wishlist Added, Search Performed
- Email Opened, Newsletter Subscribed

### 💼 SaaS  
- Dashboard Viewed, Report Generated, API Called
- Feature Used, Integration Connected, Account Upgraded
- Trial Started, Subscription Purchased

### 🏠 IoT
- Device Activated, Sensor Data Received, Automation Triggered
- Firmware Updated, Alert Generated, Energy Saved

### 🏨 Hospitality
- Room Search, Booking Completed, Check-in/Check-out
- Amenity Used, Room Service Ordered, Spa Service Booked
- Loyalty Program Joined, Points Earned

## 🔧 Advanced Configuration

### Environment Variables (Optional)
- `DEMO_PORT`: Server port (default: 3010)
- `DEMO_INDUSTRY`: Default industry
- `EVENT_INTERVAL`: Event generation interval (default: 5000ms)

### Custom Industries
Add new configurations in `examples/` directory:
```json
{
  "company": {
    "name": "Your Company",
    "industry": "custom",
    "description": "Custom industry demo"
  },
  "scenarios": {
    "business": {
      "events": ["Custom Event 1", "Custom Event 2"]
    }
  }
}
```

## 🏗️ Architecture

```
src/
├── amplitude/          # Amplitude client and tracking
├── generators/         # Event property generators  
├── server/            # Express server and API
└── public/            # Web interface
```

## 🎨 Key Features

### ✅ Amplitude Best Practices
- Numeric session IDs (not strings)
- Clean event properties (no computed metrics)
- Proper revenue event format
- UTM attribution tracking
- User journey progression

### ✅ Production Ready
- Error handling and validation
- Real-time event streaming
- Statistics and monitoring
- Clean, professional UI
- Easy sharing and deployment

## 🤝 Sharing with Others

The demo is designed to be easily shared:
1. **No API Key Required**: Others can test in demo mode
2. **Web-based Setup**: No technical configuration needed
3. **Multiple Industries**: Choose the most relevant industry
4. **Instant Results**: See events immediately in the interface

## 👨‍💻 Author & Feedback

**Created by James** - Amplitude Analytics Expert

💬 **Feedback & Questions**: I'd love to hear how you're using this demo template! 
- Found a bug? Have a feature request? 
- Want to add a new industry template?
- Need help with your Amplitude implementation?

**Get in touch:**
- Open an issue on GitHub
- Connect with me for Amplitude consulting and implementation support
- Share your success stories and use cases!

## 📝 License

MIT License - Perfect for demos, training, and proof-of-concepts.

---

*Built with ❤️ for the Amplitude community. Happy analyzing! 📊*