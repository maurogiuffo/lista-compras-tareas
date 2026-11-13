import type { Clock, IdGenerator } from '../src/application/index.js';

export class FixedClock implements Clock {
  constructor(private current = new Date('2026-01-01T10:00:00Z')) {}
  now(): Date {
    return this.current;
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class SequentialIds implements IdGenerator {
  private n = 0;
  next(): string {
    this.n += 1;
    return `item-${this.n}`;
  }
}
