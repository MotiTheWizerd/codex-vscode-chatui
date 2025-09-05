#!/usr/bin/env node

import { ConfigLoader } from './ConfigLoader.js';
import { CoreAnalyzer } from './CoreAnalyzer.js';
import { writeFileSync } from 'fs';
import { ReportGenerator } from './ReportGenerator.js';

async function main() {
  console.log('Starting code analysis...');
  
  // Load configuration
  const config = ConfigLoader.load();
  console.log('Configuration loaded');
  
  // Create analyzer
  const analyzer = new CoreAnalyzer(config);
  
  // Find files to analyze
  const patterns = config.includePatterns || ['**/*.ts', '**/*.js'];
  const ignore = config.excludePatterns || ['node_modules', 'dist'];
  
  console.log('Searching for files...');
  const files: string[] = [];
  
  // Dynamically import glob
  const { glob } = await import('glob');
  
  for (const pattern of patterns) {
    try {
      const foundFiles = await glob(pattern, { ignore, absolute: true });
      files.push(...foundFiles);
    } catch (error) {
      console.error(`Error searching for files with pattern ${pattern}:`, error);
    }
  }
  
  console.log(`Found ${files.length} files to analyze`);
  
  // Analyze files
  const allResults = [];
  for (const file of files) {
    try {
      const results = analyzer.analyzeFile(file);
      allResults.push(...results.filter(r => r.issues.length > 0 || r.score < 100));
    } catch (error) {
      console.error(`Error analyzing file ${file}:`, error);
    }
  }
  
  // Generate report
  const report = ReportGenerator.generate(allResults);
  const outputPath = config.output?.file || 'code-analysis-report.md';
  writeFileSync(outputPath, report);
  console.log(`Report saved to ${outputPath}`);
  
  console.log('Analysis complete!');
}

main().catch(console.error);