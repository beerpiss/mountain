export interface ITag {
  name: string;
  content: string;
  date: Date;
  useCount: number;
  image?: string; // data URL
  addedBy: string;
  whitelistedChannelId?: string[];
}
