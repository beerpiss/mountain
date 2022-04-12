// eslint-disable-next-line import/named
import { TextBasedChannel, CommandInteraction, Guild, GuildMember, InteractionReplyOptions, Message, MessagePayload, WebhookEditMessageOptions, MessageEmbedOptions } from 'discord.js';

export interface MountainMessagePayload extends InteractionReplyOptions {
  followup?: boolean;
  deleteAfter?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class MountainContext {
  public readonly interaction: CommandInteraction;

  public whisper: boolean;

  constructor(interaction: CommandInteraction) {
    this.interaction = interaction;
    this.whisper = false;
  }

  public get guild(): Guild | null {
    return this.interaction.guild;
  }

  public get channel(): TextBasedChannel | null {
    return this.interaction.channel;
  }

  public get member(): GuildMember | null {
    return <GuildMember> this.interaction.member;
  }

  public async respond(options: string | MessagePayload | InteractionReplyOptions) {
    if (await this.interaction.fetchReply()) {
      return this.interaction.followUp(options);
    } else {
      return this.interaction.reply(options);
    }
  }

  public async defer(options?: InteractionReplyOptions) {
    return this.interaction.deferReply(options);
  }

  public async followup(options: string | MessagePayload | InteractionReplyOptions) {
    return this.interaction.followUp(options);
  }

  public async edit(options: string | MessagePayload | WebhookEditMessageOptions) {
    return this.interaction.editReply(options);
  }

  public get bot() {
    return this.interaction.client;
  }

  public async send(options: InteractionReplyOptions & { fetchReply?: boolean }) {
    return this.interaction.reply(options);
  }

  public async respondOrEdit(options: MountainMessagePayload) {
    if (this.interaction.replied) {
      if (!options.followup) {
        const ephemeral = options.ephemeral;
        const deleteAfter = options.deleteAfter;
        delete options.ephemeral;
        delete options.deleteAfter;
        delete options.followup;
        await this.edit(options);
        if (deleteAfter && !ephemeral) {
          this.delayedDelete(deleteAfter);
        }
      } else {
        const deleteAfter = options.deleteAfter;
        delete options.deleteAfter;
        delete options.followup;
        const message = <Message> (await this.followup(options));
        if (deleteAfter && !options.ephemeral) {
          setTimeout(() => message.delete(), deleteAfter);
        }
      }
    } else {
      delete options.followup;
      const deleteAfter = options.deleteAfter;
      delete options.deleteAfter;
      await this.respond(options);
      if (deleteAfter && !options.ephemeral) {
        this.delayedDelete(deleteAfter);
      }
    }
  }

  public async delayedDelete(delay: number) {
    setTimeout(() => this.interaction.deleteReply(), delay);
  }

  public async sendFollowup(options: MountainMessagePayload) {
    const deleteAfter = options.deleteAfter;
    delete options.deleteAfter;
    delete options.followup;
    const response = <Message>(await this.followup(options));
    if (deleteAfter && !options.ephemeral) {
      setTimeout(() => response.delete(), deleteAfter);
    }
  }

  public async sendSuccess(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'DARK_GREEN',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter });
  }

  public async sendWarning(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'ORANGE',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter });
  }

  public async sendError(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'RED',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter });
  }
}
