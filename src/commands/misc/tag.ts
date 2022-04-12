import { Discord, Guild, Slash, SlashOption, Permission, SlashGroup } from 'discordx';
import { CommandInteraction, Message, MessageEmbedOptions } from 'discord.js';
import { config } from '../../utils/config.js';
import { TagService } from '../../data/services/tag-service.js';
import { ITag } from '../../data/model/tag.js';
import { BadArgumentError } from '../../utils/exceptions.js';
import { allowRoleAndUp, shouldSendEphemerally, CommandEphemeralType } from '../../utils/permissions.js';
import { tagAutocompleter } from '../../utils/autocompleters.js';

@Discord()
@SlashGroup({ name: 'tag' })
@Guild(<string>config.guild.id)
export class Tag {
  private async prepareEmbed(tag: ITag): Promise<MessageEmbedOptions> {
    const embed: MessageEmbedOptions = {
      title: tag.name,
      description: tag.content,
      timestamp: tag.date,
      color: 'BLUE',
      footer: {
        text: `Used ${tag.useCount} times`,
      },
    };
    if (tag.image) {
      const image: Blob = await (await fetch(tag.image)).blob();
      Object.assign(embed, {
        image: image.type === 'image/gif' ? 'attachment://image.gif' : 'attachment://image.png',
      });
    }
    return embed;
  }

  @Slash('show')
  @SlashGroup('tag')
  async show(
    @SlashOption('name', { 
      description: 'Tag muốn show',
      autocomplete: tagAutocompleter,
      type: 'STRING',
    }) name: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply();
    const tag: ITag | undefined = await TagService.getTag(name, false);
    if (tag === undefined) {
      throw new BadArgumentError('Tag này không tồn tại.');
    } else if (interaction?.channel?.id !== undefined && tag.whitelistedChannelId !== undefined && !tag.whitelistedChannelId?.includes(interaction?.channel?.id)) {
      throw new BadArgumentError('Tag này chỉ được hiện ở một số kênh nhất định.');
    } else {
      tag.useCount++;
      TagService.editTag(tag.name, { useCount: tag.useCount });
      const embed: MessageEmbedOptions = await this.prepareEmbed(tag);
      await interaction.editReply({ embeds: [embed] });
    }
  }

  @Slash('list')
  @SlashGroup('tag')
  async list(
    interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn')) });
    const tagNames = await TagService.getAllTagNames();
    interaction.editReply({
      embeds: [{
        title: 'Tags',
        description: tagNames.join(', '),
        color: 'BLUE',
      }],
    });
  }

