import { client as WebsocketClient } from 'websocket';

const PING_CHECK_INTERVAL = 30 * 1000;
const CLIENT = new WebsocketClient();

let intervalId: NodeJS.Timeout | null = null;

CLIENT.on('connectFailed', (error) => {
  console.log(`Connect Error: ${error.toString()}`);
});

CLIENT.on('connect', (conn) => {
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
    console.log(`Received error: ${error.toString()}`);
  });

  conn.on('message', (message) => {
    if (message.type === 'utf8') {
      console.log(`Received:  ${message.utf8Data}`);
    }
  });

  conn.on('close', (code, reason) => {
    console.log(`Websocket closed with code ${code} and reason ${reason}`);
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

// Websocket Request Params
const PROTOCOL = 'wss';
const HOSTNAME = '';
const LEAGUE = '';
const FEED = '';
const GAME_ID = '';
const X_TOKEN = '';

CLIENT.connect(
  `${PROTOCOL}://${HOSTNAME}?league=${LEAGUE}&feed=${FEED}&gameId=${GAME_ID}`,
  [],
  '',
  {
    'x-token': `${X_TOKEN}`
  }
);
