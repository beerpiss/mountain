import { MessageEmbedOptions } from 'discord.js';
import { client } from '../utils/client.js';
import { BadArgumentError } from '../utils/exceptions.js';

client.on('interactionCreate', async (interaction) => {
  try {
    await client.executeInteraction(interaction);
  } catch (e: any) {
    const embed: MessageEmbedOptions = {
      title: ':(\nLỗi',
      color: 'RED',
      timestamp: new Date().getTime(),
    };
    switch (e.constructor) {
      case BadArgumentError:
        embed.description = e.message;
        break;
      default:
        embed.description = `Lỗi này hơi căng, báo cho <@!810818056171421726> biết ik\n\`\`\`${JSON.stringify(e, ['message', 'arguments', 'type', 'name'])}\`\`\``;
        break;
    }
    if (interaction.isCommand()) {
      try {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (_) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    }
  }
});
