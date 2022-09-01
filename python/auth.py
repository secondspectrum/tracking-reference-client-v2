import http.client
import os
import json
import time

CLIENT_ID = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"

HOME_DIR = os.getenv("HOME") or os.getenv(
    "HOMEPATH") or os.getenv("USERPROFILE")
TOKEN_CACHE_DIR = os.getenv('SSI_TOKEN_CACHE') or f"."

AUTH_DOMAIN = "secondspectrum.auth0.com"
HEADERS = {'content-type': "application/x-www-form-urlencoded"}

# For API, audience is hermes-api-external.prod
# For Websocket, audience is hermes-fast-live.prod
def get(audience):
    cacheKey = getCacheKey(CLIENT_ID, audience)

    tokenFile = f"{TOKEN_CACHE_DIR}/{cacheKey}.json"
    fsToken = getFSToken(tokenFile)
    if fsToken != None and fsToken['token'] != None and time.time() <= int(fsToken['expires']):
        return fsToken['token']

    newToken = fetchTokenClientCreds(
        CLIENT_ID, CLIENT_SECRET, audience, AUTH_DOMAIN)

    f = open(tokenFile, "w+")
    f.write(json.dumps(newToken))
    f.close()

    return newToken['token']


def getCacheKey(id, audienceName):
    return f"{AUTH_DOMAIN}_{id}_{audienceName}"


def getFSToken(tokenFile):
    if os.path.exists(tokenFile):
        f = open(tokenFile, "r")
        tokenStr = f.readlines()[0]
        token = json.loads(tokenStr)
        return token


def fetchTokenClientCreds(clientID, clientSecret, audience, authDomain):
    conn = http.client.HTTPSConnection(authDomain)
    payload = f"grant_type=client_credentials&client_id={clientID}&client_secret={clientSecret}&audience={audience}"
    conn.request("POST", "/oauth/token", payload, HEADERS)

    res = conn.getresponse().read().decode("utf-8")
    data = json.loads(res)

    tokenData = dict()
    tokenData['token'] = data['access_token']
    tokenData['expires'] = int(time.time()) + int(data['expires_in'])
    return tokenData
