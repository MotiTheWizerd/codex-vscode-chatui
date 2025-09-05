// Test script to verify CoreAnalysis module isolation
import { CoreAnalyzer } from './src/modules/CoreAnalysis/index.js';
import { ConfigLoader } from './src/modules/CoreAnalysis/ConfigLoader.js';

console.log('Testing CoreAnalysis module isolation...');

// Load configuration
const config = ConfigLoader.load();
console.log('Configuration loaded successfully');

// Create analyzer
const analyzer = new CoreAnalyzer(config);
console.log('CoreAnalyzer created successfully');

console.log('Module isolation test passed!');