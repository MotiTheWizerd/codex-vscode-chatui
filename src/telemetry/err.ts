// Error serialization helper for structured logging metadata
export function serializeErr(e: unknown) {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack };
  }
  try {
    return { value: String(e) };
  } catch {
    return { value: "<unstringifiable>" };
  }
}

