import fs from 'fs/promises';
import chalk from 'chalk';

const LOG_LEVELS = {
  minimal: 0,
  standard: 1,
  verbose: 2,
  debug: 3
};

export class Logger {
  constructor(level = 'debug') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.debug;
    this.logFile = 'output/discovery.log';
  }

  async log(message, level = 'standard') {
    if (LOG_LEVELS[level] <= this.level) {
      console.log(message);
      await this.writeToFile(message);
    }
  }

  async error(message, error) {
    const errorMsg = `${chalk.red('ERROR:')} ${message}\n${error?.stack || error}`;
    console.error(errorMsg);
    await this.writeToFile(errorMsg, 'output/error.log');
  }

  async writeToFile(message, file = this.logFile) {
    const timestamp = new Date().toISOString();
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, ''); // Remove chalk colors
    await fs.appendFile(file, `[${timestamp}] ${cleanMessage}\n`, 'utf8');
  }
}
