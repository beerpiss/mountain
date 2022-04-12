export interface IGuild {
  _id: number;
  roleAdmin?: number;
  roleBcn?: number;
  roleFormerBcn?: number;
  roleKiThuat?: number;
  roleRaDe?: number;
  roleNoiDung?: number;
  roleTruyenThong?: number;
  roleTrainers?: number;
  roleTrainees?: number;
  rolePendingKiThuat?: number;
  rolePendingRaDe?: number;
  rolePendingNoiDung?: number;
  rolePendingTruyenThong?: number;
  roleCuuKiThuat?: number;
  roleCuuRaDe?: number;
  roleCuuNoiDung?: number;
  roleCuuTruyenThong?: number;

  channelSuggestions?: number;
  channelAdminLog?: number;
  channelLog?: number;
  channelBotspam?: number;
  channelSeeding?: number;

  filterExcludedChannels?: number[];
  filterExcludedGuilds?: number[];

  loggingGuildId?: number;
  loggingMapping?: Map<string, string>;
}
