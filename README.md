# Second Spectrum Live V2 Reference Client

## Setup

This package requires Node / NPM on the system. Node version 12.x is recommended. You can verify your node version by running `npm run version`. The latest version of Node can be found here: https://nodejs.org/

## Building the Reference Client

```
npm ci
npm run build
```

## Connecting to Feeds

```
node lib/index.js record \
  --gameId <game id> \
  --authToken <auth token> \
  --gameIdType <opta or ssi> \
  --feedName <feedName>. Default tracking-fast \
  --folderName <folder to write data to>
```

The `gameIdType` field:

- If using an Opta Legacy ID (e.g. `2128553`), please set gameIdType to `opta`
- If using SSI game ID, please set gameIdType to `ssi`

Optional Parameters:

- `test`: If true, connects you to the test feed. Default false.
- `position`:
  - `start`: Ingest data starting from the beginning of the stream. Default if test is true
  - `live` : Ingest data starting from the current tip of the stream. Default if test is false
  - Message ID of the form `number:number`. Each feed message will have a message ID attached
- `json`: Default `false`. If true, tracking data will output in JSON

Example command to connect to test feeds

```
node lib/index.js record \
  --gameId <game id> \
  --authToken <auth token> \
  --gameIdType <opta or ssi> \
  --feedName <feedName>. Default tracking-fast \
  --test <boolean> \
  --folderName <folder to write data to>
```

NOTE: For test feeds, we AUTOMATICALLY set the position to `start` if not specified

## Error handling

#### CLI Verification

The CLI will:

- Validate that the gameIdType is either `ssi` or `opta`
- Validate that postion is one of `start` and `live` or a message ID of the form `number:number`
- Validate that feedName is one of `tracking-fast`, `tracking-fast-refs`, `tracking-produced`, and `insight`

#### Websocket Error Messages

The Websocket can return the following error messages:

- `Reason: User not authorized`: Token does not have the required permissions for the game
- `Reason: Internal Server Error. No feed found for game [ID]`: No game feeds exist for this game
- `Reason: Inactive Feed`: The game feed has not started yet
  - Feeds start 1 hour prior to game start and stop 7 hours after game start

## Record Data

- When you run the command to ingest data, you should see a message: `Websocket Connected`
- The data is written to `folderName/client/msg_[messageNumber]_[timestamp].json`
