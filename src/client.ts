import { client as WebsocketClient } from 'websocket';
import Recorder, { Message, RawMessage } from './record';

const PING_CHECK_INTERVAL = 30 * 1000;
export const UUID_V4_REGEX = new RegExp(
  /^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-4[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/
);
export const MESSAGE_ID_REGEX = new RegExp(/^[0-9]+:[0-9]+$/);

export interface Opts {
  gameId: string;
  gameIdType: string;
  authToken: string;
  test: boolean;
  folderName: string;
  feedName: string;
  json: boolean;
  position?: string;
}

function convertFromJSONL(data: string): Message {
  const rawMessage: RawMessage = JSON.parse(data);
  const split = rawMessage.data.split('\n');
  const parsedData: any[] = [];
  for (const frame of split) {
    parsedData.push(JSON.parse(frame));
  }

  let output: Message = {
    league: rawMessage.league,
    gameId: rawMessage.gameId,
    feedName: rawMessage.feedName,
    messageId: rawMessage.messageId,
    data: parsedData
  };

  return output;
}

export function setup(
  client: WebsocketClient,
  recorder: Recorder,
  json: boolean
) {
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
        if (json) {
          const asJSON = convertFromJSONL(message.utf8Data);
          recorder.recordJSONMessage(messageNumber, asJSON);
        } else {
          recorder.recordMessage(messageNumber, message.utf8Data);
        }
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