  @Slash('delete')
  @SlashGroup('tag')
  @Permission(async (guild, message) => allowRoleAndUp(guild, message, 'roleFormerBcn'))
  async delete(
    @SlashOption('name', { 
      description: 'Tag muốn xóa',
      autocomplete: tagAutocompleter,
      type: 'STRING',
    }) name: string,    interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.ALWAYS, 'roleFormerBcn')) });
    const tag: ITag | undefined = await TagService.getTag(name);
    if (tag === undefined) {
      throw new BadArgumentError('Tag này không tồn tại.');
    }
    await TagService.deleteTag(name);
    interaction.editReply('Đã xóa tag!');
  }

  @Slash('add')
  @SlashGroup('tag')
  @Permission(async (guild, message) => allowRoleAndUp(guild, message, 'roleFormerBcn'))
  async add(
    @SlashOption('name', { description: 'Tên tag muốn thêm' }) name: string,
      @SlashOption('channels', { description: '(những) ID của kênh cho phép hiện tag', required: false  }) channelIds: string,
      @SlashOption('image', { description: 'Link ảnh đính kèm tag', required: false  }) image: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.ALWAYS, 'roleFormerBcn')) });
    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag chỉ được có ký tự `a-z, A-Z, 0-9 và _`.');
    }
    if (name.split(' ').length > 1) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag không được có khoảng trắng.');
    }
    if (await TagService.getTag(name, false) !== undefined) {
      throw new BadArgumentError('Tag này đã tồn tại! Dùng `/edittag` nếu muốn cập nhật nội dung tag.');
    }
    await interaction.editReply('Hãy nhập nội dung tag...');
    interaction.channel?.awaitMessages({ 
      max: 1, 
      time: 30000, 
      filter: (m: Message) => m.author.id === interaction.member?.user.id,
      errors: ['time'],
    })
      .then(collected => {
        if (collected.first()?.content === undefined) {
          throw new BadArgumentError('Nội dung tag bị undefined?!');
        }
        const message = collected.first();
        collected.first()?.delete();
        const tag: ITag = {
          name: name,
          content: <string>message?.content,
          date: new Date(),
          useCount: 0,
          addedBy: `${interaction.user.username}#${interaction.user.discriminator}`,
          image: image ?? undefined,
          whitelistedChannelId: channelIds?.split(/[\s,]+/g).filter(id => id.match(/\d+/g)) ?? undefined,
        };
        TagService.addTag(tag);
        interaction.editReply(`Tag **${name}** đã được thêm thành công!`);
      })
      .catch(_ => {
        interaction.editReply('Đã bị hủy do quá thời gian chờ.');
      });
  }

  @Slash('edit')
  @SlashGroup('tag')
  @Permission(async (guild, message) => allowRoleAndUp(guild, message, 'roleFormerBcn'))
  async edit(
    @SlashOption('name', { 
      description: 'Tag muốn sửa',
      autocomplete: tagAutocompleter,
      type: 'STRING',
    }) name: string,    
      @SlashOption('channels', { description: 'ID của kênh cho phép hiện tag', required: false  }) channelIds: string,
      @SlashOption('image', { description: 'Link ảnh đính kèm tag', required: false  }) image: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.ALWAYS, 'roleFormerBcn')) });
    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag chỉ được có ký tự `a-z, A-Z, 0-9 và _`.');
    }
    if (name.split(' ').length > 1) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag không được có khoảng trắng.');
    }
    if (await TagService.getTag(name, false) === undefined) {
      throw new BadArgumentError('Tag này không tồn tại! Dùng /addtag để thêm tag.');
    }
    await interaction.editReply('Hãy nhập nội dung tag...');
    interaction.channel?.awaitMessages({ 
      max: 1, 
      time: 30000, 
      filter: (m: Message) => m.author.id === interaction.member?.user.id,
      errors: ['time'],
    })
      .then(collected => {
        if (collected.first()?.content === undefined) {
          throw new BadArgumentError('Nội dung tag bị undefined?!');
        }
        const message = collected.first();
        collected.first()?.delete();
        const tag: Partial<ITag> = {
          content: <string>message?.content,
          image: image ?? undefined,
          whitelistedChannelId: channelIds?.split(/[\s,]+/g).filter(id => id.match(/\d+/g)) ?? undefined,
        };
        TagService.editTag(name, tag);
        interaction.editReply(`Tag **${name}** đã được sửa thành công!`);
      })
      .catch(_ => {
        interaction.editReply('Đã bị hủy do quá thời gian chờ.');
      });
  }

  @Slash('raw')
  @SlashGroup('tag')
  @Permission(async (guild, message) => allowRoleAndUp(guild, message, 'roleFormerBcn'))
  async raw(
    @SlashOption('name', {
      description: 'Tag muốn xem',
      autocomplete: tagAutocompleter,
      type: 'STRING',
    }) name: string,
      interaction: CommandInteraction,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: Boolean(await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn')) });
    const tag = await TagService.getTag(name, false);
    if (tag === undefined) {
      throw new BadArgumentError('Tag này không tồn tại! Dùng /addtag để thêm tag.');
    }
    interaction.editReply(`\`\`\`\n${tag.content}\n\`\`\``);
  }
}
