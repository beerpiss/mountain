import { IGuild } from './data/model/guild.js';
import { GuildService } from './data/services/guild-service.js';

const setupValues: IGuild = {
  _id: '',
  roleAdmin: '',
  roleBcn: '',
  roleFormerBcn: '962643144405573659',
  roleKiThuat: '',
  roleRaDe: '',
  roleNoiDung: '',
  roleTruyenThong: '',
  roleTrainers: '',
  roleTrainees: '',
  rolePendingKiThuat: '',
  rolePendingRaDe: '',
  rolePendingNoiDung: '',
  rolePendingTruyenThong: '',
  roleCuuKiThuat: '',
  roleCuuRaDe: '',
  roleCuuNoiDung: '',
  roleCuuTruyenThong: '',

  channelSuggestions: '',
  channelAdminLog: '',
  channelLog: '',
  channelBotspam: '962643145668034570',
  channelSeeding: '',

  filterExcludedChannels: [],
  filterExcludedGuilds: [],

  loggingGuildId: '',
  loggingMapping: new Map(),
};

Object.keys(setupValues).forEach((key: string) => {
  const typedKey = key as keyof IGuild;
  if (setupValues[typedKey]) {
    GuildService.set(typedKey, setupValues[typedKey]);
  }
});

await GuildService.provider.destroy();
