# Files to Refactor (Over 250 Lines)

This document lists all files in the project that exceed 250 lines and are candidates for refactoring to improve maintainability.

| File Path | Line Count | Refactoring Priority |
|----------|------------|---------------------|
| `src/ui/chat-webview.ts` | 388 lines | High |
| `src/core/manager.ts` | 368 lines | High |

## Summary

- Total files analyzed: 41
- Files exceeding 250 lines: 2
- Refactoring candidates: 2

## Recommendations

1. **src/ui/chat-webview.ts** - Consider breaking down into smaller modules by functionality
2. **src/core/manager.ts** - Look for opportunities to extract helper classes or functions

Both files are significantly above the 250-line threshold and would benefit from modularization to improve code readability and maintainability.