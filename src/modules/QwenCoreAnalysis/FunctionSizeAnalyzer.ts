import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalysisResult, Issue } from './BaseAnalyzer.js';

export class FunctionSizeAnalyzer extends BaseAnalyzer {
  analyzeFile(filePath: string, content: string): AnalysisResult {
    const lines = content.split('\n');
    const issues: Issue[] = [];
    
    let inFunction = false;
    let functionStartLine = 0;
    let functionLineCount = 0;
    let functionName = '';
    
    const threshold = this.config.thresholds?.['functionLength'] || 50;
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Detect function start
      if (this.isFunctionStart(trimmedLine)) {
        inFunction = true;
        functionStartLine = lineNumber;
        functionLineCount = 1;
        functionName = this.extractFunctionName(trimmedLine);
        return;
      }
      
      // If we're in a function, count lines
      if (inFunction) {
        functionLineCount++;
        
        // Detect function end
        if (this.isFunctionEnd(trimmedLine)) {
          inFunction = false;
          
          // Check if function exceeds threshold
          if (functionLineCount > threshold) {
            issues.push(this.createIssue(
              'large-function',
              `Function '${functionName}' has ${functionLineCount} lines, exceeding threshold of ${threshold}`,
              'medium',
              functionStartLine,
              `Consider breaking this function into smaller, more manageable pieces`
            ));
          }
        }
      }
    });
    
    const metrics = {
      largeFunctions: issues.length
    };
    
    const score = this.calculateScore(issues);
    
    return {
      filePath,
      issues,
      metrics,
      score
    };
  }
  
  private isFunctionStart(line: string): boolean {
    return line.includes('function ') || 
           line.includes('=>') ||
           line.includes(') {') ||
           !!line.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)\s*\{/);
  }
  
  private isFunctionEnd(line: string): boolean {
    return line.trim() === '}' || 
           line.includes('};') ||
           line.includes('} else');
  }
  
  private extractFunctionName(line: string): string {
    // Try to extract function name
    const functionMatch = line.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (functionMatch && functionMatch[1]) {
      return functionMatch[1];
    }
    
    const arrowMatch = line.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/);
    if (arrowMatch && arrowMatch[1]) {
      return arrowMatch[1];
    }
    
    const methodMatch = line.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/);
    if (methodMatch && methodMatch[1]) {
      return methodMatch[1];
    }
    
    return 'anonymous';
  }
}