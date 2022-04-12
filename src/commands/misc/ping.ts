import { Discord, Guild, Slash } from 'discordx';
import { CommandInteraction, MessageEmbedOptions } from 'discord.js';
import { config } from '../../utils/config.js';
import { shouldSendEphemerally, CommandEphemeralType } from '../../utils/permissions.js';

@Discord()
export class Ping {
  @Slash('ping')
  @Guild(<string>config.guild.id)
  async ping(interaction: CommandInteraction): Promise<void> {
    let embed: MessageEmbedOptions = {
      title: 'Pong!',
      description: 'Đang đo ping...',
      color: 'BLURPLE',
    };
    const timeStart: number = new Date().getTime();
    await interaction.reply({ embeds: [embed], ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT)) });

    const ping: number = Math.round(new Date().getTime() - timeStart);
    embed = Object.assign(embed, {
      description: '',
      fields: [
        {
          name: 'Ping tin nhắn',
          value: `${ping}ms`,
          inline: true,
        },
        {
          name: 'Ping API',
          value: `${Math.round(interaction.client.ws.ping)}ms`,
          inline: true,
        },
      ],
    });
    await interaction.editReply({ embeds: [embed] });
  }
}
