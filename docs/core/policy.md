# Policy Module

## Overview

The policy module provides a minimal policy guard for permissions and rate limiting. It allows the application to check if features are allowed and if requests are within rate limits.

## Class

### PolicyGuard

A simple policy guard that supports feature checking, rate limiting, and request recording.

## Methods

### isFeatureAllowed(feature: string): boolean

Check if a feature is allowed based on policy.

- `feature`: The name of the feature to check
- Returns: `true` if the feature is allowed, `false` otherwise

Note: In the MVP implementation, this method always returns `true` (permissive).

### isWithinRateLimit(identifier: string, limit = 100, windowMs = 60_000): boolean

Check if a request is within rate limits.

- `identifier`: A unique identifier for the request (e.g., user ID, IP address)
- `limit`: The maximum number of requests allowed in the time window (default: 100)
- `windowMs`: The time window in milliseconds (default: 60,000ms = 1 minute)
- Returns: `true` if the request is within rate limits, `false` otherwise

### recordRequest(identifier: string): void

Record a request for rate limiting purposes.

- `identifier`: A unique identifier for the request (e.g., user ID, IP address)

## Usage

```typescript
import { PolicyGuard } from '@core/policy';

const policyGuard = new PolicyGuard();

// Check if a feature is allowed
if (policyGuard.isFeatureAllowed('premium-feature')) {
  // Proceed with feature
}

// Check if a request is within rate limits
if (policyGuard.isWithinRateLimit('user-123')) {
  // Proceed with request
  policyGuard.recordRequest('user-123');
} else {
  // Reject request due to rate limiting
}
```

## Implementation Details

The PolicyGuard uses an in-memory sliding window algorithm for rate limiting:

1. Requests are stored with timestamps in a Map keyed by identifier
2. When checking rate limits, only requests within the time window are counted
3. The default limit is 100 requests per minute
4. Request history is maintained in memory (no external storage)

## Design Principles

1. **Minimal API**: Only three methods with clear responsibilities
2. **Permissive Defaults**: Allows all features and requests by default
3. **In-Memory Storage**: Uses simple in-memory storage for MVP
4. **Configurable Limits**: Allows customization of rate limiting parameters
5. **Clear Logging**: Provides visibility during development