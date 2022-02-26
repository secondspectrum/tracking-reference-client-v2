import * as fs from 'fs';
import axios from 'axios';
import { get } from './auth';

const outputFile = process.argv[2];
const apiUrl = process.argv[3];

async function getToken(): Promise<string> {
  try {
    return get('hermes-fast-live.prod');
  } catch (err) {
    throw new Error('Failed to authenticate request. Contact support.');
  }
}

async function request(): Promise<void> {
  const token = await getToken();
  const response = await axios.get(apiUrl, {
    headers: {
      'accept-language': 'en-US,en;q=0.9',
      authorization: `Bearer ${token}`,
    },
  });

  const file = fs.openSync(outputFile, 'w');
  await fs.writeSync(file, JSON.stringify(response.data));
}

request().catch((err) => console.error(err));
