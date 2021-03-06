// eslint-disable-next-line import/named
import {
  BaseCommandInteraction, ButtonInteraction, Guild, GuildMember, InteractionReplyOptions, Message,
  MessageEmbedOptions, MessagePayload, TextBasedChannel, User, WebhookEditMessageOptions,
} from 'discord.js';

import { TimeoutError, UndefinedPromptError } from './exceptions.js';

export interface MountainMessagePayload extends InteractionReplyOptions {
  followup?: boolean;
  deleteAfter?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class MountainContext {
  public readonly interaction: BaseCommandInteraction | ButtonInteraction;

  public whisper: boolean;

  constructor(interaction: BaseCommandInteraction | ButtonInteraction, whisper: boolean = false) {
    this.interaction = interaction;
    this.whisper = whisper;
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

  public get user(): User | null {
    return <User> this.interaction.member?.user;
  }

  public async respond(options: string | MessagePayload | InteractionReplyOptions) {
    if (this.interaction.replied || this.interaction.deferred) {
      return this.interaction.followUp(options);
    } else {
      return this.interaction.reply(options);
    }
  }

  public async defer(options?: InteractionReplyOptions) {
    options = Object.assign(options ?? {}, { ephemeral: this.whisper });
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
    if (this.interaction.replied || this.interaction.deferred) {
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
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter, ephemeral: this.whisper });
  }

  public async sendWarning(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'ORANGE',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter, ephemeral: this.whisper });
  }

  public async sendError(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'RED',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter, ephemeral: this.whisper });
  }

  public async sendInfo(description: string, title?: string, deleteAfter?: number) {
    const embed: MessageEmbedOptions = {
      title: title || '',
      description: description,
      color: 'BLUE',
    };
    await this.respondOrEdit({ embeds: [embed], deleteAfter: deleteAfter, ephemeral: this.whisper });
  }

  public async prompt(time: string | number) {
    try {
      const collected = await this.interaction.channel?.awaitMessages({ 
        max: 1, 
        time: Number(time), 
        filter: (m: Message) => m.author.id === this.interaction.member?.user.id,
        errors: ['time'],
      });
      if (collected?.first()?.content === undefined) {
        throw new UndefinedPromptError('Prompt b??? undefined?!');
      }
      const message = collected.first();
      collected.first()?.delete();
      return message?.content;
    } catch (e) {
      throw new TimeoutError('???? h???y do qu?? th???i gian ch???.');
    }
  }
}
