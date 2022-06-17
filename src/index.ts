import { promises as fs } from 'fs';
import { join } from 'path';
import * as yargs from 'yargs';
import { client as WebsocketClient } from 'websocket';

import Recorder from './record';
import { setup, Opts, MESSAGE_ID_REGEX } from './client';
import { get } from './auth';

const CLIENT = new WebsocketClient({
  maxReceivedFrameSize: 67108864,
});

// Constants
const PROTOCOL = 'wss';
const HOSTNAME = 'live-v2.secondspectrum.com';
const FEEDNAMES = [
  'tracking-fast',
  'tracking-fast-refs',
  'tracking-refs-produced',
  'tracking-produced',
  'insight',
  'tracking-pose',
];

async function main(opts: Opts): Promise<void> {
  try {
    await fs.access(opts.folderName);
  } catch (_) {
    await fs.mkdir(opts.folderName);
  }

  const clientFolder = join(opts.folderName, `client`);

  try {
    await fs.access(clientFolder);
  } catch (_) {
    await fs.mkdir(clientFolder);
  }

  const recorder = new Recorder(clientFolder);
  setup(CLIENT, recorder);
  const token = await get('hermes-fast-live.prod');

  if (!opts.position) {
    if (opts.test || opts.demo) opts.position = 'start';
    else opts.position = 'live';
  }

  const queryString = `feed=${opts.feedName}&gameId=${opts.gameId}&position=${opts.position}&test=${opts.test}&demo=${opts.demo}&gameIdType=${opts.gameIdType}`;
  CLIENT.connect(`${PROTOCOL}://${HOSTNAME}?${queryString}`, [], '', {
    Authorization: `Bearer ${token}`,
  });
}

yargs
  .scriptName('Second Spectrum Live Data Ingestion')
  .command(
    'record',
    'Start Data Ingestion',
    (yargs_) => {
      yargs_
        .option('gameId', { type: 'string', demandOption: true })
        .option('folderName', { type: 'string', demandOption: true })
        .option('feedName', {
          type: 'string',
          demandOption: true,
          default: 'tracking-fast',
          choices: FEEDNAMES,
        })
        .option('gameIdType', {
          type: 'string',
          demandOption: true,
          choices: ['opta', 'ssi', 'ngss'],
        })
        .option('position', {
          type: 'string',
        })
        .option('test', { type: 'boolean', default: false })
        .option('demo', { type: 'boolean', default: false })
        .option('json', {
          type: 'boolean',
          default: false,
        })
        .check((argv, _) => {
          const position = argv.position;
          if (position) {
            const isMatch = position.match(MESSAGE_ID_REGEX) ? true : false;
            return position === 'start' || position === 'live' || isMatch;
          }
          return true;
        });
    },
    main
  )
  .demandCommand()
  .help()
  .parse();
