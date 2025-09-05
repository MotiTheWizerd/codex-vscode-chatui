import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalysisResult, Issue } from './BaseAnalyzer.js';

export class LineCountAnalyzer extends BaseAnalyzer {
  analyzeFile(filePath: string, content: string): AnalysisResult {
    const lines = content.split('\n');
    const lineCount = lines.length;
    
    const issues: Issue[] = [];
    const threshold = this.config.thresholds?.['lineCount'] || 250;
    
    if (lineCount > threshold) {
      issues.push(this.createIssue(
        'high-line-count',
        `File has ${lineCount} lines, exceeding threshold of ${threshold}`,
        'high',
        undefined,
        `Consider breaking this file into smaller modules by functionality`
      ));
    }
    
    const metrics = {
      lineCount
    };
    
    const score = this.calculateScore(issues);
    
    return {
      filePath,
      issues,
      metrics,
      score
    };
  }
}