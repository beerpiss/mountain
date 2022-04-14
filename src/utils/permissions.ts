import {
  ApplicationCommandPermissions, CommandInteraction, Guild, GuildMemberRoleManager, Role,
} from 'discord.js';
import { ApplicationCommandMixin, SimpleCommandMessage } from 'discordx';

import { IGuild } from '../data/model/guild.js';
import { GuildService } from '../data/services/guild-service.js';

export enum CommandEphemeralType {
  ALWAYS = 'ALWAYS',
  NEVER = 'NEVER',
  DEFAULT = 'DEFAULT',
}

export async function shouldSendEphemerally(interaction: CommandInteraction, level: CommandEphemeralType, role: keyof IGuild = 'roleFormerBcn'): Promise<boolean> {
  switch (level) {
    case CommandEphemeralType.ALWAYS:
      return true;
    case CommandEphemeralType.DEFAULT: {
      const { channel } = interaction;
      const botSpamChannelId = await GuildService.get('channelBotspam', null);
      const roleFormerBcn = await GuildService.get(role, null);
      if (botSpamChannelId === null || roleFormerBcn === null) return false;
      return channel?.id === botSpamChannelId
        ? false
        : (<GuildMemberRoleManager>interaction.member?.roles).highest.comparePositionTo(roleFormerBcn) <= 0;
    }
    case CommandEphemeralType.NEVER:
      return false;
    default:
      return false;
  }
}

export async function allowRoleAndUp(guild: Guild, message: ApplicationCommandMixin | SimpleCommandMessage, role: keyof IGuild): Promise<ApplicationCommandPermissions[]> {
  const roleID = await GuildService.get(role, null);
  const roles =  await guild.roles.fetch();
  return roles.map((value: Role) => {
    return { id: value.id, permission: value.comparePositionTo(roleID) >= 0, type: 'ROLE' };
  });
}

export async function alwaysWhisper(_: any, __: any, next: Function, guardData: { whisper: boolean } ): Promise<void> {
  guardData.whisper = true;
  await next();
}

export async function whisper(interaction: CommandInteraction, __: any, next: Function, guardData: { whisper: boolean }): Promise<void> {
  guardData.whisper = await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn');
  await next();
}
