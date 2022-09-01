import { promises as fs } from 'fs';
import { join } from 'path';
import * as yargs from 'yargs';
import { client as WebsocketClient } from 'websocket';

import { get } from './auth';
import Recorder from './record';
import { computeConnectionUrl, run, Opts, MESSAGE_ID_REGEX } from './client';

const CLIENT = new WebsocketClient({
  maxReceivedFrameSize: 67108864,
});

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
  const connectionUrl = computeConnectionUrl(opts);

  const token = await get('hermes-fast-live.prod');
  run(CLIENT, connectionUrl, token, recorder);
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
