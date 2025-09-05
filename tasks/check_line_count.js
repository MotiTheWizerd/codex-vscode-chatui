const fs = require('fs');
const path = require('path');

// List of files to check (from the glob result)
const files = [
  "C:\\projects\\codex-vs-ext\\src\\ui\\controllers.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\chat-webview.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\elements-registry.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\renderer.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\bridge.ts",
  "C:\\projects\\codex-vs-ext\\media\\chat\\js\\main.js",
  "C:\\projects\\codex-vs-ext\\src\\core\\manager.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\events.ts",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\logger.ts",
  "C:\\projects\\codex-vs-ext\\src\\ext\\extension.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\bootstrap.ts",
  "C:\\projects\\codex-vs-ext\\src\\ext\\registrations\\commands.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\statusbar\\logs-button.ts",
  "C:\\projects\\codex-vs-ext\\src\\ui\\chat-panel-manager.ts",
  "C:\\projects\\codex-vs-ext\\tasks\\results\\js\\main.js",
  "C:\\projects\\codex-vs-ext\\src\\tools\\tool-bus.ts",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\errors.ts",
  "C:\\projects\\codex-vs-ext\\src\\state\\migrations.ts",
  "C:\\projects\\codex-vs-ext\\src\\types\\chat.ts",
  "C:\\projects\\codex-vs-ext\\src\\state\\session-store.ts",
  "C:\\projects\\codex-vs-ext\\src\\tools\\shell-tool.ts",
  "C:\\projects\\codex-vs-ext\\src\\types\\result.ts",
  "C:\\projects\\codex-vs-ext\\src\\types\\tools.ts",
  "C:\\projects\\codex-vs-ext\\src\\types\\ipc.ts",
  "C:\\projects\\codex-vs-ext\\src\\transport\\ws-handler.ts",
  "C:\\projects\\codex-vs-ext\\src\\transport\\client.ts",
  "C:\\projects\\codex-vs-ext\\src\\transport\\http.ts",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\err.ts",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\log.ts",
  "C:\\projects\\codex-vs-ext\\src\\scripts\\package-project.js",
  "C:\\projects\\codex-vs-ext\\src\\scripts\\consolidate-docs.js",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\reporter.ts",
  "C:\\projects\\codex-vs-ext\\src\\config\\settings.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\event-bus.ts",
  "C:\\projects\\codex-vs-ext\\src\\telemetry\\metrics.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\policy.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\config.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\di.ts",
  "C:\\projects\\codex-vs-ext\\src\\config\\secrets.ts",
  "C:\\projects\\codex-vs-ext\\src\\core\\errors.ts",
  "C:\\projects\\codex-vs-ext\\src\\transport\\types.ts"
];

const longFiles = [];

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    if (lines > 250) {
      longFiles.push({ path: filePath, lines });
    }
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
  }
});

console.log("Files with more than 250 lines:");
longFiles.sort((a, b) => b.lines - a.lines); // Sort by line count descending
longFiles.forEach(file => {
  console.log(`${file.path}: ${file.lines} lines`);
});