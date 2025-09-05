#!/usr/bin/env node

// generate-codebase-json.cjs
// Script to generate codebase analysis JSON files for AI agent consumption

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const OUTPUT_DIR = path.join(ROOT_DIR, 'docs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ----------------------------
// 1. codebase-structure.json
// ----------------------------

// Define architecture layers first to count files
const architecture = {
  layers: [
    {
      name: "ext",
      description: "Extension entry point and command registrations",
      files: ["src/ext/extension.ts", "src/ext/registrations/commands.ts"],
      responsibilities: ["Extension activation", "Command registration", "Lifecycle management"]
    },
    {
      name: "core",
      description: "Business logic and main orchestration",
      files: [
        "src/core/manager.ts",
        "src/core/event-bus.ts",
        "src/core/config.ts",
        "src/core/bootstrap.ts",
        "src/core/policy.ts",
        "src/core/di.ts"
      ],
      responsibilities: [
        "Extension lifecycle",
        "Event coordination",
        "Dependency management",
        "Configuration management",
        "Policy enforcement"
      ]
    },
    {
      name: "ui",
      description: "User interface and webview management",
      files: [
        "src/ui/chat-webview.ts",
        "src/ui/chat-panel-manager.ts",
        "src/ui/renderer.ts",
        "src/ui/bridge.ts"
      ],
      responsibilities: [
        "Webview rendering",
        "User interactions",
        "UI state management",
        "Panel management"
      ]
    },
    {
      name: "transport",
      description: "External communication layer",
      files: [
        "src/transport/client.ts",
        "src/transport/http.ts",
        "src/transport/ws-handler.ts",
        "src/transport/types.ts"
      ],
      responsibilities: [
        "API communication",
        "WebSocket handling",
        "Request/response management",
        "Streaming responses"
      ]
    },
    {
      name: "state",
      description: "Session and state management",
      files: [
        "src/state/session-store.ts",
        "src/state/migrations.ts"
      ],
      responsibilities: [
        "Session persistence",
        "State management",
        "Data serialization"
      ]
    },
    {
      name: "tools",
      description: "Tool execution and management",
      files: [
        "src/tools/tool-bus.ts",
        "src/tools/shell-tool.ts"
      ],
      responsibilities: [
        "Tool registration",
        "Tool execution",
        "Plugin API"
      ]
    },
    {
      name: "telemetry",
      description: "Logging and telemetry",
      files: [
        "src/telemetry/logger.ts",
        "src/telemetry/log.ts",
        "src/telemetry/metrics.ts",
        "src/telemetry/reporter.ts",
        "src/telemetry/err.ts",
        "src/telemetry/errors.ts"
      ],
      responsibilities: [
        "Structured logging",
        "Error handling",
        "Metrics collection",
        "Telemetry reporting"
      ]
    },
    {
      name: "config",
      description: "Configuration management",
      files: [
        "src/config/settings.ts",
        "src/config/secrets.ts"
      ],
      responsibilities: [
        "Settings management",
        "Secret handling",
        "Configuration loading"
      ]
    },
    {
      name: "types",
      description: "Type definitions",
      files: [
        "src/types/chat.ts",
        "src/types/tools.ts",
        "src/types/ipc.ts",
        "src/types/result.ts"
      ],
      responsibilities: [
        "Shared type definitions",
        "Interface contracts",
        "Data structures"
      ]
    }
  ]
};

// Count files in architecture layers
const fileSet = new Set();
architecture.layers.forEach(layer => {
  layer.files.forEach(file => fileSet.add(file));
});
const totalFiles = fileSet.size;

const codebaseStructure = {
  metadata: {
    projectName: "codex-vs-ext",
    version: "0.0.1",
    lastUpdated: new Date().toISOString(),
    totalFiles: totalFiles,
    language: "TypeScript",
    framework: "VSCode Extension"
  },
  architecture: architecture,
  dependencies: [
    {
      "file": "src/core/manager.ts",
      "imports": [
        {
          "module": "vscode",
          "type": "external",
          "usage": "Extension API integration"
        },
        {
          "module": "@/core/event-bus",
          "type": "internal",
          "usage": "Event coordination",
          "relationship": "uses"
        },
        {
          "module": "@/core/config",
          "type": "internal",
          "usage": "Configuration management",
          "relationship": "uses"
        },
        {
          "module": "@/core/policy",
          "type": "internal",
          "usage": "Policy enforcement",
          "relationship": "uses"
        },
        {
          "module": "@/core/di",
          "type": "internal",
          "usage": "Dependency injection",
          "relationship": "uses"
        },
        {
          "module": "@/transport/client",
          "type": "internal",
          "usage": "External API communication",
          "relationship": "orchestrates"
        },
        {
          "module": "@/state/session-store",
          "type": "internal",
          "usage": "Session persistence",
          "relationship": "manages"
        },
        {
          "module": "@/tools/tool-bus",
          "type": "internal",
          "usage": "Tool execution",
          "relationship": "uses"
        },
        {
          "module": "@/telemetry/logger",
          "type": "internal",
          "usage": "Logging",
          "relationship": "uses"
        },
        {
          "module": "@/config/settings",
          "type": "internal",
          "usage": "Settings management",
          "relationship": "uses"
        },
        {
          "module": "@/files/service",
          "type": "internal",
          "usage": "File operations",
          "relationship": "uses"
        },
        {
          "module": "@/types/chat",
          "type": "internal",
          "usage": "Type definitions",
          "relationship": "uses"
        },
        {
          "module": "@core/events",
          "type": "internal",
          "usage": "Event definitions",
          "relationship": "uses"
        }
      ],
      "dependents": [
        "src/ext/extension.ts",
        "src/ui/chat-webview.ts"
      ]
    },
    {
      "file": "src/ui/chat-webview.ts",
      "imports": [
        {
          "module": "vscode",
          "type": "external",
          "usage": "Webview API integration"
        },
        {
          "module": "@/core/manager",
          "type": "internal",
          "usage": "Core functionality access",
          "relationship": "uses"
        },
        {
          "module": "@/telemetry/logger",
          "type": "internal",
          "usage": "Logging",
          "relationship": "uses"
        }
      ],
      "dependents": [
        "src/ui/chat-panel-manager.ts"
      ]
    }
  ],
  patterns: [
    {
      "type": "Singleton",
      "files": ["src/core/manager.ts", "src/telemetry/log.ts"],
      "description": "Single instance of core manager and logger"
    },
    {
      "type": "Observer",
      "files": ["src/core/event-bus.ts"],
      "description": "Event-driven communication"
    },
    {
      "type": "Facade",
      "files": ["src/transport/client.ts"],
      "description": "Simplified interface for external APIs"
    },
    {
      "type": "Factory",
      "files": ["src/ui/chat-webview.ts", "src/ui/chat-panel-manager.ts"],
      "description": "Factory pattern for creating chat webviews"
    },
    {
      "type": "Dependency Injection",
      "files": ["src/core/di.ts", "src/core/manager.ts"],
      "description": "Dependency injection container for service management"
    }
  ],
  hotspots: [
    {
      "file": "src/core/manager.ts",
      "complexity": "high",
      "reason": "Central orchestration point with many dependencies",
      "risk": "Single point of failure"
    },
    {
      "file": "src/ui/chat-webview.ts",
      "complexity": "high",
      "reason": "Complex webview message handling and event coordination",
      "risk": "UI/UX issues if broken"
    },
    {
      "file": "src/transport/client.ts",
      "complexity": "medium",
      "reason": "Handles external API communication with retry logic",
      "risk": "Communication failures if broken"
    }
  ]
};

// --------------------------
// 2. codebase-symbols.json
// --------------------------

const codebaseSymbols = {
  classes: [
    {
      "name": "CoreManager",
      "file": "src/core/manager.ts",
      "line": 23,
      "access": "export",
      "extends": null,
      "implements": ["vscode.Disposable"],
      "description": "Main orchestrator for extension functionality",
      "complexity": "high",
      "responsibilities": [
        "Extension lifecycle management",
        "Component coordination",
        "Event orchestration",
        "Resource cleanup"
      ],
      "methods": [
        {
          "name": "initialize",
          "signature": "async initialize(): Promise<void>",
          "line": 45,
          "access": "public",
          "description": "Initializes all core components",
          "parameters": [],
          "returns": "Promise<void>",
          "throws": ["Error"],
          "complexity": "medium"
        },
        {
          "name": "dispose",
          "signature": "dispose(): void",
          "line": 235,
          "access": "public",
          "description": "Cleanup resources and dispose components",
          "parameters": [],
          "returns": "void"
        },
        {
          "name": "shutdown",
          "signature": "async shutdown(): Promise<void>",
          "line": 190,
          "access": "public",
          "description": "Gracefully shutdown the extension",
          "parameters": [],
          "returns": "Promise<void>"
        }
      ],
      "properties": [
        {
          "name": "eventBus",
          "type": "EventBus",
          "access": "private readonly",
          "readonly": true,
          "description": "Central event coordination system"
        },
        {
          "name": "configService",
          "type": "ConfigService",
          "access": "private readonly",
          "readonly": true,
          "description": "Configuration service"
        }
      ],
      "dependencies": [
        "EventBus", "ConfigService", "PolicyGuard", "DIContainer", "Logger", 
        "SettingsManager", "SessionStore", "ToolBus", "FilesService", "CodexClient"
      ],
      "usedBy": [
        "ChatWebview", "CommandRegistration", "Bootstrap"
      ]
    },
    {
      "name": "ChatWebview",
      "file": "src/ui/chat-webview.ts",
      "line": 7,
      "access": "export",
      "extends": null,
      "implements": ["vscode.Disposable"],
      "description": "Webview panel for chat interface",
      "complexity": "high",
      "responsibilities": [
        "Webview panel management",
        "Message handling",
        "Event coordination with core"
      ],
      "methods": [
        {
          "name": "create",
          "signature": "static create(context: vscode.ExtensionContext, core: CoreManager, logger: Logger | null, onDispose?: () => void): ChatWebview",
          "line": 180,
          "access": "public static",
          "description": "Factory method to create a new chat webview",
          "parameters": [
            {
              "name": "context",
              "type": "vscode.ExtensionContext",
              "description": "VS Code extension context"
            },
            {
              "name": "core",
              "type": "CoreManager",
              "description": "Core manager instance"
            },
            {
              "name": "logger",
              "type": "Logger | null",
              "description": "Logger instance"
            },
            {
              "name": "onDispose",
              "type": "() => void",
              "description": "Callback when disposed"
            }
          ],
          "returns": "ChatWebview"
        },
        {
          "name": "dispose",
          "signature": "dispose(): void",
          "line": 205,
          "access": "public",
          "description": "Dispose of the webview resources",
          "parameters": [],
          "returns": "void"
        }
      ],
      "properties": [
        {
          "name": "panel",
          "type": "vscode.WebviewPanel",
          "access": "private",
          "readonly": false,
          "description": "The webview panel"
        }
      ],
      "dependencies": [
        "vscode", "CoreManager", "Logger"
      ],
      "usedBy": [
        "ChatPanelManager"
      ]
    },
    {
      "name": "EventBus",
      "file": "src/core/event-bus.ts",
      "line": 4,
      "access": "export",
      "extends": null,
      "implements": [],
      "description": "Centralized event bus for inter-component communication",
      "complexity": "low",
      "responsibilities": [
        "Event subscription",
        "Event publishing",
        "Handler management"
      ],
      "methods": [
        {
          "name": "subscribe",
          "signature": "subscribe(event: string, handler: EventHandler): void",
          "line": 11,
          "access": "public",
          "description": "Subscribe to an event",
          "parameters": [
            {
              "name": "event",
              "type": "string",
                           "description": "Event name"
            },
            {
              "name": "handler",
              "type": "EventHandler",
              "description": "Event handler function"
            }
          ],
          "returns": "void"
        },
        {
          "name": "publish",
          "signature": "publish(event: string, ...args: unknown[]): void",
          "line": 23,
          "access": "public",
          "description": "Publish an event with arguments",
          "parameters": [
            {
              "name": "event",
              "type": "string",
              "description": "Event name"
            },
            {
              "name": "args",
              "type": "unknown[]",
              "description": "Event arguments"
            }
          ],
          "returns": "void"
        },
        {
          "name": "unsubscribe",
          "signature": "unsubscribe(event: string, handler: EventHandler): void",
          "line": 17,
          "access": "public",
          "description": "Unsubscribe from an event",
          "parameters": [
            {
              "name": "event",
              "type": "string",
              "description": "Event name"
            },
            {
              "name": "handler",
              "type": "EventHandler",
              "description": "Event handler function"
            }
          ],
          "returns": "void"
        }
      ],
      "properties": [],
      "dependencies": [
        "Logger"
      ],
      "usedBy": [
        "CoreManager", "ChatWebview"
      ]
    },
    {
      "name": "SessionStore",
      "file": "src/state/session-store.ts",
      "line": 9,
      "access": "export",
      "extends": null,
      "implements": [],
      "description": "Manages chat sessions and persistence",
      "complexity": "medium",
      "responsibilities": [
        "Session creation",
        "Message management",
        "State persistence"
      ],
      "methods": [
        {
          "name": "createSession",
          "signature": "async createSession(): Promise<ChatSession>",
          "line": 70,
          "access": "public",
          "description": "Create a new chat session",
          "parameters": [],
          "returns": "Promise<ChatSession>"
        },
        {
          "name": "addMessageToCurrentSession",
          "signature": "async addMessageToCurrentSession(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>",
          "line": 110,
          "access": "public",
          "description": "Add a message to the current session",
          "parameters": [
            {
              "name": "message",
              "type": "Omit<ChatMessage, 'id' | 'timestamp'>",
              "description": "Message to add"
            }
          ],
          "returns": "Promise<ChatMessage>"
        }
      ],
      "properties": [],
      "dependencies": [
        "vscode", "Logger"
      ],
      "usedBy": [
        "CoreManager"
      ]
    },
    {
      "name": "CodexClient",
      "file": "src/transport/client.ts",
      "line": 10,
      "access": "export",
      "extends": null,
      "implements": [],
      "description": "Client for communicating with Codex server",
      "complexity": "medium",
      "responsibilities": [
        "API communication",
        "Message sending",
        "Response streaming"
      ],
      "methods": [
        {
          "name": "sendMessage",
          "signature": "async sendMessage(message: string, options?: Record<string, unknown>): Promise<unknown>",
          "line": 28,
          "access": "public",
          "description": "Send a message to the Codex server",
          "parameters": [
            {
              "name": "message",
              "type": "string",
              "description": "Message to send"
            },
            {
              "name": "options",
              "type": "Record<string, unknown>",
              "description": "Additional options"
            }
          ],
          "returns": "Promise<unknown>"
        },
        {
          "name": "streamResponse",
          "signature": "async streamResponse(message: string, onToken: (token: string) => void, options?: Record<string, unknown>): Promise<void>",
          "line": 65,
          "access": "public",
          "description": "Stream a response from the Codex server",
          "parameters": [
            {
              "name": "message",
              "type": "string",
              "description": "Message to send"
            },
            {
              "name": "onToken",
              "type": "(token: string) => void",
              "description": "Callback for each token"
            },
            {
              "name": "options",
              "type": "Record<string, unknown>",
              "description": "Additional options"
            }
          ],
          "returns": "Promise<void>"
        }
      ],
      "properties": [],
      "dependencies": [
        "ConfigService", "Logger"
      ],
      "usedBy": [
        "CoreManager"
      ]
    }
  ],
  interfaces: [
    {
      "name": "ChatMessage",
      "file": "src/types/chat.ts",
      "line": 1,
      "description": "Contract for chat message data",
      "properties": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "Unique message identifier"
        },
        {
          "name": "role",
          "type": "'user' | 'assistant' | 'system'",
          "required": true,
          "description": "Message sender role"
        },
        {
          "name": "content",
          "type": "string",
          "required": true,
          "description": "Message text content"
        },
        {
          "name": "timestamp",
          "type": "Date",
          "required": true,
          "description": "When message was created"
        }
      ],
      "usedBy": ["ChatSession", "ChatWebview", "SessionStore"],
      "extends": []
    },
    {
      "name": "ChatSession",
      "file": "src/types/chat.ts",
      "line": 7,
      "description": "Contract for chat session data",
      "properties": [
        {
          "name": "id",
          "type": "string",
          "required": true,
          "description": "Unique session identifier"
        },
        {
          "name": "messages",
          "type": "ChatMessage[]",
          "required": true,
          "description": "Messages in the session"
        },
        {
          "name": "createdAt",
          "type": "Date",
          "required": true,
          "description": "When session was created"
        },
        {
          "name": "updatedAt",
          "type": "Date",
          "required": true,
          "description": "When session was last updated"
        }
      ],
      "usedBy": ["SessionStore", "CoreManager"],
      "extends": []
    },
    {
      "name": "Tool",
      "file": "src/types/tools.ts",
      "line": 1,
      "description": "Contract for tool plugins",
      "properties": [
        {
          "name": "name",
          "type": "string",
          "required": true,
          "description": "Tool name"
        },
        {
          "name": "description",
          "type": "string",
          "required": true,
          "description": "Tool description"
        },
        {
          "name": "parameters",
          "type": "I",
          "required": true,
          "description": "Tool parameters type"
        },
        {
          "name": "execute",
          "type": "(args: I) => Promise<O>",
          "required": true,
          "description": "Tool execution function"
        }
      ],
      "usedBy": ["ToolBus", "ShellTool"],
      "extends": []
    }
  ],
  functions: [
    {
      "name": "activate",
      "file": "src/ext/extension.ts",
      "line": 4,
      "signature": "async function activate(context: vscode.ExtensionContext): Promise<void>",
      "access": "export",
      "description": "VSCode extension activation entry point",
      "parameters": [
        {
          "name": "context",
          "type": "vscode.ExtensionContext",
          "description": "VSCode extension context"
        }
      ],
      "returns": "Promise<void>",
      "complexity": "low"
    },
    {
      "name": "bootstrap",
      "file": "src/core/bootstrap.ts",
      "line": 5,
      "signature": "async function bootstrap(context: vscode.ExtensionContext): Promise<void>",
      "access": "export",
      "description": "Bootstrap the extension core services",
      "parameters": [
        {
          "name": "context",
          "type": "vscode.ExtensionContext",
          "description": "VSCode extension context"
        }
      ],
      "returns": "Promise<void>",
      "complexity": "low"
    }
  ],
  enums: [],
  types: [
    {
      "name": "EventHandler",
      "file": "src/core/event-bus.ts",
      "definition": "type EventHandler = (...args: unknown[]) => void",
      "description": "Generic event handler function signature",
      "usedBy": ["EventBus"]
    },
    {
      "name": "ShellIn",
      "file": "src/types/tools.ts",
      "definition": "interface ShellIn { command: string }",
      "description": "Input type for shell tool",
      "usedBy": ["ShellTool"]
    },
    {
      "name": "ShellOut",
      "file": "src/types/tools.ts",
      "definition": "interface ShellOut { stdout: string; stderr: string; exitCode: number }",
      "description": "Output type for shell tool",
      "usedBy": ["ShellTool"]
    }
  ]
};

