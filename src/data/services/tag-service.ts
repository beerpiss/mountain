import { ITag } from '../model/tag.js';
import { config } from '../../utils/config.js';
import DataProvider from './data-provider.js';

const TagDataProvider = new DataProvider('data/tags.leveldb');
await TagDataProvider.init();

export class TagService {
  static async addTag(tag: ITag) {
    const temp: ITag | string = await TagDataProvider.get(config.guild.id, tag.name, undefined);
    if (temp) {
      throw new Error(`Tag ${tag.name} already exists`);
    }
    await TagDataProvider.set(config.guild.id, tag.name, tag);
  }

  static async deleteTag(tagName: string) {
    await TagDataProvider.delete(config.guild.id, tagName);
  }

  static async editTag(name: string, tag: Partial<ITag>) {
    const temp: ITag | string = await TagDataProvider.get(config.guild.id, name, undefined);
    if (temp) {
      Object.assign(temp, tag);
      await TagDataProvider.set(config.guild.id, name, temp);
    } else {
      await TagDataProvider.set(config.guild.id, name, tag);
    }
  }

  static async getTag(tagName: string, increment: boolean = true) {
    const temp: ITag | undefined = await TagDataProvider.get(config.guild.id, tagName, undefined);
    if (temp) {
      temp.useCount = temp.useCount + Number(increment);
      await this.editTag(tagName, temp);
      return temp;
    }
    return undefined;
  }

  static async getAllTagNames() {
    return (await TagDataProvider.getAllKeys()).map(key => key.split(':', 2)[1]);
  }
}
