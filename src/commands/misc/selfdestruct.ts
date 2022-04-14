import { timeparse } from '@beerpsi/timeparse';
import { CommandInteraction, GuildMember } from 'discord.js';
import { Client, Discord, Guard, Slash, SlashOption } from 'discordx';

import { MountainContext } from '../../utils/context.js';
import { whisper } from '../../utils/permissions.js';

@Discord()
export class SelfDestructCommands {
  @Slash('selfdestruct', { description: 'Tự hủy' })
  @Guard(whisper)
  async selfmute(
    @SlashOption('time', { description: 'Thời gian muốn tự hủy', type: 'STRING' }) time: string,
      interaction: CommandInteraction,
      _: Client,
      guardData: any,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, guardData.whisper);
    await ctx.defer();
    const muteTime: number | undefined = (timeparse(time) ?? 0) * 1000;
    if (muteTime === undefined || muteTime < 1000) {
      ctx.sendError('Thời gian không hợp lệ!');
      return;
    }
    if (muteTime > 28 * 86400 * 1000) {
      ctx.sendError('Thời gian tối đa là 28 ngày!');
      return;
    }
    if (interaction.member instanceof GuildMember) {
      try {
        await interaction.member.timeout(muteTime, 'đòi tự hủy');
        ctx.sendSuccess('Đã tự hủy!');
      } catch (e: any) {
        if (e.message === 'Missing Permissions') {
          ctx.sendError('cung manh :+1:');
        } else throw e;
      }
    } else {
      ctx.sendError('Không thể tự hủy!');
    }
  }
}
