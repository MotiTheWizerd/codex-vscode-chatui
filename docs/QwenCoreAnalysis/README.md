# QwenCoreAnalysis

A comprehensive static code analysis tool for identifying code quality issues, maintainability concerns, and refactoring opportunities.

## Features

- **Line Count Analysis**: Identifies files that exceed configurable line count thresholds
- **Code Smell Detection**: Finds TODOs, FIXMEs, and other markers
- **Nesting Depth Analysis**: Identifies deeply nested code blocks
- **Function Size Analysis**: Finds functions that exceed length thresholds

## Installation

The tool is included in this project. To install dependencies:

```bash
pnpm install
```

## Usage

Run the analysis tool with:

```bash
npm run analyze
```

This will generate a `code-analysis-report.md` file with detailed findings.

## Configuration

The tool uses a configuration file (`core-analysis.config.json`) to control its behavior. If this file is not present, it will use the default configuration:

```json
{
  "includePatterns": [
    "src/**/*.ts",
    "src/**/*.js"
  ],
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "**/*.test.*",
    "**/*.spec.*"
  ],
  "thresholds": {
    "lineCount": 250,
    "functionLength": 50,
    "nestingDepth": 5
  },
  "output": {
    "format": "markdown",
    "file": "code-analysis-report.md"
  }
}
```

## Output

The tool generates a markdown report with:

1. Summary of findings
2. Issues grouped by file
3. Severity ratings for each issue
4. Actionable suggestions for improvement

## Extending the Tool

The tool is designed to be extensible:

1. Create new analyzers by extending the `BaseAnalyzer` class
2. Add your analyzer to the `CoreAnalyzer` class
3. Configure thresholds in the configuration file

## Architecture

The tool follows a modular architecture:

- **BaseAnalyzer**: Abstract base class that all analyzers extend
- **CoreAnalyzer**: Orchestrates all individual analyzers
- **ConfigLoader**: Handles configuration loading
- **ReportGenerator**: Generates formatted reports
- **Individual Analyzers**: Specific analysis modules (LineCountAnalyzer, CodeSmellAnalyzer, etc.)

## Analyzer Details

### LineCountAnalyzer
Identifies files that exceed a configurable line count threshold (default: 250 lines).

### CodeSmellAnalyzer
Finds code smells such as:
- TODO comments
- FIXME comments
- Other markers that indicate incomplete or problematic code

### NestingAnalyzer
Identifies deeply nested code blocks that exceed a configurable depth threshold (default: 5 levels).

### FunctionSizeAnalyzer
Finds functions that exceed a configurable length threshold (default: 50 lines).