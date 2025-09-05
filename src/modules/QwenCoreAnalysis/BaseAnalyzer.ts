import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Define the Issue type with optional properties that can be undefined
export interface Issue {
  type: string;
  message: string;
  line?: number | undefined;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string | undefined;
}

export interface AnalysisResult {
  filePath: string;
  issues: Issue[];
  metrics: Record<string, any>;
  score: number;
}

export interface Issue {
  type: string;
  message: string;
  line?: number;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface AnalyzerConfig {
  includePatterns: string[];
  excludePatterns: string[];
  thresholds: Record<string, any>;
  output?: {
    format?: string;
    file?: string;
  };
}

export abstract class BaseAnalyzer {
  protected config: AnalyzerConfig;
  
  constructor(config: AnalyzerConfig) {
    this.config = config;
  }
  
  /**
   * Abstract method that must be implemented by subclasses
   * Performs analysis on a file and returns results
   */
  abstract analyzeFile(filePath: string, content: string): AnalysisResult;
  
  /**
   * Filter files based on configuration patterns
   */
  protected shouldAnalyzeFile(filePath: string): boolean {
    // Check exclude patterns first
    for (const pattern of this.config.excludePatterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of this.config.includePatterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Simple pattern matching (can be extended for more complex patterns)
   */
  protected matchesPattern(filePath: string, pattern: string): boolean {
    if (pattern === '*') return true;
    
    // Extension matching
    if (pattern.startsWith('*.')) {
      const ext = pattern.substring(1);
      return extname(filePath) === ext;
    }
    
    // Substring matching
    return filePath.includes(pattern);
  }
  
  /**
   * Read file content safely
   */
  protected readFile(filePath: string): string | null {
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
  
  /**
   * Create a new issue
   */
  protected createIssue(
    type: string,
    message: string,
    severity: 'low' | 'medium' | 'high',
    line?: number,
    suggestion?: string
  ): Issue {
    return {
      type,
      message,
      severity,
      ...(line !== undefined && { line }),
      ...(suggestion !== undefined && { suggestion })
    };
  }
  
  /**
   * Calculate a quality score based on issues
   */
  protected calculateScore(issues: Issue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }
    
    return Math.max(0, score);
  }
}