import type { AnalyzerConfig } from './BaseAnalyzer.js';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ConfigLoader {
  static load(configPath?: string): AnalyzerConfig {
    // If a specific config path is provided, try to load it
    if (configPath && existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf8');
        return JSON.parse(configContent);
      } catch (error) {
        console.error(`Error loading config from ${configPath}:`, error);
      }
    }
    
    // Try to load from default locations
    const defaultPaths = [
      'core-analysis.config.json',
      join(__dirname, 'default.config.json')
    ];
    
    for (const path of defaultPaths) {
      if (existsSync(path)) {
        try {
          const configContent = readFileSync(path, 'utf8');
          return JSON.parse(configContent);
        } catch (error) {
          console.error(`Error loading config from ${path}:`, error);
        }
      }
    }
    
    // Return default config
    return {
      includePatterns: ['*.ts', '*.js'],
      excludePatterns: ['node_modules', 'dist'],
      thresholds: {
        lineCount: 250
      }
    };
  }
}