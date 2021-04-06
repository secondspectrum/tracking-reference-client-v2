import { promises as fs } from 'fs';
import { join } from 'path';

function padStart(s: string, length: number, char: string): string {
  let padding = '';
  const lengthToPad = Math.max(length - s.length, 0);
  for (let i = 0; i < lengthToPad; i++) {
    padding += char;
  }

  return padding + s;
}

export default class Recorder {
  constructor(private clientFolder: string) {}

  async log(message: string): Promise<void> {
    const logMessage = `[${new Date().toISOString()}]\t${message}`;
    const logFile = join(this.clientFolder, 'logs');

    console.log(logMessage);
    await fs.appendFile(logFile, `${logMessage}\n`);
  }

  async recordMessage(messageNumber: number, message: string): Promise<void> {
    const messageNumberStr = padStart(messageNumber.toString(), 6, '0');
    const now = Date.now();
    const rawFilename = join(
      this.clientFolder,
      `msg_${messageNumberStr}_${now}.json`
    );

    await fs.writeFile(rawFilename, message);
  }
}
