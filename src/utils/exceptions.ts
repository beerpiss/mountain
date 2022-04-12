export class BadArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadArgumentError';
  }
}
