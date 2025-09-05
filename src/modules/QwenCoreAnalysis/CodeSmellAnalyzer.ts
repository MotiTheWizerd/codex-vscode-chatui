import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalysisResult, Issue } from './BaseAnalyzer.js';

export class CodeSmellAnalyzer extends BaseAnalyzer {
  analyzeFile(filePath: string, content: string): AnalysisResult {
    const lines = content.split('\n');
    const issues: Issue[] = [];
    
    // Look for TODO and FIXME comments
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (line.includes('TODO') || line.includes('todo')) {
        issues.push(this.createIssue(
          'todo-found',
          'TODO comment found',
          'medium',
          lineNumber,
          'Address this TODO or create a proper task for it'
        ));
      }
      
      if (line.includes('FIXME') || line.includes('fixme')) {
        issues.push(this.createIssue(
          'fixme-found',
          'FIXME comment found',
          'high',
          lineNumber,
          'This needs immediate attention'
        ));
      }
    });
    
    const metrics = {
      todoCount: lines.filter(line => line.includes('TODO') || line.includes('todo')).length,
      fixmeCount: lines.filter(line => line.includes('FIXME') || line.includes('fixme')).length
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