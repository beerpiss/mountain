import { client } from '../utils/client.js';

client.once('ready', async () => {
  client.user?.setStatus('online');
  client.user?.setActivity('mới đi tát vợ xong');
  console.log(`Connection established (${client.ws.ping}ms). Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`);

  console.log('Loading slash commands...');
  await client.guilds.fetch();
  await client.initApplicationCommands();
  await client.initApplicationPermissions();

  console.log('Bot started');
});
