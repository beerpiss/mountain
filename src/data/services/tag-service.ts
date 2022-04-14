import { config } from '../../utils/config.js';
import { ITag } from '../model/tag.js';
import DataProvider from './data-provider.js';

const TagDataProvider = new DataProvider('data/', 'tags');

export class TagService {
  public static provider = TagDataProvider.init();

  static async addTag(tag: ITag) {
    const temp: ITag | string = await this.provider.get(config.guild.id, tag.name, undefined);
    if (temp) {
      throw new Error(`Tag ${tag.name} already exists`);
    }
    await this.provider.set(config.guild.id, tag.name, tag);
  }

  static async deleteTag(tagName: string) {
    await this.provider.delete(config.guild.id, tagName);
  }

  static async editTag(name: string, tag: Partial<ITag>) {
    const temp: ITag | string = await this.provider.get(config.guild.id, name, undefined);
    if (temp) {
      Object.assign(temp, tag);
      await this.provider.set(config.guild.id, name, temp);
    } else {
      await this.provider.set(config.guild.id, name, tag);
    }
  }

  static async getTag(tagName: string, increment: boolean = true) {
    const temp: ITag | undefined = await this.provider.get(config.guild.id, tagName, undefined);
    if (temp) {
      temp.useCount = temp.useCount + Number(increment);
      await this.editTag(tagName, temp);
      return temp;
    }
    return undefined;
  }

  static async getAllTagNames() {
    return this.provider.getAllKeys(config.guild.id).map(key => key.split(':', 2)[1]);
  }
}
