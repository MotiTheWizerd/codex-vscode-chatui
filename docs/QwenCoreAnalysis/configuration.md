# QwenCoreAnalysis Configuration Examples

## Basic Configuration

```json
{
  "includePatterns": ["src/**/*.ts"],
  "excludePatterns": ["node_modules/**", "dist/**"],
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

## Advanced Configuration

```json
{
  "includePatterns": ["src/**/*.ts", "src/**/*.js"],
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "**/*.test.*",
    "**/*.spec.*",
    "examples/**"
  ],
  "thresholds": {
    "lineCount": 300,
    "functionLength": 40,
    "nestingDepth": 4
  },
  "output": {
    "format": "markdown",
    "file": "analysis-report.md"
  }
}
```

## Configuration Options

### includePatterns

Glob patterns for files to include in analysis.

### excludePatterns

Glob patterns for files to exclude from analysis.

### thresholds

Configurable limits for various metrics:

- `lineCount`: Maximum lines per file
- `functionLength`: Maximum lines per function
- `nestingDepth`: Maximum nesting depth

### output

Output configuration:

- `format`: Report format (currently only "markdown" supported)
- `file`: Output file path
