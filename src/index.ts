import { client as WebsocketClient } from 'websocket';

const PING_CHECK_INTERVAL = 5 * 1000; // check ping/pongs every 15 seconds
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

CLIENT.connect(
  'ws://localhost:9000/?league=epl&feed=tracking-fast&gameId=3fda033f-7eff-459e-9dd1-b24f75b3a4dd',
  [],
  '',
  {
    'x-token': '2e12a2aa017112b4fe104693d9397ed5add0a720'
  }
);
