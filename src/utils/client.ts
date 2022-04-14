import { Intents } from 'discord.js';
import { Client } from 'discordx';

import { config } from './config.js';

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
  silent: false,
  botGuilds: [config.guild.id],
});
