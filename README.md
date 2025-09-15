# 🎯 Amplitude Demo Builder

**Professional client demo generator for Amplitude Analytics**

Create realistic, industry-specific Amplitude demos with historical data backfill, proper event structure, and client branding. Perfect for sales demos, proof-of-concepts, and training.

## ✨ Key Features

- **� Multib-Industry Support**: E-commerce, SaaS, FinTech, Media, Healthcare, IoT, Hospitality
- **� Hivstorical Data Backfill**: 2 weeks to 3 months using Amplitude's Batch API
- **🎯 Realistic User Journeys**: Progressive stages with proper conversion rates
- **📊 Enhanced Attribution**: Both initial and current UTM parameters
- **💰 Revenue Tracking**: Proper Amplitude revenue event formatting
- **🌐 Web Generator**: User-friendly form-based demo creation
- **⚙️ CLI Generator**: Interactive command-line demo builder
- **🎨 Client Branding**: Custom colors, logos, and messaging
- **🔧 API Key Integration**: Pre-configured Amplitude connections
- **🐳 Docker Ready**: Complete deployment configurations

## 🚀 Quick Start

### **Option 1: Web Generator (Recommended)**
```bash
git clone https://github.com/yourusername/amplitude-demo-builder.git
cd amplitude-demo-builder
npm install
npm start
```
Visit `http://localhost:3001/generator` and create your client demo!

### **Option 2: CLI Generator**
```bash
npm run create-client-demo
# Follow interactive prompts for client details
```

### **Option 3: Template Setup**
```bash
npm run setup-template
# Prepares the system for generating multiple client demos
```

## 🎯 What Makes This Special

### **Professional Client Demos**
- **Complete Projects**: Each generated demo is a full Node.js application
- **Client Branding**: Custom colors, company names, and messaging
- **Industry Alignment**: Events and properties match client's business
- **API Key Integration**: Pre-configured with client's Amplitude project

### **Historical Data Backfill** 🆕
- **Batch API Integration**: Uses Amplitude's `/batch` endpoint efficiently
- **Realistic Timelines**: 2 weeks to 3 months of historical events
- **User Journey Progression**: Visitors → Prospects → Customers → Power Users
- **Configurable Volume**: Customize users per day and events per user

### **Enhanced Attribution** 🆕
- **Dual UTM Tracking**: Both `initial_utm_*` and `utm_*` parameters
- **First-Touch Attribution**: Capture original acquisition source
- **Last-Touch Attribution**: Track current campaign performance
- **Marketing Channel Classification**: Automatic channel grouping

## 📊 Industry Templates

### 🛒 **E-commerce**
- Product views, cart actions, purchases, reviews
- Search, recommendations, wishlist management
- Email campaigns, loyalty programs

### 💼 **SaaS**  
- Feature usage, dashboard views, API calls
- Integrations, reports, account management
- Trial conversions, subscription upgrades

### 💰 **FinTech**
- Account opening, transactions, investments
- KYC processes, loan applications, credit checks
- Portfolio management, payment processing

### � S**Media & Entertainment** 🆕
- Video streaming, content consumption, ratings
- Recommendations, social sharing, playlists
- Subscription tiers, premium content access

### 🏥 **Healthcare**
- Appointments, treatments, patient records
- Telemedicine, prescription management
- Health monitoring, wellness programs

### 🏠 **IoT**
- Device activation, sensor data, automations
- Energy monitoring, security alerts
- Firmware updates, predictive maintenance

### 🏨 **Hospitality**
- Bookings, check-ins, amenity usage
- Room service, spa services, loyalty programs
- Guest feedback, mobile app interactions

## 🎨 Generated Demo Features

Each generated client demo includes:

### **Complete Application**
- ✅ Node.js server with Express and WebSocket
- ✅ Professional web interface with client branding
- ✅ Real-time event streaming and statistics
- ✅ Amplitude API integration with error handling

### **Historical Data Generation**
- ✅ Batch API client for efficient data upload
- ✅ Realistic user journeys with stage progression
- ✅ Industry-specific events and properties
- ✅ Configurable volume and timeline

### **Deployment Ready**
- ✅ Docker configuration with docker-compose
- ✅ Environment variable management
- ✅ Health check endpoints
- ✅ Production logging and monitoring

## 🔧 Advanced Usage

### **Custom Industry Templates**
Add new configurations in `examples/` directory:
```json
{
  "company": {
    "name": "Your Industry Demo",
    "industry": "custom",
    "description": "Custom industry demonstration"
  },
  "contentLibrary": {
    "customData": ["item1", "item2", "item3"]
  },
  "scenarios": {
    "primary": {
      "events": ["Custom Event 1", "Custom Event 2"]
    }
  }
}
```

### **Environment Variables**
```bash
AMPLITUDE_API_KEY=your_api_key_here
DEMO_PORT=3001
DEMO_INDUSTRY=saas
EVENT_INTERVAL=4000
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

## 📈 Perfect for

### **Sales Teams**
- Generate professional client demos in minutes
- Industry-specific events that resonate with prospects
- Historical data that makes demos credible
- Branded experience with client's colors and messaging

### **Solutions Engineers**
- Technical proof-of-concepts with proper event structure
- Demonstrate Amplitude best practices
- Show realistic user journeys and conversion funnels
- Test dashboard configurations with authentic data

### **Consultants & Partners**
- Deliver complete demo projects to clients
- Multiple industry templates for different verticals
- Docker deployment for consistent environments
- Professional documentation and setup guides

## 🏗️ Architecture

```
amplitude-demo-builder/
├── src/
│   ├── amplitude/          # Amplitude client & batch API
│   ├── generators/         # Event property generators
│   └── server/            # Express server & WebSocket
├── examples/              # Industry configuration templates
├── public/                # Web generator interface
├── scripts/               # CLI generator & setup tools
└── docs/                 # Documentation & guides
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 🐛 **Bug Reports**: Open an issue with reproduction steps
- 💡 **Feature Requests**: Describe your use case and proposed solution
- 🏭 **New Industries**: Submit industry templates with realistic events
- 📖 **Documentation**: Help improve guides and examples

## 📝 License

MIT License - Perfect for demos, training, and commercial use.

## 🙏 Acknowledgments

Built for the Amplitude community to showcase analytics best practices and accelerate client success.

---

**Ready to create amazing Amplitude demos?** 🚀

```bash
git clone https://github.com/yourusername/amplitude-demo-builder.git
cd amplitude-demo-builder
npm install
npm start
# Visit http://localhost:3001/generator
```