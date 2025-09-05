import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalysisResult, Issue } from './BaseAnalyzer.js';

export class NestingAnalyzer extends BaseAnalyzer {
  analyzeFile(filePath: string, content: string): AnalysisResult {
    const lines = content.split('\n');
    const issues: Issue[] = [];
    
    let maxDepth = 0;
    let currentDepth = 0;
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Increase depth for opening braces/keywords
      if (this.isOpeningConstruct(trimmedLine)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      
      // Check if current line is deeply nested
      if (currentDepth >= 5 && trimmedLine.length > 0 && !trimmedLine.startsWith('//')) {
        issues.push(this.createIssue(
          'deep-nesting',
          `Line is nested at depth ${currentDepth}`,
          'high',
          lineNumber,
          'Consider refactoring to reduce nesting depth'
        ));
      }
      
      // Decrease depth for closing braces/keywords
      if (this.isClosingConstruct(trimmedLine)) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    });
    
    const metrics = {
      maxNestingDepth: maxDepth
    };
    
    const score = this.calculateScore(issues);
    
    return {
      filePath,
      issues,
      metrics,
      score
    };
  }
  
  private isOpeningConstruct(line: string): boolean {
    return line.includes('{') || 
           line.includes('if (') ||
           line.includes('for (') ||
           line.includes('while (') ||
           line.includes('switch (') ||
           line.includes('try {') ||
           line.includes('else {') ||
           line.includes('else if (');
  }
  
  private isClosingConstruct(line: string): boolean {
    return line.includes('}') ||
           line === '}' ||
           line.includes('break;') ||
           line.includes('return') ||
           line.includes('continue;');
  }
}