import { Discord, Guild, Slash, SlashOption } from 'discordx';
import { CommandInteraction, GuildMember } from 'discord.js';
import { timeparse } from '@beerpsi/timeparse';
import { config } from '../../utils/config.js';

@Discord()
export class SelfDestructCommands {
  @Slash('selfdestruct', { description: 'Tự hủy' })
  @Guild(config.guild.id)
  async selfmute(
    @SlashOption('time', { description: 'Thời gian muốn tự hủy', type: 'STRING' }) time: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true });
    const muteTime: number | undefined = (timeparse(time) ?? 0) * 1000;
    if (muteTime === undefined || muteTime < 1000) {
      interaction.editReply('Thời gian không hợp lệ!');
      return;
    }
    if (muteTime > 28 * 86400 * 1000) {
      interaction.editReply('Thời gian tối đa là 28 ngày!');
      return;
    }
    if (interaction.member instanceof GuildMember) {
      try {
        await interaction.member.timeout(muteTime, 'đòi tự hủy');
        interaction.editReply('Đã tự hủy!');
      } catch (e: any) {
        if (e.message === 'Missing Permissions') {
          interaction.editReply('cung manh :+1:');
        } else throw e;
      }
    } else {
      interaction.editReply('Không thể tự hủy!');
    }
  }
}
