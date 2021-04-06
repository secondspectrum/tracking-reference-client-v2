import { client as WebsocketClient } from 'websocket';
import Recorder from './record';

const PING_CHECK_INTERVAL = 30 * 1000;

export interface Opts {
  league: string;
  feed: string;
  gameId: string;
  authToken: string;
  position: string;
  test: boolean;
  folderName: string;
}

export function setup(client: WebsocketClient, recorder: Recorder) {
  let messageNumber = 1;
  let intervalId: NodeJS.Timeout | null = null;

  client.on('connectFailed', (error) => {
    console.log(`${error.toString()}`);
  });

  client.on('connect', (conn) => {
    let gotPong = false;
    let numPongsMissed = 0;
    console.log('Websocket connected');

    const sendPing = () => {
      if (!gotPong) {
        numPongsMissed += 1;
      }

      if (numPongsMissed === 2) {
        conn.close();
      }
      gotPong = false;
      conn.ping('ping');
    };

    intervalId = setInterval(sendPing, PING_CHECK_INTERVAL);

    conn.on('error', (error) => {
      console.error(`Received error: ${error.toString()}`);
    });

    conn.on('message', (message) => {
      if (message.type === 'utf8' && message.utf8Data) {
        recorder.recordMessage(messageNumber, message.utf8Data);
      }
      messageNumber += 1;
    });

    conn.on('close', (code, reason) => {
      console.log(`Websocket closed with code: ${code}. Reason: ${reason}`);
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    });

    conn.on('pong', () => {
      console.log('got pong');
      gotPong = true;
      numPongsMissed = 0;
    });
  });
}
