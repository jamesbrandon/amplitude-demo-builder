// Script to clean up duplicate code in demo-server.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/server/demo-server.js');
const backupPath = path.join(__dirname, '../src/server/demo-server-backup.js');

console.log('🧹 Cleaning up duplicate code in demo-server.js...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');
const originalLines = content.split('\n').length;

console.log(`📊 Original file: ${originalLines} lines`);

// Find where the duplication starts by looking for the second occurrence of setupWebSocket
const lines = content.split('\n');
let firstSetupWebSocketIndex = -1;
let secondSetupWebSocketIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('setupWebSocket()')) {
    if (firstSetupWebSocketIndex === -1) {
      firstSetupWebSocketIndex = i;
    } else {
      secondSetupWebSocketIndex = i;
      break;
    }
  }
}

if (secondSetupWebSocketIndex !== -1) {
  console.log(`🔍 Found duplication starting at line ${secondSetupWebSocketIndex + 1}`);
  
  // Keep only the content up to the first duplication
  const cleanLines = lines.slice(0, secondSetupWebSocketIndex);
  
  // Add proper class closing
  cleanLines.push('}');
  cleanLines.push('');
  cleanLines.push('// Start server if called directly');
  cleanLines.push('if (require.main === module) {');
  cleanLines.push('  const server = new ConfigurableDemoServer();');
  cleanLines.push('  server.start();');
  cleanLines.push('}');
  cleanLines.push('');
  cleanLines.push('module.exports = { ConfigurableDemoServer };');
  
  const cleanContent = cleanLines.join('\n');
  
  // Write the clean version
  fs.writeFileSync(filePath, cleanContent);
  
  const newLines = cleanContent.split('\n').length;
  console.log(`✅ Cleaned file: ${newLines} lines (removed ${originalLines - newLines} lines)`);
} else {
  console.log('✅ No duplicates found');
}

console.log('🎉 Cleanup complete!');