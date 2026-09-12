import { clientLogos } from './src/data';
import https from 'node:https';
import http from 'node:http';

async function checkUrl(url: string, name: string): Promise<boolean> {
  if (url.startsWith('data:')) return true;

  const lib = url.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    const req = lib.request(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 3000 // 3 secs timeout
    }, (res) => {
      if (res.statusCode && res.statusCode < 400) {
        resolve(true);
      } else {
        console.log(`Failed (${res.statusCode}): ${name} - ${url}`);
        resolve(false);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`Failed (Timeout): ${name} - ${url}`);
      resolve(false);
    });

    req.on('error', (e) => {
      console.log(`Failed (Error ${e.message}): ${name} - ${url}`);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const broken = [];
  for (const client of clientLogos) {
    const isOk = await checkUrl(client.logoUrl, client.name);
    if (!isOk) {
      broken.push(client.name);
    }
  }
  console.log("BROKEN_LOGOS=" + JSON.stringify(broken));
}

main();
