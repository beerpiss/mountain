import { IFilterWord } from '../model/filterword.js';
import { config } from '../../utils/config.js';
import DataProvider from './data-provider.js';

const FilterWordDataProvider = new DataProvider('data/', 'filterwords');

export class FilterWordService {
  public static provider = FilterWordDataProvider.init();

  static async addFilterWord(word: IFilterWord) {
    const temp: IFilterWord | undefined = await this.provider.get(config.guild.id, word.word, undefined);
    if (temp) {
      throw new Error(`FilterWord ${word.word} already exists`);
    }
    await this.provider.set(config.guild.id, word.word, word);
  }

  static async deleteFilterWord(word: string) {
    await this.provider.delete(config.guild.id, word);
  }

  static async editFilterWord(tag: IFilterWord) {
    const temp: IFilterWord | undefined = await this.provider.get(config.guild.id, tag.word, undefined);
    if (temp) {
      Object.assign(temp, tag);
      await this.provider.set(config.guild.id, tag.word, temp);
    } else {
      await this.provider.set(config.guild.id, tag.word, tag);
    }
  }

  static async getFilterWords(): Promise<any[]> {
    return this.provider.getAllKeys(config.guild.id).map(key => key.split(':', 2)[1]);
  }
}
