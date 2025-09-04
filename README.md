# Codex Chat Extension

AI chat extension for VS Code powered by Codex.

## Features

- AI-powered chat interface within VS Code
- Streaming responses for real-time interaction
- Tool calling capabilities
- Session persistence
- Telemetry for usage analytics

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press F5 to launch the extension in a new Extension Development Host window

## Development

For development guidelines, see [docs/development.md](docs/development.md).

## Architecture

For architectural overview, see [docs/architecture.md](docs/architecture.md).

## Documentation

Module-specific documentation can be found in the [docs/](docs/) directory:

- [Core Module](docs/core/)
  - [Errors](docs/core/errors.md)
  - [Event Bus](docs/core/event-bus.md)
  - [Policy](docs/core/policy.md)
  - [Config](docs/core/config.md)
  - [Dependency Injection](docs/core/di.md)
  - [Manager](docs/core/manager.md)

## Contributing

1. Follow the development guidelines in [docs/development.md](docs/development.md)
2. Keep documentation up to date
3. Write clean, typed TypeScript code
4. Test your changes thoroughly