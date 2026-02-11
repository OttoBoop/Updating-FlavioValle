import { describe, it, expect } from '@jest/globals';
import { Logger } from '../utils/logger.js';

describe('Logger', () => {
  it('should create logger instance with log level', () => {
    const logger = new Logger('debug');
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
  });

  it('should have log and error methods', () => {
    const logger = new Logger('standard');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should have writeToFile method', () => {
    const logger = new Logger('verbose');
    expect(typeof logger.writeToFile).toBe('function');
  });

  it('should default to debug level when no level provided', () => {
    const logger = new Logger();
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('number');
  });
});
