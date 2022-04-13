import { ButtonComponent, Client, Discord, Guard, Slash, SlashOption, Permission } from 'discordx';
import { CommandInteraction, MessageEmbedOptions, GuildMember, ButtonInteraction, MessageButton, MessageActionRow, WebhookEditMessageOptions } from 'discord.js';
import { whisper, allowRoleAndUp } from '../../utils/permissions.js';
import { MountainContext } from '../../utils/context.js';
import { BadArgumentError } from '../../utils/exceptions.js';

@Discord()
export class Misc {
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

  @Slash('8ball', { description: 'Bạn hỏi quá cầu tiên tri trả lời' })
  @Guard(whisper)
  async eightball(
    @SlashOption('question', { description: 'Điều muốn hỏi' }) question: string,
      interaction: CommandInteraction,
      _: Client,
      guardData: any,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, guardData.whisper);
    await ctx.defer();
    const replies = [
      'Không',
      'Không phải hôm nay',
      'Sure kèo rồi',
      'Chắc vậy á',
      'Tôi thấy thế',
      'Tiên lượng tốt',
      'Thử lại ik',
      'Không thể kể giờ được hihi',
      'Hỏi sai ngày rồi',
      'Tôi say đ** nhé',
      'Tiên lượng không tốt lắm',
    ];
    const embed: MessageEmbedOptions = {
      fields: [
        {
          name: 'Bạn hỏi:',
          value: question,
        },
        {
          name: ':8ball: Quả cầu trả lời:',
          value: replies[Math.floor(Math.random() * replies.length)],
        },
      ],
      color: 'BLUE',
    };
    ctx.edit({ embeds: [embed] });
  }

  @Slash('say', { description: 'Bắt Núi nói cái gì đó rất ngu' })
  @Permission(async (guild, message) => allowRoleAndUp(guild, message, 'roleFormerBcn'))
  async say(
    @SlashOption('text', { description: 'Điều muốn nói' }) text: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, false);
    if (text.includes('@everyone') || text.includes('@here')) {
      throw new BadArgumentError('Tính làm trò gì z bro');
    }
    ctx.channel?.send(text);
  }

  @Slash('jumbo', { description: 'Phóng to emoji' })
  async jumbo(
    @SlashOption('emoji', { description: 'Emoji muốn phóng to' }) emoji: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, false);
    await ctx.defer();
    const emojiObj = emoji.match(/<(?<animated>a?):(?<name>[a-zA-Z0-9\_]{1,32}):(?<id>[0-9]{15,20})>/g);
    if (emojiObj?.[0] === emoji) {
      const animated = Boolean(emojiObj.groups?.animated);
      const id = emojiObj.groups?.id;
      ctx.edit(`https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?v=1`);
    } else {
      throw new BadArgumentError('Không thể phóng to emoji này, chắc đây là emoji Unicode.');
    }
  }
}

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
