# QwenCoreAnalysis Technical Documentation

## Architecture Overview

The QwenCoreAnalysis module follows a modular, extensible architecture designed for static code analysis. The core components include:

### Core Components

1. **BaseAnalyzer** - Abstract base class for all analyzers
2. **CoreAnalyzer** - Main orchestrator that runs all analyzers
3. **ConfigLoader** - Handles configuration management
4. **ReportGenerator** - Creates formatted analysis reports
5. **Individual Analyzers** - Specific analysis implementations

## BaseAnalyzer

The `BaseAnalyzer` is an abstract class that provides common functionality for all analyzers:

```typescript
export abstract class BaseAnalyzer {
  protected config: AnalyzerConfig;
  
  constructor(config: AnalyzerConfig) {
    this.config = config;
  }
  
  abstract analyzeFile(filePath: string, content: string): AnalysisResult;
}
```

### Key Methods

- `analyzeFile()`: Abstract method that must be implemented by subclasses
- `shouldAnalyzeFile()`: Determines if a file should be analyzed based on patterns
- `matchesPattern()`: Simple pattern matching utility
- `readFile()`: Safe file reading with error handling
- `createIssue()`: Helper for creating standardized issue objects
- `calculateScore()`: Calculates quality score based on issues

## CoreAnalyzer

The `CoreAnalyzer` orchestrates the analysis process by:

1. Loading configuration
2. Initializing all analyzer modules
3. Finding files to analyze
4. Running each analyzer on each file
5. Aggregating results
6. Generating reports

```typescript
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
}
```

## Configuration System

The configuration system allows customization of the analysis process:

```typescript
export interface AnalyzerConfig {
  includePatterns: string[];
  excludePatterns: string[];
  thresholds: Record<string, any>;
  output?: {
    format?: string;
    file?: string;
  };
}
```

### Default Configuration

```json
{
  "includePatterns": [
    "src/**/*.ts",
    "src/**/*.js"
  ],
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "test/**"
  ],
  "thresholds": {
    "lineCount": 250,
    "functionLength": 50,
    "nestingDepth": 5
  }
}
```

## Report Generation

The `ReportGenerator` creates formatted reports from analysis results:

```typescript
export class ReportGenerator {
  static generate(results: any[]): string {
    // Generate markdown report
  }
}
```

### Report Structure

1. **Summary Section**
   - Total files analyzed
   - Issues found
   - Average quality score

2. **Severity Breakdown**
   - High severity issues
   - Medium severity issues
   - Low severity issues

3. **Detailed Results**
   - Issues grouped by file
   - Metrics for each file
   - Specific issue details with line numbers

## Individual Analyzers

### LineCountAnalyzer

Analyzes file length and identifies files exceeding the configured threshold.

**Key Features:**
- Counts lines in each file
- Compares against threshold
- Generates issues for oversized files

### CodeSmellAnalyzer

Identifies code smells and markers that indicate potential issues.

**Key Features:**
- Finds TODO comments
- Finds FIXME comments
- Identifies other code smell patterns

### NestingAnalyzer

Analyzes code structure and identifies deeply nested blocks.

**Key Features:**
- Tracks nesting depth
- Identifies complex control flows
- Generates issues for excessive nesting

### FunctionSizeAnalyzer

Analyzes function length and identifies functions exceeding the configured threshold.

**Key Features:**
- Detects function boundaries
- Counts lines in functions
- Generates issues for oversized functions

## Extending the Module

To create a new analyzer:

1. Extend the `BaseAnalyzer` class
2. Implement the `analyzeFile()` method
3. Add the new analyzer to the `CoreAnalyzer` constructor
4. Update configuration as needed

```typescript
export class NewAnalyzer extends BaseAnalyzer {
  analyzeFile(filePath: string, content: string): AnalysisResult {
    // Implementation here
  }
}
```

## Integration with Build Process

The module integrates with the project's build process through npm scripts:

```json
{
  "scripts": {
    "analyze": "node dist/modules/QwenCoreAnalysis/cli.js"
  }
}
```

This allows easy execution as part of development workflows or CI/CD pipelines.