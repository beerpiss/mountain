export class BadArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadArgumentError';
  }
}

export class UndefinedPromptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UndefinedPromptError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
