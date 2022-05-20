import { client as WebsocketClient } from 'websocket';
import Recorder from './record';

const RETRY_TIMEOUT_BASE_MS = 1000;
const RETRY_TIMEOUT_MAX_MS = 10000;
const RETRY_MAX_ATTEMPTS = 10;
const PING_CHECK_INTERVAL = 30 * 1000;
export const UUID_V4_REGEX = new RegExp(
  /^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-4[A-Za-z0-9]{3}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/
);
export const MESSAGE_ID_REGEX = new RegExp(/^[0-9]+:[0-9]+$/);

export interface Opts {
  league: string;
  gameId: string;
  gameIdType: string;
  authToken: string;
  test: boolean;
  folderName: string;
  feedName: string;
  position?: string;
}

export function compute_connection_url(
  protocol: string,
  hostname: string,
  opts: Opts
): string {
  if (!opts.position) {
    if (opts.test === true) opts.position = 'start';
    else opts.position = 'live';
  }

  const queryString = `league=${opts.league}&feed=${opts.feedName}&gameId=${opts.gameId}&position=${opts.position}&test=${opts.test}&gameIdType=${opts.gameIdType}`;

  return `${protocol}://${hostname}?${queryString}`;
}

export function run(
  client: WebsocketClient,
  connection_url: string,
  token: string,
  recorder: Recorder
) {
  setup(client, connection_url, token, recorder);
  connect(client, connection_url, token);
}

function setup(
  client: WebsocketClient,
  connection_url: string,
  token: string,
  recorder: Recorder
) {
  let messageNumber = 1;
  let intervalId: NodeJS.Timeout | null = null;
  let retry_attempts = 0;

  client.on('connectFailed', (error) => {
    console.log(`${error.toString()}`);
  });

  client.on('httpResponse', (response, client) => {
    if (response.statusCode === 429 && retry_attempts < RETRY_MAX_ATTEMPTS) {
      console.log(
        `Connection rejected because of too many simultaneous requests; retrying after timeout....`
      );
      let timeout = computeTimeoutMs(retry_attempts);
      retry_attempts++;
      setTimeout(() => {
        connect(client, connection_url, token);
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
  connection_url: string,
  token: string
) {
  client.connect(connection_url, [], '', {
    'x-token': `${token}`
  });
}

function computeTimeoutMs(retry_attempts: number): number {
  return Math.min(
    RETRY_TIMEOUT_BASE_MS * Math.pow(2, retry_attempts),
    RETRY_TIMEOUT_MAX_MS
  );
}
