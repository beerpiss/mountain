import { ButtonComponent, Client, Discord, Guard, Slash, SlashOption } from 'discordx';
import { CommandInteraction, MessageEmbedOptions, GuildMember, ButtonInteraction, MessageButton, MessageActionRow, WebhookEditMessageOptions } from 'discord.js';
import { whisper } from '../../utils/permissions.js';
import { MountainContext } from '../../utils/context.js';

@Discord()
export class Avatar {
  private other: boolean = false;

  @Slash('avatar')
  @Guard(whisper)
  async avatar(
    @SlashOption('user', { description: 'Người muốn lấy avatar', type: 'USER', required: false }) member: GuildMember,
      interaction: CommandInteraction,
      _: Client,
      guardData: any,
  ): Promise<void> {
    if (!member) {
      member = <GuildMember>interaction.member;
    }
    const ctx = new MountainContext(interaction, guardData.whisper);
    await ctx.defer();
    const button = new MessageButton()
      .setLabel('View other')
      .setStyle('SECONDARY')
      .setCustomId(`view-other-avatar-${ctx.member?.id}`);
    const row = member?.avatarURL() ? new MessageActionRow().addComponents(button) : null;
    const embed: MessageEmbedOptions = {
      title: `Avatar của ${member?.user?.username}#${member?.user?.discriminator}`,
      fields: [{
        name: 'Tải về dưới dạng',
        value: `[jpeg](${member?.user?.avatarURL({ format: 'jpeg', size: 1024 })}) [png](${member?.user?.avatarURL({ format: 'png', size: 1024 })}) [gif](${member?.user?.avatarURL({ format: 'gif', size: 1024 })})`,
        inline: true,
      }],
      image: {
        url: member?.user?.displayAvatarURL({ dynamic: true, size: 1024 }),
      },
    };
    let payload: WebhookEditMessageOptions = { 
      embeds: [embed],
    };
    if (row !== null) {
      payload = { ...payload, components: [row] };
    }
    ctx.respondOrEdit(payload);
  }

  @ButtonComponent(/view-other-avatar-\d+/)
  async viewOtherAvatar(interaction: ButtonInteraction) {
    const ctx = new MountainContext(interaction);
    const userId = <string>interaction.customId.match(/view-other-avatar-(\d+)/)?.[1];
    const user = await interaction.client.users.fetch(userId);
    const member = await interaction.guild?.members.fetch(userId);
    this.other = !this.other;
    const avatarURL = this.other ? member?.avatarURL : user?.avatarURL;
    const displayAvatarURL = this.other ? member?.displayAvatarURL : user?.displayAvatarURL;
    if (avatarURL && displayAvatarURL) {
      const embed: MessageEmbedOptions = {
        title: `Avatar của ${ctx.user?.username}#${ctx.user?.discriminator}`,
        fields: [{
          name: 'Tải về dưới dạng',
          value: `[jpeg](${avatarURL({ format: 'jpeg', size: 1024 })}) [png](${avatarURL({ format: 'png', size: 1024 })}) [gif](${avatarURL({ format: 'gif', size: 1024 })})`,
          inline: true,
        }],
        image: {
          url: displayAvatarURL({ dynamic: true, size: 1024 }),
        },
      };
      ctx.edit({ embeds: [embed] });
    }
  }
}
