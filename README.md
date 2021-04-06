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
  --folderName <folder to write data to>
```


Optional Parameters:
- `test`: If true, connects you to the test feed. Default false.
- `position`:
    - `start`: Ingest data starting from the beginning of the stream. Default if test is true
    - `live` : Ingest data starting from the current tip of the stream. Default if test is false


Example command to connect to test feeds
```
node lib/index.js record \
  --gameId <game id> \
  --authToken <auth token> \
  --test <boolean> \
  --folderName <folder to write data to>
```
NOTE: For test feeds, we AUTOMATICALLY set the position to `start` if not specified

## Error handling
#### CLI Verification
The CLI will:
- Validate that the gameId is a valid UUID V4
- Validate that postion is one of `start` and `live`

#### Websocket Error Messages
The Websocket can return the following error messages:
- `Reason: User not authorized`: Token does not have the required permissions for the game
- `Reason: Internal Server Error. No feed found for game [ID]`: No game feeds exist for this game
- `Reason: Inactive Feed`: The game feed has not started yet
    - Feeds start 1 hour prior to game start and stop 7 hours after game start

## Record Data
- When you run the command to ingest data, you should see a message: `Websocket Connected`
- The data is written to `folderName/client/msg_[messageNumber]_[timestamp].json`

## Upcoming Updates
We plan to add the following features to the CLI soon:
- The ability to connect to a stream starting from a specific message
- Improved error handling