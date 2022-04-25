#!/usr/bin/env bash
CLIENT_ID="ENTER CLIENT ID HERE"
CLIENT_SECRET="ENTER CLIENT SECRET HERE"

audience="hermes-api-external.prod"
cache_dir="."
auth_domain="secondspectrum.auth0.com"

if [ ! -d "$cache_dir" ]; then
    mkdir -p "$cache_dir"
fi

NOW=$(date +"%s")
cache_file="$cache_dir/$auth_domain_$CLIENT_ID_$audience.json"

if [[ -f "$cache_file" ]]; then
    expires_at=$(cat "$cache_file" | jq '.expires')
    if [[ $NOW -lt expires_at ]]; then
        echo $(cat "$cache_file" | jq -r '.token')
        exit 0
    fi
fi

response=$(curl -s --request POST \
    --url "https://$auth_domain/oauth/token" \
    --header 'content-type: application/x-www-form-urlencoded' \
    --data grant_type=client_credentials \
    --data client_id=$CLIENT_ID \
    --data client_secret=$CLIENT_SECRET \
    --data audience=$audience)

token=$(echo $response | jq -r '.access_token')
expires_in=$(echo $response | jq '.expires_in')
expires_at=$(($(date +"%s") + $expires_in))

if [ $token = "null" ]; then
    exit 1
fi

json="{\"token\":\"$token\", \"expires\":$expires_at}"
echo $(echo $json | jq '.') >"$cache_file"
echo $(cat "$cache_file" | jq -r '.token')
exit 0