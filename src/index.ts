import { promises as fs } from 'fs';
import { join } from 'path';
import * as yargs from 'yargs';
import { client as WebsocketClient } from 'websocket';

import Recorder from './record';
import { setup, Opts, UUID_V4_REGEX } from './client';

const CLIENT = new WebsocketClient();

// Constants
const PROTOCOL = 'wss';
const HOSTNAME = 'live-v2.secondspectrum.com';
const FEED_NAMES = ['tracking-fast', 'tracking-fast-refs'];
const POSITIONS = ['start', 'live'];

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

  if (!opts.position) {
      if (opts.test === true) opts.position = 'start';
      else opts.position = 'live'
  }

  const queryString = `league=epl&feed=${opts.feedName}&gameId=${opts.gameId}&position=${opts.position}&test=${opts.test}`;
  CLIENT.connect(`${PROTOCOL}://${HOSTNAME}?${queryString}`, [], '', {
    'x-token': `${opts.authToken}`
  });
}

yargs
  .scriptName('Second Spectrum Live Data Ingestion')
  .command(
    'record',
    'Start Data Ingestion',
    (yargs_) => {
      yargs_
        .option('feedName', {
          type: 'string',
          choices: FEED_NAMES,
          demandOption: true
        })
        .option('gameId', { type: 'string', demandOption: true })
        .option('authToken', { type: 'string', demandOption: true })
        .option('folderName', { type: 'string', demandOption: true })
        .option('position', {
          type: 'string',
          choices: POSITIONS,
          
        })
        .option('test', { type: 'boolean', default: false }).
        check((argv, _) => {
            const gameId = argv.gameId;
            return gameId.match(UUID_V4_REGEX) ? true : false;
        });
    },
    main
  )
  .demandCommand()
  .help()
  .parse();
