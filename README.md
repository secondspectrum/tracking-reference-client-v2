# Second Spectrum REST API Client
The API can be hit using Node.js or bash. If you aren't sure, opt to use Node.
## Node.js
### Setup

This package requires Node / NPM on the system. Node 14.14 is recommended. You can verify your node version by running `npm run version`. The latest version of Node can be found here: https://nodejs.org/

### Add your credentials (Client ID and Client Secret)

- Navigate to `src/auth.ts` and add your credentials there
- If you change the credentials, make sure to rebuild the client as below

### Building the Reference Client
This is a two-step process. NOTE that the second step changes based on which OS you are running
```
1. npm ci
```
For Windows users ONLY:
```
2. npm run build-windows
``` 
For non-Windows users:
```
2. npm run build
```
### Getting data
- `node lib/rest.js [output_file_name] [API_endpoint_url]`
- Run the above command, replacing the filename (and brackets) and the API endpoint url with a url from the documentation
## Bash (Windows incompatible)
### Setup
- Download `jq`. Please navigate to https://stedolan.github.io/jq/download/ to install `jq`
- NOTE for Mac OS X users: if you don't have it already, please install Homebrew (https://brew.sh/)

### Add your credentials (Client ID and Client Secret)

- Navigate to `bash/auth.sh` and add your CLIENT_ID and CLIENT_SECRET

### Getting data

- Enter the API endpoint you are trying to hit as the value for `API_URL` in `bash/rest_api_reference_client.sh`
  - Please refer to the documentation to determine what the API URL should be
- The command to run is `sh bash/rest_api_reference_client.sh outputFilename` where outputFilename is a name of your choosing
  - NOTE that it is important to run the command from the root of this folder
- Once the command completes, you should see data located at `outputFilename`

### Request Authentication (How it works)
- In order to make a request to the REST API, the user must first authenticate with the server
- User must have a clientId and clientSecret provided to them by Second Spectrum
- With the clientID and clientSecret, the user must retrieve an access token (JWT) that MUST be passed in the request header
- The request header must include an `Authorization` key and it's value must be `Bearer <INSERT ACCESS TOKEN HERE>`
- Example Header:
```
{
    Authorization: Bearer sampletestaccesstoken
}
```
- You can use `bash/auth.sh` as a reference on how to get the JWT
- IMPORTANT: Once you retrieve a JWT, **it is VALID for 30 days**
    - Please ONLY request a new JWT if the previous one has expired
- The `bash/auth.sh` also includes sample code on how to cache your JWT and request a new one if the current one has expired

# Second Spectrum Live Data Reference Client

## Setup

This package requires Node / NPM on the system. Node 14.14 is recommended. You can verify your node version by running `npm run version`. The latest version of Node can be found here: https://nodejs.org/

## Add your credentials (Client ID and Client Secret)

- Navigate to `src/auth.ts` and add your credentials there

## Building the Reference Client

*WINDOWS USERS: Before running the steps below, please copy the contents of `package-windows.sample.json` into `package.json` and make sure Visual Studio Build Tools are installed*
```
npm ci
npm run build
```

## Connecting to Feeds

```
node lib/index.js record \
  --gameId <game id> \
  --gameIdType <opta or ssi> \
  --feedName <feedName>. Default tracking-fast \
  --folderName <folder to write data to>
```

The `gameIdType` field:

- If using an Opta Legacy ID (e.g. `2128553`), please set gameIdType to `opta`
- If using SSI game ID, please set gameIdType to `ssi`

Optional Parameters:

- `test`: If true, connects you to the test feed. Default false.
- `demo`: If true, connects you to the demo feed. Default false.
- `position`:
  - `start`: Ingest data starting from the beginning of the stream. Default if test is true
  - `live` : Ingest data starting from the current tip of the stream. Default if test is false
  - Message ID of the form `number:number`. The two numbers are `streamInstanceId` and `streamSequenceNumber`. Each feed message will have a message ID attached

Example command to connect to test feeds

```
node lib/index.js record \
  --gameId <game id> \
  --gameIdType <opta or ssi> \
  --feedName <feedName>. Default tracking-fast \
  --test <boolean> \
  --folderName <folder to write data to>
```

NOTE: For test feeds, we AUTOMATICALLY set the position to `start` if not specified

## Error handling
#### Websocket Error Messages

The Websocket can return the following error messages:

- `Reason: User not authorized`: Token does not have the required permissions for the game
- `Reason: Internal Server Error. No feed found for game [ID]`: No game feeds exist for this game
- `Reason: Inactive Feed`: The game feed has not started yet
  - Feeds start 1 hour prior to game start and stop 7 hours after game start

## Record Data

- When you run the command to ingest data, you should see a message: `Websocket Connected`
- The data is written to `folderName/client/msg_[messageNumber]_[timestamp].json`