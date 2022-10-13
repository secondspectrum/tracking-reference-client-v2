#!/usr/bin/env bash
API_URL="ENTER API URL HERE"

if [ $# -eq 0 ]
  then
    echo "ERROR: Missing output filename. Please pass in the name of the file where you'd like to output your data"
    exit 1
fi

token=$(sh ./bash/auth.sh)

mkdir -p "$(dirname "$1")"

curl -L $API_URL \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer '$token \
  -o $1

exit 0
