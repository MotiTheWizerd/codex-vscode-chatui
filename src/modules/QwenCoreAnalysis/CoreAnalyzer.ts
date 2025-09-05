import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerConfig, AnalysisResult } from './BaseAnalyzer.js';
import { readFileSync, existsSync } from 'fs';
import { LineCountAnalyzer } from './LineCountAnalyzer.js';
import { CodeSmellAnalyzer } from './CodeSmellAnalyzer.js';
import { NestingAnalyzer } from './NestingAnalyzer.js';
import { FunctionSizeAnalyzer } from './FunctionSizeAnalyzer.js';

export class CoreAnalyzer {
  private analyzers: BaseAnalyzer[];
  private config: AnalyzerConfig;
  
  constructor(config: AnalyzerConfig) {
    this.config = config;
    this.analyzers = [
      new LineCountAnalyzer(config),
      new CodeSmellAnalyzer(config),
      new NestingAnalyzer(config),
      new FunctionSizeAnalyzer(config)
    ];
  }
  
  analyzeFile(filePath: string): AnalysisResult[] {
    const content = this.readFile(filePath);
    if (!content) {
      return [];
    }
    
    return this.analyzers
      .map(analyzer => analyzer.analyzeFile(filePath, content));
  }
  
  private readFile(filePath: string): string | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }
}