# Modules

This directory contains isolated, reusable modules for the Codex VS Code Extension.

## CoreAnalysis

A comprehensive static code analysis tool for identifying code quality issues, maintainability concerns, and refactoring opportunities.

### Features

- **Line Count Analysis**: Identifies files that exceed configurable line count thresholds
- **Code Smell Detection**: Finds TODOs, FIXMEs, and other markers
- **Nesting Depth Analysis**: Identifies deeply nested code blocks
- **Function Size Analysis**: Finds functions that exceed length thresholds

### Usage

Run the analysis tool with:

```bash
npm run analyze
```

This will generate a `code-analysis-report.md` file with detailed findings.