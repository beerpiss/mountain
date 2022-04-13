import { Discord, Guild, Slash, SlashOption, Permission, SlashGroup } from 'discordx';
import { CommandInteraction, MessageAttachment, MessageEmbedOptions } from 'discord.js';
import { config } from '../../utils/config.js';
import { TagService } from '../../data/services/tag-service.js';
import { ITag } from '../../data/model/tag.js';
import { BadArgumentError, UndefinedPromptError, TimeoutError } from '../../utils/exceptions.js';
import { allowRoleAndUp, shouldSendEphemerally, CommandEphemeralType } from '../../utils/permissions.js';
import { tagAutocompleter } from '../../utils/autocompleters.js';
import { MountainContext } from '../../utils/context.js';
import { dataUriToBuffer } from 'data-uri-to-buffer';
import axios from 'axios';

@Discord()
@SlashGroup({ name: 'tag' })
@Guild(<string>config.guild.id)
export class Tag {
  private async prepareEmbed(tag: ITag): Promise<[MessageEmbedOptions, MessageAttachment | null]> {
    let embed: MessageEmbedOptions = {
      title: tag.name,
      description: tag.content,
      timestamp: tag.date,
      color: 'BLUE',
      footer: {
        text: `Đã dùng ${tag.useCount} lần | Được thêm bởi ${tag.addedBy}`,
      },
    };
    if (tag.image) {
      const decoded = dataUriToBuffer(tag.image);
      const file = new MessageAttachment(decoded, decoded.type.replace('/', '.'));
      embed = Object.assign(embed, {
        image: {
          url: `attachment://${decoded.type.replace('/', '.')}`,
        },
      });
      return [embed, file];
    } else {
      return [embed, null];
    }
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
    const ctx = new MountainContext(interaction);
    await ctx.defer();
    const tag: ITag | undefined = await TagService.getTag(name, false);
    if (tag === undefined) {
      throw new BadArgumentError('Tag này không tồn tại.');
    } else if (interaction?.channel?.id !== undefined && tag.whitelistedChannelId !== undefined && !tag.whitelistedChannelId?.includes(interaction?.channel?.id)) {
      throw new BadArgumentError('Tag này chỉ được hiện ở một số kênh nhất định.');
    } else {
      tag.useCount++;
      TagService.editTag(tag.name, { useCount: tag.useCount });
      const [embed, file] = await this.prepareEmbed(tag);
      let payload = {
        embeds: [embed],
      };
      if (file) {
        payload = Object.assign(payload, { files: [file] });
      }
      await ctx.edit(payload);
    }
  }

  @Slash('list')
  @SlashGroup('tag')
  async list(
    interaction: CommandInteraction,
  ): Promise<void> {
    const ctx = new MountainContext(interaction, await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn'));
    await ctx.defer();
    const tagNames = await TagService.getAllTagNames() ?? [];
    ctx.sendInfo(tagNames.join(', '), 'Tags');
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
    const ctx = new MountainContext(interaction, await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn'));
    await ctx.defer();
    const tag: ITag | undefined = await TagService.getTag(name);
    if (tag === undefined) {
      throw new BadArgumentError('Tag này không tồn tại.');
    }
    await TagService.deleteTag(name);
    ctx.sendSuccess('Đã xóa tag!');
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
    const ctx = new MountainContext(interaction, await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn'));
    await ctx.defer();
    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag chỉ được có ký tự `a-z, A-Z, 0-9 và _`.');
    }
    if (name.split(' ').length > 1) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag không được có khoảng trắng.');
    }
    if (await TagService.getTag(name, false) !== undefined) {
      throw new BadArgumentError('Tag này đã tồn tại! Dùng `/edittag` nếu muốn cập nhật nội dung tag.');
    }
    await ctx.sendInfo('Hãy nhập nội dung tag...');
    try {
      const response = await ctx.prompt(30000);
      if (response === undefined) {
        throw new UndefinedPromptError('');
      }

      let imageData;
      if (image) {
        const resp = await axios.get(image, { responseType: 'arraybuffer' });
        imageData = `data:${resp.headers['content-type'].toLowerCase()};base64,${Buffer.from(resp.data).toString('base64')}`;
      }
      let tag: ITag = {
        name: name,
        content: response,
        whitelistedChannelId: channelIds?.split(/[\s,]+/g).filter(id => id.match(/\d+/g)) ?? undefined,
        date: new Date(),
        useCount: 0,
        addedBy: `${ctx.user?.username}#${ctx.user?.discriminator}`,
        image: imageData ?? undefined,
      };
      TagService.addTag(tag);
      ctx.sendSuccess(`Tag **${name}** đã được thêm thành công!`);
    } catch (e: any) {
      if (e instanceof UndefinedPromptError) {
        ctx.sendError('Nội dung tag bị undefined?!');
      } else if (e instanceof TimeoutError) {
        ctx.sendError('Đã bị hủy do quá thời gian chờ.');
      } else {
        throw e;
      }
    }
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
    const ctx = new MountainContext(interaction, await shouldSendEphemerally(interaction, CommandEphemeralType.DEFAULT, 'roleFormerBcn'));
    await ctx.defer();
    if (!name.match(/^[a-zA-Z0-9_]+$/)) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag chỉ được có ký tự `a-z, A-Z, 0-9 và _`.');
    }
    if (name.split(' ').length > 1) {
      throw new BadArgumentError('Tên tag không hợp lệ. Tên tag không được có khoảng trắng.');
    }
    if (await TagService.getTag(name, false) === undefined) {
      throw new BadArgumentError('Tag này không tồn tại! Dùng /addtag để thêm tag.');
    }
    await ctx.sendInfo('Hãy nhập nội dung tag...');
    try {
      const response = await ctx.prompt(30000);

      let imageData;
      if (image) {
        const resp = await axios.get(image, { responseType: 'arraybuffer' });
        imageData = `data:${resp.headers['content-type'].toLowerCase()};base64,${Buffer.from(resp.data).toString('base64')}`;
      }
      const tag: Partial<ITag> = {
        content: response,
        image: imageData ?? undefined,
        whitelistedChannelId: channelIds?.split(/[\s,]+/g).filter(id => id.match(/\d+/g)) ?? undefined,
      };
      TagService.editTag(name, tag);
      ctx.sendSuccess(`Tag **${name}** đã được cập nhật thành công!`);
    } catch (e: any) {
      if (e instanceof UndefinedPromptError) {
        ctx.sendError('Nội dung tag bị undefined?!');
      } else if (e instanceof TimeoutError) {
        ctx.sendError('Đã bị hủy do quá thời gian chờ.');
      } else {
        throw e;
      }
    }
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
