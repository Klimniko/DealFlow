export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function assert(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) {
    throw new HttpError(status, message);
  }
}
