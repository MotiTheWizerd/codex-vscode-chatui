export class ReportGenerator {
  static generate(results: any[]): string {
    let report = '# Code Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    if (results.length === 0) {
      report += 'No issues found! Your code is in excellent shape.\n';
      return report;
    }
    
    // Summary
    const totalFiles = new Set(results.map(r => r.filePath)).size;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    report += '## Summary\n\n';
    report += `- Total files analyzed: ${totalFiles}\n`;
    report += `- Issues found: ${totalIssues}\n`;
    report += `- Average quality score: ${avgScore.toFixed(1)}/100\n\n`;
    
    // Issues by severity
    const highSeverity = results.flatMap(r => r.issues).filter(i => i.severity === 'high').length;
    const mediumSeverity = results.flatMap(r => r.issues).filter(i => i.severity === 'medium').length;
    const lowSeverity = results.flatMap(r => r.issues).filter(i => i.severity === 'low').length;
    
    report += '## Issues by Severity\n\n';
    report += `- High: ${highSeverity}\n`;
    report += `- Medium: ${mediumSeverity}\n`;
    report += `- Low: ${lowSeverity}\n\n`;
    
    // Group by file
    const fileResults = new Map<string, any[]>();
    results.forEach(result => {
      if (!fileResults.has(result.filePath)) {
        fileResults.set(result.filePath, []);
      }
      fileResults.get(result.filePath)!.push(result);
    });
    
    // Detailed results by file
    report += '## Detailed Results\n\n';
    fileResults.forEach((results, filePath) => {
      // Extract just the relative path from the full path
      const relativePath = filePath.replace(process.cwd(), '').replace(/^\/|\\/, '');
      
      report += `### ${relativePath}\n\n`;
      
      // Aggregate metrics
      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      
      report += `**Score: ${avgScore.toFixed(1)}/100** | **Issues: ${totalIssues}**\n\n`;
      
      // Group issues by type
      const issuesByType = new Map<string, any[]>();
      results.forEach(result => {
        result.issues.forEach((issue: any) => {
          if (!issuesByType.has(issue.type)) {
            issuesByType.set(issue.type, []);
          }
          issuesByType.get(issue.type)!.push(issue);
        });
      });
      
      // List issues by type
      issuesByType.forEach((issues, type) => {
        report += `#### ${this.formatIssueType(type)} (${issues.length})\n\n`;
        
        issues.forEach((issue: any) => {
          report += `- **${issue.severity.toUpperCase()}**: ${issue.message}\n`;
          if (issue.line) {
            report += `  - Line: ${issue.line}\n`;
          }
          if (issue.suggestion) {
            report += `  - Suggestion: ${issue.suggestion}\n`;
          }
          report += '\n';
        });
      });
      
      report += '\n';
    });
    
    return report;
  }
  
  private static formatIssueType(type: string): string {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}