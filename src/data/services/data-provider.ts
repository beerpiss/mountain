import Enmap from 'enmap';
import Discord from 'discord.js';

/**
 * A data provider implemented with Enmap. Requires [Enmap](https://github.com/eslachance/enmap).
 * This data provider is implemented for v5 of Enmap.
 */
class DataProvider {
  /**
   * The directory where the Enmap database will be stored.
   * @type {string}
   * @memberof DataProvider
   */
  public readonly location: string;

  /**
   * The name of the SQLite table associated with this DataProvider.
   * @type {string}
   * @memberof DataProvider
   */
  public readonly tableName: string;

  /**
   * The Enmap instance for this data provider.
   * @private
   * @type {(Enmap<string, any> | null)}
   * @memberof DataProvider
   */
  public db: Enmap<string, any> | null;

  /**
   * @param {string} location The directory where the Enmap database will be stored. This must resolve to a directory.
   * @param {string} tableName The name of the SQLite table associated with this DataProvider.
   */
  constructor(location: string, tableName: string) {
    this.location = location;
    this.tableName = tableName;
    this.db = null;
  }

  /**
   * Initialize this Enmap data provider. This creates the database instance and the
   * database files inside the location specified.
   * @returns the data provider instance.
   */
  public init(): this {
    if (this.db) {
      return this;
    }
    this.db = new Enmap({
      name: this.tableName,
      autoFetch: true,
      fetchAll: false, 
      dataDir: this.location,
      cloneLevel: 'deep',
    });
    return this;
  }

  /**
   * Gracefully destroy this Enmap data provider. This closes the database connection.
   * Once this is called, this data provider will be unusable.
   * @returns A promise that resolves once this data provider is destroyed.
   */
  public destroy(): Promise<void> {
    if (!this.db) {
      return Promise.resolve();
    }

    return this.db!.close();
  }

  /**
   * Get a value for a given absolute key.
   * @param key The key of the data to be queried.
   * @param defaultValue The default value in case there is no entry found.
   * @private
   * @returns A promise that resolves the queried data.
   */
  private async _get(key: string, defaultValue?: string): Promise<any> {
    if (this.db!.has(key)) {
      return this.db!.get(key);
    } else {
      return defaultValue;
    }
  }

  /**
   * Get a value for a key in a guild.
   * @param guild The [guild](https://discord.js.org/#/docs/discord.js/stable/class/Guild) for which the data will be queried, or a guild ID.
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

  /**
   * Really stupid hack to get all keys for a scope. This will temporarily loads the
   * entire database into memory, so it can actually acquire all the keys.
   * 
   * Keys that were not loaded before will be evicted after this function finishes.
   * 
   * Call this function with no arguments to actually get every key in the table.
   * 
   * @param {Discord.Guild | string | 'global'} scope The scope to get all keys for.
   * @returns {any[]} An array of all keys in the scope.
   */
  public getAllKeys(scope: Discord.Guild | string | 'global' | '' = ''): any[] {
    const cachedKeys = this.db!.keyArray();
    this.db!.fetchEverything();
    const keys = this.db!.keyArray();
    this.db!.evict(keys.filter(n => !cachedKeys.includes(n)));
    return keys.filter(n => n.startsWith(scope instanceof Discord.Guild ? scope.id : scope));
  }

  private async _set(key: string, value: any): Promise<any> {
    return this.db!.set(key, value);
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
    const data = await this._get(key, undefined);
    this.db!.delete(key);

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
    this.db!.sweep(m => m.key.startsWith(startsWith));
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
