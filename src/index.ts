import { dirname, importx } from '@discordx/importer';

import { client } from './utils/client.js';
import { config } from './utils/config.js';

async function run() {
  await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

  if (!config.bot.token) {
    throw Error('Could not find bot token in config.json');
  }

  await client.login(<string>config.bot.token);
}

run();
