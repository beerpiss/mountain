export interface IGuild {
  _id: string;
  roleAdmin?: string;
  roleBcn?: string;
  roleFormerBcn?: string;
  roleKiThuat?: string;
  roleRaDe?: string;
  roleNoiDung?: string;
  roleTruyenThong?: string;
  roleTrainers?: string;
  roleTrainees?: string;
  rolePendingKiThuat?: string;
  rolePendingRaDe?: string;
  rolePendingNoiDung?: string;
  rolePendingTruyenThong?: string;
  roleCuuKiThuat?: string;
  roleCuuRaDe?: string;
  roleCuuNoiDung?: string;
  roleCuuTruyenThong?: string;

  channelSuggestions?: string;
  channelAdminLog?: string;
  channelLog?: string;
  channelBotspam?: string;
  channelSeeding?: string;

  filterExcludedChannels?: string[];
  filterExcludedGuilds?: string[];

  loggingGuildId?: string;
  loggingMapping?: Map<string, string>;
}
