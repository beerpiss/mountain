import { IGuild } from '../model/guild.js';
import { config } from '../../utils/config.js';
import DataProvider from './data-provider.js';

export const GuildDataProvider = new DataProvider('data/', 'guilds');
await GuildDataProvider.init();

export class GuildService {
  static async get(key: keyof IGuild, defaultValue: any = undefined): Promise<any> {
    return GuildDataProvider.get(config.guild.id, key, defaultValue);
  }

  static async set(key: keyof IGuild, value: any): Promise<void> {
    return GuildDataProvider.set(config.guild.id, key, value);
  }

  static async setLoggingMapping(channelID: string | number, webhook: string) {
    const loggingMapping = await this.get('loggingMapping', {});
    loggingMapping[String(channelID)] = webhook;
    await this.set('loggingMapping', loggingMapping);
  }

  static async getLoggingMapping(channelID: string | number) {
    const loggingMapping = await this.get('loggingMapping', {});
    return loggingMapping[String(channelID)] ?? undefined;
  }
}
