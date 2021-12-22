import * as async from 'async';
import { promises as fs } from 'graceful-fs';
import { join } from 'path';

interface BaseMessage {
  league: string;
  gameId: string;
  feedName: string;
  messageId: string;
}

export interface RawMessage extends BaseMessage {
  data: string;
}

export interface Message extends BaseMessage {
  data: any[];
}

function padStart(s: string, length: number, char: string): string {
  let padding = '';
  const lengthToPad = Math.max(length - s.length, 0);
  for (let i = 0; i < lengthToPad; i++) {
    padding += char;
  }

  return padding + s;
}

interface MessageDetails {
  message: string;
  messageNumber: number;
}

export default class Recorder {
  private queue: async.QueueObject<MessageDetails>;

  constructor(private clientFolder: string) {
    this.queue = async.queue((details: MessageDetails, callback) => {
      const { messageNumber, message } = details;
      this.recordMessage(messageNumber, message)
        .then(() => {
          callback();
        })
        .catch((e) => console.error(e));
    });
  }

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

    try {
      await fs.writeFile(rawFilename, message);
    } catch (e) {
      if (e.code === 'EMFILE') {
        this.queue.push({ message, messageNumber }, (err, _) => {
          console.log(
            'WARNING: File writes are getting throttled by your OS. Writes are being queued to be written later. This will affect latency of the data.'
          );
          if (err) {
            console.error(`Unable to push to queue. Error ${err} `);
          }
        });
      } else {
        console.error(`Unable to write file. Error ${e}`);
      }
    }
  }

  async recordJSONMessage(
    messageNumber: number,
    message: Message
  ): Promise<void> {
    await this.recordMessage(messageNumber, JSON.stringify(message));
  }
}
