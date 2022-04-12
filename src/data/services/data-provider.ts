import { Level } from 'level';
import Discord from 'discord.js';

/**
 * A {@link DataProvider} implemented with a LevelDB backend. Requires the package [level](https://www.npmjs.com/package/level).
 * This data provider was implemented for level@7.0.1 but any v7 should work.
 */
class DataProvider {
  /**
   * The fully resolved path where the LevelDB database will be saved.
   * @type {string}
   * @memberof LevelDataProvider
   */
  public readonly location: string;

  /**
   * The LevelDB instance for this data provider.
   * @private
   * @type {(Level<string, any> | null)}
   * @memberof LevelDataProvider
   */
  private db: Level<string, any> | null;

  /**
   * @param location The fully resolved path where the LevelDB database will be saved. This must resolve to a directory.
   */
  constructor(location: string) {
    this.location = location;
    this.db = null;
  }

  /**
   * Initialize this LevelDB data provider. This creates the database instance and the
   * database files inside the location specified.
   * @returns A promise that resolves this LevelDB data provider once it's ready.
   * @emits `client#dataProviderInit`
   */
  public init(): Promise<this> {
    if (this.db) {
      return Promise.resolve(this);
    }

    return new Promise((resolve, reject) => {
      const db = new Level(this.location, { createIfMissing: true, valueEncoding: 'utf8' });
      db.open((err?: any) => {
        if (err) {
          return reject(err);
        }
      });
      this.db = db!;
      return resolve(this);
    });
  }

  /**
   * Gracefully destroy this LevelDB data provider. This closes the database connection.
   * Once this is called, this data provider will be unusable.
   * @returns A promise that resolves once this data provider is destroyed.
   * @emits `client#dataProviderDestroy`
   */
  public destroy(): Promise<void> {
    if (!this.db) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.db!.close((error?: any) => {
        if (error) {
          return reject(error);
        }

        this.db = null;
        return resolve();
      });
    });
  }

  /**
   * Get a value for a given absolute key.
   * @param key The key of the data to be queried.
   * @param defaultValue The default value in case there is no entry found.
   * @private
   * @returns A promise that resolves the queried data.
   */
  private async _get(key: string, defaultValue?: string): Promise<any> {
    try {
      const value = await this.db!.get(key);
      try {
        const valueType = Object.prototype.toString.call(JSON.parse(value));
        if (valueType === '[object Object]' || valueType === '[object Array]') {
          return JSON.parse(value);
        } else {
          return value;
        }
      } catch (e) {
        return value;
      }

    } catch (error: any) {
      if (error.notFound) {
        return defaultValue;
      }

      throw error;
    }
  }

  /**
   * Get a value for a key in a guild.
   * @param guild The [guild](https://discord.js.org/#/docs/discord.js/stable/class/Guild) for which the data will be queried.
   * @param key The key of the data to be queried.
   * @param defaultValue The default value in case there is no entry found.
   * @returns A promise that resolves the queried data.
   */
  public async get(guild: Discord.Guild | string, key: string, defaultValue?: any): Promise<any> {
    const id = guild instanceof Discord.Guild ? guild.id : guild;
    return this._get(`${id}:${key}`, defaultValue);
  }

  /**
   * Get a value for a key in a global scope.
   * @param key The key of the data to be queried.
   * @param defaultValue The default value in case there is no entry found.
   * @returns A promise that resolves the queried data.
   */
  public async getGlobal(key: string, defaultValue?: any): Promise<any> {
    return this._get(`global:${key}`, defaultValue);
  }

  public async getAllKeys(): Promise<any[]> {
    return this.db!.keys({ limit: 10 }).all();
  }

  private async _set(key: string, value: any): Promise<any> {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    await this.db!.put(key, value);
  }

  /**
   * Set a value for a key in a guild.
   * @param guild The [guild](https://discord.js.org/#/docs/discord.js/stable/class/Guild) for which the data will be set.
   * @param key The key of the data to be set.
   * @param value The value to set.
   * @returns A promise that resolves once the data is saved.
   */
  public async set(guild: Discord.Guild | string, key: string, value: any): Promise<void> {
    const id = guild instanceof Discord.Guild ? guild.id : guild;
    return this._set(`${id}:${key}`, value);
  }

  /**
   * Set a value for a key in a global scope.
   * @param key The key of the data to be set.
   * @param value The value to set.
   * @returns A promise that resolves once the data is saved.
   */
  public async setGlobal(key: string, value: any): Promise<void> {
    return this._set(`global:${key}`, value);
  }

  /**
   * Delete a value stored for a given absolute key.
   * @param key The key of the data to be set.
   * @private
   * @returns A promise that resolves once the data has been deleted.
   */
  private async _delete(key: string): Promise<any> {
    const data = JSON.parse(await this.db!.get(key));
    await this.db!.del(key);

    return data;
  }

  /**
   * Delete a key-value pair in a guild.
   * @param guild The [guild](https://discord.js.org/#/docs/discord.js/stable/class/Guild) for which the key-value pair will be deleted.
   * @param key The key to delete.
   * @returns A promise that resolves the data that has been deleted.
   */
  public async delete(guild: Discord.Guild | string, key: string): Promise<any> {
    const id = guild instanceof Discord.Guild ? guild.id : guild;
    return this._delete(`${id}:${key}`);
  }

  /**
   * Delete a key-value pair in a global scope.
   * @param key The key to delete.
   * @returns A promise that resolves the data that has been deleted.
   */
  public async deleteGlobal(key: string): Promise<any> {
    return this._delete(`global:${key}`);
  }

  /**
   * Clear all data that start with the given pattern.
   * @param startsWith The pattern to look for the keys to delete.
   * @private
   * @returns A promise that resolves once all data has been deleted.
   */
  public async _clear(startsWith: string): Promise<void> {
    await this.db!.clear({
      gt: `${startsWith}:`,
      lte: `${startsWith}${String.fromCharCode(':'.charCodeAt(0) + 1)}`,
    });
  }

  /**
   * Clear all data in a guild.
   * @param guild The [guild](https://discord.js.org/#/docs/discord.js/stable/class/Guild) to clear the data from.
   * @returns A promise that resolves once all data has been deleted.
   * @emits `client#dataProviderClear`
   */
  public async clear(guild: Discord.Guild | string): Promise<void> {
    const id = guild instanceof Discord.Guild ? guild.id : guild;
    await this._clear(id);
  }

  /**
   * Clear all data in a global scope.
   * @returns A promise that resolves once all data has been deleted.
   * @emits `client#dataProviderClear`
   */
  public async clearGlobal(): Promise<void> {
    await this._clear('global');
  }
}

export default DataProvider;