// --------------------------
// 3. codebase-content.json
// --------------------------

const codebaseContent = {
  files: [
    {
      "path": "src/core/manager.ts",
      "size": fs.statSync(path.join(ROOT_DIR, "src/core/manager.ts")).size,
      "language": "typescript",
      "key_sections": [
        {
          "type": "class_definition",
          "name": "CoreManager",
          "startLine": 23,
          "endLine": 245,
          "content": `export class CoreManager implements vscode.Disposable {
  private readonly eventBus = new EventBus();
  private readonly configService = new ConfigService();
  private readonly policyGuard = new PolicyGuard();
  private readonly di = new DIContainer();
  private sessionStore: SessionStore | null = null;
  private toolBus: ToolBus | null = null;
  private client: CodexClient | null = null;
  private files: FilesService | null = null;

  private disposables: vscode.Disposable[] = [];
  private initialized = false;
  private disposed = false;
  // Event handlers we register so we can unsubscribe on shutdown
  private onUiSendWrapped: ((...args: unknown[]) => void) | null = null;
  private onToolInvokeWrapped: ((...args: unknown[]) => void) | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    public readonly logger: Logger | null = null
  ) {}

  async initialize(): Promise<void> {
    // Implementation...
  }

  // Getters for services
  get diContainer(): DIContainer {
    return this.di;
  }
  // ... more getters

  async shutdown(): Promise<void> {
    // Implementation...
  }

  dispose(): void {
    // Implementation...
  }

  private registerEventHandlers() {
    // Implementation...
  }
  // ... other private methods
}`,
          "issues": [
            {
              "type": "complexity",
              "severity": "medium",
              "description": "High number of dependencies and responsibilities",
              "line": 23
            }
          ],
          "metrics": {
            "cyclomatic_complexity": 10,
            "lines_of_code": 222,
            "dependencies_count": 12
          }
        }
      ],
      "imports": [
        {
          "module": "vscode",
          "line": 2,
          "used_exports": ["* as vscode"]
        },
        {
          "module": "@/core/event-bus",
          "line": 3,
          "used_exports": ["EventBus"]
        },
        {
          "module": "@/core/config",
          "line": 4,
          "used_exports": ["ConfigService"]
        },
        {
          "module": "@/core/policy",
          "line": 5,
          "used_exports": ["PolicyGuard"]
        },
        {
          "module": "@/core/di",
          "line": 6,
          "used_exports": ["DIContainer"]
        },
        {
          "module": "@/telemetry/logger.js",
          "line": 7,
          "used_exports": ["Logger"]
        },
        {
          "module": "@/config/settings",
          "line": 8,
          "used_exports": ["SettingsManager"]
        },
        {
          "module": "@/state/session-store",
          "line": 9,
          "used_exports": ["SessionStore"]
        },
        {
          "module": "@/tools/tool-bus",
          "line": 10,
          "used_exports": ["ToolBus"]
        },
        {
          "module": "@/files/service",
          "line": 11,
          "used_exports": ["FilesService"]
        },
        {
          "module": "@/transport/client",
          "line": 12,
          "used_exports": ["CodexClient"]
        },
        {
          "module": "@/types/chat",
          "line": 13,
          "used_exports": ["ChatSession"]
        },
        {
          "module": "@core/events",
          "line": 14,
          "used_exports": ["Events"]
        },
        {
          "module": "@core/events",
          "line": 15,
          "used_exports": [
            "UiSendPayload",
            "TransportStartedPayload", 
            "TransportTokenPayload",
            "TransportCompletePayload",
            "TransportErrorPayload",
            "ToolInvokePayload",
            "ToolResultPayload",
            "ToolErrorPayload"
          ]
        }
      ],
      "exports": [
        {
          "name": "CoreManager",
          "type": "class",
          "line": 23,
          "default": false
        }
      ]
    },
    {
      "path": "src/ui/chat-webview.ts",
      "size": fs.statSync(path.join(ROOT_DIR, "src/ui/chat-webview.ts")).size,
      "language": "typescript",
      "key_sections": [
        {
          "type": "class_definition",
          "name": "ChatWebview",
          "startLine": 7,
          "endLine": 220,
          "content": `export class ChatWebview implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private disposed = false;
  private logger: Logger | null = null;

  private constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly core: CoreManager,
    private readonly onDispose?: () => void
  ) {
    // Implementation...
  }

  private panel: vscode.WebviewPanel;

  static create(
    context: vscode.ExtensionContext,
    core: CoreManager,
    logger: Logger | null = null,
    onDispose?: () => void
  ): ChatWebview {
    // Implementation...
  }

  reveal(column: vscode.ViewColumn = vscode.ViewColumn.Beside) {
    // Implementation...
  }

  dispose() {
    // Implementation...
  }

  get webviewPanel(): vscode.WebviewPanel {
    // Implementation...
  }

  private async setHtml(context: vscode.ExtensionContext) {
    // Implementation...
  }
}`,
          "issues": [
            {
              "type": "complexity",
              "severity": "high",
              "description": "Complex message handling and event coordination",
              "line": 7
            }
          ],
          "metrics": {
            "cyclomatic_complexity": 15,
            "lines_of_code": 213,
            "dependencies_count": 5
          }
        }
      ],
      "imports": [
        {
          "module": "vscode",
          "line": 2,
          "used_exports": ["Disposable", "window", "ViewColumn", "Uri"]
        },
        {
          "module": "@/core/manager",
          "line": 3,
          "used_exports": ["CoreManager"]
        }
      ],
      "exports": [
        {
          "name": "ChatWebview",
          "type": "class",
          "line": 7,
          "default": false
        }
      ]
    },
    {
      "path": "src/types/chat.ts",
      "size": fs.statSync(path.join(ROOT_DIR, "src/types/chat.ts")).size,
      "language": "typescript",
      "key_sections": [
        {
          "type": "interface_definitions",
          "name": "ChatMessage and ChatSession",
          "startLine": 1,
          "endLine": 25,
          "content": `export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Persisted shapes used in workspaceState
export interface PersistedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO
}

export interface PersistedChatSession {
  id: string;
  messages: PersistedChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PersistedState {
  sessions: Record<string, PersistedChatSession>;
  currentSessionId: string | null;
}`
        }
      ]
    }
  ],
  snippets: [
    {
      "category": "event_handling",
      "examples": [
        {
          "file": "src/core/event-bus.ts",
          "pattern": "type-safe event subscription and publishing",
          "code": `subscribe(event: string, handler: EventHandler): void {
  if (!this.handlers.has(event)) {
    this.handlers.set(event, new Set());
  }
  this.handlers.get(event)!.add(handler);
}

publish(event: string, ...args: unknown[]): void {
  const list = this.handlers.get(event);
  if (!list) return;
  for (const handler of list) {
    try {
      handler(...args);
    } catch (err) {
      this.logger?.error(\`Error in event handler for "\${event}"\`, { error: err });
    }
  }
}`
        }
      ]
    },
    {
      "category": "error_handling",
      "examples": [
        {
          "file": "src/core/manager.ts",
          "pattern": "try-catch with error logging",
          "code": `try {
  await this.riskyOperation();
} catch (error) {
  const m = error instanceof Error ? error.message : String(error);
  this.logger?.error?.("Operation failed", { error: m });
}`
        }
      ]
    },
    {
      "category": "webview_communication",
      "examples": [
        {
          "file": "src/ui/chat-webview.ts",
          "pattern": "webview message handling",
          "code": `const recv = this.panel.webview.onDidReceiveMessage(async (msg) => {
  try {
    if (!msg || typeof msg !== "object") return;
    const type = msg.type as string | undefined;
    
    if (type === "ui.ready") {
      // Handle UI ready event
    }
    
    if (type === "chat.userMessage") {
      // Handle user message
    }
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    this.logger?.error?.("webview message handling error", { error: m });
  }
});`
        }
      ]
    }
  ]
};

// Write the JSON files
const files = [
  { name: 'codebase-structure.json', data: codebaseStructure },
  { name: 'codebase-symbols.json', data: codebaseSymbols },
  { name: 'codebase-content.json', data: codebaseContent }
];

files.forEach(file => {
  const outputPath = path.join(OUTPUT_DIR, file.name);
  fs.writeFileSync(outputPath, JSON.stringify(file.data, null, 2));
  console.log(`Generated ${file.name}`);
});

console.log("Codebase analysis JSON files generated successfully!");