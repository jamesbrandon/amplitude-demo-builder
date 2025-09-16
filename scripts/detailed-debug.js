// Detailed debug script to check user session creation
const { ConfigurableDemoServer } = require('../src/server/demo-server');

console.log('🔍 Detailed Debugging...\n');

const server = new ConfigurableDemoServer();

// Test user session creation step by step
console.log('Creating user session...');
const userSession = server.getOrCreateUserSession();

console.log('User session structure:');
console.log('- userId:', userSession.userId);
console.log('- sessionId:', userSession.sessionId);
console.log('- platform:', userSession.platform);

console.log('\nUser properties:');
console.log('Total properties:', Object.keys(userSession.userProperties).length);

// Print all user properties
Object.keys(userSession.userProperties).forEach(key => {
  console.log(`- ${key}: ${userSession.userProperties[key]}`);
});

console.log('\nLooking specifically for A/B testing properties:');
const abTestProps = Object.keys(userSession.userProperties).filter(key => 
  key.startsWith('ab_') || key.startsWith('ff_')
);

if (abTestProps.length > 0) {
  console.log('✅ Found A/B testing properties:', abTestProps);
  abTestProps.forEach(key => {
    console.log(`  ${key}: ${userSession.userProperties[key]}`);
  });
} else {
  console.log('❌ No A/B testing properties found');
}

console.log('\n🎉 Debug complete!');