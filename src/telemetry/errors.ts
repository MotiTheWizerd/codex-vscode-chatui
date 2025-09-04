// Typed errors for network/timeout/protocol failures

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timeout after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends Error {
  override cause?: unknown;
  constructor(msg: string, cause?: unknown) {
    super(msg);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

export class ProtocolError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ProtocolError";
  }
}
