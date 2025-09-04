# Event Bus Module

## Overview

The event-bus module provides a minimal typed event bus implementation for pub/sub communication between components. It allows different parts of the application to communicate without direct dependencies.

## Class

### EventBus

A simple event bus that supports subscribing to events, unsubscribing from events, and publishing events.

## Methods

### subscribe(event: string, handler: EventHandler): void

Subscribe to an event with a handler function.

- `event`: The name of the event to subscribe to
- `handler`: The function to call when the event is published

### unsubscribe(event: string, handler: EventHandler): void

Unsubscribe a handler from an event.

- `event`: The name of the event to unsubscribe from
- `handler`: The handler function to remove

Note: This method removes all matching handlers, not just the first one.

### publish(event: string, ...args: any[]): void

Publish an event with optional arguments.

- `event`: The name of the event to publish
- `args`: Optional arguments to pass to the event handlers

Note: Event handlers are executed in a try/catch block to prevent one bad handler from breaking the entire event chain.

## Usage

```typescript
import { EventBus } from '@core/event-bus';

const eventBus = new EventBus();

// Subscribe to an event
const handler = (message: string) => console.log('Received:', message);
eventBus.subscribe('test-event', handler);

// Publish an event
eventBus.publish('test-event', 'Hello World!');

// Unsubscribe from an event
eventBus.unsubscribe('test-event', handler);
```

## Design Principles

1. **Minimal API**: Only three methods (subscribe, unsubscribe, publish)
2. **Type Safety**: Uses TypeScript for basic type safety
3. **Robustness**: Includes error handling to prevent one bad handler from breaking the chain
4. **Duplicate Handling**: Properly removes all matching handlers when unsubscribing
5. **No External Dependencies**: Pure TypeScript implementation with no external libraries