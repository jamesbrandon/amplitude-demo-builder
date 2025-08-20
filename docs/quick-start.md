# Quick Start Guide

Get your Amplitude demo running in 5 minutes!

## 🚀 Installation

1. **Clone or download** this template
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run setup wizard**:
   ```bash
   npm run setup
   ```

4. **Start the demo**:
   ```bash
   npm start
   ```

5. **Open your browser**: http://localhost:3001

## 🎯 Industry Quick Start

Skip the setup and use pre-configured industry demos:

### E-commerce Demo
```bash
npm run demo:ecommerce
```
- Fashion retail company (StyleHub)
- Shopping cart, checkout, product events
- Instagram/Pinterest attribution

### SaaS Demo
```bash
npm run demo:saas
```
- Data analytics platform (DataFlow Pro)
- Dashboard usage, API calls, subscriptions
- LinkedIn/Google attribution

### IoT Demo
```bash
npm run demo:iot
```
- Smart home platform (SmartHome Hub)
- Device interactions, automation, energy monitoring
- Amazon/YouTube attribution

### Hospitality Demo
```bash
npm run demo:hospitality
```
- Luxury resort (Grand Vista Resort)
- Bookings, guest services, amenity usage, loyalty programs
- Booking.com/Expedia/Instagram attribution

## ⚡ Manual Configuration

Create your own `.env` file:

```env
# Required
AMPLITUDE_API_KEY=your_amplitude_api_key_here

# Optional
DEMO_PORT=3001
DEMO_INDUSTRY=saas
DEFAULT_SCENARIO=business
```

## 🎨 Custom Industry

1. Copy an example config: `examples/saas-config.json`
2. Modify for your industry
3. Set environment variable:
   ```bash
   CUSTOM_CONFIG_PATH=/path/to/your-config.json npm start
   ```

## 🔧 Available Commands

- `npm start` - Start demo server
- `npm run setup` - Interactive setup wizard
- `npm run list-industries` - Show available industries
- `npm run validate` - Validate configuration
- `npm run demo:INDUSTRY` - Start specific industry demo

## 📊 Demo Features

- **Real-time event streaming** - See events as they happen
- **Multiple scenarios** - Business, marketing, product usage
- **Authentic user journeys** - Realistic user progression
- **UTM attribution** - Proper marketing attribution
- **Revenue tracking** - E-commerce and subscription events
- **Honest status reporting** - Real Amplitude API responses

## 🎯 Next Steps

1. **Customize your industry** - Edit config files
2. **Add custom events** - Extend event generators
3. **Brand the interface** - Update colors and styling
4. **Create dashboards** - Use generated data in Amplitude
5. **Share with team** - Deploy for stakeholder demos

## 🆘 Troubleshooting

**Events not appearing in Amplitude?**
- Check your API key in `.env`
- Look for error messages in console
- Verify API key format (32 hex characters)

**Demo not starting?**
- Run `npm install` to install dependencies
- Check port 3001 is available
- Verify Node.js version >= 16

**Configuration errors?**
- Run `npm run validate` to check config
- Check JSON syntax in config files
- Ensure required fields are present

## 📚 Learn More

- [Configuration Guide](configuration-guide.md)
- [Event Reference](event-reference.md)
- [Customization Guide](customization-guide.md)