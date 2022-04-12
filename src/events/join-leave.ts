import { TextBasedChannel } from 'discord.js';
import { Discord, On } from 'discordx';
import { client } from '../utils/client.js';
import type { ArgsOf } from 'discordx';
import { config } from '../utils/config.js';

@Discord()
export class JoinLeaveMonitor {
  @On('guildMemberAdd')
  async onJoin([member]: ArgsOf<'guildMemberAdd'>): Promise<void> {
    const channel = await this.fetchWelcomeChannel();
    channel?.send({
      content: `Hello ${member}!`,
      embeds: [{
        color: 0xffd700,
        description: config.guild.welcomeMessage ?? 'Welcome to the server!',
        timestamp: new Date().getTime(),
        footer: {
          text: `Thành viên #${member.guild.memberCount}`,
        },
      }],
    });
  }

  @On('guildMemberRemove')
  async onRemove([member]: ArgsOf<'guildMemberRemove'>): Promise<void> {
    const channel = await this.fetchWelcomeChannel();
    if (!member.user.bot) {
      channel?.send({
        content: `Bái bai ${member} huhu, hẹn gặp lại ||nếu không bị ban||`,
      });
    }
  }

  private async fetchWelcomeChannel(): Promise<TextBasedChannel | undefined> {
    if (config.guild.welcomeChannel && config.guild.id) {
      const channel = await (await client.guilds.fetch({ guild: config.guild.id })).channels.fetch(config.guild.welcome_channel);
      if (!channel?.isText()) {
        console.log('Welcome channel is not a text channel?!');
        return undefined;
      }
      return channel;
    } else {
      return undefined;
    }
  }
}
