import { IFilterWord } from '../model/filterword.js';
import { config } from '../../utils/config.js';
import DataProvider from './data-provider.js';

const FilterWordDataProvider = new DataProvider('data/', 'filterwords');
await FilterWordDataProvider.init();

export class FilterWordService {
  static async addFilterWord(word: IFilterWord) {
    const temp: IFilterWord | undefined = await FilterWordDataProvider.get(config.guild.id, word.word, undefined);
    if (temp) {
      throw new Error(`FilterWord ${word.word} already exists`);
    }
    await FilterWordDataProvider.set(config.guild.id, word.word, word);
  }

  static async deleteFilterWord(word: string) {
    await FilterWordDataProvider.delete(config.guild.id, word);
  }

  static async editFilterWord(tag: IFilterWord) {
    const temp: IFilterWord | undefined = await FilterWordDataProvider.get(config.guild.id, tag.word, undefined);
    if (temp) {
      Object.assign(temp, tag);
      await FilterWordDataProvider.set(config.guild.id, tag.word, temp);
    } else {
      await FilterWordDataProvider.set(config.guild.id, tag.word, tag);
    }
  }

  static async getFilterWords(): Promise<any[]> {
    return (await FilterWordDataProvider.getAllKeys()).map(key => key.split(':', 2)[1]);
  }
}
