import { Discord, Slash, Client, Guard } from 'discordx';
import { CommandInteraction, MessageEmbedOptions } from 'discord.js';
import { whisper } from '../../utils/permissions.js';
import { MountainContext } from '../../utils/context.js';

@Discord()
export class Ping {
  @Slash('ping')
  @Guard(whisper)
  async ping(
    interaction: CommandInteraction,
    _: Client,
    guardData: any,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, guardData.whisper);

    const timeStart: number = new Date().getTime();
    await ctx.sendInfo('Đang đo ping...', 'Pong!');
    const ping: number = Math.round(new Date().getTime() - timeStart);
    
    const embed: MessageEmbedOptions = {
      title: 'Pong!',
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
      color: 'BLUE',
    };
    await ctx.edit({ embeds: [embed] });
  }
}
