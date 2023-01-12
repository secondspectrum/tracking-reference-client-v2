import { client as WebsocketClient } from 'websocket';
import Recorder from './record';

const PROTOCOL = 'wss';
const HOSTNAME = 'live-v2.secondspectrum.com';
const RETRY_TIMEOUT_BASE_MS = 1000;
const RETRY_TIMEOUT_MAX_MS = 10000;
const RETRY_MAX_ATTEMPTS = 10;
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
  demo: boolean;
  folderName: string;
  feedName: string;
  position?: string;
}

export function computeConnectionUrl(opts: Opts): string {
  if (!opts.position) {
    if (opts.test || opts.demo) opts.position = 'start';
    else opts.position = 'live';
  }

  const queryString = `feed=${opts.feedName}&gameId=${opts.gameId}&position=${opts.position}&test=${opts.test}&gameIdType=${opts.gameIdType}&demo=${opts.demo}`;

  return `${PROTOCOL}://${HOSTNAME}?${queryString}`;
}

export function run(
  client: WebsocketClient,
  connectionUrl: string,
  token: string,
  recorder: Recorder
) {
  setup(client, connectionUrl, token, recorder);
  connect(client, connectionUrl, token);
}

function setup(
  client: WebsocketClient,
  connectionUrl: string,
  token: string,
  recorder: Recorder
) {
  let messageNumber = 1;
  let intervalId: NodeJS.Timeout | null = null;
  let retryAttempts = 0;

  client.on('connectFailed', (error) => {
    console.log(`${error.toString()}`);
  });

  client.on('httpResponse', (response, client) => {
    if (response.statusCode === 429 && retryAttempts < RETRY_MAX_ATTEMPTS) {
      console.log(
        'Connection rejected because of too many simultaneous requests; retrying after timeout....'
      );
      let timeout = computeTimeoutMs(retryAttempts);
      retryAttempts++;
      setTimeout(() => {
        connect(client, connectionUrl, token);
      }, timeout);
    } else {
      console.log(`${response.toString()}`);
    }
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

function connect(
  client: WebsocketClient,
  connectionUrl: string,
  token: string
) {
  client.connect(connectionUrl, [], '', {
    Authorization: `Bearer ${token}`,
  });
}

function computeTimeoutMs(retryAttempts: number): number {
  return Math.min(
    RETRY_TIMEOUT_BASE_MS * Math.pow(2, retryAttempts),
    RETRY_TIMEOUT_MAX_MS
  );
}
